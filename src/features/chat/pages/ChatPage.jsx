// features/chat/pages/ChatPage.jsx
import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@shared/components/layout/Navbar';
import { Card } from '@shared/components/ui/Card';
import { Button } from '@shared/components/ui/Button';
import { Spinner } from '@shared/components/ui/Spinner';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { useChat } from '../hooks/useChat';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '@features/auth/stores/authStore';
import api from '@shared/lib/api';
import { FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

/**
 * Página de chat individual
 * Exibe mensagens de uma solicitação específica
 */
export function ChatPage() {
  const { id_solicitacao } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [receiverId, setReceiverId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestInfo, setRequestInfo] = useState(null);
  
  const { sendMessage, isConnected, markAsRead } = useChat();
  const { getMessages } = useChatStore();
  const { user } = useAuthStore();
  
  const messages = getMessages(parseInt(id_solicitacao));

  // Auto-scroll para última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll quando terminar de carregar
  useEffect(() => {
    if (!loading) {
      scrollToBottom();
    }
  }, [loading]);

  // Marcar como lida ao abrir
  useEffect(() => {
    markAsRead(parseInt(id_solicitacao));
  }, [id_solicitacao, markAsRead]);

  // Buscar informações da solicitação
  useEffect(() => {
    async function fetchRequestInfo() {
      try {
        setLoading(true);
        const response = await api.get(`/requests/${id_solicitacao}`);
        const request = response.data;
        setRequestInfo(request);
        
        // Determinar quem é o outro participante
        // Se eu sou o passageiro, o outro é o motorista; caso contrário, é o passageiro
        const otherId = request.id_passageiro === user?.id 
          ? request.id_motorista 
          : request.id_passageiro;
        
        setReceiverId(otherId);
      } catch (error) {
        console.error('Erro ao buscar informações da solicitação:', error);
        toast.error('Erro ao carregar conversa');
      } finally {
        setLoading(false);
      }
    }
    
    if (id_solicitacao && user?.id) {
      fetchRequestInfo();
    }
  }, [id_solicitacao, user]);

  // Determinar receiver_id das mensagens existentes (fallback)
  useEffect(() => {
    if (!receiverId && messages.length > 0) {
      const firstMsg = messages[0];
      const otherId = firstMsg.id_sender === user?.id ? firstMsg.id_receiver : firstMsg.id_sender;
      setReceiverId(otherId);
    }
  }, [messages, receiverId, user]);

  const handleSendMessage = async (messageText) => {
    if (!receiverId) {
      toast.error('Não foi possível identificar o destinatário');
      return;
    }

    try {
      await sendMessage({
        receiver: receiverId,
        id_solicitacao: parseInt(id_solicitacao),
        message: messageText
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    }
  };

  return (
    <>
      <Navbar showAuthButton={true} />
      
      <div className="min-h-[calc(100vh-80px)] bg-gray-50 flex flex-col">
        {/* Header do Chat */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
          <div className="container mx-auto max-w-4xl flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="p-2"
              aria-label="Voltar"
            >
              <FiArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                Chat - Solicitação #{id_solicitacao}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Área de Mensagens */}
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto max-w-4xl px-4 py-6">
            {!isConnected && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
                <FiAlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  Você está desconectado. As mensagens serão enviadas quando a conexão for restabelecida.
                </p>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner />
                <span className="ml-3 text-gray-600">Carregando conversa...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Nenhuma mensagem ainda</p>
                <p className="text-sm text-gray-400 mt-2">
                  Seja o primeiro a enviar uma mensagem!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((msg, index) => (
                  <ChatMessage key={msg.id || msg._id || index} message={msg} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input de Mensagem */}
        <div className="bg-white border-t border-gray-200 px-4 py-4">
          <div className="container mx-auto max-w-4xl">
            <ChatInput 
              onSend={handleSendMessage} 
              disabled={loading || !isConnected || !receiverId}
            />
          </div>
        </div>
      </div>
    </>
  );
}
