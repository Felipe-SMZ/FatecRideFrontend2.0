import { useState, useEffect, useRef } from 'react';
import { FiMessageCircle, FiMinus, FiX, FiChevronDown } from 'react-icons/fi';
import { useAuthStore } from '@features/auth/stores/authStore';
import { useChat } from '../hooks/useChat';
import { useChatStore } from '../stores/chatStore';
import { chatService } from '../services/chatService';
import { ridesService } from '@features/rides/services/ridesService';
import toast from 'react-hot-toast';

/**
 * ChatWidget - painel flutuante minimizável que aparece em qualquer página
 * - abre automaticamente ao receber evento 'sse-solicitacao-aceita'
 * - minimiza/expande ao clicar
 * - usa `useChat` para enviar mensagens (WS/REST)
 */
export function ChatWidget() {
  const { user, token, messagesToken } = useAuthStore();
  const { sendMessage, isConnected } = useChat();
  const getMessages = useChatStore(state => state.getMessages);
  const addMessage = useChatStore(state => state.addMessage);
  const unreadCountObj = useChatStore(state => state.unreadCount);

  const [open, setOpen] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [otherName, setOtherName] = useState('Motorista');
  const [receiverId, setReceiverId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');

  const messages = getMessages(requestId ? Number(requestId) : -1) || [];
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // abrir automaticamente quando uma solicitação é aceita (global event)
    const handler = (e) => {
      try {
        const data = e?.detail || e;
        const id = data?.solicitacaoId || data?.id_solicitacao || data?.id || null;
        const motoristaNome = data?.nome_motorista || data?.nomeMotorista || data?.motoristaNome || 'Motorista';
        const mid = data?.id_motorista || data?.idMotorista || null;
        if (!id) return;
        setRequestId(String(id));
        setOtherName(motoristaNome);
        if (mid) setReceiverId(Number(mid));
        setOpen(true);
      } catch (e) {
        // silencioso
      }
    };

    window.addEventListener('sse-solicitacao-aceita', handler);
    return () => window.removeEventListener('sse-solicitacao-aceita', handler);
  }, []);

  useEffect(() => {
    // auto-scroll
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  useEffect(() => {
    // foco automático no input quando expandir
    if (open) {
      setTimeout(() => { try { inputRef.current?.focus(); } catch(e) {} }, 120);
    }
  }, [open]);

  useEffect(() => {
    // quando trocar requestId, tentar recuperar receiverId via mapping se ausente
    let mounted = true;
    (async () => {
      if (!requestId) return;
      if (!receiverId) {
        try {
          const myUserId = user?.id_usuario ?? user?.id ?? user?.userId ?? null;
          const mapped = ridesService.getSolicitacaoMapping(requestId, myUserId);
          if (mapped) {
            setReceiverId(Number(mapped));
            return;
          }

          // tentar buscar na lista de pending (padrão do backend)
          try {
            const pending = await ridesService.getPending(0, 100);
            let arr = Array.isArray(pending) ? pending : pending?.content || [];
            if (!Array.isArray(arr)) arr = [arr];
            const match = arr.find(p => Number(p?.id_solicitacao || p?.id) === Number(requestId));
            const mid = match?.id_motorista ?? match?.idMotorista ?? match?.carona?.driver?.id ?? null;
            if (mid && mounted) {
              setReceiverId(Number(mid));
              return;
            }
          } catch (e) {
            // não crítico
          }

          // tentar buscar via carona/rides por id_carona
          try {
            // alguns payloads têm id_carona em vez de id_solicitacao
            const maybeCaronaId = requestId; // tentamos usar como id_solicitacao primeiro
            const ride = await ridesService.getRideById(maybeCaronaId).catch(() => null);
            const driverId = ride?.driver?.id || ride?.motorista?.id || ride?.id_motorista || null;
            if (driverId && mounted) {
              setReceiverId(Number(driverId));
              return;
            }
          } catch (e) {
            // ignore
          }
        } catch (e) {
          // ignore
        }
      }
    })();
    return () => { mounted = false; };
  }, [requestId]);

  // total de não-lidas
  const totalUnread = Object.values(unreadCountObj || {}).reduce((s, v) => s + (v || 0), 0);

  useEffect(() => {
    // Abrir automaticamente se chegarem mensagens não-lidas (comportamento tipo Facebook)
    if (totalUnread > 0 && !open) {
      // evitar abrir quando no chat full-page
      if (window.location.pathname && window.location.pathname.startsWith('/chat')) return;
      // abrir com pequeno delay para suavizar
      const t = setTimeout(() => setOpen(true), 350);
      return () => clearTimeout(t);
    }
  }, [totalUnread]);

  const handleSend = async (e) => {
    e?.preventDefault?.();
    if (!text.trim()) return;
    // tentar recuperar receiverId se estiver ausente antes de enviar
    let effectiveReceiver = receiverId ?? null;
    if (!effectiveReceiver && requestId) {
      try {
        const myUserId = user?.id_usuario ?? user?.id ?? user?.userId ?? null;
        const mapped = ridesService.getSolicitacaoMapping(requestId, myUserId);
        if (mapped) effectiveReceiver = Number(mapped);
        else {
          // tentar buscar pending
          const pending = await ridesService.getPending(0, 100).catch(() => null);
          let arr = Array.isArray(pending) ? pending : pending?.content || [];
          if (!Array.isArray(arr)) arr = [arr];
          const match = arr.find(p => Number(p?.id_solicitacao || p?.id) === Number(requestId));
          const mid = match?.id_motorista ?? match?.idMotorista ?? match?.carona?.driver?.id ?? null;
          if (mid) effectiveReceiver = Number(mid);
        }
      } catch (err) {
        // ignore
      }
    }
    if (!effectiveReceiver) {
      // backend espera um destinatário válido — avisar o usuário
      toast.error('Não foi possível identificar o destinatário da mensagem. Tente abrir o chat a partir da solicitação ou tente novamente mais tarde.');
      return;
    }

    const payload = {
      receiver: Number(effectiveReceiver),
      id_solicitacao: requestId ? Number(requestId) : null,
      message: text.trim(),
      data: new Date().toISOString()
    };
    try {
      await sendMessage(payload);
      setText('');
    } catch (err) {
      // optimistic local add
      const senderId = user?.id_usuario ?? user?.id ?? user?.userId ?? null;
      const localMsg = { id_sender: senderId, id_receiver: effectiveReceiver, id_solicitacao: payload.id_solicitacao, message: payload.message, data: payload.data, _id: `local-${Date.now()}` };
      try { addMessage(localMsg); } catch (e) {}
      setText('');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Minimized button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="relative bg-fatecride-blue text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform transform-gpu"
          aria-label="Abrir chat"
        >
          <FiMessageCircle size={22} />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full animate-pulse">
              {totalUnread}
            </span>
          )}
        </button>
      )}

      {/* Expanded panel */}
      {open && (
        <div className="w-[360px] md:w-[420px] h-[520px] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col transform transition-all duration-300 ease-out origin-bottom-right translate-y-2 opacity-100">
          <div className="bg-fatecride-blue text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold">{otherName?.[0]?.toUpperCase() || 'M'}</div>
              <div>
                <div className="font-semibold">{otherName}</div>
                <div className="text-xs text-white/90">{isConnected ? 'Online' : 'Offline'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded"><FiMinus /></button>
              <button onClick={() => { setOpen(false); setRequestId(null); }} className="p-1 hover:bg-white/10 rounded"><FiX /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 bg-gray-50 space-y-3 scrollbar-thin scrollbar-thumb-gray-300">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-fatecride-blue/10 text-fatecride-blue text-2xl font-bold mx-auto mb-3">💬</div>
                <p className="font-medium">Nenhuma mensagem ainda</p>
                <p className="text-sm">Comece a conversa com uma mensagem.</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const myId = user?.id_usuario ?? user?.id ?? user?.userId;
                const mine = Number(msg.id_sender) === Number(myId);
                return (
                  <div key={msg._id || i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`${mine ? 'bg-fatecride-blue text-white' : 'bg-white border border-gray-200 text-gray-800'} px-3 py-2 rounded-lg max-w-[78%] shadow-sm`}>
                      <div className="text-sm whitespace-pre-wrap">{msg.message}</div>
                      <div className="text-xs text-gray-400 mt-1 text-right">{new Date(msg.data || msg.timestamp || msg.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 border-t bg-white">
            <div className="flex gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva uma mensagem..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none" />
              <button type="submit" className="bg-fatecride-blue text-white px-3 py-2 rounded-lg" disabled={!text.trim()} aria-label="Enviar">Enviar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ChatWidget;
