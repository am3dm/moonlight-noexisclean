import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useStore } from "@/store/useStore";
import { useSystemSetup } from "@/hooks/useSystemSetup";
import { Suspense, lazy, type ReactElement, useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2, WifiOff, Cloud } from "lucide-react";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { User } from "@/types";
import { DataSync } from "@/components/DataSync";

// Lazy load pages
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Setup = lazy(() => import("./pages/Setup"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        const anyErr = error as any;
        const status: number | undefined =
          anyErr?.response?.status ??
          (typeof anyErr?.status === "number" ? anyErr.status : undefined);

        if (status === 401 || status === 403) return false;
        return failureCount < 2;
      },
    },
  },
});

// Offline indicator component
const OfflineIndicator = (): JSX.Element | null => {
  const { isOnline, isSyncing, pendingCount } = useOfflineSync();

  if (isOnline && !isSyncing && pendingCount === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg transition-all ${
      isOnline ? 'bg-primary text-primary-foreground' : 'bg-destructive text-destructive-foreground'
    }`}>
      {isOnline ? (
        <>
          <Cloud className={`w-4 h-4 ${isSyncing ? 'animate-pulse' : ''}`} />
          <span className="text-sm font-medium">
            {isSyncing ? 'جاري المزامنة...' : `${pendingCount} عملية في الانتظار`}
          </span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">وضع عدم الاتصال</span>
          {pendingCount > 0 && (
            <span className="bg-background/20 px-2 py-0.5 rounded-full text-xs">
              {pendingCount > 0 ? pendingCount : ''}
            </span>
          )}
        </>
      )}
    </div>
  );
};

// Loading component
const LoadingScreen = (): JSX.Element => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
    <Loader2 className="h-10 w-10 animate-spin text-primary" />
    <p className="text-muted-foreground">جاري التحميل...</p>
  </div>
);

// Auth Sync Component
const AuthSync = () => {
  const { user: authUser, profile, roles } = useAuth();
  const { setCurrentUser } = useStore();

  useEffect(() => {
    if (authUser) {
      const appUser: User = {
        id: authUser.id,
        username: profile?.full_name || authUser.email?.split('@')[0] || 'User',
        fullName: profile?.full_name || 'User',
        role: roles.includes('admin') ? 'admin' : (roles[0] || 'user'),
        permissions: roles.includes('admin') ? ['all'] : [],
        isActive: profile?.is_active ?? true,
        createdAt: new Date(authUser.created_at || Date.now()),
      };
      setCurrentUser(appUser);
    } else {
      setCurrentUser(null);
    }
  }, [authUser, profile, roles, setCurrentUser]);

  return null;
};

// Protected Route Component
const ProtectedRoute = ({ children }: { children: ReactElement; setupData?: any }): JSX.Element => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// Public Route
const PublicRoute = ({ children }: { children: ReactElement; setupData?: any }): JSX.Element => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = (): JSX.Element => {
  const { isLoading: setupLoading, data: setupData } = useSystemSetup();

  if (setupLoading) {
    return <LoadingScreen />;
  }
  
  const isSetupCompleted = setupData?.isSetupCompleted;

  return (
    <>
      <AuthSync />
      <DataSync /> 
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                 {/* Logic: If setup is not completed, redirect to /setup. 
                     We wrap this inside ProtectedRoute because we need the user to be logged in (as admin) to do setup. 
                 */}
                 {isSetupCompleted ? (
                    <ErrorBoundary>
                      <Index />
                    </ErrorBoundary>
                 ) : (
                    <Navigate to="/setup" replace />
                 )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/setup"
            element={
               <ProtectedRoute>
                 <ErrorBoundary>
                   <Setup />
                 </ErrorBoundary>
               </ProtectedRoute>
            }
          />
          <Route
            path="/auth"
            element={
              <PublicRoute>
                <ErrorBoundary>
                  <Auth />
                </ErrorBoundary>
              </PublicRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <OfflineIndicator />
    </>
  );
};

const App = (): JSX.Element => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
