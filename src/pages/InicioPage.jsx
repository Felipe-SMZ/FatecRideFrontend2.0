import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@shared/components/layout/PageContainer';
import { Card } from '@shared/components/ui/Card';
import { FiTruck, FiUser } from 'react-icons/fi';

export function InicioPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-8">
          <h2 className="text-4xl font-bold text-blue-900 mb-12 text-center">
            O que você deseja?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
            {/* Botão Motorista */}
            <Card 
              className="hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 bg-gradient-to-br from-blue-600 to-blue-700 text-white"
              onClick={() => navigate('/motorista')}
            >
              <div className="flex flex-col items-center justify-center p-8 h-64">
                <div className="bg-white rounded-full p-6 mb-6 shadow-lg">
                  <FiTruck className="w-20 h-20 text-blue-600" />
                </div>
                <span className="text-3xl font-bold">Motorista</span>
                <p className="mt-3 text-blue-100 text-center">
                  Ofereça caronas e ajude outros estudantes
                </p>
              </div>
            </Card>

            {/* Botão Passageiro */}
            <Card 
              className="hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 bg-gradient-to-br from-green-600 to-green-700 text-white"
              onClick={() => navigate('/passageiro')}
            >
              <div className="flex flex-col items-center justify-center p-8 h-64">
                <div className="bg-white rounded-full p-6 mb-6 shadow-lg">
                  <FiUser className="w-20 h-20 text-green-600" />
                </div>
                <span className="text-3xl font-bold">Passageiro</span>
                <p className="mt-3 text-green-100 text-center">
                  Busque caronas disponíveis para sua rota
                </p>
              </div>
            </Card>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

export default InicioPage;
