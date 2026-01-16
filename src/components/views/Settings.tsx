import { useState, useEffect } from 'react';
import { Save, Store, Percent, Globe, Receipt, Loader2, ImagePlus, User, Lock, Type, Printer, Plus, Trash2, Power } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PrinterConfig } from '@/types';

export const Settings = () => {
  const { settings, updateSettings, currentUser, addPrinter, removePrinter, togglePrinter } = useStore();
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    storeName: '',
    storePhone: '',
    storeEmail: '',
    storeAddress: '',
    currency: 'IQD',
    taxRate: 0,
    invoicePrefix: 'INV',
    language: 'ar',
    logo: '',
    footerMessage: '',
    invoiceNotes: '',
  });

  const [newPrinter, setNewPrinter] = useState<{name: string, type: 'cashier'|'kitchen'|'other'}>({ name: '', type: 'cashier' });

  useEffect(() => {
    if (settings) {
      setFormData({
        storeName: settings.storeName || '',
        storePhone: settings.storePhone || '',
        storeEmail: settings.storeEmail || '',
        storeAddress: settings.storeAddress || '',
        currency: settings.currency || 'IQD',
        taxRate: settings.taxRate || 0,
        invoicePrefix: settings.invoicePrefix || 'INV',
        language: settings.language || 'ar' as 'ar',
        logo: settings.logo || '',
        footerMessage: settings.footerMessage || '',
        invoiceNotes: settings.invoiceNotes || '',
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== 'admin') {
      toast.error('ليس لديك صلاحية لتعديل الإعدادات');
      return;
    }
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      updateSettings(formData);
      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPrinter = () => {
    if (!newPrinter.name) return;
    addPrinter({ ...newPrinter, enabled: true });
    setNewPrinter({ name: '', type: 'cashier' });
    toast.success('تم إضافة الطابعة');
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">الإعدادات</h1>
          <p className="text-muted-foreground">تخصيص إعدادات النظام والمتجر</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-6">
          {/* Store Info */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-primary/10">
                <Store className="text-primary" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">معلومات المتجر</h2>
                <p className="text-sm text-muted-foreground">البيانات الأساسية للمتجر</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">اسم المتجر *</Label>
                <Input
                  id="storeName"
                  required
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storePhone">رقم الهاتف</Label>
                <Input
                  id="storePhone"
                  value={formData.storePhone}
                  onChange={(e) => setFormData({ ...formData, storePhone: e.target.value })}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="storeAddress">العنوان</Label>
                <Textarea
                  id="storeAddress"
                  value={formData.storeAddress}
                  onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Invoice Customization */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-indigo-500/10">
                <Type className="text-indigo-500" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">تخصيص الفواتير</h2>
                <p className="text-sm text-muted-foreground">النصوص والملاحظات في الفاتورة</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="footerMessage">رسالة التذييل (Footer)</Label>
                <Input
                  id="footerMessage"
                  value={formData.footerMessage}
                  onChange={(e) => setFormData({ ...formData, footerMessage: e.target.value })}
                  placeholder="مثال: شكراً لزيارتكم"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceNotes">سياسة الاسترجاع / ملاحظات</Label>
                <Textarea
                  id="invoiceNotes"
                  value={formData.invoiceNotes}
                  onChange={(e) => setFormData({ ...formData, invoiceNotes: e.target.value })}
                  placeholder="مثال: البضاعة المباعة لا ترد..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Printers Management */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-orange-500/10">
                <Printer className="text-orange-500" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">إعدادات الطابعات</h2>
                <p className="text-sm text-muted-foreground">إدارة الطابعات المتعددة (كاشير، مطبخ)</p>
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex gap-2 items-end">
                 <div className="space-y-1 flex-1">
                   <Label>اسم الطابعة</Label>
                   <Input value={newPrinter.name} onChange={e => setNewPrinter({...newPrinter, name: e.target.value})} placeholder="مثال: طابعة المطبخ" />
                 </div>
                 <div className="space-y-1 w-32">
                   <Label>النوع</Label>
                   <Select value={newPrinter.type} onValueChange={(v: any) => setNewPrinter({...newPrinter, type: v})}>
                     <SelectTrigger><SelectValue /></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="cashier">كاشير</SelectItem>
                       <SelectItem value="kitchen">مطبخ</SelectItem>
                       <SelectItem value="other">أخرى</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <Button type="button" onClick={handleAddPrinter}><Plus size={18} /></Button>
               </div>

               <div className="space-y-2 mt-4">
                 {settings.printers?.map((printer) => (
                   <div key={printer.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                      <div className="flex items-center gap-3">
                        <Printer size={20} className="text-muted-foreground" />
                        <div>
                          <p className="font-medium">{printer.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{printer.type === 'cashier' ? 'الكاشير' : printer.type === 'kitchen' ? 'المطبخ' : 'أخرى'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <Button type="button" variant="ghost" size="icon" onClick={() => togglePrinter(printer.id)} className={printer.enabled ? "text-green-500" : "text-muted-foreground"}>
                           <Power size={18} />
                         </Button>
                         <Button type="button" variant="ghost" size="icon" onClick={() => removePrinter(printer.id)} className="text-destructive">
                           <Trash2 size={18} />
                         </Button>
                      </div>
                   </div>
                 ))}
                 {(!settings.printers || settings.printers.length === 0) && (
                   <p className="text-center text-muted-foreground text-sm py-4">لا توجد طابعات مضافة</p>
                 )}
               </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-info/10">
                <ImagePlus className="text-info" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">شعار المتجر</h2>
              </div>
            </div>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center text-center h-48 relative">
                {formData.logo ? (
                  <img src={formData.logo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-muted-foreground">
                    <ImagePlus size={40} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">رفع صورة</p>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              {formData.logo && (
                <Button type="button" variant="destructive" size="sm" className="w-full" onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}>
                  حذف الشعار
                </Button>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isSaving} className="w-full gap-2 h-12 text-lg font-semibold shadow-lg">
            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            حفظ التغييرات
          </Button>
        </div>
      </form>
    </div>
  );
};
