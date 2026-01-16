import { useEffect, useState } from 'react';

interface UseBarcodeScannerProps {
  onScan: (barcode: string) => void;
  minLength?: number;
}

export const useBarcodeScanner = ({ onScan, minLength = 3 }: UseBarcodeScannerProps) => {
  const [barcode, setBarcode] = useState('');
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is typing in an input field, ignore global listener unless it's specifically handled elsewhere
      // But for a true POS experience, we often want the scanner to work even if focused on inputs, 
      // however, that causes double entry.
      // Best practice: If focused element is an input, let the input handle it.
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Enter') {
        if (barcode.length >= minLength) {
          onScan(barcode);
          setBarcode('');
        }
        return;
      }

      // Scanner usually sends printable characters
      if (e.key.length === 1) {
        setBarcode((prev) => prev + e.key);
        
        // Clear buffer if typing is too slow (manual entry vs scanner)
        // Scanners are very fast (ms between keys). Manual typing is slower.
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          setBarcode('');
        }, 100); // 100ms threshold usually distinguishes scanner from human
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeout);
    };
  }, [barcode, onScan, minLength]);
};
