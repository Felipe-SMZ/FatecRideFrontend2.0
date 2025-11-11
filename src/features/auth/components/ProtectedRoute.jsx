import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

/**
 * ProtectedRoute - Wrapper para rotas que exigem autenticação
 * 
 * Verifica se usuário está autenticado antes de renderizar a rota.
 * Opcionalmente valida role específico (ex: apenas MOTORISTA).
 * Redireciona para login se não autenticado ou para home se role incorreto.
 * 
 * @example
 * <Route path="/perfil" element={
 *   <ProtectedRoute>
 *     <ProfilePage />
 *   </ProtectedRoute>
 * } />
 * 
 * @example
 * // Rota apenas para motoristas
 * <Route path="/veiculos" element={
 *   <ProtectedRoute requiredRole="MOTORISTA">
 *     <VehiclesPage />
 *   </ProtectedRoute>
 * } />
 */

export function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuthStore();

  // Primeira verificação: usuário está autenticado?
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Segunda verificação: usuário tem o role necessário?
  // Se requiredRole não foi passado, permite qualquer role
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // Tudo certo, renderiza o conteúdo protegido
  return children;
}
