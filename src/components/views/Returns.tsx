import { useState, useMemo, useRef } from 'react';
import { Search, RotateCcw, Printer, FileText, Calendar as CalendarIcon, Filter, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Invoice, InvoiceItem } from '@/types';
import { ThermalInvoicePrint } from '@/components/ThermalInvoicePrint';

export const Returns = () => {
  const { invoices, settings, returnInvoice, customers, products } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('history');
  
  // Create Return State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [returnItems, setReturnItems] = useState<{ productId: string, quantity: number }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Printing
  const printRef = useRef<HTMLDivElement>(null);
  const [printReturnInvoice, setPrintReturnInvoice] = useState<any>(null);

  const currency = settings.currency || 'IQD';

  const completedInvoices = useMemo(() => {
    return invoices.filter(inv => 
        inv.type === 'sale' && 
        inv.status === 'completed' && 
        (inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
         (inv.customerId && customers.find(c => c.id === inv.customerId)?.name.toLowerCase().includes(searchQuery.toLowerCase())))
    );
  }, [invoices, searchQuery, customers]);

  const returnHistory = useMemo(() => {
    return invoices.filter(inv => inv.type === 'return').sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [invoices]);

  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    // Initialize return items with 0 quantity
    setReturnItems(invoice.items.map(item => ({ productId: item.productId, quantity: 0 })));
    setActiveTab('create');
  };

  const handleQuantityChange = (productId: string, qty: number, maxQty: number) => {
    if (qty < 0) qty = 0;
    if (qty > maxQty) {
        toast.error(`الكمية المرتجعة لا يمكن أن تتجاوز الكمية المباعة (${maxQty})`);
        qty = maxQty;
    }
    setReturnItems(prev => prev.map(item => item.productId === productId ? { ...item, quantity: qty } : item));
  };

  const calculateReturnTotal = () => {
      if (!selectedInvoice) return 0;
      return returnItems.reduce((total, item) => {
          const originalItem = selectedInvoice.items.find(i => i.productId === item.productId);
          if (!originalItem) return total;
          return total + (originalItem.price * item.quantity); 
      }, 0);
  };

  const handlePrint = (invoice: Invoice, customer: any) => {
      setPrintReturnInvoice({ invoice, customer });
      setTimeout(() => {
          if (printRef.current) {
              const printContent = printRef.current.innerHTML;
              const printWindow = window.open('', '', 'width=300,height=600');
              if (printWindow) {
                  printWindow.document.write(`
                      <html dir="rtl">
                          <head>
                              <title>فاتورة مرتجع</title>
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
                      printWindow.print();
                      printWindow.onafterprint = () => printWindow.close();
                      setTimeout(() => !printWindow.closed && printWindow.close(), 500);
                  };
              }
          }
          setPrintReturnInvoice(null); // Clear after print
      }, 100);
  };

  const handleSubmitReturn = async () => {
      if (!selectedInvoice) return;
      const itemsToReturn = returnItems.filter(i => i.quantity > 0);
      
      if (itemsToReturn.length === 0) {
          toast.error("يرجى تحديد كمية واحدة على الأقل للإرجاع");
          return;
      }

      setIsProcessing(true);
      try {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Logic usually handled by store/hook, assuming returnInvoice returns the new invoice object or ID
          // For now, we simulate constructing the return object for print before the store action completes/refreshes
          const totalRefund = calculateReturnTotal();
          
          // Execute Store Action
          returnInvoice(selectedInvoice, itemsToReturn);
          toast.success("تم إنشاء فاتورة المرتجع بنجاح");
          
          // Prepare for Print (Simulating the returned invoice structure)
          const mockReturnInvoice: any = {
              invoiceNumber: 'RET-NEW',
              type: 'return',
              createdAt: new Date(),
              total: totalRefund,
              subtotal: totalRefund,
              discount: 0,
              paid: totalRefund,
              remaining: 0,
              items: itemsToReturn.map(ri => {
                  const original = selectedInvoice.items.find(i => i.productId === ri.productId);
                  return {
                      productName: original?.productName || 'Unknown',
                      quantity: ri.quantity,
                      price: original?.price || 0,
                      total: (original?.price || 0) * ri.quantity
                  };
              })
          };
          
          const customer = customers.find(c => c.id === selectedInvoice.customerId);
          handlePrint(mockReturnInvoice, customer);

          setSelectedInvoice(null);
          setReturnItems([]);
          setActiveTab('history');
      } catch (error) {
          toast.error("حدث خطأ أثناء عملية الإرجاع");
      } finally {
          setIsProcessing(false);
      }
  };

  const getCustomerName = (id?: string) => customers.find(c => c.id === id)?.name || 'عميل نقدي';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="hidden">
          {printReturnInvoice && (
              <div ref={printRef}>
                  <ThermalInvoicePrint 
                      invoice={printReturnInvoice.invoice}
                      items={printReturnInvoice.invoice.items}
                      customer={printReturnInvoice.customer}
                      storeSettings={settings}
                  />
              </div>
          )}
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-title">إدارة المرتجعات</h1>
          <p className="text-muted-foreground">إنشاء ومتابعة فواتير المرتجعات</p>
        </div>
        <div className="flex gap-2">
            <Button variant={activeTab === 'create' ? 'default' : 'outline'} onClick={() => { setActiveTab('create'); setSelectedInvoice(null); }}>
                <RotateCcw className="mr-2 h-4 w-4" />
                مرتجع جديد
            </Button>
            <Button variant={activeTab === 'history' ? 'default' : 'outline'} onClick={() => setActiveTab('history')}>
                <FileText className="mr-2 h-4 w-4" />
                سجل المرتجعات
            </Button>
        </div>
      </div>

      {activeTab === 'create' && !selectedInvoice && (
          <div className="space-y-4">
              <div className="glass-card p-6">
                  <div className="relative max-w-md">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input 
                          placeholder="ابحث برقم الفاتورة أو اسم العميل..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pr-10"
                      />
                  </div>
              </div>

              <div className="glass-card overflow-hidden">
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>رقم الفاتورة</TableHead>
                              <TableHead>العميل</TableHead>
                              <TableHead>التاريخ</TableHead>
                              <TableHead>القيمة</TableHead>
                              <TableHead>الإجراء</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {completedInvoices.length > 0 ? (
                              completedInvoices.map(inv => (
                                  <TableRow key={inv.id}>
                                      <TableCell className="font-mono">{inv.invoiceNumber}</TableCell>
                                      <TableCell>{getCustomerName(inv.customerId)}</TableCell>
                                      <TableCell>{formatDate(inv.createdAt)}</TableCell>
                                      <TableCell>{formatCurrency(inv.total, currency)}</TableCell>
                                      <TableCell>
                                          <Button size="sm" onClick={() => handleSelectInvoice(inv)}>
                                              اختيار للإرجاع
                                          </Button>
                                      </TableCell>
                                  </TableRow>
                              ))
                          ) : (
                              <TableRow>
                                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                      لا توجد فواتير مطابقة
                                  </TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                  </Table>
              </div>
          </div>
      )}

      {activeTab === 'create' && selectedInvoice && (
          <div className="space-y-6">
              <Button variant="ghost" onClick={() => setSelectedInvoice(null)} className="mb-2">
                  &larr; العودة للبحث
              </Button>
              
              <Card>
                  <CardHeader>
                      <CardTitle className="flex justify-between">
                          <span>تفاصيل الفاتورة: {selectedInvoice.invoiceNumber}</span>
                          <span className="text-muted-foreground text-sm font-normal">{formatDate(selectedInvoice.createdAt)}</span>
                      </CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="space-y-4">
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>المنتج</TableHead>
                                      <TableHead className="text-center">الكمية الأصلية</TableHead>
                                      <TableHead className="text-center">السعر</TableHead>
                                      <TableHead className="text-center">الكمية المرتجعة</TableHead>
                                      <TableHead className="text-left">قيمة الاسترداد</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {selectedInvoice.items.map(item => {
                                      const returnQty = returnItems.find(r => r.productId === item.productId)?.quantity || 0;
                                      return (
                                          <TableRow key={item.id}>
                                              <TableCell>{item.productName}</TableCell>
                                              <TableCell className="text-center">{item.quantity}</TableCell>
                                              <TableCell className="text-center">{formatCurrency(item.price, currency)}</TableCell>
                                              <TableCell className="text-center">
                                                  <Input 
                                                      type="number" 
                                                      min="0" 
                                                      max={item.quantity} 
                                                      value={returnQty} 
                                                      onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value) || 0, item.quantity)}
                                                      className="w-20 mx-auto text-center h-8"
                                                  />
                                              </TableCell>
                                              <TableCell className="text-left font-bold text-destructive">
                                                  {formatCurrency(returnQty * item.price, currency)}
                                              </TableCell>
                                          </TableRow>
                                      );
                                  })}
                              </TableBody>
                          </Table>

                          <div className="flex justify-end items-center gap-4 pt-4 border-t">
                              <div className="text-lg">
                                  إجمالي الاسترداد: <span className="font-bold text-destructive">{formatCurrency(calculateReturnTotal(), currency)}</span>
                              </div>
                              <Button onClick={handleSubmitReturn} disabled={isProcessing || calculateReturnTotal() === 0}>
                                  {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <RotateCcw className="mr-2" />}
                                  تأكيد وطباعة المرتجع
                              </Button>
                          </div>
                      </div>
                  </CardContent>
              </Card>
          </div>
      )}

      {activeTab === 'history' && (
          <div className="glass-card overflow-hidden">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>رقم المرتجع</TableHead>
                          <TableHead>فاتورة أصلية</TableHead>
                          <TableHead>العميل</TableHead>
                          <TableHead>التاريخ</TableHead>
                          <TableHead>الإجمالي</TableHead>
                          <TableHead>الإجراء</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {returnHistory.length > 0 ? (
                          returnHistory.map(ret => (
                              <TableRow key={ret.id}>
                                  <TableCell className="font-mono font-bold text-destructive">{ret.invoiceNumber}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                      {ret.originalInvoiceId ? invoices.find(i => i.id === ret.originalInvoiceId)?.invoiceNumber : '-'}
                                  </TableCell>
                                  <TableCell>{getCustomerName(ret.customerId)}</TableCell>
                                  <TableCell>{formatDate(ret.createdAt)}</TableCell>
                                  <TableCell className="font-bold">{formatCurrency(ret.total, currency)}</TableCell>
                                  <TableCell>
                                      <Button variant="ghost" size="sm" onClick={() => handlePrint(ret, customers.find(c => c.id === ret.customerId))}>
                                          <Printer size={16} />
                                      </Button>
                                  </TableCell>
                              </TableRow>
                          ))
                      ) : (
                          <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                  لا توجد عمليات مرتجع مسجلة
                              </TableCell>
                          </TableRow>
                      )}
                  </TableBody>
              </Table>
          </div>
      )}
    </div>
  );
};
