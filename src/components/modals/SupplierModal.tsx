import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useCreateSupplier, useUpdateSupplier } from '@/hooks/useDatabase';

interface SupplierModalProps {
  supplier: any | null;
  onClose: () => void;
}

export const SupplierModal = ({ supplier, onClose }: SupplierModalProps) => {
  const { mutate: addSupplier, isPending: isAdding } = useCreateSupplier();
  const { mutate: updateSupplier, isPending: isUpdating } = useUpdateSupplier();

  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name,
        contact_person: supplier.contact_person || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
      });
    }
  }, [supplier]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (supplier) {
      updateSupplier({ id: supplier.id, ...formData }, { onSuccess: onClose });
    } else {
      addSupplier(formData, { onSuccess: onClose });
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
            {supplier ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-2">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">اسم الشركة / المورد *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="اسم الشركة أو المورد"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">الشخص المسؤول (اختياري)</label>
            <input
              type="text"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              className="input-field"
              placeholder="اسم مندوب المبيعات أو المدير"
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
                placeholder="example@company.com"
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
              placeholder="موقع الشركة أو المخزن"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={isLoading} className="btn-primary flex-1">
              {isLoading && <Loader2 className="animate-spin ml-2" size={16} />}
              {supplier ? 'حفظ التغييرات' : 'إضافة المورد'}
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
