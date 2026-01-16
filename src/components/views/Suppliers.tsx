import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Fixed: Import Label
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, CreditCard, Wallet, Truck, Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

export const Suppliers = () => {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, addPayment, settings, logAction } = useStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.phone?.includes(searchQuery)
  );

  const totalDebt = suppliers.reduce((sum, s) => sum + s.balance, 0);

  const handleOpenModal = (supplier?: any) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({ name: supplier.name, phone: supplier.phone || '', email: supplier.email || '', address: supplier.address || '' });
    } else {
      setEditingSupplier(null);
      setFormData({ name: '', phone: '', email: '', address: '' });
    }
    setIsModalOpen(true);
  };

  const handleSaveSupplier = () => {
    if (!formData.name) {
      toast.error('اسم المورد مطلوب');
      return;
    }
    if (editingSupplier) {
      updateSupplier(editingSupplier.id, formData);
      toast.success('تم تحديث بيانات المورد');
    } else {
      addSupplier(formData);
      toast.success('تم إضافة المورد بنجاح');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المورد؟')) {
      deleteSupplier(id);
      toast.success('تم حذف المورد');
    }
  };

  const handleOpenPayment = (supplier: any) => {
    setSelectedSupplier(supplier);
    setPaymentAmount('');
    setIsPaymentModalOpen(true);
  };

  const handleSubmitPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }
    if (amount > selectedSupplier.balance) {
      toast.error('المبلغ أكبر من المستحق للمورد');
      return;
    }

    // Process Payment (Reduce Supplier Balance)
    const newBalance = selectedSupplier.balance - amount;
    updateSupplier(selectedSupplier.id, { balance: newBalance });
    
    // Log Action
    logAction({
      userId: 'current-user',
      actionType: 'UPDATE',
      entity: 'Supplier',
      entityId: selectedSupplier.id,
      details: `Payment to Supplier: ${amount} - Remaining: ${newBalance}`
    });

    toast.success('تم تسجيل الدفعة للمورد بنجاح');
    setIsPaymentModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">الموردين</h1>
          <p className="text-muted-foreground">إدارة الموردين والديون المستحقة لهم</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus size={20} /> إضافة مورد
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">إجمالي الديون للموردين</p>
              <h3 className="text-2xl font-bold text-destructive">{formatCurrency(totalDebt, settings.currency)}</h3>
            </div>
            <Wallet className="h-8 w-8 text-destructive opacity-50" />
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="بحث عن مورد..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المورد</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>إجمالي المشتريات</TableHead>
                <TableHead>الدين المستحق</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        {supplier.name}
                      </div>
                    </TableCell>
                    <TableCell>{supplier.phone || '-'}</TableCell>
                    <TableCell>{formatCurrency(supplier.totalPurchases, settings.currency)}</TableCell>
                    <TableCell>
                      <span className={supplier.balance > 0 ? "font-bold text-destructive" : "text-success"}>
                        {formatCurrency(supplier.balance, settings.currency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(supplier)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {supplier.balance > 0 && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="gap-2 text-xs h-8 border-destructive/20 text-destructive hover:bg-destructive/10"
                            onClick={() => handleOpenPayment(supplier)}
                          >
                            <CreditCard size={14} />
                            سداد
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(supplier.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    لا يوجد موردين
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingSupplier ? 'تعديل المورد' : 'إضافة مورد جديد'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>اسم المورد *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>العنوان</Label>
              <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
            </div>
            <Button onClick={handleSaveSupplier} className="w-full">حفظ</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>سداد دفعة للمورد: {selectedSupplier?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-destructive/10 rounded-lg flex justify-between items-center text-destructive">
              <span>المستحق:</span>
              <span className="font-bold text-lg">{selectedSupplier && formatCurrency(selectedSupplier.balance, settings.currency)}</span>
            </div>
            <div className="space-y-2">
              <Label>المبلغ المدفوع</Label>
              <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="0.00" />
            </div>
            <Button onClick={handleSubmitPayment} className="w-full gap-2">
              <CreditCard size={18} />
              تسجيل السداد
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
