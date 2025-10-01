import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { hasPermission, hasAnyPermission, Permission } from '@/lib/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin_pusat' | 'admin_unit' | ('admin_pusat' | 'admin_unit')[];
  requiredPermission?: Permission;
  requireAnyPermission?: Permission[];
  fallbackPath?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredPermission,
  requireAnyPermission,
  fallbackPath = '/dashboard'
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check role-based access
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowedRoles.includes(user.role as any)) {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check if user has any of the required permissions
  if (requireAnyPermission && !hasAnyPermission(user, requireAnyPermission)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}
