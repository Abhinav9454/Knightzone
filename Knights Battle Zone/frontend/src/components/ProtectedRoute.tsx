import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminRole } from "@/lib/auth-role";

export function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdminRole(user?.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
