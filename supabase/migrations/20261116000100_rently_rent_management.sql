-- Add rent terms and persistent monthly payment records to the private
-- Rently owner portfolio. Existing owner data is preserved.

alter table public.rently_leases
  add column if not exists monthly_rent numeric(12, 2),
  add column if not exists due_day smallint;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'rently_leases_monthly_rent_positive'
      and conrelid = 'public.rently_leases'::regclass
  ) then
    alter table public.rently_leases
      add constraint rently_leases_monthly_rent_positive
      check (monthly_rent is null or monthly_rent > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'rently_leases_due_day_valid'
      and conrelid = 'public.rently_leases'::regclass
  ) then
    alter table public.rently_leases
      add constraint rently_leases_due_day_valid
      check (due_day is null or due_day between 1 and 31);
  end if;
end
$$;

create unique index if not exists rently_leases_id_owner_unique
  on public.rently_leases (id, owner_id);

create table if not exists public.rently_payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  lease_id uuid not null,
  due_date date not null,
  amount numeric(12, 2) not null check (amount > 0),
  paid_at date,
  created_at timestamptz not null default now(),
  constraint rently_payments_lease_due_unique unique (lease_id, due_date),
  constraint rently_payments_lease_owner_fkey
    foreign key (lease_id, owner_id)
    references public.rently_leases (id, owner_id)
    on delete cascade
);

create index if not exists rently_payments_owner_due_idx
  on public.rently_payments (owner_id, due_date);
create index if not exists rently_payments_lease_due_idx
  on public.rently_payments (lease_id, due_date);

alter table public.rently_payments enable row level security;
revoke all on public.rently_payments from anon, authenticated;
grant select on public.rently_payments to authenticated;

drop policy if exists "Owners read their Rently payments"
  on public.rently_payments;
create policy "Owners read their Rently payments"
  on public.rently_payments
  for select to authenticated
  using (auth.uid() is not null and owner_id = (select auth.uid()));

-- Owners may create and edit their own property, unit, and tenant records.
-- Ownership cannot be transferred because every new row version must still
-- have owner_id = auth.uid(). Lease/payment writes go through checked RPCs.
grant insert, update on public.rently_properties,
  public.rently_units, public.rently_tenants to authenticated;

drop policy if exists "Owners insert their Rently properties"
  on public.rently_properties;
create policy "Owners insert their Rently properties"
  on public.rently_properties
  for insert to authenticated
  with check (auth.uid() is not null and owner_id = (select auth.uid()));

drop policy if exists "Owners update their Rently properties"
  on public.rently_properties;
create policy "Owners update their Rently properties"
  on public.rently_properties
  for update to authenticated
  using (auth.uid() is not null and owner_id = (select auth.uid()))
  with check (auth.uid() is not null and owner_id = (select auth.uid()));

drop policy if exists "Owners insert their Rently units"
  on public.rently_units;
create policy "Owners insert their Rently units"
  on public.rently_units
  for insert to authenticated
  with check (auth.uid() is not null and owner_id = (select auth.uid()));

drop policy if exists "Owners update their Rently units"
  on public.rently_units;
create policy "Owners update their Rently units"
  on public.rently_units
  for update to authenticated
  using (auth.uid() is not null and owner_id = (select auth.uid()))
  with check (auth.uid() is not null and owner_id = (select auth.uid()));

drop policy if exists "Owners insert their Rently tenants"
  on public.rently_tenants;
create policy "Owners insert their Rently tenants"
  on public.rently_tenants
  for insert to authenticated
  with check (auth.uid() is not null and owner_id = (select auth.uid()));

drop policy if exists "Owners update their Rently tenants"
  on public.rently_tenants;
create policy "Owners update their Rently tenants"
  on public.rently_tenants
  for update to authenticated
  using (auth.uid() is not null and owner_id = (select auth.uid()))
  with check (auth.uid() is not null and owner_id = (select auth.uid()));

create or replace function public.create_rently_lease_with_schedule(
  p_unit_id uuid,
  p_tenant_full_name text,
  p_tenant_email text,
  p_tenant_phone text,
  p_start_date date,
  p_end_date date,
  p_monthly_rent numeric,
  p_due_day smallint
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid := auth.uid();
  v_unit_owner_id uuid;
  v_tenant_id uuid;
  v_lease_id uuid := gen_random_uuid();
  v_month_start date;
  v_month_end date;
  v_due_date date;
  v_status text;
begin
  if v_owner_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_tenant_full_name is null or length(btrim(p_tenant_full_name)) = 0 then
    raise exception 'Tenant name is required' using errcode = '22023';
  end if;
  if p_start_date is null or p_end_date is null or p_end_date < p_start_date
     or p_end_date > (p_start_date + interval '10 years')::date then
    raise exception 'Invalid lease dates' using errcode = '22023';
  end if;
  if p_monthly_rent is null or p_monthly_rent <= 0 then
    raise exception 'Monthly rent must be positive' using errcode = '22023';
  end if;
  if p_due_day is null or p_due_day < 1 or p_due_day > 31 then
    raise exception 'Due day must be between 1 and 31' using errcode = '22023';
  end if;

  select u.owner_id
    into v_unit_owner_id
    from public.rently_units u
    where u.id = p_unit_id
    for update;

  if v_unit_owner_id is distinct from v_owner_id then
    raise exception 'Unit not found' using errcode = 'P0002';
  end if;

  if exists (
    select 1
      from public.rently_leases l
      where l.owner_id = v_owner_id
        and l.unit_id = p_unit_id
        and daterange(l.start_date, l.end_date, '[]')
            && daterange(p_start_date, p_end_date, '[]')
  ) then
    raise exception 'Lease overlaps an existing lease' using errcode = '23P01';
  end if;

  insert into public.rently_tenants (owner_id, full_name, email, phone)
  values (
    v_owner_id,
    btrim(p_tenant_full_name),
    nullif(btrim(coalesce(p_tenant_email, '')), ''),
    nullif(btrim(coalesce(p_tenant_phone, '')), '')
  )
  returning id into v_tenant_id;

  v_status := case
    when p_start_date > current_date then 'upcoming'
    when p_end_date < current_date then 'ended'
    else 'active'
  end;

  insert into public.rently_leases (
    id, owner_id, unit_id, tenant_id, start_date, end_date, status,
    monthly_rent, due_day
  )
  values (
    v_lease_id, v_owner_id, p_unit_id, v_tenant_id,
    p_start_date, p_end_date, v_status, p_monthly_rent, p_due_day
  );

  v_month_start := date_trunc('month', p_start_date)::date;
  while v_month_start <= date_trunc('month', p_end_date)::date loop
    v_month_end := (v_month_start + interval '1 month - 1 day')::date;
    v_due_date := make_date(
      extract(year from v_month_start)::integer,
      extract(month from v_month_start)::integer,
      least(p_due_day, extract(day from v_month_end)::integer)
    );

    if v_due_date between p_start_date and p_end_date then
      insert into public.rently_payments (
        owner_id, lease_id, due_date, amount
      )
      values (v_owner_id, v_lease_id, v_due_date, p_monthly_rent);
    end if;

    v_month_start := (v_month_start + interval '1 month')::date;
  end loop;

  if not exists (
    select 1 from public.rently_payments where lease_id = v_lease_id
  ) then
    raise exception 'No due date falls within this lease term'
      using errcode = '22023';
  end if;

  return v_lease_id;
end;
$$;

create or replace function public.record_rently_payment(
  p_payment_id uuid,
  p_paid_at date
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid := auth.uid();
  v_payment_owner_id uuid;
  v_existing_paid_at date;
begin
  if v_owner_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_paid_at is null or p_paid_at > current_date then
    raise exception 'Payment date cannot be in the future' using errcode = '22023';
  end if;

  select p.owner_id, p.paid_at
    into v_payment_owner_id, v_existing_paid_at
    from public.rently_payments p
    where p.id = p_payment_id
    for update;

  if v_payment_owner_id is distinct from v_owner_id then
    raise exception 'Payment not found' using errcode = 'P0002';
  end if;
  if v_existing_paid_at is not null then
    raise exception 'Payment is already recorded' using errcode = '23505';
  end if;

  update public.rently_payments
    set paid_at = p_paid_at
    where id = p_payment_id and owner_id = v_owner_id;

  return true;
end;
$$;

revoke all on function public.create_rently_lease_with_schedule(
  uuid, text, text, text, date, date, numeric, smallint
) from public, anon;
grant execute on function public.create_rently_lease_with_schedule(
  uuid, text, text, text, date, date, numeric, smallint
) to authenticated;

revoke all on function public.record_rently_payment(uuid, date)
  from public, anon;
grant execute on function public.record_rently_payment(uuid, date)
  to authenticated;

-- When the optional signed-document module is installed, bind documents to
-- the same owner's real lease. NOT VALID preserves existing records while
-- enforcing the foreign key for all future inserts/updates.
do $$
begin
  if to_regclass('public.lease_documents') is not null then
    if not exists (
      select 1 from pg_constraint
      where conname = 'lease_documents_rently_lease_owner_fkey'
        and conrelid = 'public.lease_documents'::regclass
    ) then
      alter table public.lease_documents
        add constraint lease_documents_rently_lease_owner_fkey
        foreign key (lease_id, owner_id)
        references public.rently_leases (id, owner_id)
        on delete cascade not valid;
    end if;

    drop policy if exists "Owners can manage their lease document metadata"
      on public.lease_documents;
    create policy "Owners can manage their lease document metadata"
      on public.lease_documents
      for all to authenticated
      using (
        owner_id = (select auth.uid())
        and exists (
          select 1 from public.rently_leases l
          where l.id = lease_id and l.owner_id = (select auth.uid())
        )
      )
      with check (
        owner_id = (select auth.uid())
        and exists (
          select 1 from public.rently_leases l
          where l.id = lease_id and l.owner_id = (select auth.uid())
        )
      );
  end if;

  if to_regclass('storage.objects') is not null then
    drop policy if exists "Lease files must belong to an owned Rently lease"
      on storage.objects;
    create policy "Lease files must belong to an owned Rently lease"
      on storage.objects as restrictive
      for all to authenticated
      using (
        bucket_id <> 'rently-lease-documents'
        or (
          (storage.foldername(name))[1] = (select auth.uid())::text
          and exists (
            select 1 from public.rently_leases l
            where l.id::text = (storage.foldername(name))[2]
              and l.owner_id = (select auth.uid())
          )
        )
      )
      with check (
        bucket_id <> 'rently-lease-documents'
        or (
          (storage.foldername(name))[1] = (select auth.uid())::text
          and exists (
            select 1 from public.rently_leases l
            where l.id::text = (storage.foldername(name))[2]
              and l.owner_id = (select auth.uid())
          )
        )
      );
  end if;
end;
$$;
