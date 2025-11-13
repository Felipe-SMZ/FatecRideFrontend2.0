import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Logo } from '@shared/components/ui/Logo';
import { useAuthStore } from '@features/auth/stores/authStore';

/**
 * Navbar - Barra de navegação azul do FatecRide
 * Exibe logo, título e menu dropdown do usuário quando logado
 */

export const Navbar = ({ showAuthButton = false }) => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/login');
  };

  const navigateTo = (path) => {
    navigate(path);
    setDropdownOpen(false);
  };

  // Pegar iniciais do nome para avatar
  const getInitials = () => {
    if (!user?.name) return 'U';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.name[0].toUpperCase();
  };

  // Renderizar avatar com foto ou iniciais
  const renderAvatar = (size = 'w-10 h-10', textSize = 'text-sm') => {
    if (user?.foto) {
      return (
        <img 
          src={user.foto} 
          alt={user.name}
          className={`${size} rounded-full object-cover bg-white`}
          onError={(e) => {
            // Se a imagem falhar, mostrar iniciais
            e.target.style.display = 'none';
            e.target.nextElementSibling.style.display = 'flex';
          }}
        />
      );
    }
    return (
      <div className={`${size} rounded-full bg-white text-fatecride-blue font-bold flex items-center justify-center ${textSize}`}>
        {getInitials()}
      </div>
    );
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

          {/* Menu do usuário ou botão Entrar */}
          {showAuthButton && (
            <div className="relative" ref={dropdownRef}>
              {isAuthenticated && user ? (
                <>
                  {/* Avatar Button */}
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full py-2 px-4 transition-all duration-200 border-2 border-white/20 hover:border-white/40"
                  >
                    {/* Avatar com foto ou iniciais */}
                    {renderAvatar('w-10 h-10', 'text-sm')}
                    {/* Nome e seta */}
                    <div className="hidden md:block text-left">
                      <p className="text-white font-semibold text-sm">{user.name}</p>
                    </div>
                    <svg 
                      className={`w-4 h-4 text-white transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* Header do menu */}
                      <div className="px-4 py-3 bg-gradient-to-r from-fatecride-blue to-fatecride-blue-dark">
                        <p className="text-white font-semibold">{user.name}</p>
                        <p className="text-white/80 text-sm">{user.email || 'Usuário FatecRide'}</p>
                      </div>

                      {/* Menu items */}
                      <div className="py-2">
                        <button
                          type="button"
                          onClick={() => navigateTo('/perfil')}
                          className="w-full px-4 py-3 text-left hover:bg-fatecride-blue-light hover:text-fatecride-blue transition-colors flex items-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="font-medium">Meu Perfil</span>
                        </button>

                        {/* Mostrar Veículos apenas para MOTORISTA ou AMBOS */}
                        {(user?.tipo === 'MOTORISTA' || user?.tipo === 'AMBOS') && (
                          <button
                            type="button"
                            onClick={() => navigateTo('/veiculos')}
                            className="w-full px-4 py-3 text-left hover:bg-fatecride-blue-light hover:text-fatecride-blue transition-colors flex items-center gap-3"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                            </svg>
                            <span className="font-medium">Meus Veículos</span>
                          </button>
                        )}

                        {/* Caronas Ativas - apenas para MOTORISTA ou AMBOS */}
                        {(user?.tipo === 'MOTORISTA' || user?.tipo === 'AMBOS') && (
                          <button
                            type="button"
                            onClick={() => navigateTo('/caronas-ativas')}
                            className="w-full px-4 py-3 text-left hover:bg-fatecride-blue-light hover:text-fatecride-blue transition-colors flex items-center gap-3"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">Caronas Ativas</span>
                          </button>
                        )}

                        {/* Solicitações Ativas - apenas para PASSAGEIRO ou AMBOS */}
                        {(user?.tipo === 'PASSAGEIRO' || user?.tipo === 'AMBOS') && (
                          <button
                            type="button"
                            onClick={() => navigateTo('/solicitacoes-ativas')}
                            className="w-full px-4 py-3 text-left hover:bg-fatecride-blue-light hover:text-fatecride-blue transition-colors flex items-center gap-3"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span className="font-medium">Solicitações Ativas</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => navigateTo('/historico')}
                          className="w-full px-4 py-3 text-left hover:bg-fatecride-blue-light hover:text-fatecride-blue transition-colors flex items-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">Histórico</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => navigateTo('/mensagens')}
                          className="w-full px-4 py-3 text-left hover:bg-fatecride-blue-light hover:text-fatecride-blue transition-colors flex items-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span className="font-medium">Mensagens</span>
                        </button>

                        <hr className="my-2 border-gray-200" />

                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full px-4 py-3 text-left hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors flex items-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span className="font-semibold">Sair</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                >
                  Entrar
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
