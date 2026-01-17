import { useState, useEffect } from 'react';
import { X, Palette, Loader2 } from 'lucide-react';
import { useCreateCategory, useUpdateCategory } from '@/hooks/useDatabase';
import { Category } from '@/types';

interface CategoryModalProps {
  category: any | null;
  onClose: () => void;
}

const colors = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
  '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'
];

export const CategoryModal = ({ category, onClose }: CategoryModalProps) => {
  const { mutate: addCategory, isPending: isAdding } = useCreateCategory();
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: 'Tag'
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        color: category.color || '#3B82F6',
        icon: category.icon || 'Tag'
      });
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (category) {
      updateCategory({ id: category.id, ...formData }, { onSuccess: onClose });
    } else {
      addCategory(formData, { onSuccess: onClose });
    }
  };

  const isLoading = isAdding || isUpdating;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content animate-scale-in max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">
            {category ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-2">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">اسم التصنيف *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="مثال: إلكترونيات"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">الوصف</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field min-h-[80px]"
              placeholder="وصف مختصر للتصنيف..."
            />
          </div>

          {/* Color Picker (Frontend Only feature for now unless schema updated) */}
          {/* Note: Schema doesn't have color yet, but we can send it and backend will ignore or we can add it to schema later. 
              The hook uses partial<Category> so it might pass through but be ignored by SQL insert if column missing. 
              Let's keep it in UI. */}
          <div>
            <label className="block text-sm font-medium mb-2">لون التمييز</label>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c })}
                  className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                    formData.color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={isLoading} className="btn-primary flex-1">
              {isLoading && <Loader2 className="animate-spin ml-2" size={16} />}
              {category ? 'حفظ التغييرات' : 'إضافة التصنيف'}
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
