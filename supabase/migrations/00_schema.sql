-- Final Production Schema
create extension if not exists "pgcrypto";

drop type if exists public.user_role cascade;
create type public.user_role as enum ('admin', 'sales', 'warehouse', 'accountant');
drop type if exists public.invoice_type cascade;
create type public.invoice_type as enum ('sale', 'purchase', 'return_sale', 'return_purchase');
drop type if exists public.payment_method cascade;
create type public.payment_method as enum ('cash', 'card', 'credit', 'transfer');
drop type if exists public.invoice_status cascade;
create type public.invoice_status as enum ('pending', 'completed', 'cancelled');

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  color text,
  icon text,
  created_at timestamptz default now()
);
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  sku text unique,
  barcode text unique,
  category_id uuid references public.categories(id) on delete set null,
  price_retail numeric(15,2) not null default 0,
  price_wholesale numeric(15,2) default 0,
  cost_price numeric(15,2) not null default 0,
  quantity integer not null default 0,
  min_quantity integer not null default 0,
  unit text default 'piece',
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  balance numeric(15,2) default 0,
  total_purchases numeric(15,2) default 0,
  credit_limit numeric(15,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  balance numeric(15,2) default 0,
  total_purchases numeric(15,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  type public.invoice_type not null default 'sale',
  customer_id uuid references public.customers(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  subtotal numeric(15,2) not null default 0,
  discount numeric(15,2) default 0,
  tax numeric(15,2) default 0,
  total numeric(15,2) not null default 0,
  paid numeric(15,2) default 0,
  remaining numeric(15,2) generated always as (total - paid) stored,
  status public.invoice_status default 'completed',
  payment_method public.payment_method default 'cash',
  notes text,
  created_by uuid,
  created_at timestamptz default now()
);
create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.invoices(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null default 1,
  price numeric(15,2) not null default 0,
  cost numeric(15,2) default 0,
  total numeric(15,2) not null default 0
);
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id text,
  customer_id uuid references public.customers(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  amount numeric(15,2) not null default 0,
  payment_method public.payment_method default 'cash',
  notes text,
  created_by uuid,
  created_at timestamptz default now()
);
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  title text not null,
  message text not null,
  is_read boolean default false,
  type text default 'info',
  created_at timestamptz default now()
);
create table if not exists public.store_settings (
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
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.user_role default 'sales',
  permissions text[] default '{}',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.customers enable row level security;
alter table public.suppliers enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
alter table public.store_settings enable row level security;
alter table public.profiles enable row level security;

create policy "Allow all" on public.products for all using (true);
create policy "Allow all" on public.categories for all using (true);
create policy "Allow all" on public.customers for all using (true);
create policy "Allow all" on public.suppliers for all using (true);
create policy "Allow all" on public.invoices for all using (true);
create policy "Allow all" on public.invoice_items for all using (true);
create policy "Allow all" on public.payments for all using (true);
create policy "Allow all" on public.notifications for all using (true);
create policy "Allow all" on public.store_settings for all using (true);
create policy "Allow all" on public.profiles for all using (true);
