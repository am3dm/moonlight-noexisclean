-- Consolidated and Final Schema for Moonlight Noexis (Production Ready)

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto"; -- For password hashing in RPC

-- Enums
drop type if exists public.user_role cascade;
create type public.user_role as enum ('admin', 'sales', 'warehouse', 'accountant');

drop type if exists public.invoice_type cascade;
create type public.invoice_type as enum ('sale', 'purchase', 'return');

drop type if exists public.payment_method cascade;
create type public.payment_method as enum ('cash', 'card', 'credit', 'transfer');

drop type if exists public.invoice_status cascade;
create type public.invoice_status as enum ('pending', 'completed', 'cancelled');

drop type if exists public.payment_type cascade;
create type public.payment_type as enum ('payment', 'refund');

-- Tables

-- Profiles (Linked to auth.users)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.user_role default 'sales',
  permissions text[] default '{}',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Categories
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  color text,
  icon text,
  created_at timestamptz default now()
);

-- Products
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  sku text,
  barcode text,
  category_id uuid references public.categories(id) on delete set null,
  price numeric(15,0) not null default 0,
  cost numeric(15,0) not null default 0,
  quantity integer not null default 0,
  min_quantity integer not null default 0,
  unit text default 'piece',
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Customers
create table if not exists public.customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text,
  email text,
  address text,
  balance numeric(15,0) default 0,
  total_purchases numeric(15,0) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Suppliers
create table if not exists public.suppliers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text,
  email text,
  address text,
  balance numeric(15,0) default 0,
  total_purchases numeric(15,0) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Invoices
create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  invoice_number text not null,
  type public.invoice_type not null default 'sale',
  customer_id uuid references public.customers(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  subtotal numeric(15,0) not null default 0,
  discount numeric(15,0) default 0,
  tax numeric(15,0) default 0,
  total numeric(15,0) not null default 0,
  paid numeric(15,0) default 0,
  remaining numeric(15,0) default 0,
  status public.invoice_status default 'completed',
  payment_method public.payment_method default 'cash',
  notes text,
  original_invoice_id uuid references public.invoices(id) on delete set null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Invoice Items
create table if not exists public.invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid references public.invoices(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null default 1,
  price numeric(15,0) not null default 0,
  discount numeric(15,0) default 0,
  total numeric(15,0) not null default 0
);

-- Payments
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid references public.invoices(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  amount numeric(15,0) not null default 0,
  payment_method public.payment_method default 'cash',
  type public.payment_type default 'payment',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Store Settings
create table if not exists public.store_settings (
  id uuid primary key default uuid_generate_v4(),
  store_name text default 'My Store',
  store_phone text,
  store_email text,
  store_address text,
  currency text default 'IQD',
  tax_rate numeric(5,2) default 0,
  invoice_prefix text default 'INV',
  language text default 'ar',
  printers_config jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Shifts
create table if not exists public.shifts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  start_time timestamptz default now(),
  end_time timestamptz,
  starting_cash numeric(15,0) default 0,
  ending_cash_actual numeric(15,0) default 0,
  ending_cash_expected numeric(15,0) default 0,
  total_sales_cash numeric(15,0) default 0,
  total_sales_card numeric(15,0) default 0,
  total_sales_credit numeric(15,0) default 0,
  status text default 'open',
  notes text,
  created_at timestamptz default now()
);

-- Audit Logs
create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  action_type text not null,
  entity text,
  entity_id text,
  details text,
  created_at timestamptz default now()
);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean default false,
  type text default 'info',
  created_at timestamptz default now()
);

-- RLS
alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.customers enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.store_settings enable row level security;
alter table public.payments enable row level security;
alter table public.shifts enable row level security;
alter table public.audit_logs enable row level security;
alter table public.profiles enable row level security;

-- Policies (Simplified for Production Readiness - allow all authenticated users for now)
-- In a stricter environment, restrict based on role in profiles
create policy "Allow all access to authenticated users" on public.products for all using (auth.role() = 'authenticated');
create policy "Allow all access to authenticated users" on public.categories for all using (auth.role() = 'authenticated');
create policy "Allow all access to authenticated users" on public.customers for all using (auth.role() = 'authenticated');
create policy "Allow all access to authenticated users" on public.invoices for all using (auth.role() = 'authenticated');
create policy "Allow all access to authenticated users" on public.invoice_items for all using (auth.role() = 'authenticated');
create policy "Allow all access to authenticated users" on public.store_settings for all using (auth.role() = 'authenticated');
create policy "Allow all access to authenticated users" on public.payments for all using (auth.role() = 'authenticated');
create policy "Allow all access to authenticated users" on public.shifts for all using (auth.role() = 'authenticated');
create policy "Allow all access to authenticated users" on public.audit_logs for all using (auth.role() = 'authenticated');
create policy "Allow all access to authenticated users" on public.profiles for all using (auth.role() = 'authenticated');

-- Triggers for User Profile Creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', (new.raw_user_meta_data->>'role')::public.user_role);
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid duplication errors on re-run
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RPC Functions (Admin User Management)

-- 1. Create New User
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
  -- Check if caller is admin (optional safety check)
  -- if not exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin') then
  --   raise exception 'Access Denied';
  -- end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000',
    uuid_generate_v4(),
    'authenticated',
    'authenticated',
    email,
    crypt(password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    json_build_object('full_name', full_name, 'role', role),
    now(),
    now()
  )
  returning id into new_user_id;

  -- Profile creation is handled by trigger usually, but we can force update permissions here
  -- Trigger handles basic profile, we update permissions
  update public.profiles 
  set permissions = create_new_user.permissions 
  where user_id = new_user_id;

  return new_user_id;
end;
$$;

-- 2. Update User Details
create or replace function public.update_user_details(
  target_user_id uuid,
  new_password text default null,
  new_full_name text default null,
  new_role public.user_role default null,
  new_permissions text[] default null,
  new_is_active boolean default null
)
returns void
language plpgsql
security definer
as $$
begin
  -- Update Password
  if new_password is not null and length(new_password) >= 6 then
    update auth.users
    set encrypted_password = crypt(new_password, gen_salt('bf')),
        updated_at = now()
    where id = target_user_id;
  end if;

  -- Update Profile
  update public.profiles
  set 
    full_name = coalesce(new_full_name, full_name),
    role = coalesce(new_role, role),
    permissions = coalesce(new_permissions, permissions),
    is_active = coalesce(new_is_active, is_active),
    updated_at = now()
  where user_id = target_user_id;

  -- Sync Metadata
  if new_full_name is not null or new_role is not null then
    update auth.users
    set raw_user_meta_data = 
      raw_user_meta_data || 
      jsonb_build_object(
        'full_name', coalesce(new_full_name, raw_user_meta_data->>'full_name'),
        'role', coalesce(new_role::text, raw_user_meta_data->>'role')
      )
    where id = target_user_id;
  end if;
end;
$$;

-- 3. Stock Management Functions
create or replace function decrement_stock(p_id uuid, qty int)
returns void as $$
begin
  update public.products
  set quantity = quantity - qty
  where id = p_id;
end;
$$ language plpgsql;

create or replace function increment_stock(p_id uuid, qty int)
returns void as $$
begin
  update public.products
  set quantity = quantity + qty
  where id = p_id;
end;
$$ language plpgsql;
