// features/chat/pages/ConversationsPage.jsx
import { useEffect, useState } from 'react';
import { Navbar } from '@shared/components/layout/Navbar';
import { Card } from '@shared/components/ui/Card';
import { Button } from '@shared/components/ui/Button';
import { EmptyState } from '@shared/components/ui/EmptyState';
import { Spinner } from '@shared/components/ui/Spinner';
import { useChatStore } from '../stores/chatStore';
import { useChat } from '../hooks/useChat';
import { useAuthStore } from '@features/auth/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { FiMessageCircle, FiArrowLeft } from 'react-icons/fi';
import api from '@shared/lib/api';
import toast from 'react-hot-toast';
import { SimpleChatModal } from '../components/SimpleChatModal';

/**
 * Página com lista de todas as conversas
 */
export function ConversationsPage() {
  const navigate = useNavigate();
  const { conversations, setConversations, unreadCount } = useChatStore();
  const { isConnected } = useChat();
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [openChat, setOpenChat] = useState(null);

  // Buscar solicitações aceitas ao carregar
  useEffect(() => {
    async function fetchAcceptedRequests() {
      try {
        setLoading(true);
        console.log('📨 Buscando solicitações aceitas para conversas...');
        
        let acceptedRequests = [];
        
        // Buscar do endpoint de concluídas (retorna solicitações do PASSAGEIRO)
        try {
          const response = await api.get('/solicitacao/concluidas?pagina=0&itens=100');
          let requestsArray = [];
          
          if (Array.isArray(response.data)) {
            requestsArray = response.data;
          } else if (response.data.content && Array.isArray(response.data.content)) {
            requestsArray = response.data.content;
          }
          
          // Filtrar apenas aceitas
          acceptedRequests = requestsArray.filter(req => 
            req.status === 'ACEITO' || 
            req.status === 'ACEITA' || 
            req.status === 'ACCEPTED' ||
            req.status === 'aceita' ||
            req.id_status_solicitacao === 2
          );
        } catch (error) {
          console.warn('⚠️ Erro ao buscar /solicitacao/concluidas:', error);
        }
        
        // Se for MOTORISTA ou AMBOS, buscar das caronas ativas
        if (user?.tipo === 'MOTORISTA' || user?.tipo === 'AMBOS') {
          try {
            console.log('🚗 Buscando também solicitações das minhas caronas...');
            const requestsResponse = await fetch('http://localhost:8080/rides/requestsForMyRide', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (requestsResponse.ok) {
              const requestsData = await requestsResponse.json();
              const acceptedFromRides = requestsData.filter(req => 
                req.status === 'aceita' || req.status === 'ACEITA' || req.status === 'ACEITO'
              );
              console.log('✅ Solicitações aceitas das minhas caronas:', acceptedFromRides.length);
              
              // Transformar para formato compatível
              const ridesRequests = acceptedFromRides.map(req => ({
                id: req.id_solicitacao,
                id_solicitacao: req.id_solicitacao,
                id_carona: req.id_carona,
                dataHora: req.dataHora || new Date().toISOString(),
                status: 'aceita',
                id_status_solicitacao: 2,
                nome_passageiro: req.nome_passageiro,
                curso_passageiro: req.curso,
                originDTO: req.originDTO,
                destinationDTO: req.destinationDTO
              }));
              
              acceptedRequests = [...acceptedRequests, ...ridesRequests];
            }
          } catch (error) {
            console.warn('⚠️ Erro ao buscar solicitações das caronas:', error);
          }
        }
        
        console.log('✅ Solicitações aceitas encontradas:', acceptedRequests);
        if (acceptedRequests.length > 0) {
          console.log('📋 Primeiro item completo:', JSON.stringify(acceptedRequests[0], null, 2));
        }
        
        // Transformar em conversas
        const convs = acceptedRequests.map(req => {
          console.log(`🔍 Processando solicitação ${req.id || req.id_solicitacao}:`, req);
          
          const requestId = req.id_solicitacao || req.id;
          let otherId = undefined; // Inferido no onClick
          let otherNome = 'Usuário';
          
          // Se tem nome_motorista, eu sou passageiro
          if (req.nome_motorista) {
            otherNome = req.nome_motorista;
          } else if (req.nome_passageiro) {
            otherNome = req.nome_passageiro;
          }
          
          console.log(`  ✅ otherId: ${otherId}, otherNome: ${otherNome}`);
          
          return {
            id_solicitacao: req.id_solicitacao || req.id,
            lastMessage: 'Clique para ver a conversa',
            lastMessageDate: req.data_atualizacao || req.data_criacao || new Date().toISOString(),
            unread: 0,
            otherUser: {
              id: otherId,
              nome: otherNome
            },
            origem: req.origem,
            destino: req.destino
          };
        });
        
        console.log('💬 Conversas criadas:', convs);
        setConversations(convs);
      } catch (error) {
        console.error('❌ Erro ao buscar conversas:', error);
        if (error.response?.status !== 404 && error.response?.status !== 500) {
          toast.error('Erro ao carregar conversas');
        }
        // Não mostrar erro se não houver conversas
        setConversations([]);
      } finally {
        setLoading(false);
      }
    }
    
    if (user?.id) {
      fetchAcceptedRequests();
    }
  }, [user, setConversations]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 168) { // 7 dias
      return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  return (
    <>
      <Navbar showAuthButton={true} />
      
      <div className="min-h-[calc(100vh-80px)] bg-gray-100 py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-fatecride-blue mb-2">
                Mensagens
              </h1>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <p className="text-gray-600">
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/inicio')}
              className="bg-gray-500 hover:bg-gray-600"
            >
              <FiArrowLeft className="mr-2" />
              Voltar
            </Button>
          </div>

          {/* Lista de Conversas */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
              <span className="ml-3 text-gray-600">Carregando conversas...</span>
            </div>
          ) : conversations.length === 0 ? (
            <EmptyState
              icon={FiMessageCircle}
              title="Nenhuma conversa"
              description="Suas conversas com motoristas e passageiros aparecerão aqui"
            />
          ) : (
            <div className="space-y-3">
              {conversations.map((conv) => {
                const unread = unreadCount[conv.id_solicitacao] || 0;
                
                return (
                  <Card
                    key={conv.id_solicitacao}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      console.log('🔵 Clicou na conversa:', conv);
                      
                      // Backend NÃO retorna IDs então vamos inferir:
                      // Se eu sou Felipe (id=2), o outro é Renato (id=6)
                      // Se eu sou Renato (id=6), o outro é Felipe (id=2)
                      const receiverId = user?.id === 2 ? 6 : 2;
                      console.warn(`⚠️ Inferindo receiverId: Eu sou ${user?.id}, logo outro usuário é ${receiverId}`);
                      
                      setOpenChat({
                        requestId: conv.id_solicitacao,
                        otherUserName: conv.otherUser?.nome || 'Usuário',
                        receiverId: receiverId
                      });
                    }}
                  >
                    <div className="flex items-center gap-4 p-4">
                      {/* Avatar/Ícone */}
                      <div className="w-12 h-12 rounded-full bg-fatecride-blue text-white flex items-center justify-center font-bold flex-shrink-0">
                        <FiMessageCircle className="w-6 h-6" />
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {conv.otherUser?.nome || `Solicitação #${conv.id_solicitacao}`}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {formatDate(conv.lastMessageDate)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate mb-1">
                          {conv.lastMessage || 'Nova conversa'}
                        </p>
                        {conv.origem && conv.destino && (
                          <p className="text-xs text-gray-500 truncate">
                            {conv.origem} → {conv.destino}
                          </p>
                        )}
                      </div>

                      {/* Badge de não lidas */}
                      {unread > 0 && (
                        <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {unread > 9 ? '9+' : unread}
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

      {/* Modal de Chat */}
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
