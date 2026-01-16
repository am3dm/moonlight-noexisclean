import { useState, useEffect } from 'react';
import { X, ScanBarcode } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Product } from '@/types';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { toast } from 'sonner';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductModal = ({ product, onClose }: ProductModalProps) => {
  const { categories, addProduct, updateProduct } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    barcode: '',
    categoryId: '',
    price: 0,
    cost: 0,
    quantity: 0,
    minQuantity: 0,
    unit: 'قطعة',
    isActive: true,
  });

  // Attach global scanner listener when modal is open
  useBarcodeScanner({
    onScan: (scannedCode) => {
      setFormData(prev => ({ ...prev, barcode: scannedCode }));
      toast.success(`تم قراءة الباركود: ${scannedCode}`);
    }
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        sku: product.sku,
        barcode: product.barcode || '',
        categoryId: product.categoryId,
        price: product.price,
        cost: product.cost,
        quantity: product.quantity,
        minQuantity: product.minQuantity,
        unit: product.unit,
        isActive: product.isActive,
      });
    }
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (product) {
      updateProduct(product.id, formData);
    } else {
      addProduct(formData);
    }
    
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">
            {product ? 'تعديل منتج' : 'إضافة منتج جديد'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-2">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">اسم المنتج *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="أدخل اسم المنتج"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">رمز المنتج (SKU) *</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="input-field"
                placeholder="PROD001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الباركود</label>
              <div className="relative">
                <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="input-field pr-10" // Padding for icon
                    placeholder="امسح الباركود الآن..."
                    autoFocus={!product} // Auto focus on barcode for new products if workflow prefers
                />
                <ScanBarcode className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-pulse" size={18} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">يمكنك استخدام ماسح الباركود الآن</p>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">التصنيف *</label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="input-field"
              >
                <option value="">اختر التصنيف</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">سعر البيع *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">سعر التكلفة *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الكمية *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الحد الأدنى</label>
              <input
                type="number"
                min="0"
                value={formData.minQuantity}
                onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">وحدة القياس</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="input-field"
              >
                <option value="قطعة">قطعة</option>
                <option value="كيلو">كيلو</option>
                <option value="لتر">لتر</option>
                <option value="متر">متر</option>
                <option value="علبة">علبة</option>
                <option value="كرتون">كرتون</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="isActive" className="text-sm">منتج نشط</label>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">الوصف</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field min-h-[80px]"
                placeholder="وصف المنتج (اختياري)"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              {product ? 'حفظ التغييرات' : 'إضافة المنتج'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
