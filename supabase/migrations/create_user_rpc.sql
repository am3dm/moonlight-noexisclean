-- التأكد من وجود عمود الصلاحيات في جدول Profiles
alter table public.profiles 
add column if not exists permissions text[] default '{}';

-- تحديث دالة إنشاء المستخدم لتقبل الصلاحيات
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
  -- إنشاء المستخدم في auth.users
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    uuid_generate_v4(),
    'authenticated',
    'authenticated',
    email,
    crypt(password, gen_salt('bf')),
    now(),
    null,
    null,
    '{"provider":"email","providers":["email"]}',
    json_build_object('full_name', full_name, 'role', role),
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  returning id into new_user_id;

  -- إنشاء الملف الشخصي مع الصلاحيات
  insert into public.profiles (user_id, full_name, role, permissions)
  values (new_user_id, full_name, role, permissions)
  on conflict (user_id) do update
  set full_name = excluded.full_name,
      role = excluded.role,
      permissions = excluded.permissions;

  return new_user_id;
end;
$$;
