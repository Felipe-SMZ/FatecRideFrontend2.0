import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

/**
 * PROTECTED ROUTE - HOC para proteger rotas autenticadas
 * Redireciona para /login se não autenticado
 */

export function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se requiredRole foi especificado, verifica se user tem o role
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}
