import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Truck, Phone, MapPin, Mail, Package } from 'lucide-react';
import { useSuppliers, useDeleteSupplier } from '@/hooks/useDatabase';
import { useStore } from '@/store/useStore';
import { SupplierModal } from '../modals/SupplierModal';

export const Suppliers = () => {
  const { data: suppliersData } = useSuppliers();
  const { mutate: deleteSupplier } = useDeleteSupplier();
  
  const suppliers = suppliersData || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);

  const filteredSuppliers = suppliers.filter((supplier: any) =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (supplier.phone && supplier.phone.includes(searchQuery))
  );

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المورد؟')) {
      deleteSupplier(id);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">الموردين</h1>
          <p className="text-muted-foreground text-lg">إدارة بيانات الموردين وشركات التوزيع</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary gap-2"
        >
          <Plus size={20} />
          إضافة مورد جديد
        </button>
      </div>

      {/* Search */}
      <div className="glass-card p-6">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="بحث عن مورد بالاسم أو رقم الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pr-10 w-full"
          />
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredSuppliers.map((supplier: any, index: number) => (
          <div 
            key={supplier.id} 
            className="glass-card rounded-2xl p-6 hover-lift group animate-slide-up"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {/* Header with Icon */}
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center text-accent shadow-lg">
                <Truck size={28} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEdit(supplier)}
                  className="p-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors text-primary"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(supplier.id)}
                  className="p-2 bg-destructive/10 hover:bg-destructive/20 rounded-lg transition-colors text-destructive"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Info */}
            <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{supplier.name}</h3>
            {supplier.contact_person && (
                <p className="text-sm text-muted-foreground mb-3">مسؤول التواصل: {supplier.contact_person}</p>
            )}
            
            <div className="space-y-2 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-primary/70" />
                <span dir="ltr">{supplier.phone || 'لا يوجد رقم'}</span>
              </div>
              {supplier.email && (
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-primary/70" />
                  <span>{supplier.email}</span>
                </div>
              )}
              {supplier.address && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-primary/70" />
                  <span>{supplier.address}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-border/50 flex justify-between items-center text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                    <Package size={12}/> توريد منتجات
                </span>
                {/* Could add total supplied value here later */}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {suppliers.length === 0 && (
        <div className="text-center py-16">
          <Truck className="mx-auto text-muted-foreground/30 mb-4" size={80} />
          <p className="text-xl text-muted-foreground font-medium">لا يوجد موردين</p>
          <p className="text-sm text-muted-foreground mt-2">قم بإضافة بيانات الموردين لتسهيل عمليات الشراء</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <SupplierModal 
          supplier={editingSupplier} 
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
