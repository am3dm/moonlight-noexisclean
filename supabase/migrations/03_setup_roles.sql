-- Ensure necessary roles exist for PostgREST
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
    create role authenticator noinherit login password 'postgres'; -- Password doesn't matter for local connection usually but good to set
  end if;
end $$;

-- Grant permissions
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;

-- Grant authenticator ability to switch to other roles
grant anon to authenticator;
grant authenticated to authenticator;
grant service_role to authenticator;
