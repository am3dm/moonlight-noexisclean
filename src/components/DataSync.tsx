import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { 
  useProducts, 
  useCategories, 
  useCustomers, 
  useSuppliers, 
  useInvoices, 
  useStoreSettings 
} from '@/hooks/useDatabase';
import { Product, Category, Customer, Supplier, Invoice, Settings } from '@/types';

export const DataSync = () => {
  const { 
    setProducts, 
    setCategories, 
    setCustomers, 
    setSuppliers, 
    setInvoices, 
    updateSettings 
  } = useStore();

  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const { data: customers } = useCustomers();
  const { data: suppliers } = useSuppliers();
  const { data: invoices } = useInvoices();
  const { data: settings } = useStoreSettings();

  useEffect(() => {
    if (products) {
      // Convert DB schema to App Type if needed, or assume match
      const mappedProducts: Product[] = products.map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku || '',
        barcode: p.barcode || '',
        categoryId: p.category_id,
        price: Number(p.price),
        cost: Number(p.cost),
        quantity: Number(p.quantity),
        minQuantity: Number(p.min_quantity),
        unit: p.unit || 'piece',
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at || p.created_at)
      }));
      setProducts(mappedProducts);
    }
  }, [products, setProducts]);

  useEffect(() => {
    if (categories) {
      const mappedCategories: Category[] = categories.map((c: any) => ({
        id: c.id,
        name: c.name,
        description: c.description || '',
        color: c.color || '#000000',
        icon: c.icon || 'tag',
        createdAt: new Date(c.created_at)
      }));
      setCategories(mappedCategories);
    }
  }, [categories, setCategories]);

  useEffect(() => {
    if (customers) {
      const mappedCustomers: Customer[] = customers.map((c: any) => ({
        id: c.id,
        name: c.name,
        phone: c.phone || '',
        email: c.email || '',
        address: c.address || '',
        balance: Number(c.balance),
        totalPurchases: Number(c.total_purchases || 0),
        createdAt: new Date(c.created_at)
      }));
      setCustomers(mappedCustomers);
    }
  }, [customers, setCustomers]);

  useEffect(() => {
    if (suppliers) {
      const mappedSuppliers: Supplier[] = suppliers.map((s: any) => ({
        id: s.id,
        name: s.name,
        phone: s.phone || '',
        email: s.email || '',
        address: s.address || '',
        balance: Number(s.balance),
        totalPurchases: Number(s.total_purchases || 0),
        createdAt: new Date(s.created_at)
      }));
      setSuppliers(mappedSuppliers);
    }
  }, [suppliers, setSuppliers]);

  useEffect(() => {
    if (invoices) {
      const mappedInvoices: Invoice[] = invoices.map((i: any) => ({
        id: i.id,
        invoiceNumber: i.invoice_number,
        type: i.type,
        customerId: i.customer_id,
        supplierId: i.supplier_id,
        items: (i.invoice_items || []).map((item: any) => ({
           id: item.id,
           productId: item.product_id,
           quantity: item.quantity,
           price: Number(item.price),
           productName: item.product_name || 'Product'
        })),
        subtotal: Number(i.subtotal),
        discount: Number(i.discount),
        tax: Number(i.tax),
        total: Number(i.total),
        status: i.status,
        paymentMethod: i.payment_method || 'cash',
        createdAt: new Date(i.created_at),
        createdBy: i.created_by
      }));
      setInvoices(mappedInvoices);
    }
  }, [invoices, setInvoices]);

  useEffect(() => {
    if (settings) {
       const mappedSettings: Partial<Settings> = {
           storeName: settings.store_name,
           storeAddress: settings.store_address,
           storePhone: settings.store_phone,
           storeEmail: settings.store_email,
           currency: settings.currency,
           taxRate: Number(settings.tax_rate),
           invoicePrefix: settings.invoice_prefix,
           language: settings.language as any,
           printers: settings.printers // Already parsed in hook
       };
       updateSettings(mappedSettings);
    }
  }, [settings, updateSettings]);

  return null;
};
