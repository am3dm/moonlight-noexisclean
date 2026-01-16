export {};

declare global {
  interface Window {
    electronAPI?: {
      print: (options: { content: string; printerName?: string; silent?: boolean }) => Promise<boolean>;
      getPrinters: () => Promise<{ name: string; displayName: string; isDefault: boolean }[]>;
    };
  }
}
