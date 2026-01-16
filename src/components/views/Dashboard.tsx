import { useState, useRef } from 'react';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  ShoppingCart, 
  CreditCard, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle, 
  XCircle, 
  ArrowRight,
  Edit
} from 'lucide-react';
import { useStore, ExtendedDashboardStats } from '@/store/useStore';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ThermalInvoicePrint } from '@/components/ThermalInvoicePrint';
import { PrinterService } from '@/services/PrinterService';
// Import createRoot from client
import { createRoot } from 'react-dom/client';

export const Dashboard = () => {
  const { 
    products, 
    invoices, 
    settings: storeSettings, 
    getDashboardStats, 
    setCurrentView, 
    updateInvoice, 
    logAction,
    loadInvoiceToCart,
    customers 
  } = useStore();
  
  const stats = getDashboardStats() as ExtendedDashboardStats;
  const currency = storeSettings?.currency || 'IQD';

  const handlePrintInvoice = async (invoice: any) => {
    const customer = customers.find(c => c.id === invoice.customerId);
    
    // Create a temporary container to render the receipt
    const container = document.createElement('div');
    // Using createRoot to render the React component to HTML string
    const root = createRoot(container);
    
    // We need to flush sync to get HTML immediately, or wait
    // Since createRoot is async in nature for effects, we might need a small delay or use renderToString if available
    // But for client-side, let's try a simpler approach: use the existing Hidden ref approach but make it cleaner
    
    // Actually, PrinterService expects an HTML string.
    // Let's render the component to a string if possible, or use the hidden div method.
    // The hidden div method in previous code was:
    // 1. Set state `printInvoice`
    // 2. Wait for render
    // 3. Grab innerHTML
    
    // Let's stick to that but update the implementation to use PrinterService
    
    // NOTE: For better performance, we should probably construct the HTML string directly 
    // or use a ref that is always present but hidden.
    
    // Let's use the ref method we already had but improved
    setPrintInvoiceData({ invoice, customer });
  };

  const [printInvoiceData, setPrintInvoiceData] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Effect to trigger print when data is ready in the DOM
  if (printInvoiceData && printRef.current) {
      setTimeout(async () => {
          if (printRef.current) {
              const htmlContent = printRef.current.innerHTML;
              await PrinterService.print(
                  htmlContent, 
                  storeSettings.defaultPrinterId, 
                  storeSettings.useElectronPrinter
              );
              setPrintInvoiceData(null); // Reset
          }
      }, 100);
  }

  const handleCompleteInvoice = (invoice: any) => {
    updateInvoice(invoice.id, { status: 'completed' });
    logAction({ userId: 'current-user', actionType: 'UPDATE', entity: 'Invoice', entityId: invoice.id, details: 'Completed pending invoice' });
    toast.success('تم إكمال الفاتورة بنجاح');
    
    const updatedInvoice = { ...invoice, status: 'completed' };
    handlePrintInvoice(updatedInvoice);
  };

  const handleEditInvoice = (invoice: any) => {
    loadInvoiceToCart(invoice);
    setCurrentView('sales');
    toast.info('تم تحميل الفاتورة للتعديل');
  };

  const handleCancelInvoice = (id: string) => {
    updateInvoice(id, { status: 'cancelled' });
    logAction({ userId: 'current-user', actionType: 'UPDATE', entity: 'Invoice', entityId: id, details: 'Cancelled invoice' });
    toast.info('تم إلغاء الفاتورة');
  };

  const statCards = [
    {
      title: 'إجمالي المبيعات',
      value: formatCurrency(stats?.totalSales || 0, currency),
      icon: <DollarSign size={24} />,
      trend: `${stats.salesTrend > 0 ? '+' : ''}${stats.salesTrend}%`,
      trendUp: stats.salesTrend >= 0,
      color: 'from-primary to-primary/60',
      bgColor: 'bg-primary/10',
      action: () => setCurrentView('reports')
    },
    {
      title: 'مبيعات اليوم',
      value: formatCurrency(stats?.todaySales || 0, currency),
      icon: <ShoppingCart size={24} />,
      trend: 'اليوم',
      trendUp: true,
      color: 'from-accent to-accent/60',
      bgColor: 'bg-accent/10',
      action: () => setCurrentView('sales')
    },
    {
      title: 'إجمالي المشتريات',
      value: formatCurrency(stats?.totalPurchases || 0, currency),
      icon: <CreditCard size={24} />,
      trend: `${stats.purchasesTrend > 0 ? '+' : ''}${stats.purchasesTrend}%`,
      trendUp: stats.purchasesTrend <= 0, 
      color: 'from-warning to-warning/60',
      bgColor: 'bg-warning/10',
      action: () => setCurrentView('purchases')
    },
    {
      title: 'صافي الربح (الشهر)',
      value: formatCurrency(stats?.monthSales || 0, currency), 
      icon: <TrendingUp size={24} />,
      trend: `${stats.profitTrend > 0 ? '+' : ''}${stats.profitTrend}%`,
      trendUp: stats.profitTrend >= 0,
      color: 'from-success to-success/60',
      bgColor: 'bg-success/10',
      action: () => setCurrentView('reports')
    },
    {
      title: 'إجمالي المنتجات',
      value: (stats?.totalProducts || 0).toString(),
      icon: <Package size={24} />,
      color: 'from-info to-info/60',
      bgColor: 'bg-info/10',
      action: () => setCurrentView('products')
    },
    {
      title: 'منتجات منخفضة المخزون',
      value: (stats?.lowStockProducts || 0).toString(),
      icon: <AlertTriangle size={24} />,
      color: 'from-destructive to-destructive/60',
      bgColor: 'bg-destructive/10',
      action: () => setCurrentView('products')
    },
    {
      title: 'فواتير معلقة',
      value: (stats?.pendingInvoices || 0).toString(),
      icon: <Clock size={24} />,
      color: 'from-warning to-warning/60',
      bgColor: 'bg-warning/10',
      action: () => setCurrentView('sales')
    },
  ];

  const lowStockProducts = products.filter(p => p.quantity <= p.minQuantity);
  const pendingInvoicesList = invoices.filter(i => i.status === 'pending').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hidden Print Area */}
      <div className="hidden">
        {printInvoiceData && (
            <div ref={printRef}>
              <ThermalInvoicePrint 
                  invoice={printInvoiceData.invoice}
                  items={printInvoiceData.invoice.items}
                  customer={printInvoiceData.customer}
                  storeSettings={storeSettings}
              />
            </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="page-title">لوحة التحكم</h1>
          <Sparkles className="text-accent animate-pulse" size={28} />
        </div>
        <p className="text-muted-foreground text-lg">
          مرحباً بك في نظام إدارة {storeSettings?.storeName || 'المتجر'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div 
            key={index} 
            className="stat-card group cursor-pointer hover:scale-[1.02] transition-transform"
            style={{ animationDelay: `${index * 0.05}s` }}
            onClick={stat.action}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2 font-medium">{stat.title}</p>
                <p className="text-2xl md:text-3xl font-bold">{stat.value}</p>
                {stat.trend && (
                  <div className={`flex items-center gap-1 mt-3 text-sm font-semibold ${stat.trendUp ? 'text-success' : 'text-destructive'}`}>
                    {stat.trendUp ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                    <span>{stat.trend}</span>
                  </div>
                )}
              </div>
              <div className={`p-4 rounded-xl ${stat.bgColor} flex-shrink-0`}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 group">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title flex items-center gap-2">
              <div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="text-destructive" size={20} /></div>
              تنبيهات المخزون
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setCurrentView('products')} className="gap-1 text-muted-foreground hover:text-primary">
              عرض الكل <ArrowRight size={16} />
            </Button>
          </div>
          
          {lowStockProducts.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
              {lowStockProducts.slice(0, 5).map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors duration-200">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground group-hover/item:text-primary transition-colors">{product.name}</p>
                    <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-destructive">{product.quantity} {product.unit}</p>
                    <p className="text-xs text-muted-foreground">الحد الأدنى: {product.minQuantity}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-emerald-500/20 mx-auto mb-3" />
              <p className="text-muted-foreground">المخزون في حالة جيدة</p>
            </div>
          )}
        </div>

        <div className="glass-card p-6 group">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title flex items-center gap-2">
              <div className="p-2 rounded-lg bg-warning/10"><Clock className="text-warning" size={20} /></div>
              فواتير معلقة
            </h2>
          </div>

          {pendingInvoicesList.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
              {pendingInvoicesList.map((invoice, index) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors duration-200">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(invoice.total, currency)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50 border-blue-200" onClick={() => handleEditInvoice(invoice)} title="تعديل">
                      <Edit size={16} />
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-success hover:text-success hover:bg-success/10 border-success/20" onClick={() => handleCompleteInvoice(invoice)} title="إكمال وطباعة">
                      <CheckCircle size={16} />
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20" onClick={() => handleCancelInvoice(invoice.id)} title="إلغاء">
                      <XCircle size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground">لا توجد فواتير معلقة</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
