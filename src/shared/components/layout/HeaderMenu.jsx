import { NavLink } from "react-router-dom";
import { FiHome, FiMapPin, FiTruck, FiUser } from "react-icons/fi";
import { cn } from "../ui/cn";
import { useAuthStore } from "@features/auth/stores/authStore";

/**
 * HeaderMenu - Menu de navegação principal
 * 
 * Renderiza links baseados no role do usuário (PASSAGEIRO ou MOTORISTA).
 * NavLink adiciona classe 'active' automaticamente, permitindo destaque visual.
 * Ícones aparecem sempre, labels de texto apenas em telas grandes (lg:inline).
 */

export function HeaderMenu() {
  const { user } = useAuthStore();

  /**
   * Definição de itens do menu com permissões por role
   * Motoristas veem opção de Veículos, passageiros não
   */
  const menuItems = [
    { to: "/", label: "Início", icon: FiHome, roles: ["PASSAGEIRO", "MOTORISTA"] },
    { to: "/caronas", label: "Caronas", icon: FiMapPin, roles: ["PASSAGEIRO", "MOTORISTA"] },
    { to: "/meus-veiculos", label: "Veículos", icon: FiTruck, roles: ["MOTORISTA"] },
    { to: "/perfil", label: "Perfil", icon: FiUser, roles: ["PASSAGEIRO", "MOTORISTA"] },
  ];

  // Filtra apenas itens que o usuário tem permissão de ver
  const visibleItems = menuItems.filter((item) =>
    item.roles.includes(user?.role || "PASSAGEIRO")
  );

  return (
    <nav className="flex items-center gap-1">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            // className como função recebe { isActive } do React Router
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                // Destaque vermelho para rota ativa, cinza para inativas
                isActive
                  ? "text-red-600 bg-red-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )
            }
          >
            <Icon className="w-4 h-4" />
            {/* Label oculto em mobile/tablet, visível em desktop */}
            <span className="hidden lg:inline">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
