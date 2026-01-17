require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-it-in-production';

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@db:5432/moonlight',
});

// Test DB connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to database', err);
  } else {
    console.log('Connected to database at:', res.rows[0].now);
  }
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Check for Admin Role
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Require Admin Role' });
    }
};

// --- Routes ---

// Auth
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role, name: user.full_name }, JWT_SECRET, { expiresIn: '8h' });
    
    // Update last login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    res.json({ token, user: { id: user.id, email: user.email, name: user.full_name, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Users Management (Admin Only)
app.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, full_name, role, is_active, last_login, created_at FROM users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users', authenticateToken, isAdmin, async (req, res) => {
    const { email, password, full_name, role, is_active } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (email, password_hash, full_name, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role, is_active',
            [email, hashedPassword, full_name, role, is_active]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { email, full_name, role, is_active, password } = req.body;
    try {
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            const result = await pool.query(
                'UPDATE users SET email=$1, full_name=$2, role=$3, is_active=$4, password_hash=$5, updated_at=NOW() WHERE id=$6 RETURNING id, email, full_name, role, is_active',
                [email, full_name, role, is_active, hashedPassword, id]
            );
            res.json(result.rows[0]);
        } else {
             const result = await pool.query(
                'UPDATE users SET email=$1, full_name=$2, role=$3, is_active=$4, updated_at=NOW() WHERE id=$5 RETURNING id, email, full_name, role, is_active',
                [email, full_name, role, is_active, id]
            );
            res.json(result.rows[0]);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM users WHERE id=$1', [id]);
        res.sendStatus(204);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Products
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', authenticateToken, async (req, res) => {
  const { name, barcode, description, price, cost_price, stock_quantity, min_stock_level, category_id, supplier_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO products (name, barcode, description, price, cost_price, stock_quantity, min_stock_level, category_id, supplier_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, barcode, description, price, cost_price, stock_quantity, min_stock_level, category_id, supplier_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, barcode, description, price, cost_price, stock_quantity, min_stock_level, category_id, supplier_id } = req.body;
  try {
    const result = await pool.query(
      `UPDATE products SET name=$1, barcode=$2, description=$3, price=$4, cost_price=$5, stock_quantity=$6, min_stock_level=$7, category_id=$8, supplier_id=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [name, barcode, description, price, cost_price, stock_quantity, min_stock_level, category_id, supplier_id, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Transactions (Sales/Purchases)
app.post('/api/transactions', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { type, customer_id, supplier_id, payment_method, items, total_amount, discount, notes } = req.body;
    
    // Generate Invoice Number
    const countRes = await client.query('SELECT count(*) FROM transactions WHERE type = $1', [type]);
    const count = parseInt(countRes.rows[0].count) + 1;
    const invoice_number = `${type === 'sale' ? 'INV' : 'PUR'}${count.toString().padStart(6, '0')}`;

    // Create transaction record
    const transactionRes = await client.query(
      `INSERT INTO transactions (type, customer_id, supplier_id, payment_method, total_amount, discount, notes, created_by, invoice_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, invoice_number`,
      [type, customer_id, supplier_id, payment_method, total_amount, discount, notes, req.user.id, invoice_number]
    );
    const transactionId = transactionRes.rows[0].id;
    const finalInvoiceNumber = transactionRes.rows[0].invoice_number;

    // Process items
    for (const item of items) {
      // Add transaction item
      await client.query(
        `INSERT INTO transaction_items (transaction_id, product_id, quantity, price, cost_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [transactionId, item.product_id, item.quantity, item.price, item.cost_price]
      );

      // Update stock
      if (type === 'sale') {
        await client.query(
          `UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2`,
          [item.quantity, item.product_id]
        );
      } else if (type === 'purchase') {
        await client.query(
          `UPDATE products SET stock_quantity = stock_quantity + $1, cost_price = $2 WHERE id = $3`,
          [item.quantity, item.price, item.product_id] // Assuming price in purchase is the cost
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ id: transactionId, invoice_number: finalInvoiceNumber, message: 'Transaction processed successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, u.full_name as created_by_name, c.name as customer_name, s.name as supplier_name 
      FROM transactions t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN suppliers s ON t.supplier_id = s.id
      ORDER BY t.created_at DESC LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Payments
app.get('/api/payments', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM payments ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/payments', authenticateToken, async (req, res) => {
    const { customer_id, amount, notes, transaction_id } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO payments (customer_id, amount, notes, transaction_id, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [customer_id, amount, notes, transaction_id, req.user.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Customer Statement
app.get('/api/customers/:id/statement', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Get Sales Invoices
        const invoicesRes = await pool.query(
            "SELECT id, created_at, invoice_number as reference, total_amount as debit, 0 as credit, 'invoice' as type, status as notes FROM transactions WHERE customer_id = $1 AND type = 'sale' ORDER BY created_at",
            [id]
        );
        
        // Get Payments
        const paymentsRes = await pool.query(
            "SELECT id, created_at, 'PAY' as reference, 0 as debit, amount as credit, 'payment' as type, notes FROM payments WHERE customer_id = $1 ORDER BY created_at",
            [id]
        );

        // Merge
        const movements = [...invoicesRes.rows, ...paymentsRes.rows].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        // Calculate balance
        let balance = 0;
        const statement = movements.map(m => {
            balance += (parseFloat(m.debit) - parseFloat(m.credit));
            return { ...m, balance };
        });

        res.json(statement);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Customers
app.get('/api/customers', authenticateToken, async (req, res) => {
  try {
    // We should calculate balance here potentially
    // For simplicity, let's fetch basic info. 
    // Ideally we should have a view or subquery for balance.
    // Let's add a quick subquery for balance
    const result = await pool.query(`
        SELECT c.*, 
        (COALESCE((SELECT SUM(total_amount) FROM transactions WHERE customer_id = c.id AND type = 'sale'), 0) - 
         COALESCE((SELECT SUM(amount) FROM payments WHERE customer_id = c.id), 0)) as balance
        FROM customers c 
        ORDER BY c.name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers', authenticateToken, async (req, res) => {
  const { name, phone, email, address, notes } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO customers (name, phone, email, address, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, phone, email, address, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/customers/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, address, notes } = req.body;
  try {
    const result = await pool.query(
      'UPDATE customers SET name=$1, phone=$2, email=$3, address=$4, notes=$5, updated_at=NOW() WHERE id=$6 RETURNING *',
      [name, phone, email, address, notes, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/customers/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM customers WHERE id = $1', [id]);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Suppliers
app.get('/api/suppliers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM suppliers ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/suppliers', authenticateToken, async (req, res) => {
  const { name, contact_person, phone, email, address } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, contact_person, phone, email, address]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/suppliers/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, contact_person, phone, email, address } = req.body;
  try {
    const result = await pool.query(
      'UPDATE suppliers SET name=$1, contact_person=$2, phone=$3, email=$4, address=$5, updated_at=NOW() WHERE id=$6 RETURNING *',
      [name, contact_person, phone, email, address, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/suppliers/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM suppliers WHERE id = $1', [id]);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Categories
app.get('/api/categories', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
  const { name, description } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/categories/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const result = await pool.query(
      'UPDATE categories SET name=$1, description=$2 WHERE id=$3 RETURNING *',
      [name, description, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard Stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const salesRes = await pool.query("SELECT SUM(total_amount) as total FROM transactions WHERE type = 'sale' AND created_at > NOW() - INTERVAL '30 days'");
    const productsRes = await pool.query("SELECT COUNT(*) as count FROM products");
    const lowStockRes = await pool.query("SELECT COUNT(*) as count FROM products WHERE stock_quantity <= min_stock_level");
    const customersRes = await pool.query("SELECT COUNT(*) as count FROM customers");

    res.json({
      monthly_sales: salesRes.rows[0].total || 0,
      total_products: productsRes.rows[0].count,
      low_stock_items: lowStockRes.rows[0].count,
      total_customers: customersRes.rows[0].count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Store Settings
app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM store_settings LIMIT 1');
    if (result.rows.length === 0) {
      // Return default if not exists
      return res.json({});
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings', authenticateToken, async (req, res) => {
  const { store_name, store_phone, store_email, store_address, is_setup_completed } = req.body;
  try {
    // Check if exists
    const check = await pool.query('SELECT id FROM store_settings LIMIT 1');
    
    if (check.rows.length > 0) {
      const id = check.rows[0].id;
      const result = await pool.query(
        'UPDATE store_settings SET store_name=$1, store_phone=$2, store_email=$3, store_address=$4, is_setup_completed=$5, updated_at=NOW() WHERE id=$6 RETURNING *',
        [store_name, store_phone, store_email, store_address, is_setup_completed, id]
      );
      res.json(result.rows[0]);
    } else {
      const result = await pool.query(
        'INSERT INTO store_settings (store_name, store_phone, store_email, store_address, is_setup_completed) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [store_name, store_phone, store_email, store_address, is_setup_completed]
      );
      res.json(result.rows[0]);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
