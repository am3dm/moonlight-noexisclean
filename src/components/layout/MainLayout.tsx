import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="mr-0 md:mr-64 transition-all duration-300">
        <Header />
        <main className="p-4 md:p-8 animate-fade-in min-h-[calc(100vh-8rem)]">
          {children}
        </main>
        <footer className="px-4 md:px-8 py-4 text-center text-xs md:text-sm text-muted-foreground border-t border-border">
          <div className="space-y-1">
            <p className="font-semibold">Moonlight Noexis - نظام إدارة المبيعات والمخازن المتطور</p>
            <p>تم التطوير بواسطة المهندس عدنان مرسال © 2025</p>
            <p className="text-primary font-mono">07901854868</p>
          </div>
        </footer>
      </div>
    </div>
  );
};
