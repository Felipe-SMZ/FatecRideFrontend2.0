import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useChatStore } from '../stores/chatStore';
import { chatService } from '../services/chatService';
import { useAuthStore } from '@features/auth/stores/authStore';
import { ridesService } from '@features/rides/services/ridesService';
import { useChat } from '../hooks/useChat';

export function ConversationsPage() {
  const { conversations, setConversations, unreadCount } = useChatStore();
  const { user, token, messagesToken } = useAuthStore();
  const { isConnected } = useChat(); // Mantém o WebSocket vivo nesta página
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar conversas do backend na montagem da página.
    // Isso garante que a lista apareça mesmo que não haja mensagens recebidas via WebSocket ainda.
    let mounted = true;
    (async () => {
      try {
        const tokenToUse = messagesToken || token || useAuthStore.getState().messagesToken || useAuthStore.getState().token;
        
        console.log('📡 ConversationsPage: Carregando lista de conversas...');
        const chatResponse = await chatService.getConversations(tokenToUse);
        const chatData = Array.isArray(chatResponse?.data) ? chatResponse.data : (Array.isArray(chatResponse) ? chatResponse : []);
        
        const CACHE_KEY = 'fatecride_user_names_cache';
        const getCachedNames = () => JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
        const saveNamesToCache = (newNames) => {
          const current = getCachedNames();
          localStorage.setItem(CACHE_KEY, JSON.stringify({ ...current, ...newNames }));
        };

        const nameMap = getCachedNames();

        try {
          const myId = user?.id_usuario || user?.id || user?.userId;
          
          console.log('🔍 ConversationsPage: Buscando nomes na API Java...');
          const [pending, history, accepted] = await Promise.all([
            ridesService.getPending(0, 50).catch(() => []),
            ridesService.getPassengerHistory(0, 50).catch(() => []),
            (ridesService.getAccepted ? ridesService.getAccepted() : ridesService.getPending(0, 100)).catch(() => [])
          ]);

          const allRides = [
            ...(Array.isArray(pending) ? pending : (pending?.content || [])),
            ...(Array.isArray(history) ? history : (history?.content || [])),
            ...(Array.isArray(accepted) ? accepted : (accepted?.content || []))
          ];

          const newNamesFound = {};
          allRides.forEach(r => {
            const id = r.id_solicitacao || r.id;
            const isDriver = Number(r.id_motorista || r.motorista?.id) === Number(myId);
            const name = isDriver
              ? (r.nome_passageiro || r.passageiro?.nome || r.passageiroNome) 
              : (r.nome_motorista || r.motorista?.nome || r.motoristaNome);
            
            if (name && id) {
              nameMap[id] = name;
              newNamesFound[id] = name;
            }
          });
          
          if (Object.keys(newNamesFound).length > 0) saveNamesToCache(newNamesFound);

        } catch (e) {
          console.warn('ConversationsPage: erro ao enriquecer nomes', e);
        }

        if (mounted) {
          if (chatData.length > 0) {
            const normalized = chatData.map(c => ({
              id_solicitacao: c.id_solicitacao || c.lastMessage?.id_solicitacao,
              partnerId: c.partnerId,
              // Tenta buscar o nome pelo ID da solicitação ou pelo partnerId
              otherUserName: 
                nameMap[c.id_solicitacao] || 
                nameMap[c.lastMessage?.id_solicitacao] || 
                null,
              lastMessage: c.lastMessage?.message || c.lastMessage?.mensagem || 'Sem mensagens',
              lastMessageDate: c.lastMessage?.data || c.lastMessage?.timestamp,
              unread: c.unreadCount || 0,
              lastMessageRead: c.lastMessage?.lida || false
            }));

            console.log('✅ ConversationsPage: conversas normalizadas:', normalized.length);
            setConversations(normalized);
          } else {
            // Se a API falhar ou estiver vazia, tenta usar o que já está no Zustand
            const msgsState = useChatStore.getState();
            const msgs = msgsState.messages || {};
            const fallbackConvs = Object.keys(msgs).map((k) => {
                const arr = msgs[k] || [];
                const last = arr[arr.length - 1] || {};
                return {
                  id_solicitacao: Number(k),
                  lastMessage: last.message || last.mensagem || '',
                  lastMessageDate: last.data || last.timestamp || new Date().toISOString(),
                  unread: msgsState.unreadCount?.[k] || 0,
                  otherUserName: nameMap[Number(k)] || null
                };
              }).sort((a, b) => new Date(b.lastMessageDate) - new Date(a.lastMessageDate));

              if (fallbackConvs.length > 0) {
                setConversations(fallbackConvs);
              } else {
                console.debug('ConversationsPage: nenhum resultado da API e fallback vazio');
              }
          }
        }
      } catch (e) {
        console.error('ConversationsPage: erro ao carregar conversas', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [user, token]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-base leading-6 tracking-wide">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-fatecride-blue leading-tight">Mensagens</h1>
          <div className="flex items-center gap-2">
             <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></span>
             <span className="text-xs text-gray-500 font-medium uppercase">{isConnected ? 'Online' : 'Conectando...'}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-fatecride-blue"></div>
            <p className="mt-4 text-gray-500 font-medium">Sincronizando conversas...</p>
          </div>
        ) : (!conversations || conversations.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-4xl">💬</div>
            <p className="text-gray-500 font-medium text-lg">Nenhuma conversa encontrada</p>
            <p className="text-gray-400 text-sm mt-1">Suas mensagens aparecerão aqui quando você solicitar ou oferecer uma carona.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {conversations.map((c, index) => {
              const solId = c.id_solicitacao;
              const unreadNum = unreadCount?.[solId] || c.unread || 0;
              const isUnread = unreadNum > 0;
              
              // Formatação de data amigável
              const date = new Date(c.lastMessageDate);
              const dateLabel = isNaN(date.getTime()) ? '' : date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

              return (
                <Link 
                  key={`${solId}-${c.partnerId || index}`} 
                  to={`/chat/${solId}`}
                  className={`block p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-fatecride-blue/30 hover:shadow-md transition-all duration-200 ${isUnread ? 'bg-blue-50/50 border-blue-100' : ''}`}
                >
                  <li className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-bold text-sm uppercase tracking-tight ${isUnread ? 'text-fatecride-blue' : 'text-gray-500'}`}>
                          {c.otherUserName || `Solicitação #${solId}`}
                        </span>
                        {dateLabel && (
                          <>
                            <span className="text-[10px] text-gray-400">•</span>
                            <span className="text-xs text-gray-400">{dateLabel}</span>
                          </>
                        )}
                      </div>
                      <div className={`text-base truncate ${isUnread ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
                        {c.lastMessage}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 flex-shrink-0">
                      {isUnread && (
                        <span className="flex items-center justify-center min-w-[24px] h-[24px] px-1.5 bg-fatecride-blue text-white rounded-full text-xs font-bold shadow-sm animate-pulse">
                          {unreadNum}
                        </span>
                      )}
                      
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-fatecride-blue transition-colors group-hover:bg-fatecride-blue group-hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </li>
                </Link>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ConversationsPage;
