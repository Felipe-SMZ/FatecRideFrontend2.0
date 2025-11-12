import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@shared/components/layout/Navbar';
import { Card } from '@shared/components/ui/Card';
import { Button } from '@shared/components/ui/Button';
import { EmptyState } from '@shared/components/ui/EmptyState';
import { Spinner } from '@shared/components/ui/Spinner';
import { ridesService } from '@features/rides/services/ridesService';
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
    console.log('🔄 RideHistoryPage montado');
    
    // Forçar reload do authStore para garantir tipo correto
    const reloadAndFetch = async () => {
      await loadAuthUserData();
      
      // Aguardar um pouco para garantir que o estado foi atualizado
      setTimeout(() => {
        const updatedUser = useAuthStore.getState().user;
        setUser(updatedUser);
        
        console.log('👤 User após reload:', updatedUser);
        console.log('🎯 Tipo após reload:', updatedUser?.tipo);
        
        // Definir aba inicial baseada no tipo do usuário
        if (updatedUser?.tipo === 'PASSAGEIRO') {
          setActiveTab('passageiro');
          console.log('📌 Aba inicial: passageiro');
        } else {
          setActiveTab('motorista');
          console.log('📌 Aba inicial: motorista');
        }
        
        fetchHistory();
      }, 100);
    };
    
    reloadAndFetch();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      
      // Pegar user atualizado do store
      const currentUser = useAuthStore.getState().user;
      
      console.log('🔍 User no fetchHistory:', currentUser);
      console.log('🔍 Tipo do usuário:', currentUser?.tipo);
      
      // Se for MOTORISTA ou AMBOS, buscar histórico de corridas
      if (currentUser?.tipo === 'MOTORISTA' || currentUser?.tipo === 'AMBOS') {
        console.log('🚗 Buscando histórico de corridas...');
        try {
          const driverData = await ridesService.getHistory(0, 50);
          console.log('📜 Histórico de corridas (motorista):', driverData);
          
          if (driverData.content) {
            setDriverRides(driverData.content);
          } else if (Array.isArray(driverData)) {
            setDriverRides(driverData);
          } else {
            setDriverRides([]);
          }
        } catch (error) {
          console.error('❌ Erro ao buscar histórico de motorista:', error);
          setDriverRides([]);
        }
      } else {
        console.log('⚠️ Usuário não é MOTORISTA ou AMBOS, não busca corridas');
      }
      
      // Se for PASSAGEIRO ou AMBOS, buscar histórico de solicitações concluídas
      if (currentUser?.tipo === 'PASSAGEIRO' || currentUser?.tipo === 'AMBOS') {
        console.log('🙋 Buscando histórico de solicitações...');
        try {
          // Buscar solicitações concluídas do passageiro
          const response = await fetch('http://localhost:8080/solicitacao/concluidas?pagina=0&itens=50', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('📡 Response status:', response.status);
          console.log('📡 Response ok:', response.ok);
          
          if (response.ok) {
            // Verificar se há conteúdo antes de tentar parsear JSON
            const text = await response.text();
            console.log('📄 Response text:', text);
            
            const passengerData = text ? JSON.parse(text) : null;
            
            console.log('📜 Histórico de solicitações (passageiro):', passengerData);
            
            if (passengerData && passengerData.content) {
              setPassengerRides(passengerData.content);
            } else if (Array.isArray(passengerData)) {
              setPassengerRides(passengerData);
            } else {
              console.log('⚠️ Dados de passageiro vazios ou inválidos');
              setPassengerRides([]);
            }
          } else if (response.status === 204) {
            // 204 No Content - sem histórico
            console.log('📜 Nenhuma solicitação concluída encontrada (204)');
            setPassengerRides([]);
          } else {
            console.warn('⚠️ Erro ao buscar histórico:', response.status);
            setPassengerRides([]);
          }
        } catch (error) {
          console.error('❌ Erro ao buscar histórico de passageiro:', error);
          setPassengerRides([]);
        }
      } else {
        console.log('⚠️ Usuário não é PASSAGEIRO ou AMBOS, não busca solicitações');
      }
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
    <>
      <Navbar showAuthButton={true} />
      
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
            <>
              {console.log('✅ Renderizando abas para AMBOS')}
              {console.log('📊 driverRides:', driverRides.length)}
              {console.log('📊 passengerRides:', passengerRides.length)}
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
            </>
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
    </>
  );
}
