import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  Download, TrendingUp, TrendingDown, DollarSign, 
  CreditCard, Calendar as CalendarIcon, Package, FileText, Wallet, User
} from 'lucide-react';
import { 
  startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, 
  subMonths, isWithinInterval, startOfDay, endOfDay 
} from 'date-fns';
import { ar } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const Reports = () => {
  const { invoices, settings, payments, suppliers, customers, currentUser } = useStore();
  const currency = settings.currency || 'IQD';

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const filteredData = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return { invoices: [], sales: [], purchases: [], payments: [], userSales: [] };

    const range = { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) };
    
    // Filter logic: Admins see all, others see their own
    let relevantInvoices = invoices.filter(i => 
      (i.status === 'completed' || i.type === 'return') && 
      isWithinInterval(new Date(i.createdAt), range)
    );

    // If NOT admin, filter by createdBy
    // NOTE: In production, backend RLS should handle this, but frontend filtering is good for UI state consistency
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'accountant') {
        relevantInvoices = relevantInvoices.filter(i => i.createdBy === currentUser?.id);
    }

    const relevantPayments = payments.filter(p => 
      isWithinInterval(new Date(p.date), range)
    );

    return {
      invoices: relevantInvoices,
      sales: relevantInvoices.filter(i => i.type === 'sale'),
      purchases: relevantInvoices.filter(i => i.type === 'purchase'),
      returns: relevantInvoices.filter(i => i.type === 'return'),
      payments: relevantPayments
    };
  }, [invoices, payments, dateRange, currentUser]);

  // Totals
  const totalSales = filteredData.sales.reduce((sum, i) => sum + i.total, 0);
  const totalPurchases = filteredData.purchases.reduce((sum, i) => sum + i.total, 0);
  const totalReturns = filteredData.returns.reduce((sum, i) => sum + i.total, 0);
  const netProfit = totalSales - totalPurchases - totalReturns; // Simplified

  // Employee Sales (For Admin)
  const employeeSales = useMemo(() => {
     if (currentUser?.role !== 'admin') return [];
     const salesByUser: Record<string, number> = {};
     filteredData.sales.forEach(i => {
         salesByUser[i.createdBy] = (salesByUser[i.createdBy] || 0) + i.total;
     });
     // In real app, map ID to Name from Users list.
     return Object.entries(salesByUser).map(([id, total]) => ({ id, total }));
  }, [filteredData.sales, currentUser]);

  // Product Sales Analysis
  const productSales = useMemo(() => {
    const products: Record<string, { name: string; quantity: number; total: number; price: number }> = {};
    
    filteredData.sales.forEach(invoice => {
      invoice.items.forEach(item => {
        if (!products[item.productId]) {
          products[item.productId] = { 
            name: item.productName, 
            quantity: 0, 
            total: 0, 
            price: item.price 
          };
        }
        products[item.productId].quantity += item.quantity;
        products[item.productId].total += item.total;
      });
    });

    return Object.values(products).sort((a, b) => b.total - a.total);
  }, [filteredData.sales]);

  // Debt Analysis
  const salesDebt = filteredData.sales.reduce((sum, i) => sum + (i.remaining || 0), 0);
  const paymentsCollected = filteredData.payments.reduce((sum, p) => sum + p.amount, 0);

  const getSupplierName = (id?: string) => suppliers.find(s => s.id === id)?.name || 'غير معروف';
  const getCustomerName = (id?: string) => customers.find(c => c.id === id)?.name || 'غير معروف';

  const chartData = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return [];
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    return days.map(day => {
      const daySales = filteredData.sales.filter(i => isSameDay(new Date(i.createdAt), day)).reduce((sum, i) => sum + i.total, 0);
      const dayPurchases = filteredData.purchases.filter(i => isSameDay(new Date(i.createdAt), day)).reduce((sum, i) => sum + i.total, 0);
      return {
        date: format(day, 'dd/MM', { locale: ar }),
        sales: daySales,
        purchases: dayPurchases,
        profit: daySales - dayPurchases
      };
    });
  }, [dateRange, filteredData]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border">
        <div>
          <h1 className="page-title text-xl mb-1">التقارير المالية</h1>
          <p className="text-muted-foreground text-sm">تحليل شامل للمبيعات، المشتريات، والديون</p>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 h-10 border-primary/20">
                <CalendarIcon size={18} className="text-primary" />
                {dateRange?.from ? (
                  dateRange.to ? `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}` : format(dateRange.from, 'dd/MM/yyyy')
                ) : <span>اختر الفترة</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} locale={ar} />
            </PopoverContent>
          </Popover>
          <Button variant="default" onClick={() => window.print()} className="gap-2 h-10">
            <Download size={18} /> طباعة
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div><p className="text-sm text-muted-foreground mb-1">المبيعات</p><h3 className="text-2xl font-bold text-primary">{formatCurrency(totalSales, currency)}</h3></div>
              <TrendingUp className="text-primary h-8 w-8 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div><p className="text-sm text-muted-foreground mb-1">المشتريات</p><h3 className="text-2xl font-bold text-destructive">{formatCurrency(totalPurchases, currency)}</h3></div>
              <TrendingDown className="text-destructive h-8 w-8 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div><p className="text-sm text-muted-foreground mb-1">الأرباح (الصافي)</p><h3 className="text-2xl font-bold text-emerald-600">{formatCurrency(netProfit, currency)}</h3></div>
              <DollarSign className="text-emerald-600 h-8 w-8 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div><p className="text-sm text-muted-foreground mb-1">المرتجعات</p><h3 className="text-2xl font-bold text-amber-600">{formatCurrency(totalReturns, currency)}</h3></div>
              <Wallet className="text-amber-600 h-8 w-8 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {currentUser?.role === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[300px] w-full bg-card p-4 rounded-xl border">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" name="مبيعات" fill="#3b82f6" />
                    <Bar dataKey="purchases" name="مشتريات" fill="#ef4444" />
                </BarChart>
                </ResponsiveContainer>
            </div>
            
            <Card className="h-[300px] overflow-auto">
                <CardHeader><CardTitle className="text-sm">مبيعات الموظفين</CardTitle></CardHeader>
                <CardContent>
                     {employeeSales.length > 0 ? (
                         <div className="space-y-4">
                             {employeeSales.map(emp => (
                                 <div key={emp.id} className="flex justify-between items-center p-2 border rounded">
                                     <div className="flex items-center gap-2">
                                         <User size={16} />
                                         {/* In production, replace with real name lookup */}
                                         <span>{emp.id === currentUser.id ? 'أنت' : 'موظف ' + emp.id.substring(0,4)}</span>
                                     </div>
                                     <span className="font-bold">{formatCurrency(emp.total, currency)}</span>
                                 </div>
                             ))}
                         </div>
                     ) : (
                         <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
                     )}
                </CardContent>
            </Card>
        </div>
      )}

      <Tabs defaultValue="sales_details" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales_details">تفاصيل المبيعات</TabsTrigger>
          <TabsTrigger value="purchases">المشتريات</TabsTrigger>
          <TabsTrigger value="returns">المرتجعات</TabsTrigger>
          <TabsTrigger value="payments">المقبوضات</TabsTrigger>
        </TabsList>
        
        {/* Sales Details Tab */}
        <TabsContent value="sales_details">
          <Card>
            <CardHeader><CardTitle>المنتجات الأكثر مبيعاً</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">اسم المنتج</TableHead>
                      <TableHead className="text-center">الكمية المباعة</TableHead>
                      <TableHead className="text-center">السعر الإفرادي</TableHead>
                      <TableHead className="text-left">الإجمالي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productSales.length > 0 ? (
                      productSales.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-center">{formatCurrency(item.price, currency)}</TableCell>
                          <TableCell className="text-left font-bold">{formatCurrency(item.total, currency)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          لا توجد مبيعات في هذه الفترة
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Returns Tab */}
        <TabsContent value="returns">
          <Card>
            <CardHeader><CardTitle>سجل المرتجعات</CardTitle></CardHeader>
            <CardContent>
               <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم المرتجع</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الإجمالي</TableHead>
                      <TableHead>فاتورة أصلية</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {filteredData.returns.length > 0 ? (
                        filteredData.returns.map(ret => (
                           <TableRow key={ret.id}>
                              <TableCell className="font-mono">{ret.invoiceNumber}</TableCell>
                              <TableCell>{getCustomerName(ret.customerId)}</TableCell>
                              <TableCell>{format(new Date(ret.createdAt), 'dd/MM/yyyy')}</TableCell>
                              <TableCell className="font-bold text-destructive">{formatCurrency(ret.total, currency)}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                  {ret.originalInvoiceId ? invoices.find(i=>i.id===ret.originalInvoiceId)?.invoiceNumber : '-'}
                              </TableCell>
                           </TableRow>
                        ))
                     ) : (
                        <TableRow><TableCell colSpan={5} className="text-center h-24">لا توجد مرتجعات</TableCell></TableRow>
                     )}
                  </TableBody>
               </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases">
          <Card>
            <CardHeader><CardTitle>سجل فواتير الشراء</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الفاتورة</TableHead>
                    <TableHead>المورد</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الإجمالي</TableHead>
                    <TableHead>المدفوع</TableHead>
                    <TableHead>المتبقي</TableHead>
                    <TableHead>المنتجات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.purchases.length > 0 ? (
                    filteredData.purchases.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono">{inv.invoiceNumber}</TableCell>
                        <TableCell>{getSupplierName(inv.supplierId)}</TableCell>
                        <TableCell>{format(new Date(inv.createdAt), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{formatCurrency(inv.total, currency)}</TableCell>
                        <TableCell className="text-emerald-600">{formatCurrency(inv.paid || 0, currency)}</TableCell>
                        <TableCell className="text-destructive font-bold">{formatCurrency(inv.remaining || 0, currency)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {inv.items.map(i => `${i.productName} (${i.quantity})`).join(', ')}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={7} className="text-center h-24">لا توجد مشتريات</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader><CardTitle>سجل المقبوضات</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم السند</TableHead>
                    <TableHead>العميل / المورد</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>تم بواسطة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.payments.length > 0 ? (
                    filteredData.payments.map((pay) => (
                      <TableRow key={pay.id}>
                        <TableCell className="font-mono">{pay.number}</TableCell>
                        <TableCell>{getCustomerName(pay.customerId) !== 'غير معروف' ? getCustomerName(pay.customerId) : 'مورد/آخر'}</TableCell>
                        <TableCell>{format(new Date(pay.date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="font-bold text-primary">{formatCurrency(pay.amount, currency)}</TableCell>
                        <TableCell>{pay.createdBy || '-'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">لا توجد عمليات</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
