import { useState } from 'react';
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
import { useAuth } from '@/hooks/useAuth';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useDatabase';

const roleLabels: any = {
  admin: 'مدير',
  sales: 'مبيعات',
  accountant: 'محاسب',
  warehouse: 'مستودع',
};

const roleIcons: any = {
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
  const { user: currentUser } = useAuth();
  const { data: users, isLoading: isLoadingUsers } = useUsers();
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutate: deleteUser } = useDeleteUser();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordForm, setPasswordForm] = useState({ userId: '', newPassword: '' });

  // Form State
  const [formData, setFormData] = useState<Partial<User> & { email?: string; password?: string; permissions?: Permission[] }>({
    username: '',
    email: '',
    fullName: '',
    role: 'sales',
    permissions: [],
    isActive: true,
    password: ''
  });

  const handleOpenModal = (user?: any) => {
    if (user) {
      setEditingUser(user);
      setFormData({ 
        ...user,
        fullName: user.full_name, // Map snake_case to camelCase
        email: user.email, 
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
    if (!formData.email) {
      toast.error('البريد الإلكتروني مطلوب');
      return;
    }
    if (!formData.fullName) {
      toast.error('الاسم الكامل مطلوب');
      return;
    }

    if (editingUser) {
        updateUser({
          id: editingUser.id,
          full_name: formData.fullName,
          role: formData.role,
          is_active: formData.isActive,
          email: formData.email,
          password: formData.password || undefined // Only send if set
        }, {
          onSuccess: () => setIsModalOpen(false)
        });
    } else {
        if (!formData.password || formData.password.length < 6) {
            toast.error('كلمة المرور مطلوبة ويجب أن تكون 6 أحرف على الأقل');
            return;
        }

        createUser({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          role: formData.role,
          is_active: formData.isActive
        }, {
          onSuccess: () => setIsModalOpen(false)
        });
    }
  };

  const handleResetPassword = async () => {
    if (passwordForm.newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    
    // We reuse updateUser for password reset
    updateUser({
      id: passwordForm.userId,
      password: passwordForm.newPassword
    }, {
      onSuccess: () => {
        setIsPasswordModalOpen(false);
        setPasswordForm({ userId: '', newPassword: '' });
      }
    });
  };

  // Permissions are not yet implemented fully in backend schema (just role based for now), but UI kept for future
  const togglePermission = (perm: Permission) => {
    const currentPerms = formData.permissions || [];
    if (currentPerms.includes(perm)) {
      setFormData({ ...formData, permissions: currentPerms.filter(p => p !== perm) });
    } else {
      setFormData({ ...formData, permissions: [...currentPerms, perm] });
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
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
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الاسم الكامل</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingUsers ? (
                 <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">جاري التحميل...</TableCell>
                 </TableRow>
              ) : users?.map((user: any) => {
                const Icon = roleIcons[user.role] || Shield;
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span>{roleLabels[user.role]}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? 'نشط' : 'معطل'}
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

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox 
                id="isActive" 
                checked={formData.isActive}
                onCheckedChange={(c) => setFormData({ ...formData, isActive: c === true })}
              />
              <label htmlFor="isActive">حساب نشط</label>
            </div>

            <Button onClick={handleSaveUser} className="w-full" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? <Loader2 className="animate-spin" /> : 'حفظ البيانات'}
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
            <Button onClick={handleResetPassword} className="w-full" disabled={isUpdating}>
              {isUpdating ? <Loader2 className="animate-spin" /> : 'تحديث كلمة المرور'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
