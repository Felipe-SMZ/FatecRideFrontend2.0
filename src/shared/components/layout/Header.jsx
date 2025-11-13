import { Link } from "react-router-dom";
import { FiLogOut, FiUser } from "react-icons/fi";
import { useAuthStore } from "@features/auth/stores/authStore";
import { HeaderMenu } from "./HeaderMenu";

/**
 * Header - Barra de navegação superior global
 * 
 * Componente presente em todas as páginas autenticadas.
 * Exibe logo, menu de navegação, informações do usuário e logout.
 * sticky top-0 mantém o header visível durante o scroll.
 */

export function Header() {
  const { user, logout } = useAuthStore();

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo com gradiente vermelho da FATEC */}
          <Link to="/" className="flex items-center gap-2" aria-label="Ir para a página inicial">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            {/* Texto do logo oculto em mobile (hidden sm:block) */}
            <div className="hidden sm:block">
              <span className="font-bold text-xl text-gray-900">FATEC</span>
              <span className="font-normal text-xl text-red-600">Ride</span>
            </div>
          </Link>

          {/* Menu principal - apenas para usuários autenticados */}
          {user && <HeaderMenu />}

          {/* Área do usuário: info + logout ou botão de login */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Nome do usuário - oculto em telas pequenas */}
                <div className="hidden md:flex items-center gap-2 text-sm">
                  <FiUser className="text-gray-500" />
                  <span className="text-gray-700">{user.nome || user.email}</span>
                </div>
                {/* Botão de logout com confirmação visual em hover */}
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Sair"
                >
                  <FiLogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
