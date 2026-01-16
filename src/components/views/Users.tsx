import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Users as UsersIcon, Shield, ShoppingCart, Calculator, Package, Plus, Lock, Trash2, Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Permission, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';

const roleLabels = {
  admin: 'مدير',
  sales: 'مبيعات',
  accountant: 'محاسب',
  warehouse: 'مستودع',
};

const roleIcons = {
  admin: Shield,
  sales: ShoppingCart,
  accountant: Calculator,
  warehouse: Package,
};

const permissionsList: { id: Permission; label: string }[] = [
  { id: 'manage_users', label: 'إدارة المستخدمين' },
  { id: 'manage_settings', label: 'إدارة الإعدادات' },
  { id: 'view_reports', label: 'عرض التقارير' },
  { id: 'manage_products', label: 'إدارة المنتجات' },
  { id: 'manage_sales', label: 'إدارة المبيعات' },
  { id: 'manage_purchases', label: 'إدارة المشتريات' },
  { id: 'manage_customers', label: 'إدارة العملاء' },
  { id: 'approve_invoices', label: 'اعتماد الفواتير' },
];

export const Users = () => {
  const { users, addUser, updateUser, deleteUser, currentUser } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordForm, setPasswordForm] = useState({ userId: '', newPassword: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<User> & { email?: string; password?: string }>({
    username: '',
    email: '',
    fullName: '',
    role: 'sales',
    permissions: [],
    isActive: true,
    password: ''
  });

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({ 
        ...user,
        email: user.username.includes('@') ? user.username : '', // Best guess for email if stored in username
        password: '' // Don't show old password
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        fullName: '',
        role: 'sales',
        permissions: ['manage_sales'], 
        isActive: true,
        password: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!formData.email && !editingUser) {
      toast.error('البريد الإلكتروني مطلوب');
      return;
    }
    if (!formData.fullName) {
      toast.error('الاسم الكامل مطلوب');
      return;
    }

    setIsLoading(true);

    try {
      if (editingUser) {
        // Update Existing User via RPC
        const { error } = await supabase.rpc('update_user_details', {
          target_user_id: editingUser.id,
          new_full_name: formData.fullName,
          new_role: formData.role,
          new_permissions: formData.permissions,
          new_is_active: formData.isActive,
          new_password: formData.password || null // Update password if provided
        });

        if (error) throw error;
        
        // Update Local Store
        updateUser(editingUser.id, formData);
        toast.success('تم تحديث بيانات المستخدم بنجاح');
      } else {
        // Create New User via RPC
        if (!formData.password || formData.password.length < 6) {
            toast.error('كلمة المرور مطلوبة ويجب أن تكون 6 أحرف على الأقل');
            setIsLoading(false);
            return;
        }

        const { data: newUserId, error } = await supabase.rpc('create_new_user', {
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          role: formData.role,
          permissions: formData.permissions || []
        });

        if (error) throw error;

        // Add to local store
        addUser({ 
            id: newUserId,
            username: formData.email!.split('@')[0], 
            ...formData as any 
        }); 
        
        toast.success('تم إنشاء المستخدم بنجاح');
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error('حدث خطأ: ' + (error.message || 'فشلت العملية'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (passwordForm.newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('update_user_details', {
        target_user_id: passwordForm.userId,
        new_password: passwordForm.newPassword
      });

      if (error) throw error;

      toast.success('تم تغيير كلمة المرور بنجاح');
      setIsPasswordModalOpen(false);
      setPasswordForm({ userId: '', newPassword: '' });
    } catch (error: any) {
      toast.error('حدث خطأ: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePermission = (perm: Permission) => {
    const currentPerms = formData.permissions || [];
    if (currentPerms.includes(perm)) {
      setFormData({ ...formData, permissions: currentPerms.filter(p => p !== perm) });
    } else {
      setFormData({ ...formData, permissions: [...currentPerms, perm] });
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-lg">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <UsersIcon className="h-6 w-6 text-primary" />
            إدارة المستخدمين
          </h1>
          <p className="text-muted-foreground">إدارة الحسابات والصلاحيات وكلمات المرور</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus size={20} />
          إضافة مستخدم
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المستخدم</TableHead>
                <TableHead>الاسم الكامل</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>الصلاحيات</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const Icon = roleIcons[user.role] || Shield;
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username || user.email || 'User'}</TableCell>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span>{roleLabels[user.role]}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.permissions?.length || 0} صلاحيات</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'secondary'}>
                        {user.isActive ? 'نشط' : 'معطل'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(user)} title="تعديل البيانات">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setPasswordForm({ userId: user.id, newPassword: '' });
                            setIsPasswordModalOpen(true);
                          }}
                          title="تغيير كلمة المرور"
                        >
                          <Lock className="h-4 w-4 text-amber-500" />
                        </Button>
                        {user.id !== currentUser.id && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) deleteUser(user.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit User Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>البريد الإلكتروني *</Label>
                <Input 
                  type="email"
                  value={formData.email} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!!editingUser} // Can't change email easily
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم الكامل *</Label>
                <Input 
                  value={formData.fullName} 
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            </div>

            {/* Optional password update during edit */}
            <div className="space-y-2">
                <Label>{editingUser ? 'تحديث كلمة المرور (اختياري)' : 'كلمة المرور *'}</Label>
                <Input 
                  type="password"
                  value={formData.password} 
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="******"
                />
                {editingUser && <p className="text-xs text-muted-foreground">اتركه فارغاً إذا كنت لا تريد تغيير كلمة المرور</p>}
            </div>

            <div className="space-y-2">
              <Label>الدور الوظيفي</Label>
              <Select 
                value={formData.role} 
                onValueChange={(val: any) => setFormData({ ...formData, role: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">مدير (Admin)</SelectItem>
                  <SelectItem value="sales">مبيعات (Sales)</SelectItem>
                  <SelectItem value="warehouse">مستودع (Warehouse)</SelectItem>
                  <SelectItem value="accountant">محاسب (Accountant)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>الصلاحيات المخصصة</Label>
              <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg bg-muted/20">
                {permissionsList.map((perm) => (
                  <div key={perm.id} className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox 
                      id={perm.id} 
                      checked={formData.permissions?.includes(perm.id)}
                      onCheckedChange={() => togglePermission(perm.id)}
                    />
                    <label
                      htmlFor={perm.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {perm.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox 
                id="isActive" 
                checked={formData.isActive}
                onCheckedChange={(c) => setFormData({ ...formData, isActive: c === true })}
              />
              <label htmlFor="isActive">حساب نشط</label>
            </div>

            <Button onClick={handleSaveUser} className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'حفظ البيانات'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Separate Password Reset Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغيير كلمة المرور بسرعة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>كلمة المرور الجديدة</Label>
              <Input 
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </div>
            <Button onClick={handleResetPassword} className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'تحديث كلمة المرور'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
