import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiMapPin, FiClock, FiUser, FiMessageCircle, FiStar, FiTruck } from 'react-icons/fi';
import { Card } from '@shared/components/ui/Card';
import { PageContainer } from '@shared/components/layout/PageContainer';
import { Button } from '@shared/components/ui/Button';
import { Badge } from '@shared/components/ui/Badge';
import { EmptyState } from '@shared/components/ui/EmptyState';
import { Spinner } from '@shared/components/ui/Spinner';
import { useAuthStore } from '@features/auth/stores/authStore';
import { ratingService } from '@features/rides/services/ratingService';
import { SimpleChatModal } from '@features/chat/components/SimpleChatModal';
import api from '@shared/lib/api';
import { ridesService } from '@features/rides/services/ridesService';
import { normalizeRequest } from '@shared/utils/normalizeRequest';
import notificationsService from '@shared/services/notificationsService';
// Controle de logs: habilite definindo VITE_ENABLE_DEBUG_LOGS=true no .env
const dbg = (...args) => {
  try {
    if (import.meta?.env?.VITE_ENABLE_DEBUG_LOGS === 'true') {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  } catch (e) {
    // ambiente não suporta import.meta.env — fallback silencioso
  }
};

/**
 * ActiveRequestsPage - Solicitações Ativas do Passageiro
 * Mostra as solicitações aceitas (caronas que o passageiro vai participar)
 */
export function ActiveRequestsPage() {
  const { user, token } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openChat, setOpenChat] = useState(null);
  const [driverRatings, setDriverRatings] = useState({});

  // Auxiliar para inferir o ID do motorista em diferentes formatos de resposta do backend
  const inferDriverId = (obj) => {
    if (!obj) return null;
    const raw = obj.__raw || obj;
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
      ?? raw.id_motorista
      ?? raw.carona?.driver?.id
      ?? null;
  };

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

  // Listeners para SSE events de atualização de solicitações
  useEffect(() => {
    if (!isAuthorized) return;

    dbg('📡 ActiveRequestsPage: Registrando listeners para eventos SSE do passageiro');

    // Quando a solicitação é ENVIADA para um novo motorista (tentativa automática)
    const handleNovaSolicitacao = (data) => {
      dbg('🔄 Evento: Nova tentativa automática', data);
      const tentativaNum = data?.tentativa || data?.tentativaNumero || data?.numero_tentativa || 'próxima';
      toast.success(`Tentando próximo motorista... (tentativa ${tentativaNum}) 🔄`);
      // Auto-refresh da página
      setTimeout(() => {
        fetchActiveRequests();
      }, 800);
    };

    // Quando um motorista ACEITA a solicitação
    const handleSolicitacaoAceita = (data) => {
      dbg('✅ Evento: Solicitação ACEITA', data);
      toast.success('Motorista aceitou sua solicitação! 🎉');
      // Auto-refresh da página
      setTimeout(() => {
        fetchActiveRequests();
      }, 1000);
    };

    // Quando NENHUM motorista aceita (tentativa falhou)
    const handleNenhumMotorista = (data) => {
      dbg('❌ Evento: Nenhum motorista disponível', data);
      toast.info('Nenhum motorista disponível. Tentando próxima tentativa...');
      // Auto-refresh da página
      setTimeout(() => {
        fetchActiveRequests();
      }, 1500);
    };

    // Quando a solicitação FALHA definitivamente
    const handleFalhaFinal = (data) => {
      dbg('🚫 Evento: Falha final na solicitação', data);
      toast.error('Solicitação cancelada. Nenhum motorista disponível.');
      // Auto-refresh da página
      setTimeout(() => {
        fetchActiveRequests();
      }, 1500);
    };

    // Registrar listeners e guardar unsubscribers
    const unsubscribeNova = notificationsService.on('nova_solicitacao', handleNovaSolicitacao);
    const unsubscribeAceita = notificationsService.on('solicitacao_aceita', handleSolicitacaoAceita);
    const unsubscribeNenhum = notificationsService.on('nenhum_motorista', handleNenhumMotorista);
    const unsubscribeFalha = notificationsService.on('falha_final', handleFalhaFinal);

    // Cleanup: remover listeners quando desmontar
    return () => {
      unsubscribeNova();
      unsubscribeAceita();
      unsubscribeNenhum();
      unsubscribeFalha();
      dbg('🧹 ActiveRequestsPage: Listeners removidos');
    };
  }, [isAuthorized]);

  // Polling automático para manter lista de solicitações ativas atualizada
  // Recarrega solicitações a cada 5 segundos enquanto página está aberta
  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    dbg('🔄 Iniciando polling automático de solicitações ativas (a cada 5s)');

    const pollInterval = setInterval(() => {
      dbg('🔄 Polling: Refetching solicitações ativas...');
      fetchActiveRequests().catch(err => {
        console.error('⚠️ Erro durante polling:', err?.message);
      });
    }, 5000); // A cada 5 segundos

    return () => {
      dbg('🧹 Parando polling de solicitações ativas');
      clearInterval(pollInterval);
    };
  }, [isAuthorized]);

  const fetchActiveRequests = async () => {
    try {
      setLoading(true);
      dbg('📡 Buscando solicitações aceitas do passageiro... (service)');

      try {
        // Tenta agregar solicitações pendentes + histórico do passageiro
        const combined = [];

        try {
          const pendingData = await ridesService.getPending(0, 100);
          dbg('📥 Raw /solicitacao/pending response:', pendingData);

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
          dbg('📥 Raw /solicitacao/concluidas response:', historyData);

          let historyArray = [];
          if (Array.isArray(historyData)) {
            historyArray = historyData;
          } else if (historyData?.content && Array.isArray(historyData.content)) {
            historyArray = historyData.content;
          } else if (historyData && typeof historyData === 'object' && !Array.isArray(historyData)) {
            historyArray = [historyData];
          } else {
            historyArray = [];
          }

          dbg('✅ historyArray após parse:', {
            isArray: Array.isArray(historyArray),
            length: historyArray?.length || 0,
            isEmpty: !historyArray || historyArray.length === 0
          });

          combined.push(...(historyArray || []));
        } catch (e) {
          console.warn('⚠️ Falha ao buscar /solicitacao/concluidas (continuando):', e?.response?.status || e?.status, e?.message || e, e?.response?.data);
          // Continua mesmo que history falhe - combined fica com só pending
        }

        // Deduplicate by id_solicitacao / id
        const map = new Map();
        
        // Filtrar nulls/undefined antes de deduplicate
        const validCombined = combined.filter(r => r && typeof r === 'object');
        dbg('🔍 Combined após filtro de nulls:', {
          original: combined.length,
          afterFilter: validCombined.length,
          removed: combined.length - validCombined.length
        });

        validCombined.forEach((r) => {
          const key = r?.id || r?.id_solicitacao || JSON.stringify(r);
          if (!map.has(key)) map.set(key, r);
        });

        const requestsArray = Array.from(map.values());

        // Filtrar solicitações "ativas": Pendente (1) e Aceita (2)
        const activeRequests = requestsArray
          .filter((req) => req && typeof req === 'object') // Remover nulls antes de filtrar
          .filter((req) => {
            const statusStr = (req?.status || '').toString().toLowerCase();
            const numeric = Number(req?.id_status_solicitacao);

            const isPending = statusStr === 'pendente' || numeric === 1;
            const isAccepted = statusStr === 'aceita' || statusStr === 'aceito' || numeric === 2;

            return isPending || isAccepted;
          });

        dbg('📋 Solicitações ativas filtradas:', {
          totalRequests: requestsArray.length,
          activeCount: activeRequests.length
        });

        // Usar o utilitário compartilhado de normalização (suporta snake_case e camelCase)
        const normalized = activeRequests
          .map((r) => {
            try {
              return normalizeRequest(r);
            } catch (err) {
              console.warn('⚠️ Erro ao normalizar request:', err, r);
              return null; // Retorna null se houver erro
            }
          })
          .filter((r) => r !== null); // Remove nulls
        
        dbg('✅ Solicitações ativas (pendente/aceita) normalized:', normalized.length, normalized);
        setRequests(normalized);

        // Buscar avaliações dos motoristas para as caronas listadas
        const driverIds = new Set();
        normalized.forEach(req => {
          const mid = inferDriverId(req);
          // Só adiciona ao Set se a nota ainda não existir no estado local
          // Isso evita requisições redundantes durante o polling de 5s
          // Só busca se ainda não houver valor (undefined)
          // Se for null, significa que já tentamos e falhou (erro 500)
          if (mid && driverRatings[mid] === undefined) driverIds.add(mid);
        });

        if (driverIds.size > 0) {
          const ratings = {};
          await Promise.all(Array.from(driverIds).map(async (id) => {
            try {
              const score = await ratingService.getDriverRating(id);
              ratings[id] = score;
            } catch (err) {
              dbg(`⚠️ Erro ao buscar avaliação para motorista ${id}:`, err?.response?.status || err.message);
              ratings[id] = null; // Marca como nulo para não tentar novamente neste ciclo de vida
            }
          }));
          setDriverRatings(prev => ({ ...prev, ...ratings }));
        }
      } catch (err) {
        console.error('❌ Erro inesperado ao agregar solicitações:', err);
        toast.error('Erro ao carregar solicitações ativas. Tente novamente.');
        setRequests([]); // Garante que requests é sempre um array
      }
    } catch (error) {
      console.error('❌ Erro ao buscar solicitações:', error);
      setRequests([]); // Garante que requests é sempre um array
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = async (request) => {
    dbg('🔵 Abrindo chat - Request:', request);

    // Tenta inferir o id do motorista a partir de várias possíveis chaves
    const raw = request.__raw || request || {};

    // Priorizar id_motorista vindo do backend: buscar /solicitacao/pending atual
    try {
      let pendingArray = [];
      if (Array.isArray(latestPending)) pendingArray = latestPending;
      else if (latestPending?.content && Array.isArray(latestPending.content)) pendingArray = latestPending.content;
      else if (latestPending && typeof latestPending === 'object') pendingArray = [latestPending];

      const match = pendingArray.find(p => Number(p?.id_solicitacao || p?.id) === Number(request?.id || request?.id_solicitacao));
      if (match) {
        // se backend expôs id_motorista, usamos prioritariamente
        const mid = match.id_motorista ?? match.idMotorista ?? match.carona?.driver?.id ?? null;
        if (mid) {
          dbg('✅ Usando id_motorista vindo de /solicitacao/pending:', mid);
          // sobrescreve o raw para que o inferDriverId encontre o valor logo abaixo
          raw.id_motorista = mid;
          raw.nome_motorista = raw.nome_motorista || match.nome_motorista || match.nomeMotorista;
        }
      }
    } catch (err) {
      console.warn('⚠️ Não foi possível buscar /solicitacao/pending no momento:', err?.message || err);
    }

    let motoristaId = inferDriverId(request) || inferDriverId(raw) || null;

    // Se não encontramos id_motorista diretamente, tentar buscar pelo id_carona
    if (!motoristaId && (request.id_carona || request.idCarona || request.__raw?.id_carona)) {
      const caronaId = request.id_carona || request.idCarona || request.__raw?.id_carona;
        dbg('🔎 id_motorista ausente — tentando buscar motorista pela id_carona:', caronaId);
      try {
        const ride = await ridesService.getRideById(caronaId);
        // ride pode ter diferentes formatos; tentar extrair driver id com defensiva
        const driverId = ride?.driver?.id || ride?.motorista?.id || ride?.id_motorista || ride?.driverId || null;
        if (driverId) {
          motoristaId = driverId;
          dbg('✅ Encontrado id_motorista via /rides/{id}:', motoristaId);
        } else {
          dbg('⚠️ /rides/{id} retornou carona sem informação de driver.id');
        }
      } catch (err) {
        console.warn('⚠️ Falha ao buscar /rides/{id} para inferir motorista (endpoint pode não existir):', err?.response?.status || err?.message || err);
        // Tentativa alternativa: buscar todas as caronas ativas e procurar pela id
        try {
          dbg('🔎 Tentando fallback: buscando /rides/corridasAtivas e procurando carona por id...');
          const activeRides = await ridesService.getActive();
          const found = Array.isArray(activeRides) ? activeRides.find(r => Number(r.id) === Number(caronaId) || Number(r.id_carona) === Number(caronaId)) : null;
          const driverId2 = found?.driver?.id || found?.motorista?.id || found?.id_motorista || found?.driverId || null;
          if (driverId2) {
            motoristaId = driverId2;
            dbg('✅ Encontrado id_motorista via /rides/corridasAtivas:', motoristaId);
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
      dbg('✅ ID do motorista inferido do payload:', motoristaId);
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
        return <Badge variant="success">Aceita</Badge>;
      }

      if (status === 'pendente' || numeric === 1) {
        return <Badge variant="warning">Pendente</Badge>;
      }

      return <Badge>Aguardando</Badge>;
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
              <Card key={request.id || request.id_solicitacao} className="p-0 overflow-hidden hover:shadow-xl transition-all duration-300 border-l-4 border-fatecride-blue">
                {/* Header do Card */}
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-fatecride-blue to-blue-700 text-white flex items-center justify-center font-bold text-xl shadow-md border-2 border-white">
                      {request.nome_motorista?.[0]?.toUpperCase() || 'M'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-gray-900">
                            {request.nome_motorista || 'Motorista'}
                          </h3>
                          {/* Exibição da Nota do Motorista */}
                          {typeof driverRatings[inferDriverId(request)] === 'number' && (
                            <div 
                              className="flex items-center text-yellow-700 text-sm font-bold bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200 shadow-sm"
                              title="Média de avaliação do motorista"
                            >
                              <FiStar className="fill-current mr-1 text-yellow-500" size={14} />
                              {Number(driverRatings[inferDriverId(request)]).toFixed(1)}
                            </div>
                          )}
                        </div>
                        {request.curso_motorista && (
                          <p className="text-sm text-gray-500 font-medium">{request.curso_motorista}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(request)}
                    </div>
                  </div>

                  {/* Linha do Tempo da Rota */}
                  <div className="flex items-start gap-4 mb-6 ml-2">
                    <div className="flex flex-col items-center mt-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                      <div className="w-0.5 h-10 bg-gradient-to-b from-green-500 to-red-500"></div>
                      <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                    </div>
                    <div className="flex-1 space-y-5">
                      <div className="-mt-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Origem</p>
                        <p className="text-sm text-gray-800 font-medium">
                          {request.originDTO?.logradouro || 'Endereço não informado'}, {request.originDTO?.cidade}
                        </p>
                      </div>
                      <div className="pt-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Destino</p>
                        <p className="text-sm text-gray-800 font-medium">
                          {request.destinationDTO?.logradouro || 'Endereço não informado'}, {request.destinationDTO?.cidade}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer com informações técnicas e botão */}
                  <div className="flex flex-wrap items-center justify-between pt-5 border-t border-gray-100 gap-4">
                    <div className="flex flex-wrap gap-4">
                      {request.dataHora && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-bold text-gray-600 shadow-sm">
                          <FiClock className="text-fatecride-blue" />
                          <span>{new Date(request.dataHora).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                      {(request.veiculo_modelo || request.veiculo_marca) && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-bold text-gray-600 shadow-sm">
                          <FiTruck className="text-fatecride-blue" />
                          <span>{request.veiculo_marca} {request.veiculo_modelo} {request.veiculo_placa && `• ${request.veiculo_placa}`}</span>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => handleOpenChat(request)}
                      className="bg-fatecride-blue hover:bg-fatecride-blue-dark shadow-md text-sm font-bold"
                    >
                      <FiMessageCircle className="mr-2" />
                      Conversar com Motorista
                    </Button>
                  </div>
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
