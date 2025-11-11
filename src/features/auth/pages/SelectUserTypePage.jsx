import { useNavigate } from 'react-router-dom';
import { Card } from '@shared/components/ui/Card';
import { Button } from '@shared/components/ui/Button';
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
    color: 'from-blue-500 to-blue-600',
    hoverColor: 'hover:from-blue-600 hover:to-blue-700'
  },
  {
    id: 2,
    name: 'Motorista',
    description: 'Ofereço caronas aos colegas',
    icon: FiTruck,
    color: 'from-green-500 to-green-600',
    hoverColor: 'hover:from-green-600 hover:to-green-700'
  },
  {
    id: 3,
    name: 'Ambos',
    description: 'Ofereço e busco caronas',
    icon: FiUsers,
    color: 'from-purple-500 to-purple-600',
    hoverColor: 'hover:from-purple-600 hover:to-purple-700'
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Bem-vindo ao FatecRide! 🚗
          </h1>
          <p className="text-xl text-gray-600">
            Escolha como você deseja usar a plataforma
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {USER_TYPES.map((type) => {
            const Icon = type.icon;
            
            return (
              <Card
                key={type.id}
                className={`
                  cursor-pointer transform transition-all duration-300
                  hover:scale-105 hover:shadow-2xl
                  bg-gradient-to-br ${type.color} ${type.hoverColor}
                  text-white border-0
                `}
                onClick={() => handleSelectUserType(type.id)}
              >
                <div className="p-8 flex flex-col items-center text-center h-full">
                  <div className="bg-white rounded-full p-6 mb-6 shadow-lg">
                    <Icon className="w-16 h-16" style={{ color: 'currentColor' }} />
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-3">
                    {type.name}
                  </h3>
                  
                  <p className="text-blue-50 flex-grow">
                    {type.description}
                  </p>

                  <Button
                    className="mt-6 bg-white text-gray-900 hover:bg-gray-100 w-full"
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

        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 hover:text-blue-800 underline font-medium"
          >
            Já tenho uma conta
          </button>
        </div>
      </div>
    </div>
  );
}

export default SelectUserTypePage;
