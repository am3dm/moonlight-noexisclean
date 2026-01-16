/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    printOrder: (data: any) => void;
  };
}
