import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMapPin, FiClock, FiTruck, FiMessageCircle } from 'react-icons/fi';
import { Navbar } from '@shared/components/layout/Navbar';
import { Card } from '@shared/components/ui/Card';
import { Button } from '@shared/components/ui/Button';
import { EmptyState } from '@shared/components/ui/EmptyState';
import { Spinner } from '@shared/components/ui/Spinner';
import { useAuthStore } from '@features/auth/stores/authStore';
import { FloatingChat } from '@features/chat/components/FloatingChat';

export function PassengerRidesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState(null);
  const [openChat, setOpenChat] = useState(null);

  const isPassenger = user?.tipo === 'PASSAGEIRO';
  const isBoth = user?.tipo === 'AMBOS';

  // Redirecionar automaticamente passageiro para buscar carona
  useEffect(() => {
    if (isPassenger || isBoth) {
      console.log('✅ Usuário PASSAGEIRO/AMBOS - indo para buscar carona');
      navigate('/buscar-carona');
    }
  }, [isPassenger, isBoth, navigate]);

  useEffect(() => {
    if (isPassenger || isBoth) {
      fetchMyRequests();
    }
  }, [user?.tipo, user?.id]);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:8080/solicitacao/concluidas?pagina=0&itens=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        let requestsArray = Array.isArray(data) ? data : (data.content || []);
        
        // Remover duplicatas baseado no ID
        const uniqueRequests = requestsArray.reduce((acc, current) => {
          const exists = acc.find(item => item.id === current.id);
          if (!exists) {
            acc.push(current);
          }
          return acc;
        }, []);
        
        console.log(`✅ ${uniqueRequests.length} solicitações únicas (${requestsArray.length} total)`);
        setRequests(uniqueRequests);
      } else {
        console.log('ℹ️ Sem solicitações');
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
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8080/solicitacao/${requestId}/cancelar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Solicitação cancelada com sucesso!');
        await fetchMyRequests();
      } else {
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
    };
    
    const statusKey = status?.toLowerCase() || 'pendente';
    const config = statusMap[statusKey] || statusMap['pendente'];
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Minhas Solicitações</h1>
          <p className="text-gray-600 mt-2">Acompanhe suas solicitações de carona</p>
        </div>

        {requests.length === 0 ? (
          <EmptyState
            icon={FiTruck}
            title="Nenhuma solicitação"
            description="Você ainda não solicitou nenhuma carona"
            action={{
              label: "Buscar Carona",
              onClick: () => navigate('/buscar-carona')
            }}
          />
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <Card key={request.id} className="hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Carona #{request.id_carona || request.id}
                      </h3>
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FiMapPin className="w-4 h-4" />
                        <span><strong>De:</strong> {request.origem || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FiMapPin className="w-4 h-4 text-green-600" />
                        <span><strong>Para:</strong> {request.destino || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FiClock className="w-4 h-4" />
                        <span><strong>Data:</strong> {request.data_carona || request.data_hora || 'N/A'}</span>
                      </div>
                      {request.nome_motorista && (
                        <div className="flex items-center gap-2">
                          <FiTruck className="w-4 h-4" />
                          <span><strong>Motorista:</strong> {request.nome_motorista}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {(request.status === 'aceita' || request.status === 'ACEITO') && (
                      <Button
                        size="sm"
                        onClick={() => setOpenChat({
                          id_solicitacao: request.id,
                          otherUserName: request.nome_motorista || 'Motorista'
                        })}
                      >
                        <FiMessageCircle className="w-4 h-4" />
                        Chat
                      </Button>
                    )}
                    
                    {request.status === 'pendente' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelRequest(request.id)}
                        disabled={cancelingId === request.id}
                      >
                        {cancelingId === request.id ? 'Cancelando...' : 'Cancelar'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {openChat && (
        <FloatingChat
          id_solicitacao={openChat.id_solicitacao}
          otherUserName={openChat.otherUserName}
          onClose={() => setOpenChat(null)}
        />
      )}
    </div>
  );
}
