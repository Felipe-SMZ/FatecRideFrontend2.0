// features/chat/stores/chatStore.js
import { create } from 'zustand';

/**
 * Store Zustand para gerenciar estado do chat
 * Armazena mensagens, conversas e estado de conexão
 */
export const useChatStore = create((set, get) => ({
  // Estado
  messages: {}, // { [id_solicitacao]: [mensagens] }
  conversations: [], // Lista de conversas (solicitações com última mensagem)
  isConnected: false,
  unreadCount: {},

  // Adicionar mensagem
  addMessage: (message) => {
    console.log('📥 chatStore.addMessage chamado:', message);
    const { id_solicitacao } = message;
    console.log('  📋 id_solicitacao:', id_solicitacao);
    // Evitar duplicatas: checar por id único (_id ou id) ou por combinação de campos
    set((state) => {
      const existing = state.messages[id_solicitacao] || [];

      // Normalizar id candidato (preferir _id do payload quando disponível)
      const incomingId = message._id ?? message.id ?? null;
      const incomingTimestamp = message.data ?? message.timestamp ?? new Date().toISOString();

      // Checar existência por id
      if (incomingId) {
        const foundById = existing.find(m => String(m.id) === String(incomingId) || String(m._id) === String(incomingId));
        if (foundById) {
          console.log('⚠️ Mensagem duplicada detectada por id, ignorando:', incomingId);
          return { messages: { ...state.messages } };
        }
      }

      // Checar por combinação (sender + texto + timestamp aproximado)
      const duplicateByContent = existing.find((m) => {
        try {
          const sameSender = Number(m.id_sender) === Number(message.id_sender);
          const sameText = (m.message || '').trim() === (message.message || '').trim();
          const t1 = new Date(m.timestamp || m.data || m.dataHora || 0).getTime();
          const t2 = new Date(incomingTimestamp).getTime();
          const timeDiff = Math.abs(t1 - t2);
          // considerar duplicata se tempo for muito próximo (<= 2000ms)
          return sameSender && sameText && timeDiff <= 2000;
        } catch (e) {
          return false;
        }
      });

      if (duplicateByContent) {
        console.log('⚠️ Mensagem duplicada detectada por conteúdo/timestamp, ignorando');
        return { messages: { ...state.messages } };
      }

      // Não é duplicata — adicionar
      const newMsg = {
        ...message,
        id: incomingId ?? Date.now(),
        timestamp: incomingTimestamp,
        read: !!(message.read || message.lida || message.lido || message.readAt)
      };

      return {
        messages: {
          ...state.messages,
          [id_solicitacao]: [...existing, newMsg].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        }
      };
    });
    
    console.log('✅ Mensagem adicionada ao chatStore');

    // Atualizar última mensagem da conversa
    get().updateConversationLastMessage(id_solicitacao, message);
  },

  // Definir mensagens de uma conversa (ao carregar histórico)
  setMessages: (id_solicitacao, messages) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [id_solicitacao]: messages.sort((a, b) => 
          new Date(a.timestamp || a.data) - new Date(b.timestamp || b.data)
        )
      }
    }));

    // Após definir o histórico, atualizar/metadados da conversa para aparecer na lista
    try {
      const msgs = messages || [];
      const last = msgs[msgs.length - 1];
      if (last) {
        // usar a função existente para atualizar a última mensagem da conversa
        const numericId = Number(id_solicitacao);
        // Chamamos diretamente a mutação para manter consistência
        get().updateConversationLastMessage(numericId, last);
      }
    } catch (e) {
      console.warn('chatStore.setMessages -> falha ao atualizar conversa após setMessages', e?.message || e);
    }
  },

  // Obter mensagens de uma conversa
  getMessages: (id_solicitacao) => {
    return get().messages[id_solicitacao] || [];
  },

  // Atualizar última mensagem da conversa
  updateConversationLastMessage: (id_solicitacao, message) => {
    set((state) => {
      const conversations = [...state.conversations];
      const targetId = Number(id_solicitacao);
      const index = conversations.findIndex(c => Number(c.id_solicitacao) === targetId);
      
      if (index >= 0) {
        conversations[index] = {
          ...conversations[index],
          lastMessage: message.message,
          lastMessageDate: message.data || message.timestamp,
          lastMessageId: message._id ?? message.id ?? null,
          lastMessageRead: !!(message.read || message.lida || message.lido || message.readAt),
          unread: conversations[index].unread || 0
        };
      } else {
        // Criar nova conversa se não existir
        conversations.push({
          id_solicitacao: targetId,
          lastMessage: message.message,
          lastMessageDate: message.data || message.timestamp,
          lastMessageId: message._id ?? message.id ?? null,
          lastMessageRead: !!(message.read || message.lida || message.lido || message.readAt),
          unread: 0
        });
      }

      return { conversations: conversations.sort((a, b) => 
        new Date(b.lastMessageDate) - new Date(a.lastMessageDate)
      )};
    });
  },

  // Definir conversas
  setConversations: (conversations) => {
    set({ conversations });
  },

  // Marcar como lida
  markAsRead: (id_solicitacao) => {
    set((state) => ({
      unreadCount: {
        ...state.unreadCount,
        [id_solicitacao]: 0
      }
    }));
  },

  // Incrementar não lidas
  incrementUnread: (id_solicitacao) => {
    set((state) => ({
      unreadCount: {
        ...state.unreadCount,
        [id_solicitacao]: (state.unreadCount[id_solicitacao] || 0) + 1
      }
    }));
  },

  // Definir estado de conexão
  setConnected: (isConnected) => {
    console.log('🏪 chatStore.setConnected chamado com:', isConnected);
    set({ isConnected });
    console.log('✅ chatStore.isConnected agora é:', isConnected);
  },

  // Limpar tudo
  clearAll: () => {
    set({
      messages: {},
      conversations: [],
      isConnected: false,
      unreadCount: {}
    });
  }
}));

export default useChatStore;

// --- Persistência e hidratação (localStorage) ---
try {
  const RAW = localStorage.getItem('chat_state');
  if (RAW) {
    try {
      const parsed = JSON.parse(RAW);
      // Aplicar somente chaves esperadas
      const safe = {
        messages: parsed.messages || {},
        conversations: parsed.conversations || [],
        unreadCount: parsed.unreadCount || {}
      };
      // Atualizar estado inicial do store com segurança
      useChatStore.setState(safe, true);
      console.debug('chatStore: estado hidratado a partir de localStorage', Object.keys(safe.messages).length, 'conversas');
    } catch (e) {
      console.warn('chatStore: falha ao parsear chat_state do localStorage, ignorando', e?.message || e);
    }
  }
} catch (e) {
  // Em ambientes sem localStorage isso pode falhar; não bloquear a app
  console.warn('chatStore: não foi possível acessar localStorage para hidratação', e?.message || e);
}

// Inscrever para salvar no localStorage quando partes importantes mudarem
try {
  useChatStore.subscribe(
    (state) => ({ messages: state.messages, conversations: state.conversations, unreadCount: state.unreadCount }),
    (sel) => {
      try {
        localStorage.setItem('chat_state', JSON.stringify(sel));
      } catch (e) {
        console.warn('chatStore: falha ao salvar estado no localStorage', e?.message || e);
      }
    }
  );
} catch (e) {
  console.warn('chatStore: subscribe não disponível ou falhou', e?.message || e);
}
