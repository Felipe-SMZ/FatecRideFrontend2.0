import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '@shared/components/ui/Logo';
import { Button } from '@shared/components/ui/Button';
import { useAuthStore } from '@features/auth/stores/authStore';

/**
 * Navbar - Barra de navegação azul do FatecRide
 * Exibe logo, título e botão de ação (Entrar ou sair)
 */

export const Navbar = ({ showAuthButton = false }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleAuthAction = () => {
    if (user) {
      logout();
      navigate('/login');
    } else {
      navigate('/login');
    }
  };

  return (
    <nav className="bg-gradient-to-r from-fatecride-blue to-fatecride-blue-dark shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo e Título */}
          <Link to="/" className="flex items-center gap-4 hover:opacity-90 transition-opacity">
            <Logo size="md" className="bg-white/10 backdrop-blur-sm rounded-2xl p-2" />
            <h1 className="text-3xl font-bold text-white">FatecRide</h1>
          </Link>

          {/* Botão de ação */}
          {showAuthButton && (
            <Button
              onClick={handleAuthAction}
              className="bg-red-600 hover:bg-red-700 text-white px-6"
            >
              {user ? 'Sair' : 'Entrar'}
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};
