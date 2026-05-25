import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiMapPin, FiClock, FiUser, FiMessageCircle } from 'react-icons/fi';
import { Card } from '@shared/components/ui/Card';
import { PageContainer } from '@shared/components/layout/PageContainer';
import { Button } from '@shared/components/ui/Button';
import { EmptyState } from '@shared/components/ui/EmptyState';
import { Spinner } from '@shared/components/ui/Spinner';
import { useAuthStore } from '@features/auth/stores/authStore';
import { SimpleChatModal } from '@features/chat/components/SimpleChatModal';
import api from '@shared/lib/api';
import { ridesService } from '@features/rides/services/ridesService';
import { normalizeRequest } from '@shared/utils/normalizeRequest';
import notificationsService from '@shared/services/notificationsService';

/**
 * ActiveRequestsPage - Solicitações Ativas do Passageiro
 * Mostra as solicitações aceitas (caronas que o passageiro vai participar)
 */
export function ActiveRequestsPage() {
  const { user, token } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openChat, setOpenChat] = useState(null);

  // ⭐ VALIDAÇÃO: Verificar se é passageiro (segunda linha de defesa)
  const isPassenger = user?.tipo === 'PASSAGEIRO';
  const isBoth = user?.tipo === 'AMBOS';
  const isAuthorized = isPassenger || isBoth;

  useEffect(() => {
    // Se não é passageiro, não fazer requisições
    if (!isAuthorized) {
      console.warn('❌ ActiveRequestsPage: Usuário não é passageiro, abortando fetchActiveRequests', {
        userTipo: user?.tipo,
        userId: user?.id
      });
      setLoading(false);
      return;
    }

    fetchActiveRequests();
  }, [isAuthorized, user?.tipo]);

  // ⭐ NOVO: Listeners para SSE events de atualização de solicitações
  useEffect(() => {
    if (!isAuthorized) return;

    console.log('📡 ActiveRequestsPage: Registrando listeners para eventos SSE do passageiro');

    // Quando a solicitação é ENVIADA para um novo motorista (tentativa automática)
    const handleNovaSolicitacao = (data) => {
      console.log('🔄 Evento: Nova tentativa automática', data);
      const tentativaNum = data?.tentativa || data?.tentativaNumero || 'próxima';
      toast.success(`Tentando próximo motorista... (tentativa ${tentativaNum}) 🔄`);
      // Auto-refresh da página
      setTimeout(() => {
        fetchActiveRequests();
      }, 800);
    };

    // Quando um motorista ACEITA a solicitação
    const handleSolicitacaoAceita = (data) => {
      console.log('✅ Evento: Solicitação ACEITA', data);
      toast.success('Motorista aceitou sua solicitação! 🎉');
      // Auto-refresh da página
      setTimeout(() => {
        fetchActiveRequests();
      }, 1000);
    };

    // Quando NENHUM motorista aceita (tentativa falhou)
    const handleNenhumMotorista = (data) => {
      console.log('❌ Evento: Nenhum motorista disponível', data);
      toast.error('Nenhum motorista disponível. Tentando próxima tentativa...');
      // Auto-refresh da página
      setTimeout(() => {
        fetchActiveRequests();
      }, 1500);
    };

    // Quando a solicitação FALHA definitivamente
    const handleFalhaFinal = (data) => {
      console.log('🚫 Evento: Falha final na solicitação', data);
      toast.error('Solicitação cancelada. Nenhum motorista disponível.');
      // Auto-refresh da página
      setTimeout(() => {
        fetchActiveRequests();
      }, 1500);
    };

    // Registrar listeners
    notificationsService.on('nova_solicitacao', handleNovaSolicitacao);
    notificationsService.on('solicitacao_aceita', handleSolicitacaoAceita);
    notificationsService.on('nenhum_motorista', handleNenhumMotorista);
    notificationsService.on('falha_final', handleFalhaFinal);

    // Cleanup: remover listeners quando desmontar
    return () => {
      notificationsService.off('nova_solicitacao', handleNovaSolicitacao);
      notificationsService.off('solicitacao_aceita', handleSolicitacaoAceita);
      notificationsService.off('nenhum_motorista', handleNenhumMotorista);
      notificationsService.off('falha_final', handleFalhaFinal);
      console.log('🧹 ActiveRequestsPage: Listeners removidos');
    };
  }, [isAuthorized]);

  const fetchActiveRequests = async () => {
    try {
      setLoading(true);
      console.log('📡 Buscando solicitações aceitas do passageiro... (service)');

      try {
        // Tenta agregar solicitações pendentes + histórico do passageiro
        const combined = [];

        try {
          const pendingData = await ridesService.getPending(0, 100);
          console.log('📥 Raw /solicitacao/pending response:', pendingData);

          let pendingArray = [];
          if (Array.isArray(pendingData)) {
            pendingArray = pendingData;
          } else if (pendingData?.content && Array.isArray(pendingData.content)) {
            pendingArray = pendingData.content;
          } else if (pendingData && typeof pendingData === 'object') {
            // Se for um único objeto, colocamos em array para processamento
            pendingArray = [pendingData];
          } else {
            pendingArray = [];
          }

          combined.push(...pendingArray);
        } catch (e) {
          console.warn('⚠️ Falha ao buscar /solicitacao/pending (continuando):', e?.response?.status || e?.status, e?.message || e, e?.response?.data);
          // Continua mesmo que pending falhe
        }

        try {
          const historyData = await ridesService.getPassengerHistory(0, 100);
          console.log('📥 Raw /solicitacao/concluidas response:', historyData);

          let historyArray = [];
          if (Array.isArray(historyData)) {
            historyArray = historyData;
          } else if (historyData?.content && Array.isArray(historyData.content)) {
            historyArray = historyData.content;
          } else if (historyData && typeof historyData === 'object') {
            historyArray = [historyData];
          } else {
            historyArray = [];
          }

          combined.push(...historyArray);
        } catch (e) {
          console.warn('⚠️ Falha ao buscar /solicitacao/concluidas (continuando):', e?.response?.status || e?.status, e?.message || e, e?.response?.data);
        }

        // Deduplicate by id_solicitacao / id
        const map = new Map();
        combined.forEach((r) => {
          const key = r?.id || r?.id_solicitacao || JSON.stringify(r);
          if (!map.has(key)) map.set(key, r);
        });

        const requestsArray = Array.from(map.values());

        // Filtrar solicitações "ativas": Pendente (1) e Aceita (2)
        const activeRequests = requestsArray.filter((req) => {
          const statusStr = (req?.status || '').toString().toLowerCase();
          const numeric = Number(req?.id_status_solicitacao);

          const isPending = statusStr === 'pendente' || numeric === 1;
          const isAccepted = statusStr === 'aceita' || statusStr === 'aceito' || numeric === 2;

          return isPending || isAccepted;
        });

        // Usar o utilitário compartilhado de normalização (suporta snake_case e camelCase)
        const normalized = activeRequests.map((r) => normalizeRequest(r));
        console.log('✅ Solicitações ativas (pendente/aceita) normalized:', normalized.length, normalized);
        setRequests(normalized);
      } catch (err) {
        console.error('❌ Erro inesperado ao agregar solicitações:', err);
        toast.error('Erro ao carregar solicitações ativas');
        setRequests([]);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar solicitações:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = async (request) => {
    console.log('🔵 Abrindo chat - Request:', request);

    // Tenta inferir o id do motorista a partir de várias possíveis chaves
    const raw = request.__raw || request || {};

    // Priorizar id_motorista vindo do backend: buscar /solicitacao/pending atual
    try {
      const latestPending = await ridesService.getPending(0, 100);
      let pendingArray = [];
      if (Array.isArray(latestPending)) pendingArray = latestPending;
      else if (latestPending?.content && Array.isArray(latestPending.content)) pendingArray = latestPending.content;
      else if (latestPending && typeof latestPending === 'object') pendingArray = [latestPending];

      const match = pendingArray.find(p => Number(p?.id_solicitacao || p?.id) === Number(request?.id || request?.id_solicitacao));
      if (match) {
        // se backend expôs id_motorista, usamos prioritariamente
        const mid = match.id_motorista ?? match.idMotorista ?? match.carona?.driver?.id ?? null;
        if (mid) {
          console.log('✅ Usando id_motorista vindo de /solicitacao/pending:', mid);
          // sobrescreve o raw para que o inferDriverId encontre o valor logo abaixo
          raw.id_motorista = mid;
          raw.nome_motorista = raw.nome_motorista || match.nome_motorista || match.nomeMotorista;
        }
      }
    } catch (err) {
      console.warn('⚠️ Não foi possível buscar /solicitacao/pending no momento:', err?.message || err);
    }

    const inferDriverId = (obj) => {
      if (!obj) return null;
      return obj.id_motorista
        ?? obj.idMotorista
        ?? obj.id_motorista_fk
        ?? obj.idCaronaMotorista
        ?? obj.carona?.driver?.id
        ?? obj.carona?.driverId
        ?? obj.carona?.driver?.userId
        ?? obj.carona?.driver?.id_usuario
        ?? obj.carona?.id_motorista
        ?? obj.carona?.idMotorista
        ?? obj.__raw?.carona?.driver?.id
        ?? obj.__raw?.id_motorista
        ?? null;
    };

    let motoristaId = inferDriverId(request) || inferDriverId(raw) || null;

    // Se não encontramos id_motorista diretamente, tentar buscar pelo id_carona
    if (!motoristaId && (request.id_carona || request.idCarona || request.__raw?.id_carona)) {
      const caronaId = request.id_carona || request.idCarona || request.__raw?.id_carona;
      console.log('🔎 id_motorista ausente — tentando buscar motorista pela id_carona:', caronaId);
      try {
        const ride = await ridesService.getRideById(caronaId);
        // ride pode ter diferentes formatos; tentar extrair driver id com defensiva
        const driverId = ride?.driver?.id || ride?.motorista?.id || ride?.id_motorista || ride?.driverId || null;
        if (driverId) {
          motoristaId = driverId;
          console.log('✅ Encontrado id_motorista via /rides/{id}:', motoristaId);
        } else {
          console.warn('⚠️ /rides/{id} retornou carona sem informação de driver.id');
        }
      } catch (err) {
        console.warn('⚠️ Falha ao buscar /rides/{id} para inferir motorista (endpoint pode não existir):', err?.response?.status || err?.message || err);
        // Tentativa alternativa: buscar todas as caronas ativas e procurar pela id
        try {
          console.log('🔎 Tentando fallback: buscando /rides/corridasAtivas e procurando carona por id...');
          const activeRides = await ridesService.getActive();
          const found = Array.isArray(activeRides) ? activeRides.find(r => Number(r.id) === Number(caronaId) || Number(r.id_carona) === Number(caronaId)) : null;
          const driverId2 = found?.driver?.id || found?.motorista?.id || found?.id_motorista || found?.driverId || null;
          if (driverId2) {
            motoristaId = driverId2;
            console.log('✅ Encontrado id_motorista via /rides/corridasAtivas:', motoristaId);
          } else {
            console.warn('⚠️ Fallback /rides/corridasAtivas não retornou driver info para essa carona');
          }
        } catch (err2) {
          console.warn('⚠️ Falha no fallback /rides/corridasAtivas:', err2?.response?.status || err2?.message || err2);
        }
      }
    }

    if (!motoristaId) {
      console.warn('⚠️ id_motorista não encontrado no payload (tentadas várias chaves). Backend deve retornar id_motorista. receiverId ficará nulo e envio por WebSocket pode falhar.');
    } else {
      console.log('✅ ID do motorista inferido do payload:', motoristaId);
    }

    setOpenChat({
      requestId: request.id || request.id_solicitacao,
      otherUserName: request.nome_motorista || request.nomeMotorista || raw.nomeMotorista || 'Motorista',
      receiverId: motoristaId || null
    });
  };

  const getStatusBadge = (request) => {
    const status = (request.status || '').toString().toLowerCase();
    const numeric = Number(request?.id_status_solicitacao);

    if (status === 'aceita' || status === 'aceito' || numeric === 2) {
      return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Aceita</span>;
    }

    if (status === 'pendente' || numeric === 1) {
      return <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">Pendente</span>;
    }

    return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">Aguardando</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-2">
      <PageContainer
        title="Solicitações Ativas"
        description="Suas caronas aceitas pelos motoristas"
        centerTitle={true}
        maxWidth="full"
        className="max-w-screen-2xl px-6 py-2"
      >

        {/* Lista de Solicitações */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
            <span className="ml-3 text-gray-600">Carregando...</span>
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={FiMapPin}
            title="Nenhuma solicitação ativa"
            description="Suas solicitações aceitas aparecerão aqui"
          />
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id || request.id_solicitacao} className="p-6">
                {/* Header do Card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-fatecride-blue text-white flex items-center justify-center font-bold">
                      {request.nome_motorista?.[0]?.toUpperCase() || 'M'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {request.nome_motorista || 'Motorista'}
                      </h3>
                      {request.curso_motorista && (
                        <p className="text-sm text-gray-600">{request.curso_motorista}</p>
                      )}
                    </div>
                  </div>
                  
                  {getStatusBadge(request)}
                </div>

                {/* Origem e Destino */}
                <div className="space-y-3 mb-4">
                  {request.originDTO && (
                    <div className="flex items-start gap-3">
                      <FiMapPin className="text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Origem</p>
                        <p className="text-sm text-gray-600">
                          {request.originDTO.logradouro}, {request.originDTO.cidade}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {request.destinationDTO && (
                    <div className="flex items-start gap-3">
                      <FiMapPin className="text-red-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Destino</p>
                        <p className="text-sm text-gray-600">
                          {request.destinationDTO.logradouro}, {request.destinationDTO.cidade}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Informações do Veículo */}
                {(request.veiculo_modelo || request.veiculo_marca) && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium text-gray-900 mb-1">Veículo</p>
                    <p className="text-sm text-gray-600">
                      {request.veiculo_marca} {request.veiculo_modelo} - {request.veiculo_cor}
                      {request.veiculo_placa && ` • ${request.veiculo_placa}`}
                    </p>
                  </div>
                )}

                {/* Data/Hora */}
                {request.dataHora && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <FiClock />
                    <span>{new Date(request.dataHora).toLocaleString('pt-BR')}</span>
                  </div>
                )}

                {/* Botão de Chat */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => handleOpenChat(request)}
                    variant="info"
                  >
                    <FiMessageCircle className="mr-2" />
                    Chat com Motorista
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageContainer>

      {/* Modal de Chat */}
      {openChat && (
        <SimpleChatModal
          requestId={openChat.requestId}
          otherUserName={openChat.otherUserName}
          receiverId={openChat.receiverId}
          onClose={() => setOpenChat(null)}
        />
      )}
    </div>
  );
}
