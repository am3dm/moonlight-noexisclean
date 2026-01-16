import { forwardRef } from 'react';
import { formatDate, formatCurrency } from '@/lib/utils';

interface InvoiceItem {
  product_name: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

interface InvoicePrintProps {
  invoice: {
    invoice_number: string;
    type: 'sale' | 'purchase' | 'return';
    created_at: string;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    paid: number;
    remaining: number;
    payment_method: string;
    notes?: string;
  };
  items: InvoiceItem[];
  customer?: { name: string; phone?: string; address?: string };
  storeSettings?: {
    store_name: string;
    store_phone?: string;
    store_address?: string;
    currency: string;
  };
}

export const InvoicePrint = forwardRef<HTMLDivElement, InvoicePrintProps>(
  ({ invoice, items, customer, storeSettings }, ref) => {
    const typeLabels = {
      sale: 'فاتورة مبيعات',
      purchase: 'فاتورة مشتريات',
      return: 'فاتورة مرتجع',
    };

    const paymentMethodLabels: Record<string, string> = {
      cash: 'نقداً',
      card: 'بطاقة',
      credit: 'آجل',
      transfer: 'تحويل',
    };

    const currency = storeSettings?.currency || 'IQD';

    return (
      <div 
        ref={ref} 
        className="bg-white text-black p-6 max-w-[80mm] mx-auto font-mono text-xs"
        style={{ direction: 'rtl' }}
      >
        {/* Header */}
        <div className="text-center border-b border-dashed border-gray-400 pb-4 mb-4">
          <h1 className="text-lg font-bold">{storeSettings?.store_name || 'متجري'}</h1>
          {storeSettings?.store_address && (
            <p className="text-[10px]">{storeSettings.store_address}</p>
          )}
          {storeSettings?.store_phone && (
            <p className="text-[10px]">هاتف: {storeSettings.store_phone}</p>
          )}
        </div>

        {/* Invoice Info */}
        <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
          <div className="flex justify-between">
            <span className="font-bold">{typeLabels[invoice.type]}</span>
            <span>{invoice.invoice_number}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span>التاريخ:</span>
            <span>{formatDate(invoice.created_at)}</span>
          </div>
        </div>

        {/* Customer Info */}
        {customer && (
          <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
            <p className="font-bold">العميل: {customer.name}</p>
            {customer.phone && <p className="text-[10px]">هاتف: {customer.phone}</p>}
            {customer.address && <p className="text-[10px]">العنوان: {customer.address}</p>}
          </div>
        )}

        {/* Items Table */}
        <div className="mb-4">
          <div className="flex border-b border-gray-400 pb-1 mb-2 font-bold">
            <span className="flex-1">الصنف</span>
            <span className="w-10 text-center">الكمية</span>
            <span className="w-16 text-center">السعر</span>
            <span className="w-16 text-center">المجموع</span>
          </div>
          {items.map((item, index) => (
            <div key={index} className="flex py-1 border-b border-dotted border-gray-300">
              <span className="flex-1 truncate text-[10px]">{item.product_name}</span>
              <span className="w-10 text-center">{item.quantity}</span>
              <span className="w-16 text-center">{item.price.toLocaleString()}</span>
              <span className="w-16 text-center">{item.total.toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-dashed border-gray-400 pt-3 space-y-1">
          <div className="flex justify-between">
            <span>المجموع الفرعي:</span>
            <span>{formatCurrency(invoice.subtotal, currency)}</span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>الخصم:</span>
              <span>- {formatCurrency(invoice.discount, currency)}</span>
            </div>
          )}
          {invoice.tax > 0 && (
            <div className="flex justify-between">
              <span>الضريبة:</span>
              <span>{formatCurrency(invoice.tax, currency)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base border-t border-gray-400 pt-2 mt-2">
            <span>الإجمالي:</span>
            <span>{formatCurrency(invoice.total, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span>المدفوع:</span>
            <span>{formatCurrency(invoice.paid, currency)}</span>
          </div>
          {invoice.remaining > 0 && (
            <div className="flex justify-between text-red-600 font-bold">
              <span>المتبقي:</span>
              <span>{formatCurrency(invoice.remaining, currency)}</span>
            </div>
          )}
          <div className="flex justify-between text-[10px]">
            <span>طريقة الدفع:</span>
            <span>{paymentMethodLabels[invoice.payment_method] || invoice.payment_method}</span>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="border-t border-dashed border-gray-400 pt-3 mt-3">
            <p className="text-[10px]">ملاحظات: {invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-4 pt-4 border-t border-dashed border-gray-400">
          <p className="text-[10px]">شكراً لتعاملكم معنا</p>
          <p className="text-[10px] text-gray-500 mt-2">
            تم الطباعة: {new Date().toLocaleString('ar-IQ')}
          </p>
        </div>
      </div>
    );
  }
);

InvoicePrint.displayName = 'InvoicePrint';
