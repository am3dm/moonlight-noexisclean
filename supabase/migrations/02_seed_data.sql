-- Create default admin user
-- Note: Password is 'admin123' (hashed)
INSERT INTO auth.users (
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
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'authenticated',
    'authenticated',
    'admin@moonlight.com',
    crypt('admin123', gen_salt('bf')),
    now(),
    NULL,
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"مدير النظام","role":"admin"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- Create Profile for Admin (if trigger didn't catch it or for safety)
INSERT INTO public.profiles (user_id, full_name, role, is_active)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'مدير النظام',
    'admin',
    true
) ON CONFLICT (user_id) DO NOTHING;

-- Set Default Store Settings
INSERT INTO public.store_settings (
    store_name,
    store_address,
    store_phone,
    currency,
    language
) VALUES (
    'متجر النخيل',
    'بغداد - العراق',
    '07700000000',
    'IQD',
    'ar'
) ON CONFLICT DO NOTHING;
