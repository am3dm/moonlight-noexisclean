import { forwardRef } from 'react';
import { Settings } from '@/types';

interface PaymentReceiptProps {
  receipt: {
    number: string;
    amount: number;
    date: Date;
    customerName: string;
    oldBalance: number;
    newBalance: number;
  };
  settings: Settings;
}

export const PaymentReceipt = forwardRef<HTMLDivElement, PaymentReceiptProps>(
  ({ receipt, settings }, ref) => {
    const currency = settings.currency || 'IQD';

    return (
      <div 
        ref={ref} 
        style={{ 
          width: '80mm',
          padding: '5mm',
          fontFamily: 'Arial, sans-serif',
          direction: 'rtl',
          textAlign: 'center',
          backgroundColor: 'white',
          color: 'black',
          fontSize: '12px'
        }}
      >
        <div style={{ borderBottom: '1px dashed #000', paddingBottom: '10px', marginBottom: '10px' }}>
          <h2 style={{ fontSize: '16px', margin: '0 0 5px 0' }}>{settings.storeName}</h2>
          <h3 style={{ fontSize: '14px', margin: '0' }}>سند قبض</h3>
        </div>

        <div style={{ textAlign: 'right', marginBottom: '15px', lineHeight: '1.6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>رقم السند:</span>
            <span style={{ fontWeight: 'bold' }}>{receipt.number}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>التاريخ:</span>
            <span>{new Date(receipt.date).toLocaleDateString('ar-IQ')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>العميل:</span>
            <span style={{ fontWeight: 'bold' }}>{receipt.customerName}</span>
          </div>
        </div>

        <div style={{ border: '2px solid #000', padding: '10px', marginBottom: '15px', borderRadius: '5px' }}>
          <div style={{ fontSize: '14px', marginBottom: '5px' }}>المبلغ المستلم</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {receipt.amount.toLocaleString('ar-IQ')} {currency}
          </div>
        </div>

        <div style={{ textAlign: 'right', marginBottom: '15px', fontSize: '11px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>الرصيد السابق:</span>
            <span>{receipt.oldBalance.toLocaleString('ar-IQ')} {currency}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #ccc', paddingTop: '5px' }}>
            <span>الرصيد المتبقي:</span>
            <span>{receipt.newBalance.toLocaleString('ar-IQ')} {currency}</span>
          </div>
        </div>

        <div style={{ marginTop: '20px', fontSize: '10px', borderTop: '1px dashed #000', paddingTop: '10px' }}>
          <p>توقيع المستلم</p>
          <br />
          <p>........................</p>
        </div>
      </div>
    );
  }
);

PaymentReceipt.displayName = 'PaymentReceipt';
