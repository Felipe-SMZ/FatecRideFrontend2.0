import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useChatStore } from '../stores/chatStore';

export function ConversationsPage() {
  const { conversations, setConversations, unreadCount } = useChatStore();

  useEffect(() => {
    // Placeholder: conversas podem ser carregadas via chatService.getConversations
    // Por enquanto usamos o estado do store que já é atualizado por mensagens recebidas
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Mensagens</h1>

        {(!conversations || conversations.length === 0) ? (
          <div className="text-gray-500">Nenhuma conversa encontrada</div>
        ) : (
          <ul className="space-y-3">
            {conversations.map((c) => (
              <li key={c.id_solicitacao} className="p-4 bg-white rounded shadow-sm flex items-center justify-between">
                <div>
                  <div className="font-medium">Solicitação #{c.id_solicitacao}</div>
                  <div className="text-sm text-gray-600">{c.lastMessage || 'Sem mensagens'}</div>
                </div>
                <div className="flex items-center gap-3">
                  {unreadCount?.[c.id_solicitacao] > 0 && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm">{unreadCount[c.id_solicitacao]}</span>
                  )}
                  <Link to={`/chat/${c.id_solicitacao}`} className="text-fatecride-blue font-medium">Abrir</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ConversationsPage;
