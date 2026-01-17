import { useState, useEffect } from 'react';
import { X, ScanBarcode, Loader2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Product } from '@/types';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { toast } from 'sonner';
import { useCreateProduct, useUpdateProduct, useCategories } from '@/hooks/useDatabase';

interface ProductModalProps {
  product: any | null; // Adapting to DB type
  onClose: () => void;
}

export const ProductModal = ({ product, onClose }: ProductModalProps) => {
  const { data: categories } = useCategories();
  const { mutate: addProduct, isPending: isAdding } = useCreateProduct();
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '', // DB doesn't have SKU, I'll map it to nothing or description? Wait, barcode is there.
    barcode: '',
    categoryId: '',
    price: 0,
    cost: 0,
    quantity: 0,
    minQuantity: 0,
    unit: 'قطعة', // DB doesn't have unit? I should check schema.
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
        sku: product.sku || '', // Use SKU if exists in obj, otherwise empty
        barcode: product.barcode || '',
        categoryId: product.category_id || '',
        price: parseFloat(product.price) || 0,
        cost: parseFloat(product.cost_price) || 0,
        quantity: product.stock_quantity || 0,
        minQuantity: product.min_stock_level || 0,
        unit: 'قطعة', // Default
        isActive: product.is_active,
      });
    }
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Map form data to DB schema
    const productData = {
        name: formData.name,
        description: formData.description,
        barcode: formData.barcode,
        price: formData.price,
        cost_price: formData.cost,
        stock_quantity: formData.quantity,
        min_stock_level: formData.minQuantity,
        category_id: formData.categoryId || null,
        is_active: formData.isActive
        // SKU and Unit are not in simple schema, ignored for now
    };

    if (product) {
      updateProduct({ id: product.id, ...productData }, {
          onSuccess: onClose
      });
    } else {
      addProduct(productData, {
          onSuccess: onClose
      });
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
              <label className="block text-sm font-medium mb-2">باركود</label>
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
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="input-field"
              >
                <option value="">اختر التصنيف</option>
                {categories?.map((cat: any) => (
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
              <label className="block text-sm font-medium mb-2">الكمية الحالية *</label>
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
              <label className="block text-sm font-medium mb-2">حد الطلب (Minimum)</label>
              <input
                type="number"
                min="0"
                value={formData.minQuantity}
                onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) })}
                className="input-field"
              />
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
            <button type="submit" disabled={isLoading} className="btn-primary flex-1">
              {isLoading && <Loader2 className="animate-spin ml-2" size={16} />}
              {product ? 'حفظ التغييرات' : 'إضافة المنتج'}
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
