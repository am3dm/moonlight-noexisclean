import { useState } from 'react';
import { Plus, Edit, Trash2, Tag, Package, Grid3x3 } from 'lucide-react';
import { useCategories, useProducts, useDeleteCategory } from '@/hooks/useDatabase';
import { Category } from '@/types';
import { CategoryModal } from '../modals/CategoryModal';

export const Categories = () => {
  const { data: categoriesData } = useCategories();
  const { data: productsData } = useProducts();
  const { mutate: deleteCategory } = useDeleteCategory();

  const categories = categoriesData || [];
  const products = productsData || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  const getProductCount = (categoryId: string) => {
    return products.filter((p: any) => p.category_id === categoryId).length;
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const productCount = getProductCount(id);
    if (productCount > 0) {
      alert(`لا يمكن حذف هذا التصنيف لأنه يحتوي على ${productCount} منتج`);
      return;
    }
    if (confirm('هل أنت متأكد من حذف هذا التصنيف؟')) {
      deleteCategory(id);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">التصنيفات</h1>
          <p className="text-muted-foreground text-lg">إدارة تصنيفات المنتجات والفئات</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary gap-2"
        >
          <Plus size={20} />
          إضافة تصنيف جديد
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">إجمالي التصنيفات</p>
              <p className="text-3xl font-bold">{categories.length}</p>
            </div>
            <div className="p-4 bg-primary/10 rounded-xl">
              <Grid3x3 className="text-primary" size={28} />
            </div>
          </div>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">إجمالي المنتجات</p>
              <p className="text-3xl font-bold">{products.length}</p>
            </div>
            <div className="p-4 bg-accent/10 rounded-xl">
              <Package className="text-accent" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {categories.map((category: any, index: number) => {
          const productCount = getProductCount(category.id);
          // Default color if missing
          const catColor = category.color || '#3B82F6';
          
          return (
            <div 
              key={category.id} 
              className="glass-card rounded-2xl p-6 hover-lift group animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ 
                    backgroundColor: `${catColor}20`,
                    borderLeft: `4px solid ${catColor}`
                  }}
                >
                  <Tag style={{ color: catColor }} size={28} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEdit(category)}
                    className="p-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors text-primary"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(category.id)}
                    className="p-2 bg-destructive/10 hover:bg-destructive/20 rounded-lg transition-colors text-destructive"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{category.name}</h3>
              {category.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{category.description}</p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-muted-foreground" />
                  <span className="text-sm font-medium">
                    <span className="font-bold text-foreground">{productCount}</span>
                    <span className="text-muted-foreground"> منتج</span>
                  </span>
                </div>
                <div 
                  className="w-6 h-6 rounded-full border-2 border-white/20 shadow-lg"
                  style={{ backgroundColor: catColor }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {categories.length === 0 && (
        <div className="text-center py-16">
          <Tag className="mx-auto text-muted-foreground/30 mb-4" size={80} />
          <p className="text-xl text-muted-foreground font-medium">لا توجد تصنيفات</p>
          <p className="text-sm text-muted-foreground mt-2">ابدأ بإضافة تصنيف جديد لتنظيم منتجاتك</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <CategoryModal 
          category={editingCategory} 
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
