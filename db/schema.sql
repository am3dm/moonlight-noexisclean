-- Final Production Schema
-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Enums
drop type if exists public.user_role cascade;
create type public.user_role as enum ('admin', 'sales', 'warehouse', 'accountant');

drop type if exists public.invoice_type cascade;
create type public.invoice_type as enum ('sale', 'purchase', 'return_sale', 'return_purchase');

drop type if exists public.payment_method cascade;
create type public.payment_method as enum ('cash', 'card', 'credit', 'transfer');

drop type if exists public.invoice_status cascade;
create type public.invoice_status as enum ('pending', 'completed', 'cancelled');

-- Tables

create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  color text,
  icon text,
  created_at timestamptz default now()
);

create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  sku text unique,
  barcode text unique,
  category_id uuid references public.categories(id) on delete set null,
  price_retail numeric(15,2) not null default 0, -- Retail Price
  price_wholesale numeric(15,2) default 0, -- Wholesale Price
  cost_price numeric(15,2) not null default 0, -- Cost
  quantity integer not null default 0,
  min_quantity integer not null default 0,
  unit text default 'piece',
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text,
  email text,
  address text,
  balance numeric(15,2) default 0, -- (+) Dept, (-) Credit
  total_purchases numeric(15,2) default 0,
  credit_limit numeric(15,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.suppliers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text,
  email text,
  address text,
  balance numeric(15,2) default 0, -- (+) Dept (We owe them), (-) They owe us
  total_purchases numeric(15,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
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
  created_by uuid, -- references auth.users
  created_at timestamptz default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid references public.invoices(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null, -- Snapshot of name
  quantity integer not null default 1,
  price numeric(15,2) not null default 0, -- Snapshot of price at sale
  cost numeric(15,2) default 0, -- Snapshot of cost at sale
  total numeric(15,2) not null default 0
);

create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  invoice_id text, -- Can be reference number or UUID
  customer_id uuid references public.customers(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  amount numeric(15,2) not null default 0,
  payment_method public.payment_method default 'cash',
  notes text,
  created_by uuid,
  created_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid, -- references auth.users
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
alter table public.suppliers enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;

-- Open Policy for MVP/Self-Hosted
create policy "Allow all" on public.products for all using (true);
create policy "Allow all" on public.categories for all using (true);
create policy "Allow all" on public.customers for all using (true);
create policy "Allow all" on public.suppliers for all using (true);
create policy "Allow all" on public.invoices for all using (true);
create policy "Allow all" on public.invoice_items for all using (true);
create policy "Allow all" on public.payments for all using (true);
create policy "Allow all" on public.notifications for all using (true);
