import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AppRole = 'admin' | 'sales' | 'accountant' | 'warehouse';

interface Profile {
  user_id: string;
  full_name?: string | null;
  role?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (identifier: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) throw error;
      setRoles((data || []).map((r) => r.role as AppRole));
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Small delay to ensure DB triggers might have run if it's a new user
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchRoles(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchRoles(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (_email: string, _password: string, _fullName: string) => {
    // In production, you might want to enable this or keep it disabled if it's an invite-only system.
    toast.error('إنشاء الحسابات معطل. يرجى التواصل مع المسؤول.');
    return { error: new Error('signup disabled') };
  };

  const signIn = async (identifier: string, password: string) => {
    // DEV ONLY: LocalAuth fallback for testing without Supabase connection
    if (import.meta.env.DEV) {
      const presetUsers = [
        { username: 'admin', password: 'admin123', role: 'admin' as AppRole },
        { username: 'cashier', password: 'cashier123', role: 'sales' as AppRole },
        { username: 'activator', password: 'activator123', role: 'warehouse' as AppRole },
      ];

      const matched = presetUsers.find(u => u.username === identifier);
      if (matched && matched.password === password) {
        // Create a local in-memory session stand-in
        setUser({
          id: `local-${matched.username}`,
          app_metadata: {},
          user_metadata: { full_name: matched.username },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          email: undefined,
          phone: undefined,
          role: 'authenticated',
          identities: [],
          last_sign_in_at: new Date().toISOString(),
          confirmed_at: new Date().toISOString(),
          email_confirmed_at: new Date().toISOString(),
          phone_confirmed_at: new Date().toISOString(),
          factors: [],
        } as unknown as User);
        setSession(null);
        setProfile({
          user_id: `local-${matched.username}`,
          full_name: matched.username,
          role: matched.role,
          is_active: true,
        });
        setRoles([matched.role]);
        toast.success('تم تسجيل الدخول (وضع المطور)');
        return { error: null };
      }
    }

    // Production: Only Supabase Auth
    try {
      // Allow sign in with email
      const { error } = await supabase.auth.signInWithPassword({
        email: identifier,
        password,
      });
      if (error) {
        toast.error(error.message.includes('Invalid login credentials') ? 'بيانات الدخول غير صحيحة' : error.message);
        return { error };
      }
      toast.success('تم تسجيل الدخول بنجاح!');
      return { error: null };
    } catch (error) {
        console.error("Login error:", error);
        toast.error('حدث خطأ غير متوقع أثناء تسجيل الدخول');
        return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
    toast.success('تم تسجيل الخروج');
  };

  const hasRole = (role: AppRole) => roles.includes(role);
  const isAdmin = () => roles.includes('admin');

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      roles,
      loading,
      signUp,
      signIn,
      signOut,
      hasRole,
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
