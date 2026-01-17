import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Package, Filter, TrendingUp } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatCurrency } from '@/lib/utils';
import { Product } from '@/types';
import { ProductModal } from '../modals/ProductModal';
import { useProducts, useDeleteProduct, useCategories } from '@/hooks/useDatabase';

export const Products = () => {
  const { settings } = useStore();
  const { data: productsData } = useProducts();
  const { data: categoriesData } = useCategories();
  const { mutate: deleteProduct } = useDeleteProduct();

  // Adapting to match local Product type if necessary, or just use DB type
  const products = productsData || [];
  const categories = categoriesData || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null); // Use Any to avoid strict type mismatch for now

  const filteredProducts = products.filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (product.barcode && product.barcode.includes(searchQuery)); // Use barcode instead of SKU if SKU missing
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categoryId: string) => {
    return categories.find((c: any) => c.id === categoryId)?.name || 'غير محدد';
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      deleteProduct(id);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const isLowStock = (product: any) => product.stock_quantity <= product.min_stock_level;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">المنتجات</h1>
          <p className="text-muted-foreground text-lg">إدارة منتجات المتجر والمخزون</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary gap-2"
        >
          <Plus size={20} />
          إضافة منتج جديد
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="ابحث عن منتج باسم أو باركود..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pr-10 w-full"
            />
          </div>
          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field pr-10 w-full appearance-none"
            >
              <option value="">جميع التصنيفات</option>
              {categories.map((category: any) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            عدد المنتجات: <span className="font-bold text-foreground">{filteredProducts.length}</span>
          </span>
          {searchQuery || selectedCategory ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
              }}
              className="text-primary hover:underline"
            >
              إعادة تعيين
            </button>
          ) : null}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredProducts.map((product: any, index: number) => (
          <div 
            key={product.id} 
            className="glass-card rounded-2xl overflow-hidden hover-lift group animate-slide-up"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {/* Image Area */}
            <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative overflow-hidden">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
              ) : (
                <Package className="text-muted-foreground group-hover:text-primary transition-colors" size={48} />
              )}
              
              {/* Category Badge */}
              <div 
                className="absolute top-3 right-3 px-3 py-1 rounded-lg text-xs font-bold text-white shadow-lg bg-primary"
              >
                {getCategoryName(product.category_id)}
              </div>

              {/* Low Stock Badge */}
              {isLowStock(product) && (
                <div className="absolute top-3 left-3 badge-destructive shadow-lg">
                  مخزون منخفض
                </div>
              )}

              {/* Overlay on Hover */}
              <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button 
                  onClick={() => handleEdit(product)}
                  className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  title="تعديل"
                >
                  <Edit size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(product.id)}
                  className="p-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
                  title="حذف"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-3">
              <div>
                <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">{product.name}</h3>
                <p className="text-xs text-muted-foreground">باركد: {product.barcode || '-'}</p>
              </div>

              {/* Price & Stock */}
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(product.price, settings.currency)}
                </span>
                <div className={`text-sm font-semibold px-2 py-1 rounded-lg ${
                  isLowStock(product) 
                    ? 'bg-destructive/10 text-destructive' 
                    : 'bg-success/10 text-success'
                }`}>
                  {product.stock_quantity} قطعة
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-16">
          <Package className="mx-auto text-muted-foreground/30 mb-4" size={80} />
          <p className="text-xl text-muted-foreground font-medium">لا توجد منتجات</p>
          <p className="text-sm text-muted-foreground mt-2">حاول تغيير معايير البحث أو الإضافة منتجات جديدة</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <ProductModal 
          product={editingProduct} 
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
