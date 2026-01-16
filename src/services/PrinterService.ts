import { toast } from "sonner";

export interface PrinterDevice {
  name: string;
  displayName: string;
  isDefault: boolean;
}

export const PrinterService = {
  isElectron: (): boolean => {
    return false; // Force web mode
  },

  getPrinters: async (): Promise<PrinterDevice[]> => {
    // In web mode, we can't list printers directly due to browser security sandbox.
    // Users select the printer from the system print dialog.
    return [];
  },

  print: async (content: string, printerName?: string, useElectron: boolean = false) => {
    // Always use browser print
    return PrinterService.printViaBrowser(content);
  },

  printViaBrowser: (content: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // Create a hidden iframe for printing to avoid popup blockers and new windows
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      
      document.body.appendChild(iframe);
      
      const doc = iframe.contentWindow?.document;
      if (!doc) {
          toast.error("خطأ في تهيئة خدمة الطباعة");
          document.body.removeChild(iframe);
          resolve(false);
          return;
      }

      doc.open();
      doc.write(`
        <html dir="rtl">
          <head>
            <title>طباعة</title>
            <style>
              @page { size: 80mm auto; margin: 0; }
              body { 
                font-family: system-ui, -apple-system, sans-serif; 
                margin: 0; 
                padding: 5px; 
                width: 80mm; 
                direction: rtl;
              }
              img { max-width: 100%; }
              table { width: 100%; border-collapse: collapse; font-size: 12px; }
              th, td { text-align: right; padding: 2px; border-bottom: 1px dashed #ccc; }
              .header { text-align: center; margin-bottom: 10px; }
              .footer { text-align: center; margin-top: 10px; font-size: 10px; }
              .total-row { font-weight: bold; border-top: 1px solid #000; }
              
              /* Hide scrollbars and ensure clean print */
              @media print {
                  body { -webkit-print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>${content}</body>
        </html>
      `);
      doc.close();

      // Wait for images to load if any, then print
      iframe.onload = () => {
        try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            resolve(true);
        } catch (e) {
            console.error("Print error:", e);
            resolve(false);
        } finally {
            // Clean up the iframe after a delay to allow print dialog to open
            // Note: In some browsers, removing iframe immediately might cancel print
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 10000); 
        }
      };
    });
  }
};
