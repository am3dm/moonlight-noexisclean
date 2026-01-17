-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'staff', -- admin, staff
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    loyalty_points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    barcode TEXT UNIQUE,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    category_id UUID REFERENCES categories(id),
    supplier_id UUID REFERENCES suppliers(id),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions Table (Sales & Purchases)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- sale, purchase, return
    customer_id UUID REFERENCES customers(id),
    supplier_id UUID REFERENCES suppliers(id),
    payment_method TEXT DEFAULT 'cash', -- cash, card
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    status TEXT DEFAULT 'completed', -- completed, pending, cancelled
    invoice_number TEXT, -- Added invoice number
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Transaction Items Table
CREATE TABLE IF NOT EXISTS transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL, -- Sale price at the moment
    cost_price DECIMAL(10, 2), -- Cost price at the moment (for profit calc)
    created_at TIMESTAMP DEFAULT NOW()
);

-- Payments Table (For debts)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    amount DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    transaction_id UUID REFERENCES transactions(id), -- Optional link to specific transaction
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Store Settings Table
CREATE TABLE IF NOT EXISTS store_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_name TEXT,
    store_phone TEXT,
    store_email TEXT,
    store_address TEXT,
    currency TEXT DEFAULT 'IQD',
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    invoice_prefix TEXT DEFAULT 'INV',
    is_setup_completed BOOLEAN DEFAULT false,
    printers_config JSONB DEFAULT '[]',
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed Initial Admin User (Password: admin123)
-- Hash generated using bcryptjs
INSERT INTO users (email, password_hash, full_name, role)
VALUES ('admin@moonlight.com', '$2a$10$X7.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1', 'Admin', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Seed Basic Categories
INSERT INTO categories (name, description) VALUES 
('General', 'General items'),
('Electronics', 'Electronic devices'),
('Groceries', 'Food and daily needs')
ON CONFLICT DO NOTHING;

-- Seed Initial Store Settings
INSERT INTO store_settings (store_name) VALUES ('My Store') ON CONFLICT DO NOTHING;
