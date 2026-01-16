import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, User, Lock, Loader2, Eye, EyeOff, Zap } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  identifier: z.string().min(2, 'أدخل اسم المستخدم أو البريد الإلكتروني'),
  password: z.string().min(3, 'كلمة المرور قصيرة'),
});

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      loginSchema.parse({ identifier, password: loginPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        return;
      }
    }

    setIsSubmitting(true);
    const { error } = await signIn(identifier, loginPassword);
    setIsSubmitting(false);

    if (!error) {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-accent/20">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري تحميل النظام...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 relative overflow-hidden" dir="rtl">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-y-1/2 translate-x-1/2 animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="w-full max-w-md animate-scale-in">
        <Card className="shadow-2xl border-border/50 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pb-8">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-2xl blur-lg opacity-75 animate-pulse"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center">
                  <Store className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  نظام الإدارة
                </CardTitle>
              </div>
              <CardDescription className="text-base text-muted-foreground">
                تسجيل الدخول إلى لوحة التحكم 
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Username/Email Input */}
              <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <Label htmlFor="login-identifier" className="text-sm font-medium">
                  اسم المستخدم أو البريد الإلكتروني
                </Label>
                <div className="relative group">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="login-identifier"
                    type="text"
                    placeholder="admin أو email@example.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="pr-10 focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>
                {errors.identifier && (
                  <p className="text-sm text-destructive flex items-center gap-1 animate-slide-up">
                    <span className="w-1 h-1 bg-destructive rounded-full"></span>
                    {errors.identifier}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <Label htmlFor="login-password" className="text-sm font-medium">
                  كلمة المرور
                </Label>
                <div className="relative group">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="pr-10 pl-10 focus:ring-2 focus:ring-primary/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive flex items-center gap-1 animate-slide-up">
                    <span className="w-1 h-1 bg-destructive rounded-full"></span>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold rounded-xl animate-slide-up" 
                style={{ animationDelay: '0.3s' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    جاري تسجيل الدخول...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 ml-2" />
                    تسجيل الدخول
                  </>
                )}
              </Button>

              {/* Demo Accounts */}
              <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-border/30 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                  <Zap size={14} className="text-accent" />
                  حسابات تجريبية
                </p>
                <div className="space-y-2 text-xs text-muted-foreground/80">
                  <div className="flex justify-between items-center font-mono bg-background/50 p-2 rounded-lg">
                    <span>admin123</span>
                    <span className="text-accent">admin</span>
                  </div>
                  <div className="flex justify-between items-center font-mono bg-background/50 p-2 rounded-lg">
                    <span>cashier123</span>
                    <span className="text-accent">cashier</span>
                  </div>
                  <div className="flex justify-between items-center font-mono bg-background/50 p-2 rounded-lg">
                    <span>activator123</span>
                    <span className="text-accent">activator</span>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-6 text-center text-xs text-muted-foreground animate-fade-in space-y-1">
          <p className="font-semibold">Moonlight Noexis - نظام إدارة المبيعات والمخازن</p>
          <p>تم التطوير بواسطة المهندس عدنان مرسال</p>
          <p className="text-primary font-mono">07901854868</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
