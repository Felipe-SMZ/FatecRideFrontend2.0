// features/rides/pages/PassengerFollowPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMapPin, FiLoader, FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi';

import { PageContainer } from '@shared/components/layout/PageContainer';
import { Card } from '@shared/components/ui/Card';
import { Button } from '@shared/components/ui/Button';
import { Spinner } from '@shared/components/ui/Spinner';
import { useAuthStore } from '@features/auth/stores/authStore';
import { useChatStore } from '@features/chat/stores/chatStore';
import notificationsService from '@shared/services/notificationsService';
import { ridesService } from '@features/rides/services/ridesService';

/**
 * PassengerFollowPage - Acompanhamento em tempo real de solicitação
 * 
 * Escuta eventos SSE:
 * - solicitacao_aceita: motorista aceitou
 * - nenhum_motorista: nenhum disponível
 * - falha_final: timeout ou todos recusaram
 */
export function PassengerFollowPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();

  // IDs da solicitação
  const solicitacaoId = searchParams.get('id');
  
  console.log('🚀 PassengerFollowPage iniciado', {
    solicitacaoId,
    user: user?.nome,
    timestamp: new Date().toISOString()
  });

  // Estados
  const [solicitacao, setSolicitacao] = useState(null);
  const [status, setStatus] = useState('aguardando'); // aguardando, aceita, nenhum_motorista, falha_final
  const [motorista, setMotorista] = useState(null);
  const [tentativa, setTentativa] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sseListenerActive, setSseListenerActive] = useState(false);

  // Buscar dados iniciais da solicitação
  useEffect(() => {
    const fetchSolicitacao = async () => {
      try {
        setLoading(true);
        console.log('🔍 Buscando solicitação:', solicitacaoId);
        
        // ⭐ NOVO: Usar método dedicado que tenta GET direto e depois fallback
        const foundRequest = await ridesService.getSolicitacaoById(solicitacaoId);

        if (foundRequest) {
          console.log('✅ Solicitação carregada:', foundRequest);
          setSolicitacao(foundRequest);
          
          // Inferir status inicial
          const initialStatus = foundRequest.status_solicitacao ?? foundRequest.status ?? 'pendente';
          console.log('📊 Status inicial:', initialStatus);
          
          if (initialStatus === 'aceita' || initialStatus === 'ACEITA') {
            setStatus('aceita');
            setMotorista(foundRequest);
          } else {
            setStatus('aguardando');
          }
        } else {
          console.warn('❌ Solicitação não encontrada:', solicitacaoId);
          toast.error('Solicitação não encontrada. Verifique o ID.');
        }
      } catch (err) {
        console.error('❌ Erro ao buscar solicitação:', err);
        toast.error('Erro ao carregar dados da solicitação: ' + (err?.message || 'Unknown'));
      } finally {
        setLoading(false);
      }
    };

    if (solicitacaoId) {
      fetchSolicitacao();
    }
  }, [solicitacaoId]);

  // ⭐ NOVO: Polling de recuperação de evento perdido
  // Se SSE não chegar em 5 segundos, faz polling a cada 2s por até 30s
  useEffect(() => {
    if (!solicitacaoId || status !== 'aguardando') return;

    const pollingTimeout = setTimeout(() => {
      console.log('⏱️ SSE não chegou em 5s, iniciando polling para recuperar evento...');
      
      ridesService.recoverLostEvent(solicitacaoId)
        .then(recovered => {
          if (recovered) {
            console.log('✅ Evento recuperado via polling!');
            // Event vai ser disparado automaticamente via CustomEvent
          } else {
            console.warn('⚠️ Evento não recuperado mesmo com polling');
          }
        })
        .catch(err => {
          console.error('❌ Erro ao tentar recuperar evento:', err);
        });
    }, 5000); // Esperar 5 segundos antes de iniciar polling

    return () => clearTimeout(pollingTimeout);
  }, [solicitacaoId, status]);

  // Escutar eventos SSE
  useEffect(() => {
    if (!solicitacaoId) return;

    console.log('📡 PassengerFollowPage: Configurando listeners SSE para solicitação:', solicitacaoId);

    // Handler para solicitacao_aceita
    const handleAceita = (eventData) => {
      console.log('✅ Solicitação aceita:', eventData);
      setStatus('aceita');
      setMotorista(eventData.motorista || eventData);
      toast.success(`🎉 ${eventData.motorista?.nome || 'Motorista'} aceitou sua solicitação!`);
      
      // Salvar no chat para referência
      if (eventData.id_solicitacao) {
        const id_num = Number(eventData.id_solicitacao);
        useChatStore.getState().updateConversationLastMessage(id_num, {
          message: 'Motorista aceitou sua solicitação',
          data: new Date().toISOString(),
          id: `system_${Date.now()}`
        });
      }

      // Auto-navegar para chat/ativas em 2 segundos
      setTimeout(() => {
        navigate('/solicitacoes-ativas');
      }, 2000);
    };

    // Handler para nenhum_motorista
    const handleNenhum = (eventData) => {
      console.log('🚫 Nenhum motorista disponível:', eventData);
      setStatus('nenhum_motorista');
      toast.error('Nenhum motorista encontrado próximo a você');
    };

    // Handler para falha_final
    const handleFalha = (eventData) => {
      console.log('❌ Falha final:', eventData);
      setStatus('falha_final');
      toast.error('Tempo esgotado. Nenhum motorista aceitou sua solicitação.');
    };

    // Registrar listeners para cada evento
    const unsubAceita = notificationsService.on('solicitacao_aceita', handleAceita);
    const unsubNenhum = notificationsService.on('nenhum_motorista', handleNenhum);
    const unsubFalha = notificationsService.on('falha_final', handleFalha);

    setSseListenerActive(true);

    return () => {
      unsubAceita?.();
      unsubNenhum?.();
      unsubFalha?.();
      setSseListenerActive(false);
      console.log('🔌 PassengerFollowPage: Listeners SSE removidos');
    };
  }, [solicitacaoId, navigate]);

  // Cancelar solicitação
  const handleCancelRequest = async () => {
    if (!solicitacaoId) return;

    if (!window.confirm('Deseja cancelar essa solicitação?')) {
      return;
    }

    try {
      await ridesService.cancelRequest(solicitacaoId);
      toast.success('Solicitação cancelada');
      navigate('/caronas');
    } catch (err) {
      console.error('Erro ao cancelar:', err);
      toast.error('Erro ao cancelar solicitação');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  // Status: Aguardando resposta
  if (status === 'aguardando') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-6">
        <PageContainer 
          title="Acompanhando sua solicitação"
          description="Procurando motoristas próximos..."
          centerTitle={true}
          maxWidth="full"
          className="max-w-screen-lg px-6"
        >
          <div className="py-8">
            <Card className="p-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="relative w-24 h-24">
                  <FiLoader className="w-24 h-24 text-fatecride-blue animate-spin" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Procurando motoristas próximos...
              </h2>
              <p className="text-gray-600 mb-8">
                Tentativa {tentativa} de 3 • Aguardando resposta dos motoristas
              </p>

              {solicitacao && (
                <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                  <h3 className="font-bold text-gray-900 mb-4">Detalhes da Solicitação</h3>
                  
                  <div className="space-y-4">
                    {solicitacao.originDTO && (
                      <div className="flex items-start gap-3">
                        <FiMapPin className="text-green-600 flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Origem</p>
                          <p className="text-sm text-gray-600">
                            {solicitacao.originDTO.logradouro}, {solicitacao.originDTO.cidade}
                          </p>
                        </div>
                      </div>
                    )}

                    {solicitacao.destinationDTO && (
                      <div className="flex items-start gap-3">
                        <FiMapPin className="text-red-600 flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Destino</p>
                          <p className="text-sm text-gray-600">
                            {solicitacao.destinationDTO.logradouro}, {solicitacao.destinationDTO.cidade}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <Button
                  onClick={handleCancelRequest}
                  className="px-6 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors"
                >
                  ✕ Cancelar Solicitação
                </Button>
              </div>

              {!sseListenerActive && (
                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    ⚠️ Conexão SSE pode não estar ativa. Você receberá uma notificação quando um motorista aceitar.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </PageContainer>
      </div>
    );
  }

  // Status: Solicitação aceita
  if (status === 'aceita') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pt-6">
        <PageContainer 
          title="Solicitação Aceita! 🎉"
          description="Um motorista aceitou sua solicitação"
          centerTitle={true}
          maxWidth="full"
          className="max-w-screen-lg px-6"
        >
          <div className="py-8">
            <Card className="p-8 border-2 border-green-500 bg-green-50">
              <div className="text-center mb-8">
                <FiCheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-green-900">
                  Ótimo! Motorista encontrado
                </h2>
              </div>

              {motorista && (
                <div className="bg-white rounded-lg p-6 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-bold text-gray-900 mb-4">Seu Motorista</h3>
                      <div className="space-y-3">
                        <p>
                          <span className="text-gray-600 text-sm">Nome:</span>
                          <span className="font-semibold ml-2">{motorista.nome || motorista.passageiroNome || 'Motorista'}</span>
                        </p>
                        <p>
                          <span className="text-gray-600 text-sm">Telefone:</span>
                          <span className="font-semibold ml-2">{motorista.telefone || '—'}</span>
                        </p>
                        {motorista.veiculo_marca && (
                          <p>
                            <span className="text-gray-600 text-sm">Veículo:</span>
                            <span className="font-semibold ml-2">{motorista.veiculo_marca} {motorista.veiculo_modelo}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {solicitacao && (
                      <div>
                        <h3 className="font-bold text-gray-900 mb-4">Sua Rota</h3>
                        <div className="space-y-3">
                          {solicitacao.originDTO && (
                            <p>
                              <span className="text-gray-600 text-sm">Origem:</span>
                              <span className="font-semibold ml-2 block text-sm">
                                {solicitacao.originDTO.logradouro}, {solicitacao.originDTO.cidade}
                              </span>
                            </p>
                          )}
                          {solicitacao.destinationDTO && (
                            <p>
                              <span className="text-gray-600 text-sm">Destino:</span>
                              <span className="font-semibold ml-2 block text-sm">
                                {solicitacao.destinationDTO.logradouro}, {solicitacao.destinationDTO.cidade}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => navigate('/solicitacoes-ativas')}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
                >
                  💬 Abrir Chat e Acompanhar
                </Button>
              </div>
            </Card>
          </div>
        </PageContainer>
      </div>
    );
  }

  // Status: Nenhum motorista
  if (status === 'nenhum_motorista') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white pt-6">
        <PageContainer 
          title="Sem Motoristas Disponíveis"
          description="Não há motoristas próximos no momento"
          centerTitle={true}
          maxWidth="full"
          className="max-w-screen-lg px-6"
        >
          <div className="py-8">
            <Card className="p-8 border-2 border-amber-400">
              <div className="text-center mb-8">
                <FiAlertCircle className="w-16 h-16 text-amber-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-amber-900">
                  Nenhum motorista disponível
                </h2>
                <p className="text-amber-800 mt-2">
                  Não encontramos motoristas próximos no momento
                </p>
              </div>

              <div className="bg-amber-50 rounded-lg p-6 mb-8">
                <h3 className="font-bold text-gray-900 mb-3">O que fazer agora?</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Tente solicitar novamente em alguns minutos</li>
                  <li>• Verifique se a localização está correta</li>
                  <li>• Tente uma rota alternativa</li>
                </ul>
              </div>

              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => navigate('/caronas')}
                  className="px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors"
                >
                  ← Voltar e Tentar Novamente
                </Button>
              </div>
            </Card>
          </div>
        </PageContainer>
      </div>
    );
  }

  // Status: Falha final
  if (status === 'falha_final') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white pt-6">
        <PageContainer 
          title="Solicitação Expirada"
          description="Nenhum motorista aceitou sua solicitação"
          centerTitle={true}
          maxWidth="full"
          className="max-w-screen-lg px-6"
        >
          <div className="py-8">
            <Card className="p-8 border-2 border-red-500">
              <div className="text-center mb-8">
                <FiXCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-red-900">
                  Solicitação Expirada
                </h2>
                <p className="text-red-800 mt-2">
                  Nenhum motorista aceitou sua solicitação dentro do tempo limite
                </p>
              </div>

              <div className="bg-red-50 rounded-lg p-6 mb-8">
                <h3 className="font-bold text-gray-900 mb-3">Próximas ações</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Tente solicitar novamente com uma rota diferente</li>
                  <li>• Verifique se a hora é apropriada (mais motoristas em horários de pico)</li>
                  <li>• Aumente a distância de busca</li>
                </ul>
              </div>

              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => navigate('/caronas')}
                  className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                >
                  ← Tentar Novamente
                </Button>
              </div>
            </Card>
          </div>
        </PageContainer>
      </div>
    );
  }

  return null;
}

export default PassengerFollowPage;
