import { useEffect, useCallback } from 'react';
import { useProducts, useStoreSettings } from '@/hooks/useDatabase';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

export const useStockAlerts = () => {
  const { data: products = [] } = useProducts();
  const { data: storeSettings } = useStoreSettings();

  const currency = storeSettings?.currency || 'د.ع';

  const checkStockLevels = useCallback(() => {
    const lowStockProducts = products.filter(p => p.quantity <= p.min_quantity && p.is_active);
    const outOfStockProducts = products.filter(p => p.quantity === 0 && p.is_active);

    // Show out of stock alerts first (more critical)
    outOfStockProducts.forEach(product => {
      toast.error(`نفد المخزون: ${product.name}`, {
        description: `يرجى إعادة طلب المنتج`,
        duration: 10000,
      });
    });

    // Show low stock warnings
    lowStockProducts
      .filter(p => p.quantity > 0)
      .forEach(product => {
        toast.warning(`مخزون منخفض: ${product.name}`, {
          description: `الكمية المتبقية: ${product.quantity} ${product.unit || 'قطعة'} (الحد الأدنى: ${product.min_quantity})`,
          duration: 8000,
        });
      });

    return {
      lowStockProducts,
      outOfStockProducts,
      totalAlerts: lowStockProducts.length,
    };
  }, [products]);

  // Check stock on initial load (only once)
  useEffect(() => {
    if (products.length > 0) {
      // Delay the check slightly to avoid overwhelming the user on login
      const timeoutId = setTimeout(() => {
        const { totalAlerts } = checkStockLevels();
        if (totalAlerts > 3) {
          // If there are many alerts, show a summary instead
          const lowStock = products.filter(p => p.quantity <= p.min_quantity && p.quantity > 0 && p.is_active);
          const outOfStock = products.filter(p => p.quantity === 0 && p.is_active);
          
          if (outOfStock.length > 0) {
            toast.error(`${outOfStock.length} منتج نفد من المخزون`, {
              description: 'يرجى مراجعة صفحة التقارير لمزيد من التفاصيل',
              duration: 10000,
            });
          }
          
          if (lowStock.length > 0) {
            toast.warning(`${lowStock.length} منتج بمخزون منخفض`, {
              description: 'يرجى مراجعة صفحة التقارير لمزيد من التفاصيل',
              duration: 8000,
            });
          }
        }
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [products.length > 0]); // Only run once when products load

  return {
    checkStockLevels,
    lowStockCount: products.filter(p => p.quantity <= p.min_quantity && p.is_active).length,
    outOfStockCount: products.filter(p => p.quantity === 0 && p.is_active).length,
  };
};
