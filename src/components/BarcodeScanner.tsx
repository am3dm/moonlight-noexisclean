import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScanBarcode, X } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  buttonText?: string;
}

export const BarcodeScanner = ({ onScan, buttonText = 'مسح الباركود' }: BarcodeScannerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        rememberLastUsedCamera: true,
        aspectRatio: 1.777778,
      };

      scannerRef.current = new Html5QrcodeScanner(
        'barcode-reader',
        config,
        false
      );

      scannerRef.current.render(
        (decodedText) => {
          onScan(decodedText);
          setIsOpen(false);
        },
        (errorMessage) => {
          // Silently handle scan errors (these happen frequently during scanning)
          console.debug('Scan error:', errorMessage);
        }
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [isOpen, onScan]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ScanBarcode className="h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            مسح الباركود
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div id="barcode-reader" ref={containerRef} className="w-full" />
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          <p className="text-sm text-muted-foreground text-center">
            وجّه الكاميرا نحو الباركود للمسح
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
