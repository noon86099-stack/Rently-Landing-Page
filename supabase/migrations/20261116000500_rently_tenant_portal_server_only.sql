-- The public application server uses the database connection to perform the
-- narrowly scoped lookup. Prevent clients using the anon or authenticated
-- Supabase keys from bypassing the server's rate limit via direct RPC calls.
revoke all on function public.lookup_rently_tenant_portal(text, text) from public;
revoke all on function public.lookup_rently_tenant_portal(text, text) from anon;
revoke all on function public.lookup_rently_tenant_portal(text, text) from authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'revoke all on function public.lookup_rently_tenant_portal(text, text) from service_role';
  end if;
end;
$$;
