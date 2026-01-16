import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // Silent logging to analytics service could go here
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
          <div className="mb-4 rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">عذراً، حدث خطأ غير متوقع</h1>
          <p className="mb-6 text-muted-foreground">
            لا تقلق، بياناتك آمنة. يرجى تحديث الصفحة للمتابعة.
          </p>
          <div className="bg-muted/50 p-4 rounded-lg mb-6 text-left text-xs font-mono max-w-md overflow-auto">
            {this.state.error?.message}
          </div>
          <Button 
            onClick={() => window.location.reload()} 
            className="gap-2"
          >
            <RefreshCw size={16} />
            تحديث النظام
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
