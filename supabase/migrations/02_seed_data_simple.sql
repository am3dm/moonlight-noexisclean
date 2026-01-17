-- Set Default Store Settings ONLY
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
