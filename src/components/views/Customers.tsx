import { useState } from 'react';
import { Plus, Search, Edit, Trash2, User, Phone, MapPin, Mail, ShoppingBag } from 'lucide-react';
import { useCustomers, useDeleteCustomer } from '@/hooks/useDatabase';
import { useStore } from '@/store/useStore';
import { formatCurrency } from '@/lib/utils';
import { Customer } from '@/types';
import { CustomerModal } from '../modals/CustomerModal';

export const Customers = () => {
  const { settings } = useStore();
  const { data: customersData } = useCustomers();
  const { mutate: deleteCustomer } = useDeleteCustomer();

  const customers = customersData || [];
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);

  const filteredCustomers = customers.filter((customer: any) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchQuery))
  );

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العميل؟ سيتم حذف سجل المبيعات المرتبط به أيضاً!')) {
      deleteCustomer(id);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">العملاء</h1>
          <p className="text-muted-foreground text-lg">إدارة بيانات العملاء والديون</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary gap-2"
        >
          <Plus size={20} />
          إضافة عميل جديد
        </button>
      </div>

      {/* Search */}
      <div className="glass-card p-6">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="بحث عن عميل بالاسم أو رقم الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pr-10 w-full"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredCustomers.map((customer: any, index: number) => (
          <div 
            key={customer.id} 
            className="glass-card rounded-2xl p-6 hover-lift group animate-slide-up"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {/* Header with Avatar */}
            <div className="flex items-start justify-between mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary text-2xl font-bold shadow-inner">
                {customer.name.charAt(0)}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEdit(customer)}
                  className="p-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors text-primary"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(customer.id)}
                  className="p-2 bg-destructive/10 hover:bg-destructive/20 rounded-lg transition-colors text-destructive"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Info */}
            <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{customer.name}</h3>
            
            <div className="space-y-2 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-primary/70" />
                <span dir="ltr">{customer.phone || 'لا يوجد رقم'}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-primary/70" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-primary/70" />
                  <span>{customer.address}</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-border/50">
              <div className="text-center p-2 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-1">المشتريات</p>
                <p className="font-bold text-primary">{formatCurrency(customer.totalPurchases || 0, settings.currency)}</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-1">الديون</p>
                <p className={`font-bold ${customer.balance > 0 ? 'text-destructive' : 'text-success'}`}>
                  {formatCurrency(customer.balance || 0, settings.currency)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {customers.length === 0 && (
        <div className="text-center py-16">
          <User className="mx-auto text-muted-foreground/30 mb-4" size={80} />
          <p className="text-xl text-muted-foreground font-medium">لا يوجد عملاء</p>
          <p className="text-sm text-muted-foreground mt-2">قم بإضافة عملاء جدد لتسجيل المبيعات بأسمائهم</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <CustomerModal 
          customer={editingCustomer} 
          onClose={handleModalClose} 
        />
      )}
      
      {/* Developer Footer */}
      <div className="mt-8 p-4 bg-card/50 rounded-xl border border-border text-center text-xs text-muted-foreground">
        <p><span className="font-semibold">Moonlight Noexis</span> © 2025 | تطوير: المهندس عدنان مرسال | <span className="text-primary font-mono">07901854868</span></p>
      </div>
    </div>
  );
};
