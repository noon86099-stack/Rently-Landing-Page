-- Read-only check to run after the Rently owner-portfolio migration.
-- Every row should return passed = true.
with rently_tables(table_name) as (
  values
    ('rently_properties'),
    ('rently_units'),
    ('rently_tenants'),
    ('rently_leases')
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
    table_name || ': no write policies exist',
    not exists (
      select 1 from pg_policies p
      where p.schemaname = 'public'
        and p.tablename = rently_tables.table_name
        and p.cmd <> 'SELECT'
    )
  from rently_tables
)
select check_name, passed
from checks
order by check_name;
