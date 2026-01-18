CREATE TABLE IF NOT EXISTS public.store_settings (
  id uuid primary key default gen_random_uuid(),
  store_name text default 'My Store',
  store_phone text,
  store_email text,
  store_address text,
  currency text default 'IQD',
  tax_rate numeric(5,2) default 0,
  invoice_prefix text default 'INV',
  language text default 'ar',
  is_setup_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

INSERT INTO public.store_settings (
    store_name,
    store_address,
    store_phone,
    currency,
    language,
    is_setup_completed
) VALUES (
    'متجر النخيل',
    'بغداد - العراق',
    '07700000000',
    'IQD',
    'ar',
    true
) ON CONFLICT DO NOTHING;
