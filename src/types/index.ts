// User and Permission Types
export interface User {
  id: string;
  username: string;
  fullName: string;
  password?: string;
  role: 'admin' | 'sales' | 'warehouse' | 'accountant';
  permissions: Permission[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
}

export type Permission = 
  | 'manage_users'
  | 'manage_settings'
  | 'view_reports'
  | 'manage_products'
  | 'manage_sales'
  | 'manage_purchases'
  | 'manage_customers'
  | 'approve_invoices';

// Settings Update
export interface PrinterConfig {
  id: string;
  name: string;
  type: 'cashier' | 'kitchen' | 'other';
  enabled: boolean;
}

export interface Settings {
  storeName: string;
  storePhone?: string;
  storeEmail?: string;
  storeAddress?: string;
  currency: string;
  taxRate: number;
  logo?: string;
  invoicePrefix: string;
  language: 'ar' | 'en';
  footerMessage?: string;
  invoiceNotes?: string;
  printers: PrinterConfig[];
  useElectronPrinter?: boolean;
  defaultPrinterId?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  price: number;       // Mapped to price_retail
  wholesalePrice?: number; // Mapped to price_wholesale
  cost: number;        // Mapped to cost_price
  quantity: number;    // Mapped to quantity
  minQuantity: number; // Mapped to min_quantity
  unit: string;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  balance: number;
  totalPurchases: number;
  createdAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  balance: number;
  totalPurchases: number;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'sale' | 'purchase' | 'return';
  customerId?: string;
  supplierId?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  remaining: number;
  status: 'pending' | 'completed' | 'cancelled';
  paymentMethod: 'cash' | 'card' | 'credit' | 'transfer';
  notes?: string;
  originalInvoiceId?: string;
  createdAt: Date;
  createdBy: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

export interface Payment {
  id: string;
  invoiceId?: string;
  customerId?: string;
  supplierId?: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'credit' | 'transfer';
  type: 'payment' | 'refund';
  notes?: string;
  createdAt: Date;
  createdBy: string;
}

export interface Shift {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  startingCash: number;
  endingCashActual?: number;
  endingCashExpected?: number;
  totalSalesCash: number;
  totalSalesCard: number;
  totalSalesCredit: number;
  status: 'open' | 'closed';
  notes?: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description?: string;
  reference?: string;
  createdAt: Date;
  createdBy: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
  entity: string;
  entityId: string;
  timestamp: Date;
  details?: string;
}

export interface DashboardStats {
  totalSales: number;
  totalPurchases: number;
  totalProfit: number;
  totalProducts: number;
  lowStockProducts: number;
  pendingInvoices: number;
  todaySales: number;
  monthSales: number;
}

export type ViewMode = 'dashboard' | 'products' | 'categories' | 'sales' | 'purchases' | 'returns' | 'customers' | 'suppliers' | 'reports' | 'settings' | 'users' | 'debts';
