import { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, Search, ShoppingCart, Minus, Trash2, CreditCard, Banknote, Receipt, Printer, Loader2, ScanBarcode, AlertCircle, PauseCircle, Edit, Check, X, PrinterIcon } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ThermalInvoicePrint } from '@/components/ThermalInvoicePrint';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { Invoice, InvoiceItem } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export const Sales = () => {
  const { 
    products, categories, customers, settings, 
    addInvoice, suspendInvoice, deleteInvoice, 
    currentUser, cart, addToCart, updateCartQuantity, removeFromCart, clearCart,
    editingInvoiceId, setEditingInvoiceId
  } = useStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('walkin');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'credit'>('cash');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  const [lastInvoiceItems, setLastInvoiceItems] = useState<any[]>([]);
  const [lastCustomer, setLastCustomer] = useState<any>(null);
  const [autoPrint, setAutoPrint] = useState(true);
  
  // Multi-Printer State
  const [printCopies, setPrintCopies] = useState(1);
  const [selectedPrinters, setSelectedPrinters] = useState<string[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  const currency = settings.currency || 'IQD';
  const taxRate = settings.taxRate || 0;

  // Initialize selected printers from settings
  useEffect(() => {
     if (settings.printers) {
         setSelectedPrinters(settings.printers.filter(p => p.enabled).map(p => p.id));
     }
  }, [settings.printers]);

  // Ensure cart is valid
  const safeCart = Array.isArray(cart) ? cart : [];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.includes(searchQuery) ||
      product.sku?.includes(searchQuery);
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const subtotal = safeCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const tax = (subtotal - discount) * (taxRate / 100);
  const total = subtotal - discount + tax;
  
  const paid = paymentMethod === 'credit' 
    ? (paidAmount ? parseFloat(paidAmount) : 0)
    : total;
  const remaining = Math.max(0, total - paid);

  const handleBarcodeScan = useCallback((barcode: string) => {
    const product = products.find((p) => p.barcode === barcode || p.sku === barcode);
    if (product) {
      if (product.quantity > 0) {
        addToCart(product);
        toast.success(`تمت إضافة: ${product.name}`);
      } else {
        toast.error('المنتج غير متوفر (الكمية 0)');
      }
    } else {
      toast.error('لم يتم العثور على المنتج');
      setSearchQuery(barcode);
    }
  }, [products, addToCart]);

  const createInvoiceData = (status: 'completed' | 'pending'): Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'> => {
    const invoiceItems: InvoiceItem[] = safeCart.map(item => ({
      id: Math.random().toString(36).substr(2, 9),
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
      discount: 0,
      total: item.product.price * item.quantity,
    }));

    return {
      type: 'sale',
      customerId: selectedCustomer !== 'walkin' ? selectedCustomer : undefined,
      subtotal,
      discount,
      tax,
      total,
      paid: status === 'pending' ? 0 : paid,
      remaining: status === 'pending' ? total : remaining,
      status,
      paymentMethod,
      notes: notes || undefined,
      items: invoiceItems,
      createdBy: currentUser?.id || 'system',
    };
  };

  const handleCheckout = async () => {
    if (safeCart.length === 0) {
      toast.error('السلة فارغة');
      return;
    }

    if (paymentMethod === 'credit' && selectedCustomer === 'walkin') {
      toast.error('يجب اختيار عميل للبيع الآجل');
      return;
    }

    setIsProcessing(true);

    try {
      // Small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100));

      // If editing, delete old invoice first
      if (editingInvoiceId) {
        deleteInvoice(editingInvoiceId);
        setEditingInvoiceId(null);
      }

      const invoiceData = createInvoiceData('completed');
      addInvoice(invoiceData); 

      // Prepare for print
      const fullInvoiceForPrint = {
        ...invoiceData,
        id: 'temp-id',
        invoiceNumber: 'NEW', 
        createdAt: new Date(),
      };
      
      setLastInvoice(fullInvoiceForPrint);
      setLastInvoiceItems(invoiceData.items);
      setLastCustomer(selectedCustomer !== 'walkin' ? {
        ...customers.find(c => c.id === selectedCustomer),
        balance: (customers.find(c => c.id === selectedCustomer)?.balance || 0) + (paymentMethod === 'credit' ? remaining : 0)
      } : null);
      
      clearCart();
      setPaidAmount('');
      setNotes('');
      setShowPrintDialog(true);
      toast.success('تم إتمام عملية البيع بنجاح');

      if (autoPrint) {
        setTimeout(() => {
          handlePrint();
        }, 300);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('حدث خطأ أثناء إتمام العملية');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuspend = async () => {
    if (safeCart.length === 0) {
      toast.error('السلة فارغة');
      return;
    }
    
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      if (editingInvoiceId) {
        deleteInvoice(editingInvoiceId);
        setEditingInvoiceId(null);
      }

      const invoiceData = createInvoiceData('pending');
      suspendInvoice(invoiceData);
      
      clearCart();
      setPaidAmount('');
      setNotes('');
      toast.info('تم تعليق الفاتورة بنجاح');
    } catch (error) {
      console.error('Suspend error:', error);
      toast.error('حدث خطأ أثناء تعليق الفاتورة');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    // 1. Electron Printing (Priority)
    if (window.electronAPI) {
        const orderData = {
            cartItems: lastInvoiceItems.map(item => ({
                name: item.productName,
                price: item.price,
                qty: item.quantity,
                category: 'general' // Could be mapped from product details if available
            })),
            total: lastInvoice?.total || 0,
            invoiceNumber: lastInvoice?.invoiceNumber,
            date: new Date().toISOString()
        };
        
        window.electronAPI.printOrder(orderData);
        toast.success("تم إرسال الطلب للطابعات (Electron)!");
        return;
    }

    // 2. Browser Fallback Printing
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      
      setTimeout(() => {
        const printWindow = window.open('', '', 'width=300,height=600');
        if (printWindow) {
          printWindow.document.write(`
            <html dir="rtl">
              <head>
                <title>فاتورة</title>
                <style>
                  @page { size: 80mm auto; margin: 0; }
                  body { margin: 0; padding: 0; font-family: Arial, sans-serif; width: 80mm; }
                </style>
              </head>
              <body>${printContent}</body>
            </html>
          `);
          printWindow.document.close();
          
          printWindow.onload = () => {
            printWindow.focus();
            printWindow.print(); // Browser print dialog
            
            printWindow.onafterprint = () => {
              printWindow.close();
            };
            setTimeout(() => {
              if (!printWindow.closed) {
                printWindow.close();
              }
            }, 500);
          };
        }
      }, 50);
    }
  };

  const handleCancelEdit = () => {
    clearCart();
    setEditingInvoiceId(null);
    toast.info('تم إلغاء تعديل الفاتورة');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">نقطة البيع</h1>
          <p className="text-muted-foreground text-lg">إنشاء ومعالجة فواتير البيع</p>
        </div>
        {editingInvoiceId && (
          <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-4 py-2 rounded-lg flex items-center gap-2 border border-amber-200 dark:border-amber-800">
            <Edit size={16} />
            <span className="font-medium">جاري تعديل فاتورة معلقة</span>
            <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="hover:bg-amber-200 dark:hover:bg-amber-800 h-6 px-2 text-xs">
              <X size={14} className="ml-1" /> إلغاء
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-6 space-y-4">
            <div className="flex gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  type="text"
                  placeholder="بحث عن منتج أو باركود أو SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <BarcodeScanner onScan={handleBarcodeScan} buttonText="مسح الباركود" />
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
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredProducts.map((product) => {
                const hasStock = product.quantity > 0;
                return (
                  <button
                    key={product.id}
                    onClick={() => hasStock ? addToCart(product) : toast.error('المنتج غير متوفر')}
                    className={`glass-card rounded-xl p-4 text-right hover-lift transition-all group animate-slide-up ${
                      hasStock ? 'hover:border-primary cursor-pointer' : 'opacity-60 bg-muted/50 cursor-not-allowed'
                    }`}
                  >
                    <h4 className="font-semibold mb-1 line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h4>
                    <p className={`text-sm mb-2 ${hasStock ? 'text-muted-foreground' : 'text-destructive font-medium'}`}>
                      {hasStock ? `المخزون: ${product.quantity}` : 'نفذت الكمية'}
                    </p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(product.price, currency)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cart */}
        <div className="glass-card rounded-2xl p-6 h-fit sticky top-24 shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-primary" size={24} />
            <h2 className="text-xl font-bold">السلة</h2>
            {safeCart.length > 0 && (
              <span className="ml-auto bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                {safeCart.length}
              </span>
            )}
          </div>

          <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
            <SelectTrigger>
              <SelectValue placeholder="عميل نقدي" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="walkin">عميل نقدي</SelectItem>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name} {(customer.balance ?? 0) > 0 && `(${formatCurrency(customer.balance || 0, currency)})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin bg-muted/20 p-2 rounded-lg">
            {safeCart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="mx-auto mb-2 opacity-50" size={32} />
                <p>السلة فارغة</p>
              </div>
            ) : (
              safeCart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium line-clamp-1">{item.product.name}</p>
                    <p className="text-sm text-primary font-semibold">
                      {formatCurrency(item.product.price * item.quantity, currency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)} className="btn-icon-sm hover:bg-muted rounded"><Minus size={14} /></button>
                    <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                    <button onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)} className="btn-icon-sm hover:bg-muted rounded" disabled={item.quantity >= (item.product.quantity || 999)}><Plus size={14} /></button>
                    <button onClick={() => removeFromCart(item.product.id)} className="btn-icon-sm text-destructive hover:bg-destructive/10 rounded ml-1"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          {safeCart.length > 0 && (
            <div className="space-y-4">
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>المجموع</span>
                  <span>{formatCurrency(subtotal, currency)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm w-16">الخصم</span>
                  <Input type="number" min="0" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="h-8" />
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>الإجمالي</span>
                  <span className="text-primary">{formatCurrency(total, currency)}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button variant={paymentMethod === 'cash' ? 'default' : 'outline'} onClick={() => setPaymentMethod('cash')} className="h-9 text-xs"><Banknote size={14} className="mr-1"/> نقداً</Button>
                <Button variant={paymentMethod === 'card' ? 'default' : 'outline'} onClick={() => setPaymentMethod('card')} className="h-9 text-xs"><CreditCard size={14} className="mr-1"/> بطاقة</Button>
                <Button variant={paymentMethod === 'credit' ? 'default' : 'outline'} onClick={() => setPaymentMethod('credit')} className="h-9 text-xs"><Receipt size={14} className="mr-1"/> آجل</Button>
              </div>

              {paymentMethod === 'credit' && (
                <div className="space-y-2 bg-destructive/5 p-2 rounded border border-destructive/20">
                  <div className="flex justify-between items-center text-sm">
                    <span>المدفوع</span>
                    <Input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} className="w-24 h-8" placeholder="0" />
                  </div>
                  <div className="flex justify-between text-sm font-bold text-destructive">
                    <span>المتبقي (دين)</span>
                    <span>{formatCurrency(remaining, currency)}</span>
                  </div>
                </div>
              )}

              {/* Printing Options */}
              <div className="space-y-2 bg-muted/20 p-2 rounded text-sm">
                 <div className="flex items-center gap-2 mb-2">
                     <PrinterIcon size={14} className="text-muted-foreground" />
                     <span className="font-semibold">خيارات الطباعة</span>
                 </div>
                 
                 <div className="flex items-center gap-2">
                    <input type="checkbox" id="auto-print" checked={autoPrint} onChange={(e) => setAutoPrint(e.target.checked)} className="rounded" />
                    <label htmlFor="auto-print" className="text-xs cursor-pointer select-none">طباعة تلقائية</label>
                 </div>

                 <div className="flex items-center gap-2 mt-2">
                    <Label className="text-xs w-20">عدد النسخ:</Label>
                    <Input type="number" min="1" max="5" value={printCopies} onChange={(e) => setPrintCopies(parseInt(e.target.value)||1)} className="h-7 w-16 text-center" />
                 </div>

                 {/* Simulated Multi-Printer Selection */}
                 {settings.printers && settings.printers.length > 0 && (
                     <div className="space-y-1 mt-2">
                        <Label className="text-xs">الطابعات:</Label>
                        {settings.printers.map(printer => (
                            <div key={printer.id} className="flex items-center gap-2">
                                <Checkbox 
                                    id={`p-${printer.id}`} 
                                    checked={selectedPrinters.includes(printer.id)} 
                                    onCheckedChange={(c) => {
                                        if(c) setSelectedPrinters([...selectedPrinters, printer.id]);
                                        else setSelectedPrinters(selectedPrinters.filter(id => id !== printer.id));
                                    }}
                                />
                                <Label htmlFor={`p-${printer.id}`} className="text-xs cursor-pointer">{printer.name} <span className="text-muted-foreground text-[10px]">({printer.type})</span></Label>
                            </div>
                        ))}
                     </div>
                 )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" onClick={handleSuspend} disabled={isProcessing} className="col-span-1 border-amber-500 text-amber-600 hover:bg-amber-50">
                  {isProcessing ? <Loader2 className="animate-spin" /> : <PauseCircle size={18} className="mr-1" />}
                  تعليق
                </Button>
                <Button onClick={handleCheckout} disabled={isProcessing} className="col-span-2 font-bold">
                  {isProcessing ? <Loader2 className="animate-spin" /> : <Check size={18} className="mr-1" />}
                  إتمام البيع
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>تمت العملية بنجاح</DialogTitle></DialogHeader>
          <div className="max-h-[60vh] overflow-auto flex justify-center bg-gray-100 p-4 rounded">
            <div ref={printRef}>
              {lastInvoice && (
                <ThermalInvoicePrint
                  invoice={lastInvoice}
                  items={lastInvoiceItems}
                  customer={lastCustomer}
                  storeSettings={settings}
                />
              )}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowPrintDialog(false)}>إغلاق</Button>
            <Button onClick={handlePrint}>طباعة</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
