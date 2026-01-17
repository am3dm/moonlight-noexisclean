-- Manual Admin User Creation (Fail-safe)
DO $$
DECLARE
  new_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
BEGIN
  -- 1. Insert User if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@moonlight.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_id,
      'authenticated',
      'authenticated',
      'admin@moonlight.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Admin","role":"admin"}'
    );
  END IF;

  -- 2. Insert Profile
  INSERT INTO public.profiles (user_id, full_name, role, is_active)
  VALUES (new_id, 'Admin', 'admin', true)
  ON CONFLICT (user_id) DO NOTHING;

END $$;
