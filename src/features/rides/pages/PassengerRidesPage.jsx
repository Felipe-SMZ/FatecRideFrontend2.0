import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMapPin, FiClock, FiMessageCircle } from 'react-icons/fi';
import { FaCar } from 'react-icons/fa';
import { Card } from '@shared/components/ui/Card';
import { Button } from '@shared/components/ui/Button';
import { EmptyState } from '@shared/components/ui/EmptyState';
import { Spinner } from '@shared/components/ui/Spinner';
import { useAuthStore } from '@features/auth/stores/authStore';
import SimpleChatModal from '@features/chat/components/SimpleChatModal';
import { ridesService } from '@features/rides/services/ridesService';
import { normalizeRequest } from '@shared/utils/normalizeRequest';
import notificationsService from '@shared/services/notificationsService';

export function PassengerRidesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState(null);
  const [openChat, setOpenChat] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(null);

  const isPassenger = user?.tipo === 'PASSAGEIRO';
  const isBoth = user?.tipo === 'AMBOS';

  // Buscar solicitações ao carregar ou quando usuário muda
  useEffect(() => {
    if (user?.id) {
      fetchMyRequests();
    }
  }, [user?.id]);

  // Subscribes SSE events para atualizar requests do passageiro
  useEffect(() => {
    if (!(isPassenger || isBoth)) return;

    const onAceita = (payload) => {
      console.log('SSE solicitacao_aceita recebido em PassengerRidesPage:', payload);
      fetchMyRequests();
    };

    const onNenhum = (payload) => {
      console.log('SSE nenhum_motorista recebido em PassengerRidesPage:', payload);
      fetchMyRequests();
    };

    const onFalha = (payload) => {
      console.log('SSE falha_final recebido em PassengerRidesPage:', payload);
      fetchMyRequests();
    };

    const off1 = notificationsService.on('solicitacao_aceita', onAceita);
    const off2 = notificationsService.on('nenhum_motorista', onNenhum);
    const off3 = notificationsService.on('falha_final', onFalha);

    return () => {
      off1(); off2(); off3();
    };
  }, [isPassenger, isBoth, user?.id]);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      // Use ridesService to centralize API calls and avoid localStorage usage here
      try {
        const data = await ridesService.getPassengerHistory(0, 100);
        let requestsArray = Array.isArray(data) ? data : (data?.content || []);

        // Se a API retornar um único objeto, coloque em array
        if (data && typeof data === 'object' && !Array.isArray(data) && !data.content) {
          requestsArray = [data];
        }

        // Remover duplicatas baseado no ID
        const map = new Map();
        requestsArray.forEach((r) => {
          const key = r?.id || r?.id_solicitacao || JSON.stringify(r);
          if (!map.has(key)) map.set(key, r);
        });

        const uniqueRequests = Array.from(map.values()).map(normalizeRequest);
        console.log(`✅ ${uniqueRequests.length} solicitações únicas (${requestsArray.length} total)`);
        console.log('Debug - Primeiros 3 requests:', uniqueRequests.slice(0, 3).map(r => ({
          id: r.id,
          status: r.status,
          statusLower: r.status?.toLowerCase(),
          origem: r.origem,
          destino: r.destino,
          nome_motorista: r.nome_motorista
        })));
        setRequests(uniqueRequests);
      } catch (err) {
        console.warn('⚠️ Falha ao buscar histórico do passageiro', err);
        setRequests([]);
      }
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      setCancelingId(requestId);
      try {
        await ridesService.cancelRequest(requestId);
        toast.success('Solicitação cancelada com sucesso!');
        setCancelConfirm(null);
        await fetchMyRequests();
      } catch (err) {
        console.error('Erro ao cancelar solicitação (service):', err);
        toast.error('Erro ao cancelar solicitação');
      }
    } catch (error) {
      console.error('Erro ao cancelar:', error);
      toast.error('Erro ao cancelar solicitação');
    } finally {
      setCancelingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pendente': { text: 'Pendente', class: 'bg-yellow-100 text-yellow-800' },
      'aceita': { text: 'Aceita', class: 'bg-green-100 text-green-800' },
      'recusada': { text: 'Recusada', class: 'bg-red-100 text-red-800' },
      'cancelada': { text: 'Cancelada', class: 'bg-gray-100 text-gray-800' },
      'concluida': { text: 'Concluída', class: 'bg-blue-100 text-blue-800' },
      'ativa': { text: 'Ativa', class: 'bg-green-100 text-green-800' },
    };
    
    const statusKey = status?.toLowerCase()?.trim() || 'pendente';
    const config = statusMap[statusKey] || statusMap['pendente'];
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
        {config.text}
      </span>
    );
  };

  // Verificar se solicitação pode ser cancelada
  const canCancelRequest = (status) => {
    if (!status) return false;
    const statusLower = status.toLowerCase().trim();
    return ['pendente', 'ativa'].includes(statusLower);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header com ações */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-fatecride-blue">Minhas Solicitações</h1>
            <p className="text-gray-600 mt-2">Acompanhe suas solicitações de carona em tempo real</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={() => navigate('/passageiro')}
              className="bg-green-600 hover:bg-green-700"
            >
              + Nova Solicitação
            </Button>
            <Button
              onClick={() => navigate('/inicio')}
              className="bg-gray-500 hover:bg-gray-600"
            >
              Voltar
            </Button>
          </div>
        </div>

        {requests.length === 0 ? (
          <EmptyState
            icon={FaCar}
            title="Nenhuma solicitação"
            description="Você ainda não solicitou nenhuma carona. Comece sua primeira solicitação!"
            action={{
              label: "Solicitar Carona Agora",
              onClick: () => navigate('/passageiro')
            }}
          />
        ) : (
          <div className="grid gap-6">
            {requests.map((request) => (
              <Card key={request.id} className="hover:shadow-xl transition-all duration-300 border-l-4 border-fatecride-blue overflow-hidden">
                <div className="flex items-start justify-between p-6">
                  <div className="flex-1">
                    {/* Header do Card */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-fatecride-blue/10 rounded-full p-3">
                        <FaCar className="w-5 h-5 text-fatecride-blue" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">
                          Solicitação #{request.id_carona || request.id}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {request.data_carona || request.data_hora || 'Data indisponível'}
                        </p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    {/* Detalhes da Rota */}
                    <div className="space-y-2 text-sm ml-16">
                      <div className="flex items-center gap-2 text-gray-700">
                        <span className="text-lg">📍</span>
                        <span><strong>De:</strong> {request.origem || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <span className="text-lg">🎯</span>
                        <span><strong>Para:</strong> {request.destino || 'N/A'}</span>
                      </div>
                      {request.nome_motorista && (
                        <div className="flex items-center gap-2 text-gray-700 mt-3 pt-3 border-t border-gray-200">
                          <span className="text-lg">🚗</span>
                          <span><strong>Motorista:</strong> {request.nome_motorista}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="ml-6 flex gap-2">
                    {canCancelRequest(request.status) && (
                      <Button
                        onClick={() => setCancelConfirm(request.id)}
                        disabled={cancelingId === request.id || cancelConfirm === request.id}
                        className="bg-red-500 hover:bg-red-600 text-white text-sm"
                      >
                        Cancelar
                      </Button>
                    )}
                    <Button
                      onClick={() => setOpenChat({
                        requestId: request.id,
                        otherUserName: request.nome_motorista || 'Motorista',
                        receiverId: null
                      })}
                      className="bg-blue-500 hover:bg-blue-600 text-white text-sm"
                    >
                      <FiMessageCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {openChat && (
        <SimpleChatModal
          requestId={openChat.requestId}
          otherUserName={openChat.otherUserName}
          onClose={() => setOpenChat(null)}
        />
      )}

      {/* Modal de confirmação de cancelamento */}
      {cancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-sm w-full">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Cancelar Solicitação?</h2>
              <p className="text-gray-600 text-sm mb-6">
                Tem certeza que deseja cancelar esta solicitação? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  onClick={() => setCancelConfirm(null)}
                  disabled={cancelingId === cancelConfirm}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-900 text-sm"
                >
                  Manter
                </Button>
                <Button
                  onClick={() => handleCancelRequest(cancelConfirm)}
                  loading={cancelingId === cancelConfirm}
                  disabled={cancelingId === cancelConfirm}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm"
                >
                  Cancelar Solicitação
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
