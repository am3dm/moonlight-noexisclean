-- Ensure necessary roles exist
do $$
begin
  if not exists (select from pg_catalog.pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select from pg_catalog.pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select from pg_catalog.pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
  if not exists (select from pg_catalog.pg_roles where rolname = 'authenticator') then
    create role authenticator noinherit login password 'postgres';
  end if;
  if not exists (select from pg_catalog.pg_roles where rolname = 'supabase_auth_admin') then
    create role supabase_auth_admin noinherit login password 'postgres' bypassrls;
  end if;
  if not exists (select from pg_catalog.pg_roles where rolname = 'supabase_admin') then
    create role supabase_admin noinherit login password 'postgres' bypassrls;
  end if;
end $$;

grant anon to authenticator;
grant authenticated to authenticator;
grant service_role to authenticator;
grant supabase_auth_admin to postgres;
grant supabase_admin to postgres;

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;
