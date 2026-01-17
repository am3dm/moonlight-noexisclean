import { useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, CreditCard, Wallet, CheckCircle, Printer, Eye, ArrowLeft, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { PaymentReceipt } from '@/components/PaymentReceipt';
import { useCustomerStatement, useCreatePayment, useCustomers } from '@/hooks/useDatabase';

export const Debts = () => {
  const { settings } = useStore(); // Keep useStore for local settings if needed, but better use hook
  const { data: customers } = useCustomers();
  const { mutate: createPayment } = useCreatePayment();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<any>(null);
  const [selectedCustomerForStatement, setSelectedCustomerForStatement] = useState<any>(null); // For Account Statement
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);

  // --- Data Fetching for Account Statement ---
  const { data: accountStatement, isLoading: isLoadingStatement } = useCustomerStatement(selectedCustomerForStatement?.id);

  // Filter customers with debt > 0 or all customers
  const debtors = (customers || []).filter((c: any) => 
    (c.balance !== 0) && // Show anyone with non-zero balance
    (c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone?.includes(searchQuery))
  );

  const totalDebt = debtors.reduce((sum: number, c: any) => sum + (c.balance > 0 ? c.balance : 0), 0);

  const handleOpenPayment = (customer: any) => {
    setSelectedCustomerForPayment(customer);
    setPaymentAmount('');
    setIsPaymentModalOpen(true);
  };
  
  const handleOpenStatement = (customer: any) => {
      setSelectedCustomerForStatement(customer);
  };

  // --- Professional Statement Print ---
  const handlePrintStatement = () => {
     const printWindow = window.open('', '_blank');
     if(printWindow) {
         const storeName = settings.storeName || 'نظام النخيل';
         const date = new Date().toLocaleDateString('ar-IQ');
         
         const rows = accountStatement?.map((m: any) => `
            <tr>
                <td>${formatDate(m.created_at)}</td>
                <td>${m.type === 'invoice' ? 'فاتورة مبيعات' : 'دفعة نقدية'} - ${m.reference || ''} ${m.notes ? '(' + m.notes + ')' : ''}</td>
                <td>${m.debit > 0 ? formatCurrency(m.debit, settings.currency) : '-'}</td>
                <td>${m.credit > 0 ? formatCurrency(m.credit, settings.currency) : '-'}</td>
                <td style="font-weight:bold; direction:ltr;">${formatCurrency(m.balance, settings.currency)}</td>
            </tr>
         `).join('') || '';

         const finalBalance = accountStatement && accountStatement.length > 0 
            ? accountStatement[accountStatement.length - 1].balance 
            : 0;

         printWindow.document.write(`
             <html dir="rtl">
             <head>
                <title>كشف حساب - ${selectedCustomerForStatement.name}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
                    .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #333; padding-bottom: 20px; }
                    .header h1 { margin: 0; font-size: 24px; }
                    .header h2 { margin: 5px 0; font-size: 18px; color: #555; }
                    .meta { display: flex; justify-content: space-between; margin-bottom: 30px; }
                    .customer-box { border: 1px solid #ddd; padding: 15px; border-radius: 8px; width: 48%; }
                    .store-box { border: 1px solid #ddd; padding: 15px; border-radius: 8px; width: 48%; background: #f9f9f9; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
                    th { background-color: #f1f1f1; font-weight: bold; border-bottom: 2px solid #aaa; }
                    tr:nth-child(even) { background-color: #fcfcfc; }
                    .balance-row { font-weight: bold; background-color: #e8f4fd !important; font-size: 16px; }
                    .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 20px; }
                    @media print {
                        body { padding: 0; }
                        .no-print { display: none; }
                        button { display: none; }
                    }
                </style>
             </head>
             <body>
                 <div class="header">
                     <h1>${storeName}</h1>
                     <h2>كشف حساب تفصيلي</h2>
                     <p>تاريخ الاستخراج: ${date}</p>
                 </div>
                 
                 <div class="meta">
                     <div class="customer-box">
                         <strong>بيانات العميل:</strong><br><br>
                         الاسم: ${selectedCustomerForStatement.name}<br>
                         الهاتف: ${selectedCustomerForStatement.phone || '-'}<br>
                         العنوان: ${selectedCustomerForStatement.address || '-'}
                     </div>
                     <div class="store-box">
                         <strong>بيانات المؤسسة:</strong><br><br>
                         ${storeName}<br>
                         ${settings.storeAddress || ''}<br>
                         ${settings.storePhone || ''}
                     </div>
                 </div>

                 <table>
                     <thead>
                         <tr>
                             <th style="width: 15%">التاريخ</th>
                             <th style="width: 40%">البيان</th>
                             <th style="width: 15%">مدين (عليه)</th>
                             <th style="width: 15%">دائن (له)</th>
                             <th style="width: 15%">الرصيد</th>
                         </tr>
                     </thead>
                     <tbody>
                         ${rows}
                     </tbody>
                     <tfoot>
                         <tr class="balance-row">
                             <td colspan="4" style="text-align:left; padding-left:20px;">الرصيد النهائي المستحق:</td>
                             <td style="direction:ltr;">${formatCurrency(finalBalance, settings.currency)}</td>
                         </tr>
                     </tfoot>
                 </table>

                 <div class="footer">
                     <p>تم إصدار هذا المستند إلكترونياً من نظام النخيل ولا يحتاج إلى توقيع.</p>
                     <p>${settings.storeAddress || ''} | ${settings.storePhone || ''}</p>
                 </div>
             </body>
             </html>
         `);
         printWindow.document.close();
         setTimeout(() => {
            printWindow.print();
            printWindow.close();
         }, 800);
     }
  };

  const handlePrintReceipt = () => {
    if (printRef.current) {
        PrinterService.print(printRef.current.innerHTML);
    }
  };
  
  // Import helper for receipt print
  const PrinterService = {
      print: (content: string) => {
         const printWindow = window.open('', '_blank');
         if(printWindow) {
             printWindow.document.write(`
                 <html dir="rtl"><head><title>Print</title>
                 <style>
                    @page { size: 80mm auto; margin: 0; }
                    body { font-family: system-ui; margin: 0; padding: 10px; width: 80mm; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { text-align: right; border-bottom: 1px dashed #ccc; padding: 4px; }
                 </style>
                 </head><body>${content}</body></html>
             `);
             printWindow.document.close();
             setTimeout(() => {
                 printWindow.print();
                 printWindow.close();
             }, 500);
         }
      }
  };

  const handleSubmitPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }
    // We allow partial payments or even advance payments, but warning if > balance is handled by logic?
    // Here we just warn if > balance
    if (amount > selectedCustomerForPayment.balance) {
      // toast.warning('المبلغ المدخل أكبر من قيمة الدين'); // Optional warning
    }

    const oldBalance = selectedCustomerForPayment.balance;
    const newBalance = oldBalance - amount;

    // Process Payment via API
    createPayment({
      customer_id: selectedCustomerForPayment.id,
      amount: amount,
      notes: 'دفعة نقدية'
    }, {
      onSuccess: () => {
        // Prepare Receipt Data
        setLastReceipt({
          number: `PAY-${Date.now().toString().substr(-6)}`,
          amount,
          date: new Date(),
          customerName: selectedCustomerForPayment.name,
          oldBalance,
          newBalance
        });

        setIsPaymentModalOpen(false);
        setShowReceiptDialog(true);
      }
    });
  };

  // --- Statement View ---
  if (selectedCustomerForStatement) {
      return (
          <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-4 bg-background p-4 rounded-lg shadow-sm border">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedCustomerForStatement(null)}>
                      <ArrowLeft className="h-6 w-6" />
                  </Button>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold">كشف حساب: {selectedCustomerForStatement.name}</h1>
                    <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><FileText size={14}/> حساب دقيق</span>
                        <span className="flex items-center gap-1">رقم الهاتف: {selectedCustomerForStatement.phone || '-'}</span>
                    </div>
                  </div>
                  <Button variant="default" size="lg" onClick={handlePrintStatement} className="gap-2">
                      <Printer className="h-5 w-5" /> طباعة الكشف الرسمي
                  </Button>
              </div>

              <Card>
                  <CardContent className="p-0">
                      <Table>
                          <TableHeader className="bg-muted/50">
                              <TableRow>
                                  <TableHead className="w-[150px]">التاريخ</TableHead>
                                  <TableHead>البيان / تفاصيل الحركة</TableHead>
                                  <TableHead className="text-red-600 font-bold">مدين (عليه)</TableHead>
                                  <TableHead className="text-green-600 font-bold">دائن (له)</TableHead>
                                  <TableHead className="font-bold bg-muted/30">الرصيد</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {isLoadingStatement ? (
                                  <TableRow><TableCell colSpan={5} className="text-center py-10">جاري تحميل البيانات...</TableCell></TableRow>
                              ) : (
                                  accountStatement?.map((move: any) => (
                                      <TableRow key={move.id} className="hover:bg-muted/5">
                                          <TableCell className="font-medium text-muted-foreground">
                                              {formatDate(move.created_at)}
                                          </TableCell>
                                          <TableCell>
                                              <div className="flex flex-col">
                                                  <span className="font-medium">
                                                    {move.type === 'invoice' ? 'فاتورة مبيعات' : 'دفعة نقدية'} - {move.reference}
                                                  </span>
                                                  {move.notes && <span className="text-xs text-muted-foreground">{move.notes}</span>}
                                              </div>
                                          </TableCell>
                                          <TableCell className="text-red-600 font-medium text-base">
                                              {move.debit > 0 ? formatCurrency(move.debit, settings.currency) : '-'}
                                          </TableCell>
                                          <TableCell className="text-green-600 font-medium text-base">
                                              {move.credit > 0 ? formatCurrency(move.credit, settings.currency) : '-'}
                                          </TableCell>
                                          <TableCell className="font-bold text-base bg-muted/10">
                                              {formatCurrency(move.balance, settings.currency)}
                                          </TableCell>
                                      </TableRow>
                                  ))
                              )}
                              
                              {!isLoadingStatement && accountStatement?.length === 0 && (
                                  <TableRow>
                                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                          لا توجد حركات مسجلة لهذا العميل
                                      </TableCell>
                                  </TableRow>
                              )}

                              {/* Final Balance Row */}
                              {!isLoadingStatement && accountStatement && accountStatement.length > 0 && (
                                  <TableRow className="bg-primary/5 border-t-2 border-primary/20">
                                      <TableCell colSpan={4} className="text-left font-bold text-lg p-4">
                                          الرصيد النهائي المستحق:
                                      </TableCell>
                                      <TableCell className="font-bold text-xl text-primary p-4">
                                          {formatCurrency(accountStatement[accountStatement.length - 1].balance, settings.currency)}
                                      </TableCell>
                                  </TableRow>
                              )}
                          </TableBody>
                      </Table>
                  </CardContent>
              </Card>
          </div>
      );
  }

  // --- Main List View ---
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">الديون والذمم</h1>
          <p className="text-muted-foreground">قائمة العملاء وأرصدة الديون</p>
        </div>
        <Card className="bg-destructive/5 border-destructive/20 w-64">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">إجمالي الديون المستحقة</p>
              <p className="text-xl font-bold text-destructive">{formatCurrency(totalDebt, settings.currency)}</p>
            </div>
            <Wallet className="text-destructive h-8 w-8 opacity-50" />
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="بحث عن عميل..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العميل</TableHead>
                <TableHead>رقم الهاتف</TableHead>
                <TableHead>الرصيد الحالي</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debtors.length > 0 ? (
                debtors.map((customer: any) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone || '-'}</TableCell>
                    <TableCell>
                      <span className={`font-bold ${customer.balance > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                        {formatCurrency(customer.balance, settings.currency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="gap-2"
                            onClick={() => handleOpenStatement(customer)}
                            title="عرض كشف الحساب"
                          >
                            <Eye size={16} />
                            كشف حساب
                          </Button>
                          {customer.balance > 0 && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary"
                                onClick={() => handleOpenPayment(customer)}
                              >
                                <CreditCard size={16} />
                                تسديد
                              </Button>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="mx-auto h-8 w-8 mb-2 text-emerald-500/50" />
                    لا توجد بيانات مطابقة للبحث
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تسديد دفعة: {selectedCustomerForPayment?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg flex justify-between items-center">
              <span>الدين الحالي:</span>
              <span className="font-bold text-destructive text-lg">
                {selectedCustomerForPayment && formatCurrency(selectedCustomerForPayment.balance, settings.currency)}
              </span>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">مبلغ الدفعة</label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <Button onClick={handleSubmitPayment} className="w-full gap-2">
              <CheckCircle size={18} />
              تأكيد الدفع
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Print Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>سند قبض</DialogTitle>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-auto flex justify-center bg-gray-50 p-4 rounded border">
            {lastReceipt && (
              <PaymentReceipt 
                ref={printRef} 
                receipt={lastReceipt} 
                settings={settings} 
              />
            )}
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowReceiptDialog(false)}>
              إغلاق
            </Button>
            <Button onClick={handlePrintReceipt} className="gap-2">
              <Printer size={18} />
              طباعة
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
