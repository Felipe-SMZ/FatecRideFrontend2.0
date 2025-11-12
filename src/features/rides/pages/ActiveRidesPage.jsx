import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiTruck } from 'react-icons/fi';
import { Navbar } from '@shared/components/layout/Navbar';
import { Card } from '@shared/components/ui/Card';
import { Button } from '@shared/components/ui/Button';
import { EmptyState } from '@shared/components/ui/EmptyState';
import { Spinner } from '@shared/components/ui/Spinner';
import { useAuthStore } from '@features/auth/stores/authStore';

/**
 * ActiveRidesPage - Página de gerenciamento de caronas ativas
 * 
 * Para MOTORISTAS:
 * - Lista caronas criadas
 * - Mostra solicitações pendentes
 * - Aceitar/recusar solicitações
 * - Cancelar carona
 * 
 * Para PASSAGEIROS:
 * - Lista caronas solicitadas
 * - Status da solicitação
 * - Cancelar solicitação
 */

export function ActiveRidesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Verificar tipo de usuário
  const isPassenger = user?.tipo === 'PASSAGEIRO';
  const isDriver = user?.tipo === 'MOTORISTA';
  const isBoth = user?.tipo === 'AMBOS';

  console.log('🔍 ActiveRidesPage - User:', user);
  console.log('🔍 ActiveRidesPage - Tipo:', user?.tipo);
  console.log('🔍 ActiveRidesPage - isDriver:', isDriver, 'isBoth:', isBoth, 'isPassenger:', isPassenger);

  // Buscar caronas ativas ao carregar
  // Se tipo não está definido, assumir que pode ser motorista (para evitar tela branca)
  useEffect(() => {
    if (isDriver || isBoth || !user?.tipo) {
      console.log('✅ Buscando caronas ativas...');
      fetchActiveRides();
    } else if (isPassenger) {
      console.log('ℹ️ Usuário é passageiro, não busca caronas');
      setLoading(false); // Não busca dados para passageiros
    }
  }, [user]);

  const fetchActiveRides = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('🔍 Token:', token ? 'Presente' : 'Ausente');
      
      // MOTORISTA: Buscar caronas criadas
      console.log('📡 Buscando caronas ativas...');
      const ridesResponse = await fetch('http://localhost:8080/rides/corridasAtivas', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Status corridasAtivas:', ridesResponse.status);

      if (ridesResponse.ok) {
        const ridesData = await ridesResponse.json();
        console.log('✅ Caronas ativas recebidas:', ridesData);
        
        // Buscar solicitações para minhas caronas
        try {
          console.log('📡 Buscando solicitações para minhas caronas...');
          const requestsResponse = await fetch('http://localhost:8080/rides/requestsForMyRide', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          console.log('📡 Status requestsForMyRide:', requestsResponse.status);

          if (requestsResponse.ok) {
            const requestsData = await requestsResponse.json();
            console.log('📋 Solicitações recebidas:', requestsData);
            
            // Agrupar solicitações por carona
            const ridesWithRequests = ridesData.map(ride => {
              const rideRequests = requestsData.filter(req => req.id_carona === ride.id);
              console.log(`🚗 Carona ${ride.id}: ${rideRequests.length} solicitações`, rideRequests);
              return { ...ride, requests: rideRequests };
            });
            
            console.log('✅ Caronas com solicitações:', ridesWithRequests);
            setRides(ridesWithRequests);
          } else if (requestsResponse.status === 500) {
            // Backend retorna 500 quando não há solicitações
            console.log('ℹ️ Nenhuma solicitação para as caronas (500 tratado)');
            setRides(ridesData.map(ride => ({ ...ride, requests: [] })));
          } else {
            const errorText = await requestsResponse.text();
            console.error('❌ Erro ao buscar solicitações:', requestsResponse.status, errorText);
            setRides(ridesData.map(ride => ({ ...ride, requests: [] })));
          }
        } catch (reqError) {
          console.error('❌ Exceção ao buscar solicitações:', reqError);
          setRides(ridesData.map(ride => ({ ...ride, requests: [] })));
        }
      } else {
        const errorText = await ridesResponse.text();
        console.error('❌ Erro ao buscar caronas:', ridesResponse.status, errorText);
      }
    } catch (error) {
      console.error('❌ Exceção ao buscar caronas ativas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (rideId, requestId) => {
    console.log('🔵 handleAcceptRequest chamado:', { rideId, requestId });
    
    try {
      setProcessingId(requestId);
      const token = localStorage.getItem('token');
      
      console.log('📤 Enviando requisição PUT /rides/${requestId}/acept');
      const response = await fetch(`http://localhost:8080/rides/${requestId}/acept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idCarona: rideId })
      });

      console.log('📥 Resposta recebida:', response.status);
      
      if (response.ok) {
        toast.success('Solicitação aceita com sucesso!');
        await fetchActiveRides(); // Recarregar lista
      } else {
        const error = await response.json();
        console.error('❌ Erro na resposta:', error);
        toast.error(error.message || 'Erro ao aceitar solicitação');
      }
    } catch (error) {
      console.error('❌ Exceção ao aceitar solicitação:', error);
      toast.error('Erro ao aceitar solicitação');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (rideId, requestId) => {
    if (!confirm('Tem certeza que deseja recusar esta solicitação?')) return;
    
    try {
      setProcessingId(requestId);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8080/solicitacao/cancelar/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Solicitação recusada');
        await fetchActiveRides(); // Recarregar lista
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao recusar solicitação');
      }
    } catch (error) {
      console.error('Erro ao recusar solicitação:', error);
      toast.error('Erro ao recusar solicitação');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCompleteRide = async (rideId) => {
    if (!confirm('Tem certeza que deseja concluir esta carona? Esta ação não pode ser desfeita.')) return;

    try {
      setProcessingId(`complete-${rideId}`);
      const token = localStorage.getItem('token');
      
      console.log('📤 Concluindo carona:', rideId);
      const response = await fetch(`http://localhost:8080/rides/concluir/${rideId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 Resposta concluir carona:', response.status);

      if (response.ok) {
        toast.success('Carona concluída com sucesso! 🎉');
        await fetchActiveRides(); // Recarregar lista
      } else {
        const error = await response.json();
        console.error('❌ Erro ao concluir carona:', error);
        toast.error(error.message || 'Erro ao concluir carona');
      }
    } catch (error) {
      console.error('❌ Exceção ao concluir carona:', error);
      toast.error('Erro ao concluir carona');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelRide = async (rideId) => {
    if (!confirm('Tem certeza que deseja cancelar esta carona? Todos os passageiros serão notificados.')) return;

    try {
      setProcessingId(`cancel-${rideId}`);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8080/rides/cancelar/${rideId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Carona cancelada com sucesso!');
        await fetchActiveRides(); // Recarregar lista
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao cancelar carona');
      }
    } catch (error) {
      console.error('Erro ao cancelar carona:', error);
      toast.error('Erro ao cancelar carona');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Navbar showAuthButton={true} />
      
      <div className="min-h-[calc(100vh-80px)] bg-gray-100 py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-fatecride-blue mb-2">
                Caronas Ativas
              </h1>
              <p className="text-gray-600">
                Gerencie suas caronas em andamento
              </p>
            </div>
            <Button
              onClick={() => navigate('/inicio')}
              className="bg-gray-500 hover:bg-gray-600"
            >
              Voltar
            </Button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          )}

          {/* Mensagem para passageiros */}
          {!loading && isPassenger && (
            <Card className="p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiTruck className="w-10 h-10 text-fatecride-blue" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Esta página é para Motoristas
                </h2>
                <p className="text-gray-600 mb-6">
                  Apenas motoristas podem gerenciar caronas ativas. 
                  Como passageiro, você pode acompanhar suas solicitações.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => navigate('/minhas-solicitacoes')}
                    className="bg-fatecride-blue hover:bg-fatecride-blue-dark"
                  >
                    Ver Minhas Solicitações
                  </Button>
                  <Button
                    onClick={() => navigate('/passageiro')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Buscar Carona
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Empty State - Nenhuma carona (motoristas, ambos ou tipo indefinido) */}
          {!loading && !isPassenger && rides.length === 0 && (
            <EmptyState
              icon={FiTruck}
              title="Nenhuma carona ativa"
              description="Você não possui caronas ativas no momento"
              action={{
                label: "Criar Carona",
                onClick: () => navigate('/motorista')
              }}
            />
          )}

          {/* Lista de caronas (motoristas, ambos ou tipo indefinido) */}
          {!loading && !isPassenger && rides.length > 0 && (
            <div className="space-y-6">
              {rides.map((ride) => (
                <Card key={ride.id} className="p-6 hover:shadow-lg transition-shadow">
                  {/* Informações da carona */}
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    {/* Origem e Destino */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        {/* Ícone de rota */}
                        <div className="flex flex-col items-center mt-1">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <div className="w-0.5 h-12 bg-gray-300"></div>
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        </div>

                        {/* Endereços */}
                        <div className="flex-1">
                          <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-1">Origem</p>
                            <p className="font-semibold text-gray-900">
                              {ride.origin?.logradouro || 'Origem não especificada'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {ride.origin?.bairro && `${ride.origin.bairro}, `}
                              {ride.origin?.cidade}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500 mb-1">Destino</p>
                            <p className="font-semibold text-gray-900">
                              {ride.destination?.logradouro || 'Destino não especificado'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {ride.destination?.bairro && `${ride.destination.bairro}, `}
                              {ride.destination?.cidade}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Informações adicionais */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-semibold">Data:</span>{' '}
                          {ride.data_hora ? formatDate(ride.data_hora) : 'Não definida'}
                        </div>
                        <div>
                          <span className="font-semibold">Vagas:</span>{' '}
                          {ride.vagas_disponiveis || 0}
                        </div>
                        {ride.vehicle && (
                          <div>
                            <span className="font-semibold">Veículo:</span>{' '}
                            {ride.vehicle.marca} {ride.vehicle.modelo}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleCompleteRide(ride.id)}
                        disabled={processingId === `complete-${ride.id}`}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        {processingId === `complete-${ride.id}` ? 'Concluindo...' : '✓ Concluir Carona'}
                      </Button>
                      <Button
                        onClick={() => handleCancelRide(ride.id)}
                        disabled={processingId === `cancel-${ride.id}`}
                        variant="danger"
                        size="sm"
                      >
                        {processingId === `cancel-${ride.id}` ? 'Cancelando...' : 'Cancelar Carona'}
                      </Button>
                    </div>
                  </div>

                  {/* Solicitações */}
                  {ride.requests && ride.requests.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="font-semibold text-gray-900 mb-4">
                        Passageiros ({ride.requests.length})
                      </h3>
                      
                      <div className="space-y-3">
                        {ride.requests.map((request) => {
                          const statusLower = request.status?.toLowerCase();
                          const isPending = !request.status || statusLower === 'pendente';
                          const isAccepted = statusLower === 'aceito' || statusLower === 'aceita';
                          const isRejected = statusLower === 'recusado' || statusLower === 'cancelado';
                          
                          return (
                            <div 
                              key={request.id_solicitacao}
                              className={`flex items-center justify-between p-4 rounded-lg ${
                                isAccepted ? 'bg-green-50 border border-green-200' :
                                isRejected ? 'bg-red-50 border border-red-200' :
                                'bg-gray-50'
                              }`}
                            >
                              {/* Info do passageiro - RequestsForMyRideDTO */}
                              <div className="flex items-center gap-4 flex-1">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                                  isAccepted ? 'bg-green-600 text-white' :
                                  isRejected ? 'bg-red-600 text-white' :
                                  'bg-fatecride-blue text-white'
                                }`}>
                                  {request.nome_passageiro?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900">
                                    {request.nome_passageiro || 'Usuário'}
                                  </p>
                                  {request.curso && (
                                    <p className="text-sm text-gray-600">
                                      {request.curso}
                                    </p>
                                  )}
                                  
                                  {/* Mostrar origem/destino do passageiro */}
                                  {request.originDTO && request.destinationDTO && (
                                    <div className="mt-2 text-xs text-gray-600">
                                      <p>📍 De: {request.originDTO.logradouro}, {request.originDTO.cidade}</p>
                                      <p>🎯 Para: {request.destinationDTO.logradouro}, {request.destinationDTO.cidade}</p>
                                    </div>
                                  )}
                                  
                                  <div className="mt-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      isAccepted ? 'bg-green-100 text-green-800' :
                                      isRejected ? 'bg-red-100 text-red-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {isAccepted ? '✓ Aceita' : isRejected ? '✗ Recusada' : '⏳ Pendente'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Botões de ação - só para pendentes */}
                              {isPending && (
                                <div className="flex gap-2 ml-4">
                                  <Button
                                    onClick={() => handleAcceptRequest(ride.id, request.id_solicitacao)}
                                    disabled={processingId === request.id_solicitacao}
                                    className="bg-green-600 hover:bg-green-700"
                                    size="sm"
                                  >
                                    {processingId === request.id_solicitacao ? 'Processando...' : 'Aceitar'}
                                  </Button>
                                  <Button
                                    onClick={() => handleRejectRequest(ride.id, request.id_solicitacao)}
                                    disabled={processingId === request.id_solicitacao}
                                    variant="danger"
                                    size="sm"
                                  >
                                    Recusar
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
