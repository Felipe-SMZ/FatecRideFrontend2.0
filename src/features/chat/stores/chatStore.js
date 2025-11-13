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
    
    set((state) => ({
      messages: {
        ...state.messages,
        [id_solicitacao]: [
          ...(state.messages[id_solicitacao] || []),
          {
            ...message,
            id: message._id || Date.now(),
            timestamp: message.data || new Date().toISOString()
          }
        ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      }
    }));
    
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
  },

  // Obter mensagens de uma conversa
  getMessages: (id_solicitacao) => {
    return get().messages[id_solicitacao] || [];
  },

  // Atualizar última mensagem da conversa
  updateConversationLastMessage: (id_solicitacao, message) => {
    set((state) => {
      const conversations = [...state.conversations];
      const index = conversations.findIndex(c => c.id_solicitacao === id_solicitacao);
      
      if (index >= 0) {
        conversations[index] = {
          ...conversations[index],
          lastMessage: message.message,
          lastMessageDate: message.data || message.timestamp,
          unread: conversations[index].unread || 0
        };
      } else {
        // Criar nova conversa se não existir
        conversations.push({
          id_solicitacao,
          lastMessage: message.message,
          lastMessageDate: message.data || message.timestamp,
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
