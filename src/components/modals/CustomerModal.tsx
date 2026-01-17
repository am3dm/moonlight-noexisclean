import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/useDatabase';

interface CustomerModalProps {
  customer: any | null;
  onClose: () => void;
}

export const CustomerModal = ({ customer, onClose }: CustomerModalProps) => {
  const { mutate: addCustomer, isPending: isAdding } = useCreateCustomer();
  const { mutate: updateCustomer, isPending: isUpdating } = useUpdateCustomer();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        notes: customer.notes || '',
      });
    }
  }, [customer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customer) {
      updateCustomer({ id: customer.id, ...formData }, { onSuccess: onClose });
    } else {
      addCustomer(formData, { onSuccess: onClose });
    }
  };

  const isLoading = isAdding || isUpdating;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">
            {customer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-2">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">اسم العميل *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="الاسم الثلاثي"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">رقم الهاتف</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
                placeholder="07xx xxx xxxx"
                dir="ltr"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                placeholder="example@mail.com"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">العنوان</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input-field"
              placeholder="المدينة، الحي، أقرب نقطة دالة"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">ملاحظات إضافية</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field min-h-[80px]"
              placeholder="أي تفاصيل أخرى..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={isLoading} className="btn-primary flex-1">
               {isLoading && <Loader2 className="animate-spin ml-2" size={16} />}
              {customer ? 'حفظ التغييرات' : 'إضافة العميل'}
            </button>
            <button type="button" disabled={isLoading} onClick={onClose} className="btn-secondary">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
