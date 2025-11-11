import { useNavigate } from 'react-router-dom';
import { Card } from '@shared/components/ui/Card';
import { Button } from '@shared/components/ui/Button';
import { Logo } from '@shared/components/ui/Logo';
import { FiUser, FiTruck, FiUsers } from 'react-icons/fi';

/**
 * SelectUserTypePage - Página de seleção de tipo de usuário
 * 
 * Permite escolher entre:
 * - Passageiro (userTypeId: 1)
 * - Motorista (userTypeId: 2)  
 * - Ambos (userTypeId: 3)
 * 
 * Segue padrão de Clean Code e IHC com:
 * - Ícones claros para cada opção
 * - Feedback visual no hover
 * - Navegação com state para próxima página
 */

const USER_TYPES = [
  {
    id: 1,
    name: 'Passageiro',
    description: 'Busco caronas para minhas viagens',
    icon: FiUser,
    color: 'from-fatecride-blue to-fatecride-blue-dark',
    hoverColor: 'hover:from-fatecride-blue-dark hover:to-fatecride-blue-darker'
  },
  {
    id: 2,
    name: 'Motorista',
    description: 'Ofereço caronas aos colegas',
    icon: FiTruck,
    color: 'from-fatecride-blue to-fatecride-blue-dark',
    hoverColor: 'hover:from-fatecride-blue-dark hover:to-fatecride-blue-darker'
  },
  {
    id: 3,
    name: 'Ambos',
    description: 'Ofereço e busco caronas',
    icon: FiUsers,
    color: 'from-fatecride-blue to-fatecride-blue-dark',
    hoverColor: 'hover:from-fatecride-blue-dark hover:to-fatecride-blue-darker'
  }
];

export function SelectUserTypePage() {
  const navigate = useNavigate();

  const handleSelectUserType = (userTypeId) => {
    // Navega para cadastro passando o tipo de usuário
    navigate('/cadastro', { 
      state: { userTypeId } 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fatecride-blue via-fatecride-blue-dark to-fatecride-blue-darker flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE zNGgxMHYxMEgzNnptMCAzMGgxMHYxMEgzNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>
      
      <div className="w-full max-w-6xl relative z-10">
        <div className="text-center mb-12">
          <Logo 
            size="xl" 
            className="bg-white/10 backdrop-blur-sm rounded-3xl mb-6 shadow-2xl mx-auto"
          />
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            Bem-vindo ao FatecRide!
          </h1>
          <p className="text-xl md:text-2xl text-white/90 drop-shadow">
            Escolha como você deseja usar a plataforma
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {USER_TYPES.map((type) => {
            const Icon = type.icon;
            
            return (
              <Card
                key={type.id}
                className={`
                  cursor-pointer transform transition-all duration-300
                  hover:scale-105 hover:shadow-2xl
                  bg-white/95 backdrop-blur-sm border-2 border-transparent hover:border-white
                `}
                onClick={() => handleSelectUserType(type.id)}
              >
                <div className="p-8 flex flex-col items-center text-center h-full">
                  <div className={`bg-gradient-to-br ${type.color} rounded-3xl p-8 mb-6 shadow-xl transform transition-transform hover:scale-110`}>
                    <Icon className="w-20 h-20 text-white" />
                  </div>
                  
                  <h3 className="text-3xl font-bold mb-4 text-fatecride-blue">
                    {type.name}
                  </h3>
                  
                  <p className="text-text-secondary flex-grow text-lg mb-8 leading-relaxed">
                    {type.description}
                  </p>

                  <Button
                    className={`mt-auto w-full bg-gradient-to-r ${type.color} ${type.hoverColor} text-white text-lg py-3 border-0 shadow-lg transition-all`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectUserType(type.id);
                    }}
                  >
                    Selecionar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-white/80 mb-4 text-lg">Já possui uma conta?</p>
          <button
            onClick={() => navigate('/login')}
            className="text-white hover:text-white/80 font-semibold text-xl underline decoration-2 underline-offset-4 transition-all"
          >
            Fazer login
          </button>
        </div>
      </div>
    </div>
  );
}

export default SelectUserTypePage;
