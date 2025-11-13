// features/chat/components/SimpleChatModal.jsx
import { useState, useEffect, useRef } from 'react';
import { FiX, FiSend } from 'react-icons/fi';
import { useChat } from '../hooks/useChat';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '@features/auth/stores/authStore';
import toast from 'react-hot-toast';

/**
 * Modal de chat simples - foca em funcionalidade básica
 */
export function SimpleChatModal({ requestId, otherUserName, receiverId, onClose }) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  
  const { sendMessage, isConnected } = useChat();
  const { getMessages } = useChatStore();
  const { user } = useAuthStore();
  
  console.log('🎨 SimpleChatModal renderizando - isConnected:', isConnected, 'tipo:', typeof isConnected);
  
  const messages = getMessages(parseInt(requestId)) || [];
  
  // Log de debug
  useEffect(() => {
    console.log('🔍 SimpleChatModal - Props recebidas:');
    console.log('  📋 requestId:', requestId);
    console.log('  👤 otherUserName:', otherUserName);
    console.log('  🎯 receiverId:', receiverId);
    console.log('  👥 user.id:', user?.id);
    console.log('  💬 messages:', messages.length);
    console.log('  🔌 isConnected:', isConnected);
  }, [requestId, otherUserName, receiverId, user, messages.length, isConnected]);

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    console.log('📝 Tentando enviar mensagem:', {
      message: message.trim(),
      isConnected,
      receiverId,
      requestId,
      canSend: !!(message.trim() && isConnected && receiverId)
    });
    
    if (!message.trim() || !isConnected) {
      console.warn('⚠️ Não pode enviar - message ou connection', { message: message.trim(), isConnected });
      return;
    }
    
    if (!receiverId) {
      console.error('❌ receiverId está undefined!');
      toast.error('Erro: ID do destinatário não encontrado');
      return;
    }
    
    // Formato correto esperado pelo backend WebSocket
    const messageData = {
      receiver: receiverId,           // ID do destinatário
      id_solicitacao: parseInt(requestId), // ID da solicitação
      message: message.trim(),        // Mensagem
      data: new Date().toISOString()  // Data/hora
    };
    
    console.log('📤 SimpleChatModal enviando:', messageData);
    
    sendMessage(messageData);
    setMessage('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg h-[600px] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`chat-title-${requestId}`}
      >
        {/* Header */}
        <div className="bg-fatecride-blue text-white px-4 py-3 flex items-center justify-between rounded-t-lg">
          <div>
            <h3 id={`chat-title-${requestId}`} className="font-semibold">Chat com {otherUserName}</h3>
            <p className="text-xs text-white/80" role="status" aria-live="polite">
              {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Fechar chat"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p>Nenhuma mensagem ainda</p>
              <p className="text-sm">Envie uma mensagem para começar!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMyMessage = msg.id_sender === user?.id;
              
              return (
                <div
                  key={msg.id || msg._id || index}
                  className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      isMyMessage
                        ? 'bg-fatecride-blue text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(msg.timestamp || msg.data).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t">
          {!isConnected && (
            <div className="mb-2 text-center text-sm text-red-600 bg-red-50 py-2 rounded">
              ⚠️ Desconectado do servidor. Aguarde reconexão...
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isConnected ? "Digite sua mensagem..." : "Aguardando conexão..."}
              aria-label="Mensagem"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-fatecride-blue"
              disabled={!isConnected}
            />
            <button
              type="submit"
              disabled={!message.trim() || !isConnected}
              className="bg-fatecride-blue text-white px-4 py-2 rounded-lg hover:bg-fatecride-blue-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              aria-label="Enviar mensagem"
            >
              <FiSend size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
