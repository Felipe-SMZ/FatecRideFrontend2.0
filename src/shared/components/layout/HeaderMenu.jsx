import { NavLink } from "react-router-dom";
import { FiHome, FiMapPin, FiCar, FiUser } from "react-icons/fi";
import { cn } from "../ui/cn";
import { useAuthStore } from "@features/auth/stores/authStore";

/**
 * HEADER MENU - Navegação principal
 * Links com estado ativo, ícones, role-based visibility
 */

export function HeaderMenu() {
  const { user } = useAuthStore();

  const menuItems = [
    { to: "/", label: "Início", icon: FiHome, roles: ["PASSAGEIRO", "MOTORISTA"] },
    { to: "/caronas", label: "Caronas", icon: FiMapPin, roles: ["PASSAGEIRO", "MOTORISTA"] },
    { to: "/meus-veiculos", label: "Veículos", icon: FiCar, roles: ["MOTORISTA"] },
    { to: "/perfil", label: "Perfil", icon: FiUser, roles: ["PASSAGEIRO", "MOTORISTA"] },
  ];

  // Filtra itens baseado no role do usuário
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
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "text-red-600 bg-red-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )
            }
          >
            <Icon className="w-4 h-4" />
            <span className="hidden lg:inline">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
