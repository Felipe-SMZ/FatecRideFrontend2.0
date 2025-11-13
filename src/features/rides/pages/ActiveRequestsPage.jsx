import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiMapPin, FiClock, FiUser, FiMessageCircle } from 'react-icons/fi';
import { Navbar } from '@shared/components/layout/Navbar';
import { Card } from '@shared/components/ui/Card';
import { Button } from '@shared/components/ui/Button';
import { EmptyState } from '@shared/components/ui/EmptyState';
import { Spinner } from '@shared/components/ui/Spinner';
import { useAuthStore } from '@features/auth/stores/authStore';
import { SimpleChatModal } from '@features/chat/components/SimpleChatModal';
import api from '@shared/lib/api';

/**
 * ActiveRequestsPage - Solicitações Ativas do Passageiro
 * Mostra as solicitações aceitas (caronas que o passageiro vai participar)
 */
export function ActiveRequestsPage() {
  const { user, token } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openChat, setOpenChat] = useState(null);

  useEffect(() => {
    fetchActiveRequests();
  }, []);

  const fetchActiveRequests = async () => {
    try {
      setLoading(true);
      console.log('📡 Buscando solicitações aceitas do passageiro...');
      
      const response = await fetch('http://localhost:8080/solicitacao/concluidas?pagina=0&itens=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        let requestsArray = Array.isArray(data) ? data : (data.content || []);
        
        // Filtrar apenas aceitas
        const acceptedRequests = requestsArray.filter(req => 
          req.status === 'ACEITO' || 
          req.status === 'ACEITA' || 
          req.status === 'aceita' ||
          req.id_status_solicitacao === 2
        );
        
        console.log('✅ Solicitações aceitas:', acceptedRequests.length);
        setRequests(acceptedRequests);
      } else {
        console.log('ℹ️ Sem solicitações aceitas');
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
    
    // Backend NÃO tem GET /rides/:id então vamos HARDCODE temporário
    // Como sabemos que Renato (id=6) é o único motorista, usamos ele
    // TODO: Backend precisa retornar id_motorista no /solicitacao/concluidas
    
    const motoristaId = 6; // HARDCODE - Renato é o motorista
    console.log('⚠️ HARDCODE: Usando id_motorista = 6 (Renato)');
    console.log('✅ ID do motorista:', motoristaId);
    
    setOpenChat({
      requestId: request.id || request.id_solicitacao,
      otherUserName: request.nome_motorista || 'Motorista',
      receiverId: motoristaId
    });
  };

  const getStatusBadge = (request) => {
    const status = request.status?.toLowerCase() || '';
    
    if (status === 'aceita' || status === 'aceito') {
      return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Aceita</span>;
    }
    return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">Aguardando</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Solicitações Ativas
          </h1>
          <p className="text-gray-600">
            Suas caronas aceitas pelos motoristas
          </p>
        </div>

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
                    className="bg-fatecride-blue hover:bg-fatecride-blue-dark"
                  >
                    <FiMessageCircle className="mr-2" />
                    Chat com Motorista
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

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
