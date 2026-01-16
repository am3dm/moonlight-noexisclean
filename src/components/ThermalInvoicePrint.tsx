import { formatCurrency, formatDate } from '@/lib/utils';
import { Invoice, InvoiceItem, Customer, Settings, Payment } from '@/types';

interface ThermalInvoicePrintProps {
  invoice: Invoice;
  items: InvoiceItem[];
  customer?: Customer | null;
  storeSettings: Settings;
  payments?: Payment[]; // For customer statement
  isStatement?: boolean;
}

export const ThermalInvoicePrint = ({ 
  invoice, 
  items, 
  customer, 
  storeSettings, 
  payments,
  isStatement 
}: ThermalInvoicePrintProps) => {

  const total = invoice.total || 0;
  const paid = invoice.paid || 0;
  const remaining = invoice.remaining || 0;
  const subtotal = invoice.subtotal || 0;
  const discount = invoice.discount || 0;

  // Custom date formatter to ensure full date and time in English numerals
  const formatFullDate = (date: Date | string) => {
    if (!date) return '';
    const d = new Date(date);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(d);
  };

  // Helper to force English numbers
  const toEn = (n: number | string) => {
      return n.toString().replace(/[٠-٩]/g, d => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]);
  };

  const formattedCurrency = (val: number) => {
      // We use a custom formatter here to ensure English digits if the global utility respects locale too much
      return new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val) + ' ' + storeSettings.currency;
  };

  if (isStatement && customer && items) {
      // Customer Statement Layout
      return (
        <div className="bg-white text-black p-2 text-[10px] font-mono w-[78mm] mx-auto leading-tight print:p-0" dir="rtl">
            <style>{`
              @media print {
                @page { size: 80mm auto; margin: 0; }
                body { margin: 0; padding: 0.2cm; }
              }
              .dashed-line { border-bottom: 1px dashed #000; margin: 4px 0; }
              .bold { font-weight: bold; }
              .center { text-align: center; }
              .flex-row { display: flex; justify-content: space-between; }
            `}</style>

            <div className="center mb-2">
                {storeSettings.logo && <img src={storeSettings.logo} alt="Logo" className="h-10 mx-auto mb-1 object-contain grayscale" />}
                <h1 className="text-sm bold">{storeSettings.storeName}</h1>
                <p>{storeSettings.storeAddress}</p>
                <p>{toEn(storeSettings.storePhone || '')}</p>
            </div>

            <div className="dashed-line"></div>

            <div className="mb-2">
                <h2 className="text-xs bold center mb-1 border border-black p-1 rounded-sm">كشف حساب عميل</h2>
                <div className="flex-row">
                    <span>العميل:</span>
                    <span className="bold">{customer.name}</span>
                </div>
                <div className="flex-row">
                    <span>التاريخ:</span>
                    <span>{formatFullDate(new Date())}</span>
                </div>
            </div>

            <div className="dashed-line"></div>

            <table className="w-full text-right border-collapse mb-2">
                <thead>
                    <tr className="border-b border-black">
                        <th className="py-1 text-right w-1/4">التاريخ</th>
                        <th className="py-1 text-center w-1/4">العملية</th>
                        <th className="py-1 text-left w-1/4">مدين</th>
                        <th className="py-1 text-left w-1/4">دائن</th>
                    </tr>
                </thead>
                <tbody>
                   {items.map((item: any) => (
                       <tr key={item.id} className="border-b border-gray-400 border-dashed">
                           <td className="py-1 text-[9px] whitespace-nowrap dir-ltr text-right">{formatFullDate(item.createdAt || item.date).split(',')[0]}</td>
                           <td className="py-1 text-center text-[9px]">{item.type === 'invoice' ? (item.invoiceNumber || 'فاتورة') : 'دفعة'}</td>
                           <td className="py-1 text-left">{item.type === 'invoice' ? formattedCurrency(item.total) : '-'}</td>
                           <td className="py-1 text-left">{item.type === 'payment' ? formattedCurrency(item.amount) : '-'}</td>
                       </tr>
                   ))}
                </tbody>
            </table>

            <div className="dashed-line"></div>

            <div className="flex-row bold text-xs mt-2">
                <span>الرصيد الحالي:</span>
                <span>{formattedCurrency(customer.balance)}</span>
            </div>
            
             <div className="center mt-4 text-[9px]">
                <p>{storeSettings.footerMessage}</p>
            </div>
        </div>
      );
  }

  // Standard Invoice Layout (Sales / Returns)
  return (
    <div className="bg-white text-black p-2 text-[11px] font-mono w-[78mm] mx-auto leading-snug print:p-0" dir="rtl">
      <style>{`
          @media print {
            @page { size: 80mm auto; margin: 0; }
            body { margin: 0; padding: 0.2cm; }
          }
          .dashed-line { border-bottom: 1px dashed #000; margin: 5px 0; }
          .solid-line { border-bottom: 1px solid #000; margin: 5px 0; }
          .bold { font-weight: bold; }
          .center { text-align: center; }
          .flex-row { display: flex; justify-content: space-between; }
      `}</style>

      {/* Header */}
      <div className="center mb-2">
        {storeSettings.logo && <img src={storeSettings.logo} alt="Logo" className="h-12 mx-auto mb-1 object-contain grayscale" />}
        <h1 className="text-base bold">{storeSettings.storeName}</h1>
        {storeSettings.storeAddress && <p>{storeSettings.storeAddress}</p>}
        {storeSettings.storePhone && <p className="dir-ltr">{toEn(storeSettings.storePhone)}</p>}
      </div>

      <div className="dashed-line"></div>

      {/* Invoice Details */}
      <div className="mb-2">
        <div className="flex-row">
          <span>رقم الفاتورة:</span>
          <span className="bold">{toEn(invoice.invoiceNumber)}</span>
        </div>
        <div className="flex-row">
          <span>التاريخ:</span>
          <span className="dir-ltr text-right">{formatFullDate(invoice.createdAt)}</span>
        </div>
        {customer && (
          <div className="flex-row">
            <span>العميل:</span>
            <span className="bold">{customer.name}</span>
          </div>
        )}
        <div className="flex-row">
            <span>نوع الفاتورة:</span>
            <span className="bold">{invoice.type === 'sale' ? 'مبيعات' : invoice.type === 'return' ? 'مرتجع' : 'مشتريات'}</span>
        </div>
      </div>

      <div className="solid-line"></div>

      {/* Items Table */}
      <table className="w-full text-right border-collapse mb-2">
        <thead>
          <tr className="border-b border-black">
            <th className="py-1 w-[45%] text-right">الصنف</th>
            <th className="py-1 w-[15%] text-center">الكمية</th>
            <th className="py-1 w-[20%] text-center">السعر</th>
            <th className="py-1 w-[20%] text-left">الاجمالي</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className="border-b border-gray-400 border-dashed">
              <td className="py-1 pr-1">{item.productName}</td>
              <td className="py-1 text-center">{toEn(item.quantity)}</td>
              <td className="py-1 text-center">{formattedCurrency(item.price).replace(storeSettings.currency, '')}</td>
              <td className="py-1 text-left">{formattedCurrency(item.total).replace(storeSettings.currency, '')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="dashed-line"></div>
      
      <div className="space-y-1">
        <div className="flex-row">
          <span>المجموع:</span>
          <span>{formattedCurrency(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex-row text-gray-700">
            <span>الخصم:</span>
            <span>-{formattedCurrency(discount)}</span>
          </div>
        )}
        
        <div className="solid-line"></div>
        
        <div className="flex-row bold text-sm">
          <span>الإجمالي النهائي:</span>
          <span>{formattedCurrency(total)}</span>
        </div>
        
        {invoice.paymentMethod === 'credit' && (
           <>
            <div className="dashed-line"></div>
            <div className="flex-row">
                <span>المدفوع:</span>
                <span>{formattedCurrency(paid)}</span>
            </div>
            <div className="flex-row bold">
                <span>المتبقي:</span>
                <span>{formattedCurrency(remaining)}</span>
            </div>
           </>
        )}
      </div>

      {/* Footer */}
      <div className="dashed-line"></div>
      <div className="center mt-4 text-[9px]">
        {storeSettings.footerMessage && <p className="mb-1 bold">{storeSettings.footerMessage}</p>}
        {storeSettings.invoiceNotes && <p className="mb-2">{storeSettings.invoiceNotes}</p>}
        <p className="text-[8px] text-gray-500 mt-2">Developed by Moonlight Noexis</p>
      </div>
    </div>
  );
};
