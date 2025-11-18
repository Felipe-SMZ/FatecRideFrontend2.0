// features/chat/services/chatService.js
import api from '@shared/lib/api';

// Base URL do serviço de mensagens (backend refatorado para o novo contrato)
// Preferimos usar rota relativa `/api/messages` para passar pelo proxy do Vite
// e evitar problemas de CORS durante desenvolvimento.
// Novo contrato: backend em :9000. Se a env estiver vazia, apontamos para o backend direto.
// Base URL do serviço de mensagens (novo contrato)
// Preferência em dev: usar rota relativa `/api/messages` para passar pelo proxy do Vite
// e evitar problemas de CORS. Em produção ou quando `VITE_MESSAGES_API_URL` for definido,
// usa o valor explícito.
const rawBase = import.meta.env.VITE_MESSAGES_API_URL || import.meta.env.VITE_MENSAGENS_API_URL || (import.meta.env.DEV ? '/api/messages' : 'http://localhost:9000/api/messages');
// Garantir que a base termine com '/api/messages' para evitar chamadas diretas indevidas
let MENSAGENS_BASE = rawBase;
try {
  const trimmed = String(rawBase).replace(/\/$/, '');
  if (trimmed.startsWith('http') && !trimmed.includes('/api/messages')) {
    MENSAGENS_BASE = `${trimmed}/api/messages`;
    console.debug('chatService: ajustando MENSAGENS_BASE para incluir /api/messages ->', MENSAGENS_BASE);
  } else {
    MENSAGENS_BASE = trimmed || '/api/messages';
  }
} catch (e) {
  MENSAGENS_BASE = '/api/messages';
}

export const chatService = {
  /**
   * Buscar histórico de conversa com outro usuário (id_usuario)
   * @param {number} otherUserId
   */
  async getHistoricoConversa(otherUserId, token) {
    try {
      const id = Number(otherUserId);
      if (!id) return [];
      const base = MENSAGENS_BASE.replace(/\/$/, '');
      const headers = { Authorization: token ? `Bearer ${token}` : (localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : undefined) };

      // Novo endpoint: GET /api/messages/with/:userId?page=1&limit=50
      // Se a base for absoluta (ex: http://localhost:9000/api/messages) chamamos diretamente o backend
      let url;
      if (/^https?:\/\//.test(base)) {
        url = `${base}/with/${id}?page=1&limit=200`;
        console.debug('chatService.getHistoricoConversa -> GET (absolute)', url);
        const resp = await api.get(url, { headers });
        const data = resp?.data;

        // Normalizar formas possíveis de retorno
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (data.messages && Array.isArray(data.messages)) return data.messages;
        if (data.content && Array.isArray(data.content)) return data.content;
        if (data.data && Array.isArray(data.data)) return data.data;
        for (const k of Object.keys(data)) {
          if (Array.isArray(data[k])) return data[k];
        }
        return [];
      } else {
        // caminho relativo via proxy do Vite
        const pathOnly = base.replace(/^https?:\/\/[^/]+/, '');
        url = `${pathOnly}/with/${id}?page=1&limit=200`;
        console.debug('chatService.getHistoricoConversa -> GET (relative)', url, ' (via api baseURL)', api.defaults.baseURL);
        const resp = await api.get(url, { headers });
        const data = resp?.data;
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (data.messages && Array.isArray(data.messages)) return data.messages;
        if (data.content && Array.isArray(data.content)) return data.content;
        if (data.data && Array.isArray(data.data)) return data.data;
        for (const k of Object.keys(data)) {
          if (Array.isArray(data[k])) return data[k];
        }
        return [];
      }
    } catch (error) {
      // Erro pode vir do CORS / network / axios; log completo para depuração temporária
      try { console.error('Erro ao buscar histórico de conversa:', error?.response?.status, error?.response?.data || error.message || error); } catch(e) { console.error('Erro desconhecido ao logar erro do histórico:', e); }
      return [];
    }
  },

  /**
   * Buscar conversas (últimas mensagens) do usuário
   */
  async getConversations(token) {
    try {
      const base = MENSAGENS_BASE.replace(/\/$/, '');
      const headers = { Authorization: token ? `Bearer ${token}` : (localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : undefined) };
      let url;
      if (/^https?:\/\//.test(base)) {
        url = `${base}/conversations`;
        console.debug('chatService.getConversations -> GET (absolute)', url);
        const resp = await api.get(url, { headers });
        const data = resp?.data;
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (data.conversations && Array.isArray(data.conversations)) return data.conversations;
        if (data.conversas && Array.isArray(data.conversas)) return data.conversas;
        return [];
      } else {
        const pathOnly = base.replace(/^https?:\/\/[^/]+/, '');
        url = `${pathOnly}/conversations`;
        console.debug('chatService.getConversations -> GET (relative)', url, ' (via api baseURL)', api.defaults.baseURL);
        const resp = await api.get(url, { headers });
        const data = resp?.data;
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (data.conversations && Array.isArray(data.conversations)) return data.conversations;
        if (data.conversas && Array.isArray(data.conversas)) return data.conversas;
        return [];
      }
    } catch (error) {
      console.error('Erro ao buscar conversas:', error?.response?.status, error?.response?.data || error.message || error);
      return [];
    }
  },

  /**
   * Envia mensagem via REST (fallback)
   */
  async sendMessage(message, token) {
    try {
      const base = MENSAGENS_BASE.replace(/\/$/, '');
      const headers = { Authorization: token ? `Bearer ${token}` : (localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : undefined) };
      let url;
      if (/^https?:\/\//.test(base)) {
        url = `${base}`; // POST /api/messages
        console.debug('chatService.sendMessage -> POST (absolute)', url, message);
        const resp = await api.post(url, message, { headers });
        console.log('🟢 chatService.sendMessage -> resposta REST:', resp.status, resp.data);
        return resp.data;
      } else {
        const pathOnly = base.replace(/^https?:\/\/[^/]+/, '');
        url = `${pathOnly}`;
        console.debug('chatService.sendMessage -> POST (relative)', url, message, ' (via api baseURL)', api.defaults.baseURL);
        const resp = await api.post(url, message, { headers });
        console.log('🟢 chatService.sendMessage -> resposta REST:', resp.status, resp.data);
        return resp.data;
      }
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem via REST:', error?.response?.status, error?.response?.data || error.message || error);
      throw error;
    }
  },

  /**
   * Marca mensagem como lida: PATCH /api/messages/:messageId/read
   */
  async markAsRead(messageId, token) {
    try {
      if (!messageId) throw new Error('messageId é necessário');
      const base = MENSAGENS_BASE.replace(/\/$/, '');
      const headers = { Authorization: token ? `Bearer ${token}` : (localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : undefined) };
      let url;
      if (/^https?:\/\//.test(base)) {
        url = `${base}/${messageId}/read`;
        console.debug('chatService.markAsRead -> PATCH (absolute)', url);
        const resp = await api.patch(url, null, { headers });
        return resp.data;
      } else {
        const pathOnly = base.replace(/^https?:\/\/[^/]+/, '');
        url = `${pathOnly}/${messageId}/read`;
        console.debug('chatService.markAsRead -> PATCH (relative)', url, ' (via api baseURL)', api.defaults.baseURL);
        const resp = await api.patch(url, null, { headers });
        return resp.data;
      }
    } catch (err) {
      console.error('Erro ao marcar mensagem como lida:', err?.response?.status || err.message || err);
      throw err;
    }
  },

  /**
   * Novo método em inglês compatível com o contrato: getHistoryWith
   */
  async getHistoryWith(otherUserId, token, page = 1, limit = 200) {
    return this.getHistoricoConversa(otherUserId, token, page, limit);
  }
};

export default chatService;
