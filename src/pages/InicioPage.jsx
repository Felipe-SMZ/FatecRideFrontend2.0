import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@shared/components/layout/Navbar';
import { Card } from '@shared/components/ui/Card';
import { FiTruck, FiUser } from 'react-icons/fi';
import { useAuthStore } from '@features/auth/stores/authStore';
//import { AdViewer } from '@/features/anuncios/components/AdViewer';
import { AnuncioDebug } from '@/features/anuncios/components/AnuncioDebug';

export function InicioPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  return (
    <>
      <Navbar showAuthButton={true} />

      <div className="min-h-[calc(100vh-80px)] bg-gray-100 flex items-center justify-center py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-4xl md:text-5xl font-bold text-fatecride-blue mb-12 text-center">
            O que você deseja?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Botão Motorista */}
            <Card
              className="hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 bg-gradient-to-br from-fatecride-blue to-fatecride-blue-dark text-white border-none"
              onClick={() => navigate('/motorista')}
            >
              <div className="flex flex-col items-center justify-center p-10 h-72">
                <div className="bg-white/95 backdrop-blur rounded-3xl p-6 mb-6 shadow-lg">
                  <FiTruck className="w-20 h-20 text-fatecride-blue" />
                </div>
                <span className="text-4xl font-bold">Motorista</span>
                <p className="mt-4 text-white/90 text-center text-lg leading-relaxed">
                  Ofereça caronas e ajude outros estudantes
                </p>
              </div>
            </Card>

            {/* Botão Passageiro */}
            <Card
              className="hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 bg-gradient-to-br from-fatecride-blue-dark to-fatecride-blue-darker text-white border-none"
              onClick={() => navigate('/passageiro')}
            >
              <div className="flex flex-col items-center justify-center p-10 h-72">
                <div className="bg-white/95 backdrop-blur rounded-3xl p-6 mb-6 shadow-lg">
                  <FiUser className="w-20 h-20 text-fatecride-blue-dark" />
                </div>
                <span className="text-4xl font-bold">Passageiro</span>
                <p className="mt-4 text-white/90 text-center text-lg leading-relaxed">
                  Busque caronas disponíveis para sua rota
                </p>
              </div>
            </Card>
          </div>
          <div className="my-6">
            <AnuncioDebug />
          </div>
        </div>
      </div>

    </>
  );
}

export default InicioPage;
