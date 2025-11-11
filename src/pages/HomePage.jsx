import { Link } from "react-router-dom";
import { FiMapPin, FiTruck, FiUser, FiClock } from "react-icons/fi";
import { PageContainer } from "@shared/components/layout/PageContainer";
import { Card } from "@shared/components/ui/Card";
import { useAuthStore } from "@features/auth/stores/authStore";

/**
 * HomePage - Dashboard principal pós-login
 * 
 * Exibe menu de navegação rápida adaptado ao role do usuário.
 * Motoristas veem opções de veículos, passageiros não.
 * Cards clicáveis com ícones coloridos para melhor UX.
 */

export function HomePage() {
  const { user } = useAuthStore();
  const isMotorista = user?.role === "MOTORISTA";

  /**
   * Configuração dos cards do menu principal
   * roles array define quem pode ver cada opção
   */
  const menuItems = [
    {
      to: "/caronas",
      icon: FiMapPin,
      title: "Buscar caronas",
      description: "Encontre caronas disponíveis",
      color: "blue",
      roles: ["PASSAGEIRO", "MOTORISTA"],
    },
    {
      to: "/oferecer-carona",
      icon: FiTruck,
      title: "Oferecer carona",
      description: "Cadastre uma nova carona",
      color: "green",
      roles: ["MOTORISTA"],
    },
    {
      to: "/meus-veiculos",
      icon: FiTruck,
      title: "Meus veículos",
      description: "Gerencie seus veículos",
      color: "purple",
      roles: ["MOTORISTA"],
    },
    {
      to: "/perfil",
      icon: FiUser,
      title: "Meu perfil",
      description: "Edite suas informações",
      color: "gray",
      roles: ["PASSAGEIRO", "MOTORISTA"],
    },
  ];

  // Filtra apenas cards permitidos para o role atual
  const visibleItems = menuItems.filter((item) =>
    item.roles.includes(user?.role || "PASSAGEIRO")
  );

  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    green: "bg-green-50 text-green-600 hover:bg-green-100",
    purple: "bg-purple-50 text-purple-600 hover:bg-purple-100",
    gray: "bg-gray-50 text-gray-600 hover:bg-gray-100",
  };

  return (
    <PageContainer
      title={`Bem-vindo, ${user?.nome || "Usuário"}!`}
      description={
        isMotorista
          ? "Gerencie suas caronas e veículos"
          : "Encontre caronas disponíveis"
      }
    >
      {/* Grid responsivo: 1 col mobile, 2 tablet, 3 desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to}>
              {/* Card interativo com animação de shadow no hover */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="flex items-start gap-4">
                  {/* Ícone com fundo colorido */}
                  <div
                    className={`p-3 rounded-lg ${colorClasses[item.color]}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </PageContainer>
  );
}
