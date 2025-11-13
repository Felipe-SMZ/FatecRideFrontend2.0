// features/chat/components/ChatMessage.jsx
import { useMemo } from 'react';
import { useAuthStore } from '@features/auth/stores/authStore';

/**
 * Componente para exibir uma mensagem individual do chat
 * @param {Object} message - Mensagem a ser exibida
 * @param {boolean} compact - Modo compacto (para chat flutuante)
 */
export function ChatMessage({ message, compact = false }) {
  const { user } = useAuthStore();
  
  const isMine = useMemo(() => {
    return message.id_sender === user?.id;
  }, [message.id_sender, user?.id]);

  const isSystemMessage = message.isSystemMessage || message.id_sender === null;

  const time = useMemo(() => {
    const date = new Date(message.data || message.timestamp);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, [message.data, message.timestamp]);

  // Mensagem do sistema (centralizada)
  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 max-w-[80%]">
          <p className="text-xs text-blue-800 text-center whitespace-pre-wrap">
            {message.message}
          </p>
          <span className="text-xs text-blue-600 block text-center mt-1">
            {time}
          </span>
        </div>
      </div>
    );
  }

  // Mensagem normal
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${compact ? 'mb-2' : 'mb-4'}`}>
      <div className={`${compact ? 'max-w-[80%]' : 'max-w-[70%]'} ${isMine ? 'order-2' : 'order-1'}`}>
        <div
          className={`rounded-2xl ${compact ? 'px-3 py-1.5' : 'px-4 py-2'} ${
            isMine
              ? 'bg-fatecride-blue text-white rounded-br-sm'
              : 'bg-gray-200 text-gray-900 rounded-bl-sm'
          }`}
        >
          <p className={`${compact ? 'text-xs' : 'text-sm'} break-words whitespace-pre-wrap`}>
            {message.message}
          </p>
        </div>
        <span className={`text-xs text-gray-500 mt-1 block ${isMine ? 'text-right' : 'text-left'}`}>
          {time}
        </span>
      </div>
    </div>
  );
}
