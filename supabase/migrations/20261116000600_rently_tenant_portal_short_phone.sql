-- Permit shorter registered phone values already accepted by the landlord
-- forms, while keeping email-and-phone matching and the server-only grant.
create or replace function public.lookup_rently_tenant_portal(
  p_email text,
  p_phone text
)
returns table (
  tenant_name text,
  rent_amount numeric,
  due_date date,
  payment_status text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
begin
  if length(v_email) < 3 or length(v_email) > 320
     or length(v_phone) < 6 or length(v_phone) > 15 then
    return;
  end if;

  return query
  with matches as (
    select
      t.owner_id,
      t.full_name,
      p.amount,
      p.due_date,
      p.paid_at
    from public.rently_tenants t
    join public.rently_leases l
      on l.tenant_id = t.id and l.owner_id = t.owner_id
    join public.rently_payments p
      on p.lease_id = l.id and p.owner_id = l.owner_id
    where lower(btrim(coalesce(t.email, ''))) = v_email
      and regexp_replace(coalesce(t.phone, ''), '[^0-9]', '', 'g') = v_phone
  ),
  matched_owners as (
    select count(distinct owner_id) as owner_count from matches
  ),
  selected_payment as (
    select m.full_name, m.amount, m.due_date, m.paid_at
    from matches m
    order by
      case when m.paid_at is null then 0 else 1 end,
      case when m.paid_at is null then m.due_date end asc nulls last,
      case when m.paid_at is not null then m.due_date end desc nulls last
    limit 1
  )
  select
    s.full_name,
    s.amount,
    s.due_date,
    case
      when s.paid_at is not null then 'paid'
      when s.due_date < current_date then 'overdue'
      else 'pending'
    end
  from selected_payment s
  cross join matched_owners o
  where o.owner_count = 1;
end;
$$;
