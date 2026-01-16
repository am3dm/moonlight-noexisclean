-- Use this script in Supabase SQL Editor to create the first admin user manually
-- Only run this if you cannot sign up via the UI

-- 1. Create user in auth.users
-- NOTE: You must generate a UUID for the ID or let it generate one. 
-- Replacing 'new-uuid-here' with a real UUID (e.g., from an online generator) is safer if uuid_generate_v4() is tricky in strict mode context.
DO $$
DECLARE
  new_uid uuid := uuid_generate_v4();
BEGIN
  INSERT INTO auth.users (
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
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_uid,
    'authenticated',
    'authenticated',
    'admin@system.local',
    crypt('admin123', gen_salt('bf')), -- Change password here
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"System Admin","role":"admin"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- 2. Ensure profile exists (trigger usually handles this, but manual insert is safe)
  INSERT INTO public.profiles (user_id, full_name, role, is_active, permissions)
  VALUES (new_uid, 'System Admin', 'admin', true, '{"all"}')
  ON CONFLICT (user_id) DO NOTHING;

END $$;
