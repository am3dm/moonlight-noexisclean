import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Users as UsersIcon, Phone, Mail, TrendingUp, CreditCard, History, Printer } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Customer } from '@/types';
import { CustomerModal } from '../modals/CustomerModal';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ThermalInvoicePrint } from '@/components/ThermalInvoicePrint';

export const Customers = () => {
  const { customers, invoices, payments, deleteCustomer, settings } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  // Statement State
  const [showStatement, setShowStatement] = useState(false);
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);
  const [statementData, setStatementData] = useState<any[]>([]);

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery)
  );

  const totalBalance = customers.reduce((sum, c) => sum + (c.balance || 0), 0);
  const totalPurchases = customers.reduce((sum, c) => sum + (c.totalPurchases || 0), 0);

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      deleteCustomer(id);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleShowStatement = (customer: Customer) => {
    const custInvoices = invoices.filter(i => i.customerId === customer.id).map(i => ({...i, type: 'invoice'}));
    const custPayments = payments.filter(p => p.customerId === customer.id).map(p => ({...p, type: 'payment'}));
    
    // Merge and sort
    const timeline = [...custInvoices, ...custPayments].sort((a, b) => 
        new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
    );

    setStatementCustomer(customer);
    setStatementData(timeline);
    setShowStatement(true);
  };

  const handlePrintStatement = () => {
     const printContent = document.getElementById('statement-print-area');
     if (printContent) {
         const printWindow = window.open('', '', 'width=800,height=600');
         if (printWindow) {
             printWindow.document.write(`
               <html dir="rtl">
                 <head><title>كشف حساب</title></head>
                 <body style="font-family: Arial;">${printContent.innerHTML}</body>
               </html>
             `);
             printWindow.document.close();
             printWindow.print();
         }
     }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">العملاء</h1>
          <p className="text-muted-foreground text-lg">إدارة بيانات ومعاملات العملاء</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary gap-2"
        >
          <Plus size={20} />
          إضافة عميل جديد
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">إجمالي العملاء</p>
              <p className="text-3xl font-bold">{customers.length}</p>
            </div>
            <div className="p-4 bg-primary/10 rounded-xl">
              <UsersIcon className="text-primary" size={28} />
            </div>
          </div>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">إجمالي الأرصدة</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(totalBalance, settings.currency)}</p>
            </div>
            <div className="p-4 bg-destructive/10 rounded-xl">
              <CreditCard className="text-destructive" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="glass-card p-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="ابحث عن عميل باسم أو رقم هاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pr-10 w-full"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="glass-card p-6 overflow-x-auto">
        {filteredCustomers.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-right py-4 px-4 font-semibold">العميل</th>
                <th className="text-right py-4 px-4 font-semibold">الهاتف</th>
                <th className="text-right py-4 px-4 font-semibold">الرصيد</th>
                <th className="text-right py-4 px-4 font-semibold">إجمالي المشتريات</th>
                <th className="text-right py-4 px-4 font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer, idx) => (
                <tr key={customer.id} className="border-b border-border/30 hover:bg-muted/50 transition-colors animate-slide-up" style={{ animationDelay: `${idx * 0.03}s` }}>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <UsersIcon className="text-primary" size={18} />
                      </div>
                      <div>
                        <p className="font-semibold">{customer.name}</p>
                        {customer.address && (
                          <p className="text-xs text-muted-foreground">{customer.address}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {customer.phone && (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone size={14} className="text-muted-foreground" />
                        {customer.phone}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <span className={customer.balance > 0 ? 'text-destructive font-bold' : 'text-success font-bold'}>
                      {formatCurrency(customer.balance, settings.currency)}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-semibold">{formatCurrency(customer.totalPurchases, settings.currency)}</td>
                  <td className="py-4 px-4">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleShowStatement(customer)} title="كشف حساب">
                         <History size={16} />
                      </Button>
                      <button onClick={() => handleEdit(customer)} className="p-2 hover:bg-muted rounded-lg transition-colors text-primary" title="تعديل">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(customer.id)} className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive" title="حذف">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-16">
            <UsersIcon className="mx-auto text-muted-foreground/30 mb-4" size={80} />
            <p className="text-xl text-muted-foreground font-medium">لا يوجد عملاء</p>
            <p className="text-sm text-muted-foreground mt-2">ابدأ بإضافة عميل جديد لتتبع معاملاتهم</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <CustomerModal 
          customer={editingCustomer} 
          onClose={handleModalClose} 
        />
      )}

      {/* Statement Modal */}
      <Dialog open={showStatement} onOpenChange={setShowStatement}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>كشف حساب العميل</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
               {statementCustomer && (
                   <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg">
                       <div>
                           <h3 className="font-bold text-lg">{statementCustomer.name}</h3>
                           <p className="text-sm text-muted-foreground">{statementCustomer.phone}</p>
                       </div>
                       <div className="text-left">
                           <p className="text-sm text-muted-foreground">الرصيد الحالي</p>
                           <p className="font-bold text-xl text-destructive">{formatCurrency(statementCustomer.balance, settings.currency)}</p>
                       </div>
                   </div>
               )}

               <div className="border rounded-lg overflow-hidden">
                   <table className="w-full text-right">
                       <thead className="bg-muted text-muted-foreground text-xs uppercase font-medium">
                           <tr>
                               <th className="px-4 py-3">التاريخ</th>
                               <th className="px-4 py-3">العملية</th>
                               <th className="px-4 py-3">المبلغ</th>
                               <th className="px-4 py-3">التفاصيل</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-border">
                           {statementData.map((item, idx) => (
                               <tr key={idx} className="hover:bg-muted/50">
                                   <td className="px-4 py-3 text-sm">{formatDate(item.createdAt || item.date)}</td>
                                   <td className="px-4 py-3 text-sm">
                                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.type === 'invoice' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                           {item.type === 'invoice' ? 'فاتورة' : 'دفعة'}
                                       </span>
                                   </td>
                                   <td className="px-4 py-3 text-sm font-medium">
                                       {formatCurrency(item.total || item.amount, settings.currency)}
                                   </td>
                                   <td className="px-4 py-3 text-sm text-muted-foreground">
                                       {item.type === 'invoice' ? `رقم: ${item.invoiceNumber}` : `إيصال: ${item.number}`}
                                   </td>
                               </tr>
                           ))}
                           {statementData.length === 0 && (
                               <tr>
                                   <td colSpan={4} className="p-8 text-center text-muted-foreground">لا توجد عمليات مسجلة</td>
                               </tr>
                           )}
                       </tbody>
                   </table>
               </div>
               
               <div className="flex justify-end gap-2">
                   <Button variant="outline" onClick={() => setShowStatement(false)}>إغلاق</Button>
                   <Button onClick={handlePrintStatement}><Printer size={16} className="mr-2"/> طباعة الكشف</Button>
               </div>
            </div>

            {/* Hidden Print Area */}
            <div id="statement-print-area" className="hidden">
                 {statementCustomer && (
                     <ThermalInvoicePrint 
                        invoice={{total: 0, subtotal: 0, discount: 0, paid: 0, remaining: 0, invoiceNumber: '', type: 'sale', items: [], createdAt: new Date(), createdBy: ''} as any}
                        items={statementData} 
                        customer={statementCustomer} 
                        storeSettings={settings} 
                        payments={[]}
                        isStatement={true}
                     />
                 )}
            </div>
        </DialogContent>
      </Dialog>

      {/* Developer Footer */}
      <div className="mt-8 p-4 bg-card/50 rounded-xl border border-border text-center text-xs text-muted-foreground">
        <p><span className="font-semibold">Moonlight Noexis</span> © 2025 | تطوير: المهندس عدنان مرسال | <span className="text-primary font-mono">07901854868</span></p>
      </div>
    </div>
  );
};
