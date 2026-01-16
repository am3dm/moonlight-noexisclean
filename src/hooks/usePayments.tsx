import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export const usePayments = (customerId?: string) => {
  return useQuery({
    queryKey: ['payments', customerId],
    queryFn: async () => {
      let query = supabase
        .from('payments')
        .select('*, customers(name)')
        .order('created_at', { ascending: false });
      
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: true,
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (payment: {
      customer_id: string;
      amount_paid: number;
      payment_method: string;
      note?: string;
    }) => {
      // 1. Create payment record
      const { data: newPayment, error: paymentError } = await supabase
        .from('payments')
        .insert([{
          ...payment,
          created_by: user?.id,
        }])
        .select()
        .single();
      
      if (paymentError) throw paymentError;

      // 2. Update customer balance
      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('balance')
        .eq('id', payment.customer_id)
        .single();
      
      if (fetchError) throw fetchError;

      const newBalance = Math.max(0, Number(customer.balance) - payment.amount_paid);
      
      const { error: updateError } = await supabase
        .from('customers')
        .update({ balance: newBalance })
        .eq('id', payment.customer_id);
      
      if (updateError) throw updateError;

      // 3. Create audit log
      await supabase.from('audit_logs').insert([{
        user_id: user?.id,
        action: 'PAYMENT_RECEIVED',
        table_name: 'payments',
        record_id: newPayment.id,
        new_data: { amount: payment.amount_paid, customer_id: payment.customer_id },
        details: `استلام دفعة بمبلغ ${payment.amount_paid} د.ع`,
      }]);
      
      return newPayment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('تم تسجيل الدفعة بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'حدث خطأ أثناء تسجيل الدفعة');
    },
  });
};

export const useCustomerInvoices = (customerId: string) => {
  return useQuery({
    queryKey: ['customer_invoices', customerId],
    queryFn: async () => {
      // Get credit invoices with their items
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_items(
            id,
            product_name,
            quantity,
            price,
            total
          )
        `)
        .eq('customer_id', customerId)
        .eq('payment_method', 'credit')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return invoices;
    },
    enabled: !!customerId,
  });
};

export default usePayments;
