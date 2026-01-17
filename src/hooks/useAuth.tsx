import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// Define simplified user types
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => void;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token and user data on load
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing stored user", e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (identifier: string, password: string) => {
    try {
      const { data } = await api.post('/auth/login', {
        email: identifier,
        password,
      });

      const { token, user } = data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      toast.success('تم تسجيل الدخول بنجاح!');
      return { error: null };
    } catch (error: any) {
        console.error("Login error:", error);
        const errorMessage = error.response?.data?.error || 'حدث خطأ أثناء تسجيل الدخول';
        toast.error(errorMessage);
        return { error: new Error(errorMessage) };
    }
  };

  const signOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('تم تسجيل الخروج');
  };

  const isAdmin = () => user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signOut,
      isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
