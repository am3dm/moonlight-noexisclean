import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Phone, MapPin, Mail, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateStoreSettings } from '@/hooks/useDatabase';

export default function Setup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateSettings } = useStore();
  const { mutate: saveSettings, isPending: loading } = useUpdateStoreSettings();
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    storeName: '',
    storePhone: '',
    storeAddress: '',
    storeEmail: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.storeName || formData.storeName.length < 2) {
        newErrors.storeName = 'اسم المتجر مطلوب';
    }
    if (!formData.storePhone || formData.storePhone.length < 10) {
        newErrors.storePhone = 'رقم الهاتف غير صحيح';
    }
    if (!formData.storeAddress || formData.storeAddress.length < 5) {
        newErrors.storeAddress = 'العنوان مطلوب';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    saveSettings({
      store_name: formData.storeName,
      store_phone: formData.storePhone,
      store_address: formData.storeAddress,
      store_email: formData.storeEmail,
      is_setup_completed: true
    }, {
      onSuccess: () => {
        // Update local store immediately for UX
        updateSettings({
            storeName: formData.storeName,
            storePhone: formData.storePhone,
            storeAddress: formData.storeAddress,
            storeEmail: formData.storeEmail
        });
        window.location.href = '/'; 
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg animate-fade-in shadow-xl border-t-4 border-primary">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">إعداد بيانات المتجر</CardTitle>
            <CardDescription>
              مرحباً بك {user?.name || 'يا مدير'}! يرجى إكمال معلومات المتجر للبدء.
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">اسم المتجر *</Label>
                  <div className="relative">
                    <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="storeName"
                      name="storeName"
                      value={formData.storeName}
                      onChange={handleChange}
                      className="pr-9"
                      placeholder="مثال: متجر النخيل"
                    />
                  </div>
                  {errors.storeName && <p className="text-destructive text-xs">{errors.storeName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storePhone">رقم الهاتف *</Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="storePhone"
                      name="storePhone"
                      value={formData.storePhone}
                      onChange={handleChange}
                      className="pr-9"
                      placeholder="07xx xxx xxxx"
                      dir="ltr"
                    />
                  </div>
                  {errors.storePhone && <p className="text-destructive text-xs">{errors.storePhone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storeAddress">العنوان *</Label>
                  <div className="relative">
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="storeAddress"
                      name="storeAddress"
                      value={formData.storeAddress}
                      onChange={handleChange}
                      className="pr-9"
                      placeholder="المدينة، الشارع"
                    />
                  </div>
                  {errors.storeAddress && <p className="text-destructive text-xs">{errors.storeAddress}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storeEmail">البريد الإلكتروني الرسمي (اختياري)</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="storeEmail"
                      name="storeEmail"
                      type="email"
                      value={formData.storeEmail}
                      onChange={handleChange}
                      className="pr-9"
                      placeholder="store@example.com"
                      dir="ltr"
                    />
                  </div>
                </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-primary h-11 text-base mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  حفظ وبدء الاستخدام
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
