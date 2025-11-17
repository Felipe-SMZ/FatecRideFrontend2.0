import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@shared/components/ui/Card';
import { FiUser, FiX } from 'react-icons/fi';
import { FaCar } from 'react-icons/fa';
import { useAuthStore } from '@features/auth/stores/authStore';
import AnuncioViewer from '@/features/anuncios/components/AnuncioViewer';

export function InicioPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [showAd, setShowAd] = useState(true);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleNavigateTo = (target) => {
    const tipo = user?.tipo || null; // 'MOTORISTA' | 'PASSAGEIRO' | 'AMBOS'
    const needed = target.toUpperCase();
    if (tipo === 'AMBOS' || tipo === needed) {
      navigate(`/${target}`);
    } else {
      setNotice({ target: needed, tipo: tipo });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setNotice(null), 6000);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-100 flex items-center justify-center py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-4xl md:text-5xl font-bold text-fatecride-blue mb-12 text-center">
            O que você deseja?
          </h2>

          {notice && (
            <div className="mb-6">
              <div className="max-w-3xl mx-auto bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded shadow-sm flex items-start justify-between gap-4">
                <div>
                  {notice.target === 'MOTORISTA' ? (
                    <p className="text-yellow-800">Somente motoristas (ou contas do tipo <strong>Ambos</strong>) podem acessar a área de motorista.</p>
                  ) : (
                    <p className="text-yellow-800">Somente passageiros (ou contas do tipo <strong>Ambos</strong>) podem acessar a área de passageiro.</p>
                  )}
                  <p className="text-sm text-yellow-700 mt-1">Quer mudar seu perfil? Vá em <button onClick={() => navigate('/perfil')} className="underline font-medium">Meu perfil</button>.</p>
                </div>
                <button onClick={() => setNotice(null)} className="text-yellow-700 hover:text-yellow-900">Fechar</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-2 flex justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Botão Motorista */}
              <Card
                role="button"
                aria-label="Ir para Motorista"
                className="hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 bg-gradient-to-br from-fatecride-blue to-fatecride-blue-dark text-white border-none w-full max-w-[380px] mx-auto h-80"
                onClick={() => handleNavigateTo('motorista')}
              >
                <div className="flex flex-col items-center justify-center p-8 h-full">
                  <div className="bg-white/95 backdrop-blur rounded-3xl p-6 mb-6 shadow-lg">
                    <FaCar className="w-20 h-20 text-fatecride-blue" />
                  </div>
                  <span className="text-4xl font-bold">Motorista</span>
                  <p className="mt-4 text-white/90 text-center text-lg leading-relaxed">
                    Ofereça caronas e ajude outros estudantes
                  </p>
                </div>
              </Card>

              {/* Botão Passageiro */}
              <Card
                role="button"
                aria-label="Ir para Passageiro"
                className="hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 bg-gradient-to-br from-fatecride-blue-dark to-fatecride-blue-darker text-white border-none w-full max-w-[380px] mx-auto h-80"
                onClick={() => handleNavigateTo('passageiro')}
              >
                <div className="flex flex-col items-center justify-center p-8 h-full">
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
            </div>

            {/* Anúncio como sidebar responsiva */}
            <aside className="md:col-span-1 flex justify-center">
              <div className="md:sticky md:top-24 w-full max-w-xs">
                <div className="relative bg-white rounded-xl shadow-xl p-4">
                  <button
                    aria-label={showAd ? 'Fechar anúncio' : 'Abrir anúncio'}
                    onClick={() => setShowAd(prev => !prev)}
                    className="absolute -right-2 -top-2 bg-white rounded-full p-1 shadow hover:shadow-md text-gray-500"
                  >
                    <FiX />
                  </button>
                  <h3 className="text-lg font-semibold mb-2">Anúncio</h3>
                  <div className={`transition-all duration-300 ease-in-out ${showAd ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    <div className="space-y-3">
                      <AnuncioViewer />
                    </div>
                  </div>
                  {!showAd && (
                    <div className="mt-2 text-sm text-gray-500">
                      Anúncio oculto. <button onClick={() => setShowAd(true)} className="underline">Mostrar</button>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
  );
}

export default InicioPage;
