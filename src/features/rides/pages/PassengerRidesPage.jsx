import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMapPin, FiClock, FiTruck } from 'react-icons/fi';
import { Navbar } from '@shared/components/layout/Navbar';
import { Card } from '@shared/components/ui/Card';
import { Button } from '@shared/components/ui/Button';
import { EmptyState } from '@shared/components/ui/EmptyState';
import { Spinner } from '@shared/components/ui/Spinner';
import { useAuthStore } from '@features/auth/stores/authStore';

export function PassengerRidesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'active', 'completed'

  // Verificar tipo de usuário
  const isPassenger = user?.tipo === 'PASSAGEIRO';
  const isDriver = user?.tipo === 'MOTORISTA';
  const isBoth = user?.tipo === 'AMBOS';

  console.log('🔍 PassengerRidesPage - User:', user);
  console.log('🔍 PassengerRidesPage - Tipo:', user?.tipo);

  useEffect(() => {
    // Se for passageiro, ambos ou tipo indefinido, buscar dados
    if (isPassenger || isBoth || !user?.tipo) {
      fetchMyRequests();
    } else if (isDriver) {
      setLoading(false); // Não busca dados para motoristas
    }
  }, [activeTab, user]);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (activeTab === 'pending') {
        // Buscar solicitações PENDENTES
        const response = await fetch('http://localhost:8080/solicitacao/pending', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('📋 Resposta do backend (pending tab, pending endpoint):', data);
          
          // PendingPassengerRequestDTO pode ter diferentes estruturas
          let requestsArray = [];
          
          if (Array.isArray(data)) {
            requestsArray = data;
          } else if (data.requests && Array.isArray(data.requests)) {
            requestsArray = data.requests;
          } else if (data.solicitacoes && Array.isArray(data.solicitacoes)) {
            requestsArray = data.solicitacoes;
          } else if (data.content && Array.isArray(data.content)) {
            requestsArray = data.content;
          } else if (typeof data === 'object' && Object.keys(data).length > 0) {
            // Se for um objeto único, coloca em array
            requestsArray = [data];
          }
          
          console.log('📋 Array processado:', requestsArray);
          console.log('📋 Todos os status encontrados:', requestsArray.map(r => ({ id: r.id, status: r.status, id_status: r.id_status_solicitacao })));
          
          // Filtrar apenas solicitações PENDENTES (id_status_solicitacao=1)
          // NOTA: Backend retorna todas as solicitações em /pending (bug documentado)
          // Então precisamos filtrar manualmente
          const pendingRequests = requestsArray.filter(req => {
            const isPending = !req.status || 
                             req.status === 'PENDENTE' || 
                             req.status === 'PENDING' ||
                             req.id_status_solicitacao === 1;
            console.log(`  - Request ID ${req.id || req.id_solicitacao}: status="${req.status}", id_status=${req.id_status_solicitacao}, pendente=${isPending}`);
            return isPending;
          });
          console.log('⏳ Solicitações pendentes filtradas:', pendingRequests);
          setRequests(pendingRequests);
        } else if (response.status === 500) {
          // Backend retorna 500 quando não há solicitações pendentes
          // Isso deveria ser 200 com array vazio, mas vamos tratar
          try {
            const errorData = await response.json();
            console.error('❌ Erro 500 do backend:', errorData);
            if (errorData.message?.includes('Nenhuma solicitação')) {
              console.log('ℹ️ Nenhuma solicitação pendente');
              setRequests([]);
            } else {
              console.error('❌ Erro ao buscar solicitações:', response.status, errorData);
              toast.error('Erro no servidor. Tente novamente.');
              setRequests([]);
            }
          } catch (e) {
            // Se não conseguir parsear JSON, assume que não há dados
            console.log('ℹ️ Erro 500 sem JSON. Assumindo sem dados.');
            setRequests([]);
          }
        } else if (response.status === 403) {
          // Forbidden - usuário não é passageiro
          toast.error('Acesso negado. Esta página é apenas para passageiros.');
          setTimeout(() => navigate('/inicio'), 2000);
        } else {
          const errorText = await response.text();
          console.error('❌ Erro ao buscar solicitações:', response.status, errorText);
          toast.error('Erro ao buscar suas solicitações');
          setRequests([]);
        }
      } else if (activeTab === 'active') {
        // Buscar solicitações ativas (ACEITO/ACEITA) do endpoint de concluídas
        const response = await fetch('http://localhost:8080/solicitacao/concluidas?pagina=0&itens=50', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('📋 Resposta do backend (active tab, concluidas endpoint):', data);
          
          // Processar array (pode ser data.content ou diretamente data)
          let requestsArray = [];
          if (Array.isArray(data)) {
            requestsArray = data;
          } else if (data.content && Array.isArray(data.content)) {
            requestsArray = data.content;
          }
          
          console.log('📋 Array processado:', requestsArray);
          console.log('📋 Todos os status encontrados:', requestsArray.map(r => ({ id: r.id, status: r.status, id_status: r.id_status_solicitacao })));
          
          // Filtrar apenas solicitações ACEITAS (id_status_solicitacao=2)
          const activeRequests = requestsArray.filter(req => {
            const isAccepted = req.status === 'ACEITO' || 
                              req.status === 'ACEITA' || 
                              req.status === 'ACCEPTED' ||
                              req.id_status_solicitacao === 2;
            console.log(`  - Request ID ${req.id || req.id_solicitacao}: status="${req.status}", id_status=${req.id_status_solicitacao}, aceita=${isAccepted}`);
            return isAccepted;
          });
          console.log('✅ Solicitações ativas filtradas:', activeRequests);
          setRequests(activeRequests);
        } else if (response.status === 500) {
          try {
            const errorData = await response.json();
            console.error('❌ Erro 500 do backend:', errorData);
            if (errorData.message?.includes('Nenhuma solicitação')) {
              console.log('ℹ️ Nenhuma solicitação ativa');
              setRequests([]);
            } else {
              console.error('❌ Erro ao buscar solicitações:', response.status, errorData);
              toast.error('Erro no servidor. Tente novamente.');
              setRequests([]);
            }
          } catch (e) {
            // Se não conseguir parsear JSON, assume que não há dados
            console.log('ℹ️ Erro 500 sem JSON. Assumindo sem dados.');
            setRequests([]);
          }
        } else {
          const errorText = await response.text();
          console.error('❌ Erro ao buscar solicitações:', response.status, errorText);
          toast.error('Erro ao buscar suas solicitações');
          setRequests([]);
        }
      } else if (activeTab === 'completed') {
        // Buscar solicitações concluídas/canceladas/recusadas (paginadas)
        const response = await fetch('http://localhost:8080/solicitacao/concluidas?pagina=0&itens=50', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('📋 Solicitações concluídas:', data);
          
          // Processar array (pode ser data.content ou diretamente data)
          let requestsArray = [];
          if (Array.isArray(data)) {
            requestsArray = data;
          } else if (data.content && Array.isArray(data.content)) {
            requestsArray = data.content;
          }
          
          console.log('📋 Array processado (concluídas):', requestsArray);
          console.log('📋 Todos os status encontrados:', requestsArray.map(r => ({ id: r.id, status: r.status, id_status: r.id_status_solicitacao })));
          
          // Filtrar apenas solicitações realmente finalizadas (CONCLUIDO=5, CANCELADO=4, RECUSADO=3)
          // IMPORTANTE: Excluir ACEITO/ACEITA (id_status=2) desta aba
          const finalized = requestsArray.filter(req => {
            const isFinalized = req.status === 'CONCLUIDO' || 
                               req.status === 'CANCELADO' || 
                               req.status === 'RECUSADO' ||
                               req.id_status_solicitacao === 5 || // CONCLUIDO
                               req.id_status_solicitacao === 4 || // CANCELADO
                               req.id_status_solicitacao === 3;   // RECUSADO
            
            // NÃO incluir ACEITO (id_status=2)
            const isAccepted = req.status === 'ACEITO' || 
                              req.status === 'ACEITA' ||
                              req.id_status_solicitacao === 2;
            
            console.log(`  - Request ID ${req.id}: status="${req.status}", id_status=${req.id_status_solicitacao}, finalized=${isFinalized}, accepted=${isAccepted}`);
            
            return isFinalized && !isAccepted;
          });
          console.log('✅ Solicitações finalizadas filtradas:', finalized);
          setRequests(finalized);
        } else if (response.status === 204) {
          setRequests([]);
        } else {
          const errorText = await response.text();
          console.error('❌ Erro ao buscar solicitações concluídas:', response.status, errorText);
          toast.error('Erro ao buscar solicitações concluídas');
        }
      }
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error);
      toast.error('Erro ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (requestId) => {
    console.log('🔵 handleCancelRequest chamado:', { requestId });
    
    if (!confirm('Tem certeza que deseja cancelar esta solicitação?')) {
      console.log('⚠️ Usuário cancelou a confirmação');
      return;
    }

    try {
      setCancelingId(requestId);
      const token = localStorage.getItem('token');
      
      console.log('📤 Enviando requisição PUT /solicitacao/cancelar/${requestId}');
      const response = await fetch(`http://localhost:8080/solicitacao/cancelar/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 Resposta recebida:', response.status);

      if (response.ok) {
        toast.success('Solicitação cancelada');
        await fetchMyRequests();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao cancelar solicitação');
      }
    } catch (error) {
      console.error('Erro ao cancelar solicitação:', error);
      toast.error('Erro ao cancelar solicitação');
    } finally {
      setCancelingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch(status?.toUpperCase()) {
      case 'ACEITO':
      case 'ACEITA':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'RECUSADO':
      case 'CANCELADO':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'PENDENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    switch(status?.toUpperCase()) {
      case 'ACEITO':
      case 'ACEITA':
        return '✓ Aceita';
      case 'RECUSADO':
        return '✗ Recusada';
      case 'CANCELADO':
        return '✗ Cancelada';
      case 'PENDENTE':
        return '⏳ Aguardando motorista';
      default:
        return status || 'Pendente';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Minhas Solicitações
              </h1>
              <p className="text-gray-600">
                Acompanhe o status das suas solicitações de carona
              </p>
            </div>
            <Button
              onClick={() => navigate('/inicio')}
              className="bg-gray-500 hover:bg-gray-600"
            >
              Voltar
            </Button>
          </div>

          {/* Abas: Pendentes / Ativas / Concluídas */}
          <div className="flex gap-2 bg-white p-1 rounded-lg shadow-sm w-fit">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'pending'
                  ? 'bg-yellow-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              ⏳ Pendentes
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'active'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              ✅ Ativas
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'completed'
                  ? 'bg-fatecride-blue text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📋 Concluídas
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Mensagem para motoristas */}
        {!loading && isDriver && (
          <Card className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiMapPin className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Esta página é para Passageiros
              </h2>
              <p className="text-gray-600 mb-6">
                Apenas passageiros podem visualizar solicitações de carona. 
                Como motorista, você pode gerenciar suas caronas ativas.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => navigate('/caronas-ativas')}
                  className="bg-fatecride-blue hover:bg-fatecride-blue-dark"
                >
                  Ver Caronas Ativas
                </Button>
                <Button
                  onClick={() => navigate('/motorista')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Criar Carona
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Empty State (passageiros, ambos ou tipo indefinido) */}
        {!loading && !isDriver && requests.length === 0 && (
          <EmptyState
            icon={FiMapPin}
            title={
              activeTab === 'pending' 
                ? "Nenhuma solicitação pendente" 
                : activeTab === 'active'
                ? "Nenhuma carona ativa"
                : "Nenhuma solicitação concluída"
            }
            description={
              activeTab === 'pending'
                ? "Você ainda não tem solicitações aguardando resposta do motorista"
                : activeTab === 'active'
                ? "Você não tem caronas aceitas no momento. Quando um motorista aceitar sua solicitação, ela aparecerá aqui."
                : "Você ainda não possui solicitações concluídas, canceladas ou recusadas"
            }
            action={{
              label: "Buscar Carona",
              onClick: () => navigate('/passageiro')
            }}
          />
        )}

        {/* Lista de solicitações (passageiros, ambos ou tipo indefinido) */}
        {!loading && !isDriver && requests.length > 0 && (
          <div className="space-y-4">
            {requests.map((request, index) => {
              const isPending = !request.status || request.status === 'PENDENTE';
              const isActive = request.status === 'ACEITO' || request.status === 'ACEITA';
              const isCompleted = request.status === 'CONCLUIDO';
              const isCanceled = request.status === 'CANCELADO';
              const isRejected = request.status === 'RECUSADO';
              
              // Pode cancelar se estiver pendente ou ativa
              const canCancel = isPending || isActive;
              
              // Usar id_solicitacao ou fallback para index
              const requestKey = request.id_solicitacao || request.id || `request-${index}`;

              return (
                <Card key={requestKey}>
                  <div className="space-y-4">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <FiClock className="w-4 h-4" />
                        {formatDate(request.data_solicitacao)}
                      </div>
                    </div>

                    {/* Informações do motorista */}
                    {request.nome_motorista && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-fatecride-blue text-white rounded-full flex items-center justify-center font-bold">
                          {request.nome_motorista[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {request.nome_motorista}
                          </p>
                          {request.curso_motorista && (
                            <p className="text-xs text-gray-500">
                              {request.curso_motorista}
                            </p>
                          )}
                          {request.veiculo_modelo && (
                            <div className="mt-1">
                              <p className="text-sm text-gray-700 font-medium">
                                🚗 {request.veiculo_marca} {request.veiculo_modelo} {request.veiculo_cor && `(${request.veiculo_cor})`}
                              </p>
                              <p className="text-xs text-gray-600">
                                Placa: {request.veiculo_placa}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Rota */}
                    <div className="space-y-3">
                      {/* Origem */}
                      {request.originDTO && (
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full" />
                            <div className="w-0.5 h-full bg-gray-300 my-1" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-1">Origem</p>
                            <p className="font-medium text-gray-900">
                              {request.originDTO.logradouro}
                            </p>
                            <p className="text-sm text-gray-600">
                              {request.originDTO.bairro && `${request.originDTO.bairro}, `}
                              {request.originDTO.cidade}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Destino */}
                      {request.destinationDTO && (
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-1">Destino</p>
                            <p className="font-medium text-gray-900">
                              {request.destinationDTO.logradouro}
                            </p>
                            <p className="text-sm text-gray-600">
                              {request.destinationDTO.bairro && `${request.destinationDTO.bairro}, `}
                              {request.destinationDTO.cidade}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Data da carona */}
                    {request.data_hora_carona && (
                      <div className="pt-3 border-t">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Horário da carona:</span> {formatDate(request.data_hora_carona)}
                        </p>
                      </div>
                    )}

                    {/* Botão cancelar */}
                    {canCancel && (
                      <div className="pt-3 border-t">
                        <Button
                          onClick={() => handleCancelRequest(request.id_solicitacao)}
                          disabled={cancelingId === request.id_solicitacao}
                          variant="danger"
                          size="sm"
                          className="w-full sm:w-auto"
                        >
                          {cancelingId === request.id_solicitacao ? 'Cancelando...' : 'Cancelar Solicitação'}
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
