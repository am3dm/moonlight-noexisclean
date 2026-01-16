import { Search, User, MapPin, Power } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useState, useEffect } from 'react';
import { NotificationsDropdown } from '../NotificationsDropdown';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export const Header = () => {
  const { settings, logout, currentUser } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showEndShiftDialog, setShowEndShiftDialog] = useState(false);
  const [endShiftData, setEndShiftData] = useState({
      cash: '',
      card: '',
      notes: ''
  });

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const handleEndShift = () => {
     // Here we would normally call an API or store function
     // For now, simulate Z-Report logic
     toast.success(`تم إغلاق الوردية. تم تسجيل ${formatCurrency(Number(endShiftData.cash), settings.currency)} نقداً.`);
     setShowEndShiftDialog(false);
     setEndShiftData({ cash: '', card: '', notes: '' });
     logout();
  };

  return (
    <header className="h-16 bg-card/60 backdrop-blur-md border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search Bar */}
      <div className={`relative flex-1 max-w-md transition-all duration-300 ${isFocused ? 'ring-2 ring-primary/30 rounded-xl' : ''}`}>
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input
          type="text"
          placeholder="بحث سريع..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full pr-10 pl-4 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
        />
      </div>

      {/* Center - Location/Store Info */}
      <div className="hidden md:flex items-center gap-2 px-6 text-sm text-muted-foreground">
        <MapPin size={16} className="text-accent" />
        <span>{settings.storeAddress || 'الموقع غير محدد'}</span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        
        {currentUser && (
            <Button variant="destructive" size="sm" className="hidden md:flex gap-2" onClick={() => setShowEndShiftDialog(true)}>
                <Power size={16} />
                إغلاق الوردية
            </Button>
        )}

        {/* Notifications */}
        <NotificationsDropdown />

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-3 md:pl-6 border-l border-border">
          <div className="hidden sm:text-left">
            <p className="text-sm font-medium leading-none">{currentUser?.fullName || 'Guest'}</p>
            <p className="text-xs text-muted-foreground leading-none mt-1">
              {currentUser?.role || 'User'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-glow">
            <User className="text-primary-foreground" size={20} />
          </div>
        </div>
      </div>

      <Dialog open={showEndShiftDialog} onOpenChange={setShowEndShiftDialog}>
          <DialogContent className="max-w-md">
              <DialogHeader>
                  <DialogTitle>إغلاق الوردية (Z-Report)</DialogTitle>
                  <DialogDescription>يرجى إدخال المبالغ الموجودة في الدرج لإغلاق الوردية.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                  <div className="space-y-2">
                      <Label>النقد الفعلي في الدرج</Label>
                      <Input 
                        type="number" 
                        value={endShiftData.cash} 
                        onChange={(e) => setEndShiftData({...endShiftData, cash: e.target.value})} 
                        placeholder="0.00"
                      />
                  </div>
                  <div className="space-y-2">
                      <Label>مبيعات البطاقة (إيصالات)</Label>
                      <Input 
                        type="number" 
                        value={endShiftData.card} 
                        onChange={(e) => setEndShiftData({...endShiftData, card: e.target.value})} 
                        placeholder="0.00"
                      />
                  </div>
                  <div className="space-y-2">
                      <Label>ملاحظات</Label>
                      <Input 
                        value={endShiftData.notes} 
                        onChange={(e) => setEndShiftData({...endShiftData, notes: e.target.value})} 
                        placeholder="أي فروقات أو مشاكل..."
                      />
                  </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setShowEndShiftDialog(false)}>إلغاء</Button>
                  <Button variant="destructive" onClick={handleEndShift}>تأكيد الإغلاق والخروج</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </header>
  );
};
