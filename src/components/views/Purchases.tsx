import { useState, useMemo } from 'react';
import { Plus, Search, TruckIcon, Minus, Trash2, Receipt, Loader2, AlertCircle, PackagePlus, Save, CreditCard, Banknote } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { InvoiceItem, Invoice } from '@/types';

interface CartItem {
  productId: string;
  name: string;
  cost: number;
  quantity: number;
}

export const Purchases = () => {
  const { products, categories, suppliers, addInvoice, addProduct, settings, currentUser, addNotification } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  
  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash');
  const [paidAmount, setPaidAmount] = useState<string>('');

  // New Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    barcode: '',
    categoryId: '',
    cost: '',
    price: '',
    initialQty: '1'
  });

  const currency = settings.currency || 'IQD';

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const total = cart.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
  
  const paid = paymentMethod === 'credit' 
    ? (paidAmount ? parseFloat(paidAmount) : 0)
    : total;
  const remaining = Math.max(0, total - paid);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { 
        productId: product.id, 
        name: product.name, 
        cost: product.cost || 0,
        quantity: 1,
      }]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.productId !== productId));
    } else {
      setCart(cart.map(item => 
        item.productId === productId ? { ...item, quantity } : item
      ));
    }
  };

  const updateCost = (productId: string, cost: number) => {
    setCart(cart.map(item => 
      item.productId === productId ? { ...item, cost } : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const handleAddNewProduct = () => {
    if (!newProduct.name || !newProduct.cost || !newProduct.price) {
      toast.error('يرجى ملء الحقول الأساسية');
      return;
    }

    const cost = parseFloat(newProduct.cost);
    const price = parseFloat(newProduct.price);
    const qty = parseInt(newProduct.initialQty) || 1;

    const productData = {
      name: newProduct.name,
      barcode: newProduct.barcode || Math.random().toString().substr(2, 8),
      sku: newProduct.barcode || `SKU-${Date.now()}`,
      categoryId: newProduct.categoryId || categories[0]?.id || '',
      cost: cost,
      price: price,
      quantity: 0,
      minQuantity: 5,
      unit: 'piece',
      isActive: true
    };
    
    addProduct(productData);
    
    // In a real async environment we would wait for the ID, but here addProduct is synchronous in store for now (or optimistic)
    // For this flow to be perfect with backend hook, we might need to refactor addProduct to return the new product.
    // Assuming store updates immediately for now or we rely on re-fetch.
    // For simplicity, we just clear and inform user to search for it, or we try to find it.
    
    setTimeout(() => {
        const currentProducts = useStore.getState().products;
        const addedProduct = currentProducts.find(p => p.name === newProduct.name); // Simple match
        
        if (addedProduct) {
          setCart([...cart, {
            productId: addedProduct.id,
            name: addedProduct.name,
            cost: cost,
            quantity: qty
          }]);
          toast.success('تم إضافة المنتج الجديد وإدراجه في الفاتورة');
        } else {
           toast.success('تم إضافة المنتج. يرجى البحث عنه لإضافته للفاتورة.');
        }
        setIsNewProductModalOpen(false);
        setNewProduct({ name: '', barcode: '', categoryId: '', cost: '', price: '', initialQty: '1' });
    }, 500);
  };

  const handlePurchase = async () => {
    if (cart.length === 0) {
      toast.error('قائمة المشتريات فارغة');
      return;
    }
    if (!selectedSupplier) {
      toast.error('يرجى اختيار مورد');
      return;
    }

    setIsProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const invoiceItems: InvoiceItem[] = cart.map((item) => ({
        id: Math.random().toString(36).substr(2, 9),
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        price: item.cost,
        discount: 0,
        total: item.cost * item.quantity,
      }));

      const invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'> = {
        type: 'purchase',
        supplierId: selectedSupplier,
        items: invoiceItems,
        subtotal: total,
        discount: 0,
        tax: 0,
        total,
        paid: paid,
        remaining: remaining,
        status: 'completed',
        paymentMethod: paymentMethod, // cash or credit
        notes: 'فاتورة شراء',
        createdBy: currentUser?.id || 'system'
      };

      addInvoice(invoiceData);
      
      // Notify Admin
      if (currentUser?.role !== 'admin') {
        addNotification({
          title: 'فاتورة شراء جديدة',
          message: `قام ${currentUser?.fullName} بإضافة فاتورة شراء بقيمة ${formatCurrency(total, currency)}`,
          type: 'info'
        });
      }
      
      setCart([]);
      setSelectedSupplier('');
      setPaidAmount('');
      setPaymentMethod('cash');
      setShowSuccessDialog(true);
      toast.success('تم إتمام عملية الشراء بنجاح');
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('حدث خطأ أثناء إتمام العملية');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">المشتريات</h1>
          <p className="text-muted-foreground text-lg">إنشاء ومعالجة فواتير الشراء من الموردين</p>
        </div>
        <Button onClick={() => setIsNewProductModalOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <PackagePlus size={20} />
          تعريف منتج جديد
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-6 space-y-4">
            <div className="flex gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  type="text"
                  placeholder="ابحث عن منتج..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 w-full"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="min-w-[150px]">
                  <SelectValue placeholder="جميع التصنيفات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع التصنيفات</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              عدد المنتجات المتاحة: <span className="font-bold text-foreground">{filteredProducts.length}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map((product, idx) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="glass-card rounded-xl p-4 text-right hover-lift transition-all hover:border-accent group animate-slide-up"
                style={{ animationDelay: `${idx * 0.03}s` }}
              >
                <h4 className="font-semibold mb-1 line-clamp-1 group-hover:text-accent transition-colors">{product.name}</h4>
                <p className="text-sm text-muted-foreground mb-2">المخزون الحالي: {product.quantity}</p>
                <div className="flex justify-between items-center text-xs mt-2 border-t pt-2">
                  <span className="text-muted-foreground">سعر الشراء:</span>
                  <span className="font-bold text-accent">{formatCurrency(product.cost, currency)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cart & Payment */}
        <div className="glass-card rounded-2xl p-6 h-fit sticky top-24 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <TruckIcon className="text-accent" size={24} />
            <h2 className="text-xl font-bold">قائمة المشتريات</h2>
            {cart.length > 0 && (
              <span className="ml-auto bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded-full">
                {cart.length}
              </span>
            )}
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium mb-1 block">المورد</label>
            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المورد *" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">لا يوجد موردين</div>
                ) : (
                  suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin mb-4">
            {cart.map((item) => (
              <div key={item.productId} className="flex flex-col gap-2 p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
                <div className="flex justify-between items-start">
                  <p className="font-medium line-clamp-1">{item.name}</p>
                  <button 
                    onClick={() => removeFromCart(item.productId)}
                    className="text-destructive hover:bg-destructive/10 p-1 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="btn-icon-sm hover:bg-muted rounded"><Minus size={14} /></button>
                    <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="btn-icon-sm hover:bg-muted rounded"><Plus size={14} /></button>
                  </div>
                  <div className="flex items-center gap-1">
                    <Input 
                      type="number" 
                      className="h-7 w-20 text-center text-sm px-1" 
                      value={item.cost}
                      onChange={(e) => updateCost(item.productId, parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {cart.length > 0 && (
            <>
              <div className="border-t border-border pt-4 space-y-4 mb-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>الإجمالي</span>
                  <span className="text-accent">{formatCurrency(total, currency)}</span>
                </div>

                {/* Payment Options */}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant={paymentMethod === 'cash' ? 'default' : 'outline'} onClick={() => setPaymentMethod('cash')} className="h-9 text-xs"><Banknote size={14} className="mr-1"/> نقداً (كامل)</Button>
                  <Button variant={paymentMethod === 'credit' ? 'default' : 'outline'} onClick={() => setPaymentMethod('credit')} className="h-9 text-xs"><Receipt size={14} className="mr-1"/> آجل / جزئي</Button>
                </div>

                {paymentMethod === 'credit' && (
                  <div className="space-y-2 bg-destructive/5 p-2 rounded border border-destructive/20">
                    <div className="flex justify-between items-center text-sm">
                      <span>المدفوع للمورد</span>
                      <Input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} className="w-24 h-8" placeholder="0" />
                    </div>
                    <div className="flex justify-between text-sm font-bold text-destructive">
                      <span>المتبقي (دين)</span>
                      <span>{formatCurrency(remaining, currency)}</span>
                    </div>
                  </div>
                )}
              </div>

              <Button 
                onClick={handlePurchase}
                className="w-full gap-2 h-12 font-semibold bg-accent hover:bg-accent/90"
                disabled={isProcessing || !selectedSupplier}
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : <Receipt size={20} />}
                إتمام الشراء
              </Button>
            </>
          )}
        </div>
      </div>

      {/* New Product Dialog */}
      <Dialog open={isNewProductModalOpen} onOpenChange={setIsNewProductModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تعريف منتج جديد</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم المنتج *</Label>
                <Input value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>الباركود</Label>
                <Input value={newProduct.barcode} onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>التصنيف</Label>
              <Select value={newProduct.categoryId} onValueChange={(val) => setNewProduct({ ...newProduct, categoryId: val })}>
                <SelectTrigger><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-2">
              <div className="space-y-2">
                <Label className="text-accent">سعر الشراء (الجملة) *</Label>
                <Input type="number" value={newProduct.cost} onChange={(e) => setNewProduct({ ...newProduct, cost: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-primary">سعر البيع (المفرق) *</Label>
                <Input type="number" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>الكمية المشتراة الآن</Label>
              <Input type="number" value={newProduct.initialQty} onChange={(e) => setNewProduct({ ...newProduct, initialQty: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewProductModalOpen(false)}>إلغاء</Button>
            <Button onClick={handleAddNewProduct}>حفظ وإضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle className="text-success">تمت العملية بنجاح</DialogTitle></DialogHeader>
          <div className="space-y-4 py-6 text-center">
            <p className="text-2xl font-bold text-success">تم تسجيل المشتريات</p>
            <p className="text-sm text-muted-foreground">تم تحديث المخزون وحساب المورد</p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowSuccessDialog(false)}>إغلاق</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
