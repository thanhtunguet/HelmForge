import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useHelmStore } from '@/lib/store';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const loadFromDatabase = useHelmStore((state) => state.loadFromDatabase);
  const isLoading = useHelmStore((state) => state.isLoading);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (user && !dataLoaded) {
      loadFromDatabase().then(() => {
        setDataLoaded(true);
      });
    }
  }, [user, dataLoaded, loadFromDatabase]);

  if (authLoading || (user && !dataLoaded) || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}