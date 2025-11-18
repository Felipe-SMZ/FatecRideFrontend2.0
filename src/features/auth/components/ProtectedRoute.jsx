import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { Navbar } from '@shared/components/layout/Navbar';

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
  // Nota: user.tipo pode ser 'MOTORISTA', 'PASSAGEIRO' ou 'AMBOS'
  if (requiredRole) {
    const userType = user?.tipo;

    // Permite acesso se o usuário tem o role requerido ou for 'AMBOS'.
    // Caso contrário, redireciona para a tela inicial.
    if (userType !== requiredRole && userType !== 'AMBOS') {
      return <Navigate to="/inicio" replace />;
    }
  }

  // Tudo certo, renderiza o conteúdo protegido com a Navbar
  return (
    <>
      <Navbar showAuthButton={true} />
      <main className="pt-20">
        {children}
      </main>
    </>
  );
}
