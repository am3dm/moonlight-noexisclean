import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Storage keys
const OFFLINE_INVOICES_KEY = 'offline_invoices';
const OFFLINE_PAYMENTS_KEY = 'offline_payments';

interface OfflineInvoice {
  id: string;
  tempId: string;
  data: any;
  items: any[];
  createdAt: string;
}

interface OfflinePayment {
  id: string;
  tempId: string;
  data: any;
  createdAt: string;
}

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const queryClient = useQueryClient();
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get pending items count
  const updatePendingCount = useCallback(() => {
    const invoices = getOfflineInvoices();
    const payments = getOfflinePayments();
    setPendingCount(invoices.length + payments.length);
  }, []);

  // Storage helpers
  const getOfflineInvoices = (): OfflineInvoice[] => {
    try {
      const data = localStorage.getItem(OFFLINE_INVOICES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const getOfflinePayments = (): OfflinePayment[] => {
    try {
      const data = localStorage.getItem(OFFLINE_PAYMENTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const saveOfflineInvoice = (invoice: Omit<OfflineInvoice, 'id' | 'createdAt'>) => {
    const invoices = getOfflineInvoices();
    const newInvoice: OfflineInvoice = {
      ...invoice,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    invoices.push(newInvoice);
    localStorage.setItem(OFFLINE_INVOICES_KEY, JSON.stringify(invoices));
    updatePendingCount();
    return newInvoice;
  };

  const saveOfflinePayment = (payment: Omit<OfflinePayment, 'id' | 'createdAt'>) => {
    const payments = getOfflinePayments();
    const newPayment: OfflinePayment = {
      ...payment,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    payments.push(newPayment);
    localStorage.setItem(OFFLINE_PAYMENTS_KEY, JSON.stringify(payments));
    updatePendingCount();
    return newPayment;
  };

  const removeOfflineInvoice = (id: string) => {
    const invoices = getOfflineInvoices().filter(i => i.id !== id);
    localStorage.setItem(OFFLINE_INVOICES_KEY, JSON.stringify(invoices));
    updatePendingCount();
  };

  const removeOfflinePayment = (id: string) => {
    const payments = getOfflinePayments().filter(p => p.id !== id);
    localStorage.setItem(OFFLINE_PAYMENTS_KEY, JSON.stringify(payments));
    updatePendingCount();
  };

  // Sync offline invoices
  const syncInvoices = async (): Promise<number> => {
    const invoices = getOfflineInvoices();
    let syncedCount = 0;

    for (const offlineInvoice of invoices) {
      try {
        // Generate invoice number
        const { count } = await supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true });
        
        const invoiceNumber = `INV${String((count || 0) + 1).padStart(6, '0')}`;
        
        const { data: newInvoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert([{ 
            ...offlineInvoice.data, 
            invoice_number: invoiceNumber,
            is_synced: true,
          }])
          .select()
          .single();
        
        if (invoiceError) throw invoiceError;

        // Insert invoice items
        const invoiceItems = offlineInvoice.items.map(item => ({
          ...item,
          invoice_id: newInvoice.id,
        }));
        
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(invoiceItems);
        
        if (itemsError) throw itemsError;

        // Update product quantities
        for (const item of offlineInvoice.items) {
          const { data: product } = await supabase
            .from('products')
            .select('quantity')
            .eq('id', item.product_id)
            .single();
          
          if (product) {
            const newQuantity = offlineInvoice.data.type === 'sale' 
              ? product.quantity - item.quantity 
              : product.quantity + item.quantity;
            
            await supabase
              .from('products')
              .update({ quantity: newQuantity })
              .eq('id', item.product_id);
          }
        }

        // Update customer balance if credit sale
        if (offlineInvoice.data.payment_method === 'credit' && offlineInvoice.data.customer_id) {
          const { data: customer } = await supabase
            .from('customers')
            .select('balance, total_purchases')
            .eq('id', offlineInvoice.data.customer_id)
            .single();
          
          if (customer) {
            await supabase
              .from('customers')
              .update({
                balance: Number(customer.balance) + Number(offlineInvoice.data.remaining),
                total_purchases: Number(customer.total_purchases) + Number(offlineInvoice.data.total),
              })
              .eq('id', offlineInvoice.data.customer_id);
          }
        }

        removeOfflineInvoice(offlineInvoice.id);
        syncedCount++;
      } catch (error) {
        console.error('Error syncing invoice:', offlineInvoice.id, error);
      }
    }

    return syncedCount;
  };

  // Sync offline payments
  const syncPayments = async (): Promise<number> => {
    const payments = getOfflinePayments();
    let syncedCount = 0;

    for (const offlinePayment of payments) {
      try {
        const { error: paymentError } = await supabase
          .from('payments')
          .insert([offlinePayment.data]);
        
        if (paymentError) throw paymentError;

        // Update customer balance
        const { data: customer } = await supabase
          .from('customers')
          .select('balance')
          .eq('id', offlinePayment.data.customer_id)
          .single();
        
        if (customer) {
          await supabase
            .from('customers')
            .update({
              balance: Number(customer.balance) - Number(offlinePayment.data.amount_paid),
            })
            .eq('id', offlinePayment.data.customer_id);
        }

        removeOfflinePayment(offlinePayment.id);
        syncedCount++;
      } catch (error) {
        console.error('Error syncing payment:', offlinePayment.id, error);
      }
    }

    return syncedCount;
  };

  // Main sync function
  const syncAll = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    const invoices = getOfflineInvoices();
    const payments = getOfflinePayments();

    if (invoices.length === 0 && payments.length === 0) return;

    setIsSyncing(true);

    try {
      const [syncedInvoices, syncedPayments] = await Promise.all([
        syncInvoices(),
        syncPayments(),
      ]);

      const totalSynced = syncedInvoices + syncedPayments;

      if (totalSynced > 0) {
        toast.success(`تمت مزامنة ${totalSynced} عملية بنجاح`);
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['payments'] });
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, queryClient]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('تم استعادة الاتصال بالإنترنت');
      syncAll();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('لا يوجد اتصال بالإنترنت - وضع العمل دون اتصال');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncAll]);

  // Periodic sync check (every 30 seconds)
  useEffect(() => {
    updatePendingCount();
    
    syncIntervalRef.current = setInterval(() => {
      if (isOnline) {
        syncAll();
      }
    }, 30000);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isOnline, syncAll, updatePendingCount]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    saveOfflineInvoice,
    saveOfflinePayment,
    getOfflineInvoices,
    getOfflinePayments,
    syncAll,
    updatePendingCount,
  };
};

export default useOfflineSync;
