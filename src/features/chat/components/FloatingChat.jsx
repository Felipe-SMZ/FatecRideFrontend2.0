// features/chat/components/FloatingChat.jsx
import { useState, useEffect, useRef } from 'react';
import { FiMessageCircle, FiX, FiMinus, FiSend } from 'react-icons/fi';
import { ChatMessage } from './ChatMessage';
import { useChat } from '../hooks/useChat';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '@features/auth/stores/authStore';
import toast from 'react-hot-toast';

/**
 * Chat flutuante no canto inferior direito
 * Abre/fecha ao clicar no ícone
 */
export function FloatingChat({ id_solicitacao, otherUserName, onClose }) {
  console.log('\n🎬 ========== FLOATINGCHAT MONTANDO ==========');
  console.log('📥 Props recebidas:', { id_solicitacao, otherUserName });
  
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [receiverId, setReceiverId] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  
  const { sendMessage, isConnected } = useChat();
  const { getMessages } = useChatStore();
  const { user } = useAuthStore();
  
  const messages = getMessages(parseInt(id_solicitacao));
  console.log('💬 Mensagens para esta solicitação:', messages?.length || 0);
  console.log('🔌 WebSocket conectado?', isConnected);

  // Buscar informações da solicitação para identificar receiverId
  useEffect(() => {
    console.log('🔄 useEffect fetchRequestInfo executando...');
    
    async function fetchRequestInfo() {
      try {
        console.log('📡 Buscando info da solicitação:', id_solicitacao);
        const response = await fetch(`http://localhost:8080/requests/${id_solicitacao}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log('📥 Response status:', response.status);
        
        if (response.ok) {
          const request = await response.json();
          console.log('✅ Request info obtida:', request);
          const otherId = request.id_passageiro === user?.id 
            ? request.id_motorista 
            : request.id_passageiro;
          console.log('👥 Receiver ID calculado:', otherId);
          setReceiverId(otherId);
          console.log('✅ setReceiverId() executado!');
        } else {
          console.error('❌ Erro ao buscar request info - status:', response.status);
        }
      } catch (error) {
        console.error('❌ Erro ao buscar informações:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (id_solicitacao && user?.id) {
      fetchRequestInfo();
    }
  }, [id_solicitacao, user]);

  // Auto-scroll
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  const handleSend = async (e) => {
    e.preventDefault();
    console.log('\n📤 ========== ENVIAR MENSAGEM ==========');
    console.log('📝 Conteúdo:', message);
    console.log('👥 Receiver ID:', receiverId);
    console.log('🔌 Conectado?', isConnected);
    
    if (!message.trim() || !isConnected || !receiverId) {
      console.warn('⚠️ Não pode enviar - message:', !!message.trim(), 'connected:', isConnected, 'receiver:', receiverId);
      return;
    }

    try {
      console.log('📡 Enviando mensagem via WebSocket...');
      await sendMessage({
        receiver: receiverId,
        id_solicitacao: parseInt(id_solicitacao),
        message: message.trim()
      });
      console.log('✅ Mensagem enviada com sucesso!');
      console.log('======================================\n');
      setMessage('');
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };

  console.log('🎨 RENDER FloatingChat - isOpen:', isOpen, 'isMinimized:', isMinimized);

  if (!isOpen) {
    console.log('❌ isOpen=false, não renderizando');
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col bg-white rounded-lg shadow-2xl border border-gray-200"
      style={{ width: '350px', maxHeight: '500px' }}
      role="region"
      aria-label={otherUserName ? `Chat com ${otherUserName}` : `Chat da solicitação ${id_solicitacao}`}
    >
      {/* Header */}
      <div className="bg-fatecride-blue text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiMessageCircle className="w-5 h-5" />
          <div>
            <h3 id={`floating-chat-title-${id_solicitacao}`} className="font-semibold text-sm">
              {otherUserName || `Solicitação #${id_solicitacao}`}
            </h3>
            <div className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}
                aria-hidden="true"
              />
              <span className="text-xs opacity-90" role="status" aria-live="polite">
                {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:bg-white/20 rounded p-1 transition-colors"
            aria-label={isMinimized ? 'Restaurar chat' : 'Minimizar chat'}
          >
            <FiMinus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="hover:bg-white/20 rounded p-1 transition-colors"
            aria-label="Fechar chat"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50" style={{ maxHeight: '350px' }}>
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                <p>Nenhuma mensagem ainda</p>
                <p className="text-xs mt-1">Envie a primeira mensagem!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((msg, index) => (
                  <ChatMessage 
                    key={msg.id || msg._id || index} 
                    message={msg}
                    compact={true}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 border-t border-gray-200 bg-white rounded-b-lg" aria-labelledby={`floating-chat-title-${id_solicitacao}`}>
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                disabled={!isConnected}
                aria-label="Mensagem"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fatecride-blue text-sm"
              />
              <button
                type="submit"
                disabled={!isConnected || !message.trim()}
                className="bg-fatecride-blue hover:bg-fatecride-blue-dark text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiSend className="w-4 h-4" />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
