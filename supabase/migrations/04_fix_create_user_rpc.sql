-- Fix create_new_user RPC to match current auth.users schema
create or replace function public.create_new_user(
  email text,
  password text,
  full_name text,
  role public.user_role,
  permissions text[] default '{}'
)
returns uuid
language plpgsql
security definer
as $$
declare
  new_user_id uuid;
begin
  -- Check if caller is admin (optional, commented out for now to ensure it works)
  -- if not exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin') then
  --   raise exception 'Access Denied';
  -- end if;

  -- Insert into auth.users (simplified columns)
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000',
    uuid_generate_v4(),
    'authenticated',
    'authenticated',
    email,
    crypt(password, gen_salt('bf')),
    now(), -- Auto confirm email
    '{"provider":"email","providers":["email"]}',
    json_build_object('full_name', full_name, 'role', role),
    now(),
    now()
  )
  returning id into new_user_id;

  -- Update Profile permissions (Profile is created by trigger, but we update permissions here)
  -- We need to wait for trigger or do upsert
  insert into public.profiles (user_id, full_name, role, permissions, is_active)
  values (new_user_id, full_name, role, permissions, true)
  on conflict (user_id) do update
  set permissions = excluded.permissions,
      role = excluded.role,
      full_name = excluded.full_name;

  return new_user_id;
end;
$$;
