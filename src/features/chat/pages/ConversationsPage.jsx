import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useChatStore } from '../stores/chatStore';
import chatService from '../services/chatService';
import { useAuthStore } from '@features/auth/stores/authStore';

export function ConversationsPage() {
  const { conversations, setConversations, unreadCount } = useChatStore();
  const { token, messagesToken } = useAuthStore();

  useEffect(() => {
    // Carregar conversas do backend na montagem da página.
    // Isso garante que a lista apareça mesmo que não haja mensagens recebidas via WebSocket ainda.
    let mounted = true;
    (async () => {
      try {
        const tokenToUse = messagesToken || token || useAuthStore.getState().messagesToken || useAuthStore.getState().token;
        console.debug('ConversationsPage: carregando conversas com token presente?', !!tokenToUse);
        const conv = await chatService.getConversations(tokenToUse);
        console.debug('ConversationsPage: conversas recebidas:', Array.isArray(conv) ? conv.length : typeof conv, conv && conv.slice ? conv.slice(0,3) : conv);
        if (mounted) {
          if (Array.isArray(conv) && conv.length > 0) {
            setConversations(conv);
          } else {
            // Fallback: construir conversas a partir do store local (mensagens já recebidas)
            try {
              const store = useChatStore.getState();
              const msgs = store.messages || {};
              const fallbackConvs = Object.keys(msgs).map((k) => {
                const arr = msgs[k] || [];
                const last = arr[arr.length - 1] || {};
                return {
                  id_solicitacao: Number(k),
                  lastMessage: last.message || last.mensagem || 'Sem mensagens',
                  lastMessageDate: last.data || last.timestamp || null,
                  unread: store.unreadCount?.[k] || 0
                };
              }).sort((a, b) => new Date(b.lastMessageDate) - new Date(a.lastMessageDate));

              if (fallbackConvs.length > 0) {
                console.debug('ConversationsPage: usando fallback a partir do chatStore.messages ->', fallbackConvs.length, 'conversas');
                setConversations(fallbackConvs);
              } else {
                console.debug('ConversationsPage: nenhum resultado da API e fallback vazio');
              }
            } catch (e) {
              console.error('ConversationsPage: erro ao construir fallback de conversas', e);
            }
          }
        }
      } catch (e) {
        console.error('ConversationsPage: erro ao carregar conversas', e);
      }
    })();

    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-base leading-6 tracking-wide">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-semibold text-fatecride-blue mb-4 leading-tight">Mensagens</h1>

        {(!conversations || conversations.length === 0) ? (
          <div className="text-gray-500">Nenhuma conversa encontrada</div>
        ) : (
          <ul className="space-y-3">
            {conversations.map((c) => {
              const unread = (unreadCount?.[c.id_solicitacao] || c.unread || 0) > 0;
              const readConfirmed = !!(c.lastMessageRead) || !unread;
              return (
                <li
                  key={c.id_solicitacao}
                  className={`p-4 bg-white rounded shadow-sm flex items-center justify-between transition-colors duration-150 ${unread ? 'bg-blue-50 ring-1 ring-blue-100' : ''}`}
                >
                  <div>
                    <div className={`font-medium ${unread ? 'text-fatecride-blue' : 'text-gray-800'}`}>Solicitação #{c.id_solicitacao}</div>
                    <div className={`text-sm ${unread ? 'text-blue-700 font-semibold' : 'text-gray-600'}`}>{c.lastMessage || 'Sem mensagens'}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {unread && (
                      <span className="px-2 py-1 bg-fatecride-blue text-white rounded-full text-sm">{unreadCount?.[c.id_solicitacao] || c.unread || 1}</span>
                    )}

                    {/* Confirmação de leitura: mostrar ícone de check quando última mensagem foi lida */}
                    {readConfirmed ? (
                      <span title="Última mensagem lida" className="text-green-600">
                        ✓
                      </span>
                    ) : (
                      <span title="Não lida" className="text-transparent">.</span>
                    )}

                    <Link to={`/chat/${c.id_solicitacao}`} className="text-fatecride-blue font-medium">Abrir</Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ConversationsPage;
