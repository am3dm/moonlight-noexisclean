import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// --- Types ---
export interface Product {
  id: string;
  name: string;
  barcode: string | null;
  description: string | null;
  price: number;
  cost_price: number;
  stock_quantity: number;
  min_stock_level: number;
  category_id: string | null;
  supplier_id: string | null;
  image_url: string | null;
  is_active: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  balance?: number;
  totalPurchases?: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
}

export interface StoreSettings {
  id?: string;
  store_name: string;
  store_phone: string;
  store_email?: string;
  store_address: string;
  currency?: string;
  tax_rate?: number;
  invoice_prefix?: string;
  is_setup_completed: boolean;
  printers_config?: any;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  last_login?: string;
}

// --- HOOKS ---

// Products
export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await api.get('/products');
      return data;
    },
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (product: Partial<Product>) => {
      const { data } = await api.post('/products', product);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('تم إضافة المنتج بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'فشل إضافة المنتج');
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...product }: { id: string } & Partial<Product>) => {
      const { data } = await api.put(`/products/${id}`, product);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('تم تحديث المنتج بنجاح');
    },
    onError: (error: any) => {
        toast.error(error.response?.data?.error || 'فشل تحديث المنتج');
      },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('تم حذف المنتج بنجاح');
    },
  });
};

// Categories
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data;
    },
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: Partial<Category>) => {
      const { data } = await api.post('/categories', category);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('تم إضافة الفئة بنجاح');
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...category }: { id: string } & Partial<Category>) => {
      const { data } = await api.put(`/categories/${id}`, category);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('تم تحديث الفئة بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'فشل تحديث الفئة');
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('تم حذف الفئة بنجاح');
    },
  });
};

// Customers
export const useCustomers = () => {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await api.get('/customers');
      return data;
    },
  });
};

export const useCreateCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (customer: Partial<Customer>) => {
        const { data } = await api.post('/customers', customer);
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        toast.success('تم إضافة العميل بنجاح');
      },
    });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...customer }: { id: string } & Partial<Customer>) => {
      const { data } = await api.put(`/customers/${id}`, customer);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('تم تحديث العميل بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'فشل تحديث العميل');
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('تم حذف العميل بنجاح');
    },
  });
};

// Suppliers
export const useSuppliers = () => {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data } = await api.get('/suppliers');
      return data;
    },
  });
};

export const useCreateSupplier = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (supplier: Partial<Supplier>) => {
        const { data } = await api.post('/suppliers', supplier);
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        toast.success('تم إضافة المورد بنجاح');
      },
    });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...supplier }: { id: string } & Partial<Supplier>) => {
      const { data } = await api.put(`/suppliers/${id}`, supplier);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('تم تحديث المورد بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'فشل تحديث المورد');
    },
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('تم حذف المورد بنجاح');
    },
  });
};


// Transactions (Invoices)
export const useTransactions = () => {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data } = await api.get('/transactions');
      return data;
    },
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (transaction: any) => {
      const { data } = await api.post('/transactions', transaction);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Stock updated
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] }); // Balance updated
      toast.success('تم إنشاء العملية بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'فشل إنشاء العملية');
    },
  });
};

// Payments
export const usePayments = () => {
    return useQuery({
        queryKey: ['payments'],
        queryFn: async () => {
            const { data } = await api.get('/payments');
            return data;
        },
    });
};

export const useCreatePayment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payment: any) => {
            const { data } = await api.post('/payments', payment);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] }); // Balance updated
            toast.success('تم تسجيل الدفعة بنجاح');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'فشل تسجيل الدفعة');
        },
    });
};

export const useCustomerStatement = (customerId: string) => {
    return useQuery({
        queryKey: ['customer_statement', customerId],
        queryFn: async () => {
            if (!customerId) return [];
            const { data } = await api.get(`/customers/${customerId}/statement`);
            return data;
        },
        enabled: !!customerId
    });
};

// Dashboard Stats
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard_stats'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/stats');
      return data;
    },
  });
};

// Store Settings
export const useStoreSettings = () => {
  return useQuery({
    queryKey: ['store_settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return data;
    },
  });
};

export const useUpdateStoreSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Partial<StoreSettings>) => {
      const { data } = await api.post('/settings', settings);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store_settings'] });
      toast.success('تم حفظ الإعدادات بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'فشل حفظ الإعدادات');
    },
  });
};

// Users (Admin)
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: any) => {
      const { data } = await api.post('/users', user);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('تم إضافة المستخدم بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'فشل إضافة المستخدم');
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...user }: { id: string } & any) => {
      const { data } = await api.put(`/users/${id}`, user);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('تم تحديث المستخدم بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'فشل تحديث المستخدم');
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('تم حذف المستخدم بنجاح');
    },
  });
};
