-- Seed Data for Production (Create Admin User & Basic Settings)

-- 1. Create Default Admin User
-- IMPORTANT: This uses the 'create_new_user' RPC logic but directly in SQL seed
-- You should change 'admin@example.com' and 'password123' immediately after deployment

DO $$
DECLARE
  new_admin_id uuid;
BEGIN
  -- Check if admin exists to avoid duplication
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@example.com') THEN
    
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
      'admin@example.com',
      crypt('password123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name": "المدير العام", "role": "admin"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    ) returning id into new_admin_id;

    -- Create Admin Profile with ALL Permissions
    insert into public.profiles (user_id, full_name, role, permissions, is_active)
    values (
      new_admin_id, 
      'المدير العام', 
      'admin', 
      ARRAY['manage_users', 'manage_settings', 'view_reports', 'manage_products', 'manage_sales', 'manage_purchases', 'manage_customers', 'approve_invoices'],
      true
    );

  END IF;
END $$;

-- 2. Store Settings (Default)
insert into public.store_settings (store_name, store_phone, currency, language, tax_rate)
select 'Moonlight Store', '07700000000', 'IQD', 'ar', 0
where not exists (select 1 from public.store_settings);

-- 3. Initial Categories (Optional Starter Data)
insert into public.categories (name, color) 
select 'عام', '#64748b'
where not exists (select 1 from public.categories);
