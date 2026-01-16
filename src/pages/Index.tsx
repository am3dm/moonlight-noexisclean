import { MainLayout } from '@/components/layout/MainLayout';
import { Dashboard } from '@/components/views/Dashboard';
import { Products } from '@/components/views/Products';
import { Categories } from '@/components/views/Categories';
import { Sales } from '@/components/views/Sales';
import { Purchases } from '@/components/views/Purchases';
import { Returns } from '@/components/views/Returns';
import { Customers } from '@/components/views/Customers';
import { Suppliers } from '@/components/views/Suppliers';
import { Reports } from '@/components/views/Reports';
import { Settings } from '@/components/views/Settings';
import { Users } from '@/components/views/Users';
import { Debts } from '@/components/views/Debts';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import { useStockAlerts } from '@/hooks/useStockAlerts';

const Index = () => {
  const { currentView } = useStore();
  const { hasRole, isAdmin } = useAuth();
  
  // Initialize stock alerts
  useStockAlerts();

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'products':
        return <Products />;
      case 'categories':
        return <Categories />;
      case 'sales':
        if (hasRole('sales') || isAdmin()) {
          return <Sales />;
        }
        return <Dashboard />;
      case 'purchases':
        if (hasRole('warehouse') || isAdmin()) {
          return <Purchases />;
        }
        return <Dashboard />;
      case 'returns':
        if (hasRole('sales') || hasRole('warehouse') || isAdmin()) {
           return <Returns />;
        }
        return <Dashboard />;
      case 'customers':
        if (hasRole('sales') || isAdmin()) {
          return <Customers />;
        }
        return <Dashboard />;
      case 'suppliers':
        if (hasRole('warehouse') || isAdmin()) {
          return <Suppliers />;
        }
        return <Dashboard />;
      case 'reports':
        if (hasRole('accountant') || isAdmin()) {
          return <Reports />;
        }
        return <Dashboard />;
      case 'settings':
        if (isAdmin()) {
          return <Settings />;
        }
        return <Dashboard />;
      case 'users':
        if (isAdmin()) {
          return <Users />;
        }
        return <Dashboard />;
      case 'debts':
        if (hasRole('sales') || hasRole('accountant') || isAdmin()) {
          return <Debts />;
        }
        return <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <MainLayout>
      {renderView()}
    </MainLayout>
  );
};

export default Index;
