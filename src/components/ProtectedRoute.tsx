import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute = ({
  children,
  requireAuth = true,
  redirectTo = "/login",
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If route requires auth but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If route doesn't require auth but user is authenticated (e.g., login page)
  if (!requireAuth && isAuthenticated) {
    const from = location.state?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
