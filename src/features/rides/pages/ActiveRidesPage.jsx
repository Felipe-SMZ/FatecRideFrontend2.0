import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiMessageCircle } from 'react-icons/fi';
import { FaCar } from 'react-icons/fa';
import { Card } from '@shared/components/ui/Card';
import { Button } from '@shared/components/ui/Button';
import { EmptyState } from '@shared/components/ui/EmptyState';
import { Spinner } from '@shared/components/ui/Spinner';
import { useAuthStore } from '@features/auth/stores/authStore';
import { SimpleChatModal } from '@features/chat/components/SimpleChatModal';
import { sendRideAcceptedMessage } from '@features/chat/services/autoMessageService';
import notificationsService from '@shared/services/notificationsService';
import { ridesService } from '@features/rides/services/ridesService';

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
  const { user, token } = useAuthStore();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [openChat, setOpenChat] = useState(null);
  const [activeTab, setActiveTab] = useState('driver'); // 'driver' ou 'passenger'
  const [newRequestAlert, setNewRequestAlert] = useState(null);

  // Verificar tipo de usuário (memoizar para evitar recalcular)
  const userTipo = user?.tipo;
  const isPassenger = userTipo === 'PASSAGEIRO';
  const isDriver = userTipo === 'MOTORISTA';
  const isBoth = userTipo === 'AMBOS';

  // Página simplificada para testes: logs reduzidos
  console.debug('🏠 ActiveRidesPage mounted', {
    userId: user?.id,
    userTipo: user?.tipo,
    userName: user?.nome,
    timestamp: new Date().toISOString()
  });

  // REMOVIDO: Redirect automático - passageiro também pode ver esta página

  // Memorizar fetchActiveRides para evitar recriação desnecessária (DEVE VIR ANTES do useEffect que a chama)
  const fetchActiveRides = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📡 fetchActiveRides iniciado para usuário:', user?.id);

      if (!token) {
        toast.error('Sessão expirada. Faça login novamente.');
        navigate('/login');
        return;
      }

      const ridesResponse = await fetch('http://localhost:8080/rides/corridasAtivas', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (ridesResponse.ok) {
        const ridesData = await ridesResponse.json();
        console.log('✅ Caronas carregadas:', ridesData.length, 'carona(s)');
        try {
          const requestsResponse = await fetch('http://localhost:8080/rides/requestsForMyRide', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (requestsResponse.ok) {
            const requestsData = await requestsResponse.json();
            console.log('✅ Solicitações carregadas:', requestsData.length, 'solicitação(ões)');
            console.log('   📋 Dados brutos:', requestsData);
            const ridesWithRequests = ridesData.map(ride => {
              const rideRequests = requestsData.filter(req => req.id_carona === ride.id);
              console.log(`   🚗 Carona ${ride.id}: ${rideRequests.length} solicitações`);
              return { ...ride, requests: rideRequests };
            });
            setRides(ridesWithRequests);
            console.log('📊 Dados renderizados - Tela atualizada!');
          } else if (requestsResponse.status === 500) {
            console.warn('⚠️ Backend retornou 500 - usando caronas sem solicitações');
            console.log('   Error:', await requestsResponse.text());
            setRides(ridesData.map(ride => ({ ...ride, requests: [] })));
          } else {
            console.warn('⚠️ Backend retornou:', requestsResponse.status);
            console.log('   Error:', await requestsResponse.text());
            setRides(ridesData.map(ride => ({ ...ride, requests: [] })));
          }
        } catch (reqError) {
          console.error('Erro ao buscar solicitações:', reqError);
          setRides(ridesData.map(ride => ({ ...ride, requests: [] })));
        }
      } else {
        const errorText = await ridesResponse.text();
        console.error('Erro ao buscar caronas:', ridesResponse.status, errorText);
      }
    } catch (error) {
      console.error('Exceção ao buscar caronas ativas:', error);
    } finally {
      setLoading(false);
    }
  }, [token, user?.id, navigate]); // Dependências: token, userId

  // Buscar caronas ativas ao carregar
  useEffect(() => {
    // Apenas buscar se for motorista ou ambos E aba driver
    if ((isDriver || isBoth) && activeTab === 'driver') {
      fetchActiveRides();
    } else {
      setLoading(false);
      setRides([]);
    }
  }, [userTipo, activeTab, fetchActiveRides]); // Adicionar fetchActiveRides

  // Memorizar listener SSE para evitar recriação
  const onNova = useCallback((payload) => {
    console.log('📢 SSE nova_solicitacao recebido em ActiveRidesPage:', payload, {
      timestamp: new Date().toISOString()
    });
    // Mostrar notificação ao motorista
    try {
      const name = payload?.passageiroNome || payload?.passageiro_nome || payload?.passageiro || 'Passageiro';
      const dist = payload?.distanciaOrigemKm ?? payload?.distancia_origem_km ?? null;
      const messageText = dist != null 
        ? `Nova solicitação de ${name} — ${dist} km`
        : `Nova solicitação de ${name}`;
      
      console.log('🎉 Disparando toast:', messageText);
      toast.info(messageText);
    } catch (e) { console.warn('Erro ao mostrar toast nova_solicitacao', e); }

    // destacar visualmente por alguns segundos
    console.log('🎨 Renderizando alerta visual de nova solicitação');
    setNewRequestAlert(payload);
    setTimeout(() => {
      console.log('⏱️ Removendo alerta visual (timeout 8s)');
      setNewRequestAlert(null);
    }, 8000);

    // ✨ NOVO: Adicionar solicitação à lista DIRETO do evento SSE
    console.log('✨ Adicionando solicitação direto do evento SSE à lista');
    setRides(prevRides => {
      return prevRides.map(ride => {
        // Se houver uma carona, adicionar a solicitação a ela
        const newRequest = {
          id_solicitacao: payload?.solicitacaoId,
          id_carona: ride.id,
          status: 'PENDENTE',
          nome_passageiro: payload?.passageiroNome,
          passageiro: {
            id: payload?.passageiroId,
            nome: payload?.passageiroNome
          },
          id_passageiro: payload?.passageiroId,
          distancia_origem: payload?.distanciaOrigemKm,
          origem: payload?.origem,
          destino: payload?.destino,
          fila_id: payload?.filaId
        };
        
        // Verificar se a solicitação já existe
        const requestExists = ride.requests?.some(r => r.id_solicitacao === payload?.solicitacaoId);
        
        if (!requestExists) {
          console.log(`✅ Adicionando solicitação ${payload?.solicitacaoId} à carona ${ride.id}`);
          return {
            ...ride,
            requests: [...(ride.requests || []), newRequest]
          };
        }
        return ride;
      });
    });

    // Refetch completo
    console.log('🔄 Refetchando caronas ativas após nova_solicitacao');
    fetchActiveRides();
  }, [fetchActiveRides]); // Dependência: fetchActiveRides

  // Subscribes SSE events para atualizar automaticamente
  useEffect(() => {
    // Só interessam eventos para motorista quando estiver na aba driver
    if (!(isDriver || isBoth) || activeTab !== 'driver') return;

    console.log('🔔 ActiveRidesPage: subscribing SSE nova_solicitacao event');

    const offNova = notificationsService.on('nova_solicitacao', onNova);

    return () => {
      console.log('🔌 Dessubscrevendo SSE nova_solicitacao');
      offNova();
    };
  }, [isDriver, isBoth, activeTab, onNova]); // onNova memorizado

  const handleAcceptRequest = async (rideId, requestId, passageiroNome, passageiroId) => {
    console.log('🎯 Aceitando solicitação:', { rideId, requestId, passageiroNome, passageiroId });
    
    try {
      setProcessingId(requestId);

      // NOVO: Usar endpoint automático com body (recomendado)
      const filaId = newRequestAlert?.filaId ?? newRequestAlert?.fila_id ?? null;
      const solicitacaoId = newRequestAlert?.solicitacaoId ?? newRequestAlert?.id_solicitacao ?? requestId;

      if (filaId && solicitacaoId) {
        try {
          console.log('✅ Usando fluxo automático (body):', { solicitacaoId, filaId });
          await ridesService.acceptAutomatic(solicitacaoId, filaId);
          toast.success('Solicitação aceita com sucesso!');
          await fetchActiveRides();

          setOpenChat({ requestId: requestId, otherUserName: passageiroNome, receiverId: passageiroId });
          sendRideAcceptedMessage(requestId, user?.name, passageiroNome, 'Origem', 'Destino');
          return;
        } catch (errAuto) {
          console.error('❌ Erro ao aceitar via fluxo automático:', errAuto);
          toast.error('Erro ao aceitar solicitação');
          return;
        }
      }

      // FALLBACK: Endpoint legacy (se filaId não disponível)
      console.log('⚠️ Fallback para endpoint legacy');
      const response = await fetch(`http://localhost:8080/rides/${requestId}/acept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idCarona: rideId })
      });

      if (response.ok) {
        toast.success('Solicitação aceita!');
        await fetchActiveRides();

        setOpenChat({ requestId: requestId, otherUserName: passageiroNome, receiverId: passageiroId });
        sendRideAcceptedMessage(requestId, user?.name, passageiroNome, 'Origem', 'Destino');
      } else {
        toast.error('Erro ao aceitar solicitação');
      }
    } catch (error) {
      console.error('❌ Erro ao aceitar solicitação:', error);
      toast.error('Erro ao aceitar solicitação');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (rideId, requestId) => {
    if (!confirm('Tem certeza que deseja recusar esta solicitação?')) return;
    
    try {
      setProcessingId(requestId);
      
      // NOVO: Usar endpoint automático com body (recomendado)
      const filaId = newRequestAlert?.filaId ?? newRequestAlert?.fila_id ?? null;
      const solicitacaoId = newRequestAlert?.solicitacaoId ?? newRequestAlert?.id_solicitacao ?? requestId;

      if (filaId && solicitacaoId) {
        try {
          console.log('✅ Recusando via fluxo automático (body):', { solicitacaoId, filaId });
          await ridesService.rejectAutomatic(solicitacaoId, filaId);
          toast.success('Solicitação recusada');
          await fetchActiveRides();
          return;
        } catch (errAuto) {
          console.error('❌ Erro ao recusar via fluxo automático:', errAuto);
          toast.error('Erro ao recusar solicitação');
          return;
        }
      }

      // FALLBACK: Endpoint legacy
      console.log('⚠️ Fallback para endpoint legacy');
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
      console.error('❌ Erro ao recusar solicitação:', error);
      toast.error('Erro ao recusar solicitação');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCompleteRide = async (rideId) => {
    if (!confirm('Tem certeza que deseja concluir esta carona? Esta ação não pode ser desfeita.')) return;

    try {
      setProcessingId(`complete-${rideId}`);
      
      console.log('📤 Concluindo carona:', rideId);
      
      // Tentar endpoint finalizar (mais comum no backend)
      const response = await fetch(`http://localhost:8080/rides/finalizar/${rideId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 Resposta finalizar carona:', response.status);

      if (response.ok) {
        toast.success('Carona concluída com sucesso! 🎉');
        await fetchActiveRides(); // Recarregar lista
      } else if (response.status === 404) {
        // Endpoint não existe - avisar que backend precisa implementar
        console.warn('⚠️ Endpoint /rides/finalizar/{id} não existe no backend');
        toast.error('Funcionalidade não disponível. Entre em contato com o suporte.');
      } else {
        const error = await response.json();
        console.error('❌ Erro ao concluir carona:', error);
        toast.error(error.message || 'Erro ao concluir carona');
      }
    } catch (error) {
      console.error('❌ Exceção ao concluir carona:', error);
      toast.error('Erro ao concluir carona. Verifique sua conexão.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelRide = async (rideId) => {
    if (!confirm('Tem certeza que deseja cancelar esta carona? Todos os passageiros serão notificados.')) return;

    try {
      setProcessingId(`cancel-${rideId}`);
      
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
      
      <div className="min-h-[calc(100vh-80px)] bg-gray-100 py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Abas para usuários AMBOS */}
          {/* Aba removida: 'Minhas Caronas' não é mais necessária para usuários AMBOS */}

          {/* 🚨 ALERTA VISUAL - Nova Solicitação */}
          {newRequestAlert && (
            <div className="mb-6 animate-pulse">
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-green-800 mb-1">
                      🔔 Nova Solicitação Recebida!
                    </h3>
                    <p className="text-green-700 font-semibold">
                      {newRequestAlert?.passageiroNome || newRequestAlert?.passageiro_nome || 'Passageiro'} está buscando uma carona
                    </p>
                    {(newRequestAlert?.distanciaOrigemKm ?? newRequestAlert?.distancia_origem_km) !== null && (
                      <p className="text-sm text-green-600 mt-2">
                        📍 Distância: {newRequestAlert?.distanciaOrigemKm ?? newRequestAlert?.distancia_origem_km} km
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setNewRequestAlert(null)}
                    className="text-green-600 hover:text-green-800 text-2xl leading-none"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-fatecride-blue mb-2">
                {isBoth && activeTab === 'driver' ? 'Minhas Caronas' : 'Caronas Ativas'}
              </h1>
              <p className="text-gray-600">
                {isBoth ? 'Gerencie suas caronas oferecidas' : 'Gerencie suas caronas em andamento'}
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
                  <FaCar className="w-10 h-10 text-fatecride-blue" />
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
              icon={FaCar}
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

                              {/* Botões de ação */}
                              <div className="flex gap-2 ml-4">
                                {/* Botão de chat para solicitações aceitas */}
                                {isAccepted && (
                                  <Button
                                    onClick={async () => {
                                      console.log('🔵 Abrindo chat - Request completo:', JSON.stringify(request, null, 2));
                                      console.log('  📋 id_solicitacao:', request.id_solicitacao);
                                      console.log('  👤 nome_passageiro:', request.nome_passageiro);
                                      console.log('  🆔 id_passageiro (raw):', request.id_passageiro);

                                      const raw = request.__raw || request || {};

                                      const inferPassengerId = (obj) => {
                                        if (!obj) return null;
                                        return obj.id_passageiro
                                          ?? obj.idPassageiro
                                          ?? obj.passageiro?.id
                                          ?? obj.passageiro?.id_usuario
                                          ?? obj.passageiro?.userId
                                          ?? obj.passageiro?.idUser
                                          ?? obj.id_passageiro_fk
                                          ?? obj.passageiroId
                                          ?? obj.id_usuario
                                          ?? obj.__raw?.id_passageiro
                                          ?? obj.__raw?.passageiro?.id
                                          ?? null;
                                      };

                                      const inferredId = inferPassengerId(request) || inferPassengerId(raw) || null;

                                      if (!inferredId) {
                                        console.warn('⚠️ receiverId não encontrado no payload da solicitação (tentadas várias chaves). Atualize o backend para retornar id_passageiro.');
                                      } else {
                                        console.log('  🎯 receiverId inferido:', inferredId);
                                      }

                                      setOpenChat({
                                        requestId: request.id_solicitacao,
                                        otherUserName: request.nome_passageiro || request.passageiro?.nome || 'Passageiro',
                                        receiverId: inferredId || null
                                      });
                                    }}
                                    className="bg-fatecride-blue hover:bg-fatecride-blue-dark"
                                    size="sm"
                                  >
                                    <FiMessageCircle className="mr-2" />
                                    Chat
                                  </Button>
                                )}
                                
                                {/* Botões de aceitar/recusar - só para pendentes */}
                                {isPending && (
                                  <>
                                    <Button
                                      onClick={() => handleAcceptRequest(
                                        ride.id, 
                                        request.id_solicitacao,
                                        request.passageiro?.nome || 'Passageiro',
                                        request.passageiro?.id
                                      )}
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
                                  </>
                                )}
                              </div>
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
      
      {/* Chat Flutuante */}
      {openChat && (
        <SimpleChatModal
          requestId={openChat.requestId}
          otherUserName={openChat.otherUserName}
          receiverId={openChat.receiverId}
          onClose={() => setOpenChat(null)}
        />
      )}
    </>
  );
}
