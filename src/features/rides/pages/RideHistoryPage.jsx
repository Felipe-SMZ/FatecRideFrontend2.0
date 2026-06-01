import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
 
import { Card } from '@shared/components/ui/Card';
import { Button } from '@shared/components/ui/Button';
import { EmptyState } from '@shared/components/ui/EmptyState';
import { Spinner } from '@shared/components/ui/Spinner';
import { ridesService } from '@features/rides/services/ridesService';
import { ratingService } from '@features/rides/services/ratingService';
import { useAuthStore } from '@features/auth/stores/authStore';
import { toast } from 'react-hot-toast';
import { FiClock } from 'react-icons/fi';

/**
 * RideHistoryPage - Histórico de caronas
 * Mostra todas as caronas passadas (concluídas ou canceladas)
 * Motoristas veem suas corridas, passageiros veem suas solicitações
 */

export function RideHistoryPage() {
  const navigate = useNavigate();
  const { loadUserData: loadAuthUserData } = useAuthStore();
  const [user, setUser] = useState(null);
  const [driverRides, setDriverRides] = useState([]);
  const [passengerRides, setPassengerRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('motorista'); // 'motorista' ou 'passageiro'

  useEffect(() => {
    const reloadAndFetch = async () => {
      try {
        await loadAuthUserData();
        const updatedUser = useAuthStore.getState().user;
        setUser(updatedUser);
        
        if (updatedUser?.tipo === 'PASSAGEIRO') {
          setActiveTab('passageiro');
        } else {
          setActiveTab('motorista');
        }
        
        fetchHistory();
      } catch (err) {
        setLoading(false);
      }
    };
    
    reloadAndFetch();
  }, [loadAuthUserData]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const currentUser = useAuthStore.getState().user;
      
      const isDriver = currentUser?.tipo === 'MOTORISTA' || currentUser?.tipo === 'AMBOS';
      const isPassenger = currentUser?.tipo === 'PASSAGEIRO' || currentUser?.tipo === 'AMBOS';

      const [driverData, passengerData] = await Promise.all([
        isDriver ? ridesService.getHistory(0, 50).catch(() => ({ content: [] })) : Promise.resolve({ content: [] }),
        isPassenger ? ridesService.getPassengerHistory(0, 50).catch(() => ({ content: [] })) : Promise.resolve({ content: [] })
      ]);

      setDriverRides(driverData?.content || (Array.isArray(driverData) ? driverData : []));
      setPassengerRides(passengerData?.content || (Array.isArray(passengerData) ? passengerData : []));

    } catch (error) {
      console.error('❌ Erro geral ao buscar histórico:', error);
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não disponível';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data inválida';
    }
  };

  const handleRateDriver = async (solicitacaoId) => {
    const nota = window.prompt('Avalie o motorista de 1 a 5:');
    if (!nota || isNaN(nota) || nota < 1 || nota > 5) {
      if (nota !== null) toast.error('Por favor, insira uma nota válida de 1 a 5.');
      return;
    }

    const comentario = window.prompt('Deixe um comentário (opcional):');
    try {
      await ratingService.rateDriver(solicitacaoId, { avaliacao: Number(nota), comentario });
      toast.success('Avaliação enviada com sucesso! ⭐');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao enviar avaliação');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'CONCLUIDA': { text: 'Concluída', color: 'bg-green-100 text-green-800' },
      'CANCELADA': { text: 'Cancelada', color: 'bg-red-100 text-red-800' },
      'ATIVA': { text: 'Ativa', color: 'bg-blue-100 text-blue-800' },
      'PENDENTE': { text: 'Pendente', color: 'bg-yellow-100 text-yellow-800' }
    };
    
    const badge = badges[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-100 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-fatecride-blue mb-2">
                Histórico de Caronas
              </h1>
              <p className="text-gray-600">
                Suas caronas anteriores
              </p>
            </div>
            <Button
              onClick={() => navigate('/')}
              className="bg-gray-500 hover:bg-gray-600"
            >
              Voltar
            </Button>
          </div>

          {/* Abas para AMBOS */}
          {user?.tipo === 'AMBOS' && (
            <div className="flex gap-2 mb-6 bg-white p-2 rounded-lg shadow">
                <Button
                  onClick={() => setActiveTab('passageiro')}
                  className={`flex-1 ${activeTab === 'passageiro' 
                    ? 'bg-fatecride-blue hover:bg-fatecride-blue-dark text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  <span className="text-2xl mr-2">🙋</span>
                  Caronas Solicitadas ({passengerRides.length})
                </Button>
                <Button
                  onClick={() => setActiveTab('motorista')}
                  className={`flex-1 ${activeTab === 'motorista' 
                    ? 'bg-fatecride-blue hover:bg-fatecride-blue-dark text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  <span className="text-2xl mr-2">🚗</span>
                  Corridas Oferecidas ({driverRides.length})
                </Button>
              </div>
          )}

          {loading && (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          )}

          {!loading && (
            <>
              {/* Lista para MOTORISTA ou aba de motorista */}
              {(user?.tipo === 'MOTORISTA' || (user?.tipo === 'AMBOS' && activeTab === 'motorista')) && (
                <>
                  {driverRides.length === 0 ? (
                    <EmptyState
                      icon={FiClock}
                      title="Nenhum histórico"
                      description="Você ainda não possui histórico de corridas como motorista"
                    />
                  ) : (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <span className="text-2xl">🚗</span>
                        Minhas Corridas Oferecidas ({driverRides.length})
                      </h2>
                      {driverRides.map((ride) => (
                        <Card key={ride.id} className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg">
                                  {ride.origin?.cidade || 'Origem'} → {ride.destination?.cidade || 'Destino'}
                                </h3>
                                {getStatusBadge(ride.status)}
                              </div>
                              
                              {/* Endereços completos */}
                              <div className="mb-2">
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">De:</span> {ride.origin?.logradouro}, {ride.origin?.numero} - {ride.origin?.bairro}, {ride.origin?.cidade}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Para:</span> {ride.destination?.logradouro}, {ride.destination?.numero} - {ride.destination?.bairro}, {ride.destination?.cidade}
                                </p>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-1">
                                {formatDate(ride.data_hora)}
                              </p>
                              {ride.vehicle && (
                                <p className="text-sm text-gray-500">
                                  {ride.vehicle.marca} {ride.vehicle.modelo} - {ride.vehicle.placa}
                                </p>
                              )}
                              <p className="text-sm text-gray-500 mt-1">
                                Vagas disponíveis: {ride.vagas_disponiveis || 0}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Lista para PASSAGEIRO ou aba de passageiro */}
              {(user?.tipo === 'PASSAGEIRO' || (user?.tipo === 'AMBOS' && activeTab === 'passageiro')) && (
                <>
                  {passengerRides.length === 0 ? (
                    <EmptyState
                      icon={FiClock}
                      title="Nenhum histórico"
                      description="Você ainda não possui histórico de solicitações como passageiro"
                    />
                  ) : (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <span className="text-2xl">🙋</span>
                        Minhas Caronas Solicitadas ({passengerRides.length})
                      </h2>
                      {passengerRides.map((request) => (
                        <Card key={request.id} className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg">
                                  {request.originDTO?.cidade || 'Origem'} → {request.destinationDTO?.cidade || 'Destino'}
                                </h3>
                                {getStatusBadge(request.status?.toUpperCase() || 'CONCLUIDA')}
                              </div>
                              
                              {/* Endereços completos */}
                              <div className="mb-2">
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">De:</span> {request.originDTO?.logradouro}, {request.originDTO?.numero} - {request.originDTO?.bairro}, {request.originDTO?.cidade}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Para:</span> {request.destinationDTO?.logradouro}, {request.destinationDTO?.numero} - {request.destinationDTO?.bairro}, {request.destinationDTO?.cidade}
                                </p>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-1">
                                {formatDate(request.dataHora)}
                              </p>
                              {request.nome_motorista && (
                                <p className="text-sm text-gray-500">
                                  Motorista: {request.nome_motorista}
                                  {request.curso_motorista && ` - ${request.curso_motorista}`}
                                </p>
                              )}
                              {request.veiculo_marca && request.veiculo_modelo && (
                                <p className="text-sm text-gray-500">
                                  {request.veiculo_marca} {request.veiculo_modelo} - {request.veiculo_placa}
                                  {request.veiculo_cor && ` (${request.veiculo_cor})`}
                                </p>
                              )}

                              {/* Apenas solicitações concluídas podem ser avaliadas */}
                              {request.status?.toUpperCase() === 'CONCLUIDA' && (
                                <div className="mt-4 flex justify-end border-t pt-4">
                                  <Button 
                                    onClick={() => handleRateDriver(request.id)}
                                    className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-1 px-4 h-auto"
                                  >
                                    ⭐ Avaliar Motorista
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
  );
}
