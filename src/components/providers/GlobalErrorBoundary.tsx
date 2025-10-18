import React from 'react';
import ErrorBoundary from '@/components/ui/error-boundary';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Home, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GlobalErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

const GlobalErrorFallback: React.FC<GlobalErrorFallbackProps> = ({ 
  error, 
  resetError 
}) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    resetError();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-4">
        <Alert variant="destructive">
          <AlertTitle className="text-lg font-semibold">
            Terjadi Kesalahan
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p className="text-sm mb-4">
              {error.message || 'Aplikasi mengalami kesalahan yang tidak terduga.'}
            </p>
            {process.env.NODE_ENV === 'development' && (
              <details className="text-xs mt-2 p-2 bg-muted rounded">
                <summary className="cursor-pointer font-medium">
                  Detail Error (Development)
                </summary>
                <pre className="mt-2 overflow-auto max-h-40">
                  {error.stack}
                </pre>
              </details>
            )}
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button 
            onClick={resetError}
            variant="outline"
            className="flex-1 gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Coba Lagi
          </Button>
          <Button 
            onClick={handleGoHome}
            className="flex-1 gap-2"
          >
            <Home className="h-4 w-4" />
            Ke Beranda
          </Button>
        </div>
      </div>
    </div>
  );
};

interface GlobalErrorBoundaryProps {
  children: React.ReactNode;
}

export const GlobalErrorBoundary: React.FC<GlobalErrorBoundaryProps> = ({ 
  children 
}) => {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
};
