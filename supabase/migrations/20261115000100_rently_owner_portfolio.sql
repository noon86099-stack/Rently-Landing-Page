-- Private owner portfolio data for Rently. Existing storefront tables are untouched.
create table if not exists public.rently_properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  street_address text,
  city text,
  region text,
  property_type text not null default 'Residential',
  created_at timestamptz not null default now(),
  unique (id, owner_id)
);

create table if not exists public.rently_units (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  property_id uuid not null,
  unit_label text not null check (length(btrim(unit_label)) > 0),
  created_at timestamptz not null default now(),
  unique (id, owner_id),
  constraint rently_units_property_owner_fkey
    foreign key (property_id, owner_id)
    references public.rently_properties (id, owner_id)
    on delete cascade
);

create table if not exists public.rently_tenants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null check (length(btrim(full_name)) > 0),
  email text,
  phone text,
  created_at timestamptz not null default now(),
  unique (id, owner_id)
);

create table if not exists public.rently_leases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  unit_id uuid not null,
  tenant_id uuid not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'active'
    check (status in ('active', 'ended', 'upcoming')),
  created_at timestamptz not null default now(),
  check (end_date >= start_date),
  constraint rently_leases_unit_owner_fkey
    foreign key (unit_id, owner_id)
    references public.rently_units (id, owner_id)
    on delete cascade,
  constraint rently_leases_tenant_owner_fkey
    foreign key (tenant_id, owner_id)
    references public.rently_tenants (id, owner_id)
    on delete restrict
);

create index if not exists rently_properties_owner_name_idx
  on public.rently_properties (owner_id, name);
create index if not exists rently_units_owner_property_idx
  on public.rently_units (owner_id, property_id);
create index if not exists rently_tenants_owner_idx
  on public.rently_tenants (owner_id);
create index if not exists rently_leases_owner_unit_idx
  on public.rently_leases (owner_id, unit_id);

alter table public.rently_properties enable row level security;
alter table public.rently_units enable row level security;
alter table public.rently_tenants enable row level security;
alter table public.rently_leases enable row level security;

revoke all on public.rently_properties, public.rently_units,
  public.rently_tenants, public.rently_leases from anon, authenticated;
grant select on public.rently_properties, public.rently_units,
  public.rently_tenants, public.rently_leases to authenticated;

drop policy if exists "Owners read their Rently properties"
  on public.rently_properties;
create policy "Owners read their Rently properties"
  on public.rently_properties for select to authenticated
  using (auth.uid() is not null and owner_id = (select auth.uid()));

drop policy if exists "Owners read their Rently units"
  on public.rently_units;
create policy "Owners read their Rently units"
  on public.rently_units for select to authenticated
  using (auth.uid() is not null and owner_id = (select auth.uid()));

drop policy if exists "Owners read their Rently tenants"
  on public.rently_tenants;
create policy "Owners read their Rently tenants"
  on public.rently_tenants for select to authenticated
  using (auth.uid() is not null and owner_id = (select auth.uid()));

drop policy if exists "Owners read their Rently leases"
  on public.rently_leases;
create policy "Owners read their Rently leases"
  on public.rently_leases for select to authenticated
  using (auth.uid() is not null and owner_id = (select auth.uid()));
