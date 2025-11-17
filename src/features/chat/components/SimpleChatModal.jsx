import { useState, useEffect, useRef } from 'react';
import { FiX, FiSend } from 'react-icons/fi';
import useChat from '../hooks/useChat';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '@features/auth/stores/authStore';
import toast from 'react-hot-toast';
import { chatService } from '../services/chatService';
import { ridesService } from '@features/rides/services/ridesService';

/**
 * Modal de chat simples - foca em funcionalidade básica
 */
export function SimpleChatModal({ requestId, otherUserName, receiverId, onClose }) {
  const [message, setMessage] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef(null);
  const [localReceiverId, setLocalReceiverId] = useState(receiverId ?? null);
  const inputRef = useRef(null);
  
  const { sendMessage, isConnected } = useChat();
  const { getMessages, setMessages } = useChatStore();
  const { user, token, messagesToken } = useAuthStore();
  
  console.log('🎨 SimpleChatModal renderizando:', { 
    requestId, 
    otherUserName, 
    receiverId, 
    isConnected 
  });
  
  const messages = getMessages(parseInt(requestId)) || [];
  
  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Tenta inferir receiverId a partir das mensagens já carregadas no store
  useEffect(() => {
    if (localReceiverId) return;
    try {
      const existing = getMessages(parseInt(requestId)) || [];
      if (existing && existing.length > 0) {
        const inferred = inferReceiverFromMessages(existing);
        if (inferred) {
          console.log('✅ Inferido receiverId a partir de mensagens locais:', inferred);
          setLocalReceiverId(inferred);
        }
      }
    } catch (e) {
      // silencioso
    }
  }, [requestId]);

  // Tenta recuperar mapeamento persistido localmente (id_solicitacao -> id_motorista)
  useEffect(() => {
    if (localReceiverId) return;
    try {
      const myUserId = user?.id_usuario ?? user?.id ?? user?.userId ?? null;
      const mapped = ridesService.getSolicitacaoMapping(requestId, myUserId);
      if (mapped) {
        console.log('✅ Found local mapping for request ->', mapped);
        setLocalReceiverId(Number(mapped));
      }
    } catch (e) {
      // silencioso
    }
  }, [requestId]);

  // Extrai número de várias representações (number, string, mongo $numberDecimal etc.)
  const extractNumber = (value) => {
    if (value == null) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }
    if (typeof value === 'object') {
      if (value.$numberDecimal) return Number(value.$numberDecimal);
      if (value.$numberInt) return Number(value.$numberInt);
      if (value.$numberLong) return Number(value.$numberLong);
      // fallback: try value.toString()
      const s = String(value);
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  // Inferir receiver a partir de mensagens: procura o outro participante (quem não for o user atual)
  const inferReceiverFromMessages = (msgs) => {
    try {
      const userId = user?.id_usuario ?? user?.id ?? user?.userId ?? null;
      if (!userId) return null;
      for (const m of msgs) {
        const sid = extractNumber(m.id_sender ?? m.idSender ?? m.sender ?? m.remetente ?? m.id_remetente);
        const rid = extractNumber(m.id_receiver ?? m.idReceiver ?? m.receiver ?? m.id_destinatario ?? m.id_destinatario);
        if (sid && rid) {
          if (sid !== Number(userId)) return sid;
          if (rid !== Number(userId)) return rid;
        }
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  // Auto-focus no campo de texto quando abrir
  useEffect(() => {
    setTimeout(() => {
      try { inputRef.current?.focus(); } catch (e) {}
    }, 120);
  }, []);

  // Sincroniza prop receiverId com estado local (permite mudanças posteriores)
  useEffect(() => {
    setLocalReceiverId(receiverId ?? null);
  }, [receiverId]);

  // **CARREGAR HISTÓRICO VIA REST** - CORREÇÃO: usa localReceiverId
  useEffect(() => {
    let mounted = true;
    
    async function loadHistory() {
        if (!requestId) {
          console.warn('⚠️ requestId ausente');
          setLoadingHistory(false);
          return;
        }

        // Se não tivermos receiverId local, tentar refetch de /solicitacao/pending
        if (!localReceiverId) {
          console.info('ℹ️ receiverId ausente — tentando refetch de /solicitacao/pending para obter id_motorista');
          try {
            const pending = await (await import('@features/rides/services/ridesService')).ridesService.getPending(0, 100);
            let pendingArray = [];
            if (Array.isArray(pending)) pendingArray = pending;
            else if (pending?.content && Array.isArray(pending.content)) pendingArray = pending.content;
            else if (pending && typeof pending === 'object') pendingArray = [pending];

            const match = pendingArray.find(p => Number(p?.id_solicitacao || p?.id) === Number(requestId));
            const mid = match?.id_motorista ?? match?.idMotorista ?? match?.carona?.driver?.id ?? null;
            const pid = match?.id_passageiro ?? match?.idPassageiro ?? match?.passageiro?.id ?? null;
            if (mid || pid) {
              console.log('✅ Recovered participants via /solicitacao/pending:', { mid, pid });
              // salvar mapping completo
              try { ridesService.saveSolicitacaoMapping(requestId, { motorista: mid ?? null, passageiro: pid ?? null }); } catch(e) {}
              // escolher o outro participante relativo ao usuário atual
              const myUserId = user?.id_usuario ?? user?.id ?? user?.userId ?? null;
              const other = ridesService.getSolicitacaoMapping(requestId, myUserId);
              if (other) setLocalReceiverId(Number(other));
              else if (mid) setLocalReceiverId(Number(mid));
            } else {
              console.info('ℹ️ /solicitacao/pending não retornou participantes para esta request');
            }
          } catch (err) {
            console.warn('⚠️ Falha ao refetch /solicitacao/pending:', err?.message || err);
          }
        }

      // Verificar se já tem mensagens carregadas
      const existing = getMessages(parseInt(requestId));
      if (existing && existing.length > 0) {
        console.log('✅ Mensagens já carregadas no store:', existing.length);
        setLoadingHistory(false);
        return;
      }

      try {
        // Só tenta carregar histórico quando tivermos um receiverId utilizável
        if (!localReceiverId) {
          console.info('ℹ️ Ainda sem receiverId — adiando carregamento do histórico até recuperá-lo (ou enviar primeira mensagem)');
          setLoadingHistory(false);
          return;
        }

        console.log('📡 Carregando histórico via REST...');
        console.log('  👥 receiverId:', localReceiverId);
        console.log('  📋 requestId:', requestId);

        // CORREÇÃO: Buscar pelo ID do outro usuário, usando token específico para mensagens quando disponível
        const tokenToUse = messagesToken || token;
        const historico = await chatService.getHistoricoConversa(Number(localReceiverId), tokenToUse);

        console.log('✅ Histórico recebido:', Array.isArray(historico) ? historico.length : 0, 'mensagens');

        if (mounted && Array.isArray(historico) && historico.length > 0) {
          // Filtrar mensagens da solicitação específica
          const mensagensDaSolicitacao = historico.filter(
            msg => Number(msg.id_solicitacao) === Number(requestId)
          );

          console.log('📨 Mensagens desta solicitação:', mensagensDaSolicitacao.length);

          setMessages(parseInt(requestId), mensagensDaSolicitacao);
        }

      } catch (err) {
        console.error('❌ Erro ao carregar histórico:', err);
        if (mounted) {
          toast.error('Não foi possível carregar histórico de mensagens');
        }
      } finally {
        if (mounted) {
          setLoadingHistory(false);
        }
      }
    }

    loadHistory();

    return () => { 
      mounted = false; 
    };
  }, [receiverId, requestId]);

  const handleSendMessage = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    console.log('📤 Tentando enviar mensagem:', {
      message: message.trim(),
      isConnected,
      receiverId,
      requestId
    });
    
    if (!message.trim()) {
      console.warn('⚠️ Mensagem vazia');
      return;
    }
    
    // Antes de enviar, tentar recuperar receiverId se ainda não tivermos (ex.: aberto a partir de "Mensagens")
    const tryRecoverReceiver = async () => {
      if (localReceiverId) return localReceiverId;
      try {
        const { ridesService } = await import('@features/rides/services/ridesService');
        const latestPending = await ridesService.getPending(0, 100);
        let pendingArray = [];
        if (Array.isArray(latestPending)) pendingArray = latestPending;
        else if (latestPending?.content && Array.isArray(latestPending.content)) pendingArray = latestPending.content;
        else if (latestPending && typeof latestPending === 'object') pendingArray = [latestPending];

        const match = pendingArray.find(p => Number(p?.id_solicitacao || p?.id) === Number(requestId));
        const mid = match?.id_motorista ?? match?.idMotorista ?? match?.carona?.driver?.id ?? null;
        const pid = match?.id_passageiro ?? match?.idPassageiro ?? match?.passageiro?.id ?? null;
        if (mid || pid) {
          console.log('✅ (recover) Encontrado participante(s) via /solicitacao/pending antes do envio:', { mid, pid });
          try { ridesService.saveSolicitacaoMapping(requestId, { motorista: mid ?? null, passageiro: pid ?? null }); } catch (e) {}
          const myUserId = user?.id_usuario ?? user?.id ?? user?.userId ?? null;
          const other = ridesService.getSolicitacaoMapping(requestId, myUserId);
          if (other) {
            setLocalReceiverId(Number(other));
            return Number(other);
          }
          // fallback: prefer motorista
          if (mid) {
            setLocalReceiverId(Number(mid));
            return Number(mid);
          }
        }
      } catch (err) {
        console.warn('⚠️ (recover) Falha ao tentar recuperar id_motorista antes do envio:', err?.message || err);
      }
      return null;
    };

    // Tentar recuperar receiverId de forma síncrona antes de montar payload
    const recovered = await tryRecoverReceiver();
    if (recovered) {
      console.log('✅ receiverId recuperado antes do envio:', recovered);
    }
    // Não bloquear envio quando WebSocket estiver desconectado — temos fallback REST
    if (!isConnected) {
      console.info('ℹ️ WebSocket desconectado — usando fallback REST se necessário');
    }

    // IMPORTANTE: usar o valor recuperado imediatamente (recovered) porque setLocalReceiverId é assíncrono
    const effectiveReceiver = recovered ?? localReceiverId ?? receiverId ?? null;
    if (effectiveReceiver == null) {
      console.warn('⚠️ receiverId ausente mesmo após tentativa de recuperação — enviando mensagem vinculada apenas à solicitação (backend deve reconciliar destinatário)');
    }
    
    // Formato correto esperado pelo backend WebSocket
    // IMPORTANTE: só envie o campo `receiver` quando existir um id válido.
    // Evita `Number(null) -> 0` que faz o backend procurar usuário id=0.
    const messageData = {
      ...(effectiveReceiver != null && { receiver: Number(effectiveReceiver) }),
      id_solicitacao: requestId ? Number(requestId) : null,
      message: message.trim(),
      data: new Date().toISOString()
    };
    
    console.log('📤 Enviando mensagem:', messageData);

    // Tenta enviar via WebSocket; se não, faz fallback via REST
    (async () => {
        if (isConnected) {
        try {
          sendMessage(messageData);
          setMessage('');
          console.log('✅ Mensagem enviada via WebSocket (enfileirada localmente)');
          // A confirmação do servidor virá via evento WS com tipo 'mensagem_confirmada' ou 'mensagem_recebida'
          return;
        } catch (error) {
          console.warn('⚠️ Falha ao enviar via WebSocket, tentando REST fallback:', error?.message || error);
        }
      }

      // Fallback: enviar por REST
        try {
        console.log('📡 Fallback REST: enviando mensagem via chatService.sendMessage', messageData);
        const resp = await chatService.sendMessage(messageData);
        console.log('📥 Fallback REST: resposta recebida', resp);
        // optimistic update local
        const senderId = user?.id_usuario ?? user?.id ?? user?.userId ?? null;
        const localMsg = {
          id_sender: senderId,
          id_receiver: effectiveReceiver != null ? Number(effectiveReceiver) : null,
          id_solicitacao: messageData.id_solicitacao,
          message: messageData.message,
          data: messageData.data,
          _id: `rest-${Date.now()}`
        };
        const { addMessage } = useChatStore.getState();
        addMessage(localMsg);
        setMessage('');
        console.log('✅ Mensagem enviada via REST e adicionada localmente', resp);
        } catch (err) {
        console.error('❌ Erro ao enviar via REST:', err);
        toast.error('Erro ao enviar mensagem');
      }
    })();
  };

  // Envio ao pressionar Enter (Shift+Enter para newline)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
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
            <h3 id={`chat-title-${requestId}`} className="font-semibold">
              Chat com {otherUserName}
            </h3>
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
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fatecride-blue"></div>
              <span className="ml-3 text-gray-600">Carregando...</span>
            </div>
          ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-fatecride-blue/10 text-fatecride-blue text-2xl font-bold mx-auto mb-3">💬</div>
                <p className="font-medium">Nenhuma mensagem ainda</p>
                <p className="text-sm">Envie a primeira mensagem para começar a conversar.</p>
              </div>
          ) : (
              messages.map((msg, index) => {
                const userId = user?.id_usuario ?? user?.id ?? user?.userId;
                const isMyMessage = Number(msg.id_sender) === Number(userId);
                const prev = messages[index - 1];
                const showAvatar = !prev || Number(prev.id_sender) !== Number(msg.id_sender);
                const timeLabel = new Date(msg.data || msg.timestamp || msg.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={msg._id || index} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} items-end`}> 
                    {!isMyMessage && showAvatar && (
                      <div className="mr-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-700">{otherUserName?.[0]?.toUpperCase() || '?'}</div>
                      </div>
                    )}

                    <div className="max-w-[78%]">
                      <div className={`${isMyMessage ? 'bg-fatecride-blue text-white' : 'bg-white border border-gray-200 text-gray-800'} px-4 py-2 rounded-lg shadow-sm`}> 
                        <p className="text-sm break-words whitespace-pre-wrap">{msg.message}</p>
                      </div>
                      <div className="text-xs mt-1 flex items-center gap-2 text-gray-500">
                        <span>{timeLabel}</span>
                        {!isMyMessage && <span className="ml-1">{showAvatar ? otherUserName : ''}</span>}
                      </div>
                    </div>
                  </div>
                );
              })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
          {!isConnected && (
            <div className="mb-2 text-center text-sm text-red-600 bg-red-50 py-2 rounded">
              ⚠️ Desconectado do servidor. Aguarde reconexão...
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isConnected ? "Digite sua mensagem (Enter envia, Shift+Enter nova linha)..." : "Aguardando conexão (envio por REST disponível)"}
              aria-label="Mensagem"
              rows={2}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-fatecride-blue disabled:bg-gray-100 resize-none"
              disabled={loadingHistory}
            />
            <button
              type="submit"
              disabled={!message.trim() || loadingHistory}
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

export default SimpleChatModal;
