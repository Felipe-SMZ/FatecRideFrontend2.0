// features/chat/components/ChatWidget.jsx
import { useState } from 'react';
import { FiMessageCircle } from 'react-icons/fi';
import { FloatingChat } from './FloatingChat';
import { useChatStore } from '../stores/chatStore';

/**
 * Widget de chat flutuante - ícone que abre o chat
 * Mostra badge de mensagens não lidas
 */
export function ChatWidget() {
  const [openChats, setOpenChats] = useState([]);
  const { unreadCount } = useChatStore();

  // Calcular total de não lidas
  const totalUnread = Object.values(unreadCount).reduce((sum, count) => sum + count, 0);

  const openChat = (id_solicitacao, otherUserName) => {
    if (!openChats.find(chat => chat.id === id_solicitacao)) {
      setOpenChats([...openChats, { id: id_solicitacao, name: otherUserName }]);
    }
  };

  const closeChat = (id_solicitacao) => {
    setOpenChats(openChats.filter(chat => chat.id !== id_solicitacao));
  };

  return (
    <>
      {/* Ícone flutuante (desabilitado por enquanto - será controlado pelas páginas) */}
      {/* {totalUnread > 0 && (
        <button
          className="fixed bottom-4 right-4 z-40 bg-fatecride-blue hover:bg-fatecride-blue-dark text-white rounded-full p-4 shadow-lg transition-all"
          onClick={() => {}}
        >
          <FiMessageCircle className="w-6 h-6" />
          {totalUnread > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {totalUnread > 9 ? '9+' : totalUnread}
            </div>
          )}
        </button>
      )} */}

      {/* Chats abertos */}
      <div className="fixed bottom-0 right-0 flex flex-col-reverse gap-2 p-4" style={{ zIndex: 50 }}>
        {openChats.map(chat => (
          <FloatingChat
            key={chat.id}
            id_solicitacao={chat.id}
            otherUserName={chat.name}
            onClose={() => closeChat(chat.id)}
          />
        ))}
      </div>
    </>
  );
}
