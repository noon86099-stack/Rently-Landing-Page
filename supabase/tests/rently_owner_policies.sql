-- Read-only check to run after the Rently owner-portfolio migration.
-- Every row should return passed = true.
with rently_tables(table_name) as (
  values
    ('rently_properties'),
    ('rently_units'),
    ('rently_tenants'),
    ('rently_leases'),
    ('rently_payments')
),
checks as (
  select
    table_name || ': row-level security is enabled' as check_name,
    coalesce((
      select c.relrowsecurity
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = rently_tables.table_name
    ), false) as passed
  from rently_tables
  union all
  select
    table_name || ': anonymous reads are denied',
    not has_table_privilege('anon', format('public.%I', table_name), 'SELECT')
  from rently_tables
  union all
  select
    table_name || ': authenticated reads are granted',
    has_table_privilege('authenticated', format('public.%I', table_name), 'SELECT')
  from rently_tables
  union all
  select
    table_name || ': exactly one owner-scoped select policy exists',
    (
      select count(*) = 1
      from pg_policies p
      where p.schemaname = 'public'
        and p.tablename = rently_tables.table_name
        and p.cmd = 'SELECT'
        and p.roles = array['authenticated']::name[]
        and p.qual ilike '%auth.uid()%'
        and p.qual ilike '%owner_id%'
    )
  from rently_tables
  union all
  select
    table_name || ': direct delete is not granted',
    not has_table_privilege('authenticated', format('public.%I', table_name), 'DELETE')
  from rently_tables
  union all
  select
    table_name || ': own insert policy exists for editable records',
    case when table_name in ('rently_properties', 'rently_units', 'rently_tenants')
      then exists (
        select 1 from pg_policies p
        where p.schemaname = 'public'
          and p.tablename = rently_tables.table_name
          and p.cmd = 'INSERT'
          and p.roles = array['authenticated']::name[]
          and p.with_check ilike '%auth.uid()%'
          and p.with_check ilike '%owner_id%'
      )
      else not has_table_privilege('authenticated', format('public.%I', table_name), 'INSERT')
    end
  from rently_tables
  union all
  select
    table_name || ': own update policy exists for editable records',
    case when table_name in ('rently_properties', 'rently_units', 'rently_tenants')
      then exists (
        select 1 from pg_policies p
        where p.schemaname = 'public'
          and p.tablename = rently_tables.table_name
          and p.cmd = 'UPDATE'
          and p.roles = array['authenticated']::name[]
          and p.qual ilike '%auth.uid()%'
          and p.qual ilike '%owner_id%'
          and p.with_check ilike '%auth.uid()%'
          and p.with_check ilike '%owner_id%'
      )
      else not has_table_privilege('authenticated', format('public.%I', table_name), 'UPDATE')
    end
  from rently_tables
  union all
  select
    'rently_payments: owner-scoped lease/payment functions exist',
    to_regprocedure('public.create_rently_lease_with_schedule(uuid,text,text,text,date,date,numeric,smallint)') is not null
      and to_regprocedure('public.record_rently_payment(uuid,date)') is not null
)
select check_name, passed
from checks
order by check_name;
