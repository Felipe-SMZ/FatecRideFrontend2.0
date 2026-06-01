import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
 
import { Card } from '@shared/components/ui/Card';
import { Button } from '@shared/components/ui/Button';
import { EmptyState } from '@shared/components/ui/EmptyState';
import { Spinner } from '@shared/components/ui/Spinner';
import { ridesService } from '@features/rides/services/ridesService';
import { ratingService } from '@features/rides/services/ratingService';
import { useAuthStore } from '@features/auth/stores/authStore';
import { toast } from 'react-hot-toast';
import { FiClock, FiX } from 'react-icons/fi';
import { FaStar, FaRegStar } from 'react-icons/fa';

/**
 * RideHistoryPage - Histórico de caronas
 * Mostra todas as caronas passadas (concluídas ou canceladas)
 * Motoristas veem suas corridas, passageiros veem suas solicitações
 */

export function RideHistoryPage() {
  const navigate = useNavigate();
  const { user, token, loadUserData } = useAuthStore();
  const [driverRides, setDriverRides] = useState([]);
  const [passengerRides, setPassengerRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('motorista'); // 'motorista' ou 'passageiro'
  
  // Estados para o Modal de Avaliação
  const [rideToRate, setRideToRate] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const init = async () => {
      if (!user || !user.tipo) {
        await loadUserData();
      }
      if (token) fetchHistory();
    };

    init();
  }, [token]);

  // Sincronizar aba ativa com o tipo de usuário
  useEffect(() => {
    if (user?.tipo) {
      if (user.tipo === 'PASSAGEIRO') setActiveTab('passageiro');
      else if (user.tipo === 'MOTORISTA') setActiveTab('motorista');
      else if (user.tipo === 'AMBOS' && (activeTab !== 'motorista' && activeTab !== 'passageiro')) {
        setActiveTab('motorista');
      }
    }
  }, [user?.tipo, activeTab]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const currentUser = useAuthStore.getState().user;
      const token = useAuthStore.getState().token;

      if (!currentUser || !token) {
        if (!token) console.warn('⚠️ Abortando fetchHistory: Token ausente');
        setLoading(false);
        return;
      }
      
      const isDriver = currentUser.tipo === 'MOTORISTA' || currentUser.tipo === 'AMBOS';
      const isPassenger = currentUser.tipo === 'PASSAGEIRO' || currentUser.tipo === 'AMBOS';

      // Executa buscas em paralelo com tratamento de erro isolado para não travar a página
      const driverPromise = isDriver ? ridesService.getHistory(0, 50).catch(() => []) : Promise.resolve([]);
      const passengerPromise = isPassenger ? ridesService.getPassengerHistory(0, 50).catch(() => []) : Promise.resolve([]);

      const [driverRes, passengerRes] = await Promise.all([driverPromise, passengerPromise]);

      const extractArray = (res) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (res.content && Array.isArray(res.content)) return res.content;
        if (typeof res === 'object') return [res];
        return [];
      };

      setDriverRides(extractArray(driverRes));
      setPassengerRides(extractArray(passengerRes));

    } catch (error) {
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

  const handleRateDriver = async (request) => {
    setRideToRate(request);
    setRating(0);
    setComment('');
  };

  const submitRating = async () => {
    if (rating === 0) {
      toast.error('Por favor, selecione uma nota de 1 a 5 estrelas.');
      return;
    }

    try {
      await ratingService.rateDriver(rideToRate.id, { 
        avaliacao: rating, 
        texto: comment 
      });
      toast.success('Avaliação enviada com sucesso! ⭐');
      setRideToRate(null);
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
              {/* Renderização Exclusiva: Motorista */}
              {(user?.tipo === 'MOTORISTA' || (user?.tipo === 'AMBOS' && activeTab === 'motorista')) ? (
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
              ) : (user?.tipo === 'PASSAGEIRO' || (user?.tipo === 'AMBOS' && activeTab === 'passageiro')) && (
                /* Renderização Exclusiva: Passageiro */
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
                                  {/* id_carona em ambos os DTOs */}
                                  Solicitação #{request.id_carona || request.idCarona || 'N/A'}
                                </h3>
                                {getStatusBadge(request.status?.toUpperCase() || 'CONCLUIDA')}
                              </div>
                              
                              <div className="space-y-1 mb-2">
                                {/* Ambos usam originDTO e destinationDTO */}
                                <p className="text-sm text-gray-700">📍 <strong>De:</strong> {request.originDTO?.cidade || 'N/A'}</p>
                                <p className="text-sm text-gray-700">🎯 <strong>Para:</strong> {request.destinationDTO?.cidade || 'N/A'}</p>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-1">
                                {/* Completed usa dataHora */}
                                {formatDate(request.dataHora)}
                              </p>

                              {/* Mapeamento de nomes: nome_motorista (Completed) vs nomeMotorista (Pending) */}
                              {(request.nome_motorista || request.nomeMotorista) && (
                                <p className="text-sm text-gray-500">
                                  Motorista: {request.nome_motorista || request.nomeMotorista}
                                  {(request.curso_motorista || request.cursoMotorista) && ` - ${request.curso_motorista || request.cursoMotorista}`}
                                </p>
                              )}

                              {/* Veículo (Apenas no Completed DTO) */}
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
                                    onClick={() => handleRateDriver(request)}
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

          {/* Modal de Avaliação com Estrelas */}
          {rideToRate && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-fatecride-blue">Avaliar Motorista</h3>
                    <button 
                      onClick={() => setRideToRate(null)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <FiX size={24} />
                    </button>
                  </div>

                  <div className="text-center mb-6">
                    <p className="text-gray-600 mb-4">
                      Como foi sua experiência com <span className="font-bold">{rideToRate.nome_motorista || rideToRate.nomeMotorista || 'o motorista'}</span>?
                    </p>
                    
                    {/* Seleção de Estrelas Interativa */}
                    <div className="flex justify-center gap-2 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="text-3xl transition-transform hover:scale-110 active:scale-95"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                        >
                          {(hoverRating || rating) >= star ? (
                            <FaStar className="text-yellow-400" />
                          ) : (
                            <FaRegStar className="text-gray-300" />
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="text-sm font-medium text-fatecride-blue h-5">
                      {rating > 0 ? `${rating} estrela${rating > 1 ? 's' : ''}` : ''}
                    </p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Seu comentário (opcional)</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-fatecride-blue focus:border-transparent outline-none transition-all"
                      rows="4"
                      placeholder="Conte-nos como foi a viagem..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </div>

                  <Button onClick={submitRating} fullWidth className="bg-yellow-500 hover:bg-yellow-600">
                    Enviar Avaliação
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
  );
}
