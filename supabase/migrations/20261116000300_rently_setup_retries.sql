-- A creation and its retry receipt commit together. No seeded records.
-- The ledger cannot be forged by authenticated clients.
create table if not exists public.rently_creation_requests (
  owner_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  kind text not null check (kind in ('property', 'unit', 'lease')),
  payload jsonb not null,
  record_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (owner_id, request_id)
);
alter table public.rently_creation_requests enable row level security;
revoke all on public.rently_creation_requests from public, anon, authenticated;

create or replace function public.create_rently_setup_record(
  p_request_id uuid, p_kind text, p_payload jsonb
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_owner uuid := auth.uid();
  v_receipt public.rently_creation_requests%rowtype;
  v_id uuid;
  v_parent uuid;
begin
  if v_owner is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_request_id is null or p_kind is null or p_kind not in ('property','unit','lease')
    or p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'Invalid creation request' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_owner::text || ':' || p_request_id::text, 0));
  select * into v_receipt from public.rently_creation_requests
    where owner_id = v_owner and request_id = p_request_id;
  if found then
    if v_receipt.kind <> p_kind or v_receipt.payload <> p_payload then
      raise exception 'Request identifier used with different data' using errcode = '22023';
    end if;
    return v_receipt.record_id;
  end if;

  if p_kind = 'property' then
    if nullif(btrim(p_payload->>'name'),'') is null
      or length(p_payload->>'name') > 160
      or nullif(btrim(p_payload->>'propertyType'),'') is null
      or length(p_payload->>'propertyType') > 80
      or length(p_payload->>'streetAddress') > 240
      or length(p_payload->>'city') > 120 or length(p_payload->>'region') > 120 then
      raise exception 'Invalid property details' using errcode = '22023';
    end if;
    insert into public.rently_properties(owner_id,name,property_type,street_address,city,region)
      values(v_owner,btrim(p_payload->>'name'),btrim(p_payload->>'propertyType'),
        nullif(btrim(p_payload->>'streetAddress'),''),nullif(btrim(p_payload->>'city'),''),
        nullif(btrim(p_payload->>'region'),''))
      returning id into v_id;
  elsif p_kind = 'unit' then
    v_parent := (p_payload->>'propertyId')::uuid;
    perform 1 from public.rently_properties where id = v_parent and owner_id = v_owner for update;
    if not found then raise exception 'Property not found' using errcode = 'P0002'; end if;
    if nullif(btrim(p_payload->>'unitLabel'),'') is null or length(p_payload->>'unitLabel') > 80 then
      raise exception 'Invalid unit label' using errcode = '22023';
    end if;
    insert into public.rently_units(owner_id,property_id,unit_label)
      values(v_owner,v_parent,btrim(p_payload->>'unitLabel')) returning id into v_id;
  else
    if length(p_payload->>'tenantFullName') > 160 or length(p_payload->>'tenantPhone') > 80
      or (p_payload->>'monthlyRent')::numeric > 100000000 then
      raise exception 'Invalid lease details' using errcode = '22023';
    end if;
    -- Reuse the existing atomic tenant/lease/schedule operation and ownership checks.
    v_id := public.create_rently_lease_with_schedule(
      (p_payload->>'unitId')::uuid,p_payload->>'tenantFullName',
      p_payload->>'tenantEmail',p_payload->>'tenantPhone',
      (p_payload->>'startDate')::date,(p_payload->>'endDate')::date,
      (p_payload->>'monthlyRent')::numeric,(p_payload->>'dueDay')::smallint);
  end if;
  insert into public.rently_creation_requests(owner_id,request_id,kind,payload,record_id)
    values(v_owner,p_request_id,p_kind,p_payload,v_id);
  return v_id;
end;
$$;
revoke all on function public.create_rently_setup_record(uuid,text,jsonb) from public, anon;
grant execute on function public.create_rently_setup_record(uuid,text,jsonb) to authenticated;
