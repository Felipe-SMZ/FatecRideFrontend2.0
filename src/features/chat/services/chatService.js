// features/chat/services/chatService.js
import api from '@shared/lib/api';

// Base URL do serviço de mensagens (backend refatorado).
const MENSAGENS_BASE = import.meta.env.VITE_MENSAGENS_API_URL || import.meta.env.VITE_CHAT_API_URL || 'http://localhost:3000';

export const chatService = {
  /**
   * Buscar histórico de conversa com outro usuário (id_usuario)
   * @param {number} otherUserId
   */
  async getHistoricoConversa(otherUserId, token) {
    try {
      const id = Number(otherUserId);
      if (!id) return [];

      const url = `${MENSAGENS_BASE.replace(/\/$/, '')}/api/mensagens/historico/${id}`;
      console.debug('chatService.getHistoricoConversa -> GET', url);
      const resp = await api.get(url, { headers: { Authorization: token ? `Bearer ${token}` : undefined } });
      const data = resp?.data;

      if (!data) return [];
      if (data.mensagens && Array.isArray(data.mensagens)) return data.mensagens;
      if (Array.isArray(data)) return data;
      if (data.content && Array.isArray(data.content)) return data.content;
      if (typeof data === 'object') return [data];
      return [];
    } catch (error) {
      console.error('Erro ao buscar histórico de conversa:', error);
      return [];
    }
  },

  /**
   * Buscar conversas (últimas mensagens) do usuário
   */
  async getConversations(token) {
    try {
      const url = `${MENSAGENS_BASE.replace(/\/$/, '')}/api/mensagens/conversas`;
      console.debug('chatService.getConversations -> GET', url);
      const resp = await api.get(url, { headers: { Authorization: token ? `Bearer ${token}` : undefined } });
      const data = resp?.data;
      if (!data) return [];
      if (data.conversas && Array.isArray(data.conversas)) return data.conversas;
      if (Array.isArray(data)) return data;
      return [];
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
      return [];
    }
  },

  /**
   * Envia mensagem via REST (fallback)
   */
  async sendMessage(message) {
    try {
      const url = `${MENSAGENS_BASE.replace(/\/$/, '')}/api/mensagens`;
      console.debug('chatService.sendMessage -> POST', url, message);
      const resp = await api.post(url, message);
      console.log('🟢 chatService.sendMessage -> resposta REST:', resp.status, resp.data);
      return resp.data;
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem via REST:', error?.response?.status, error?.response?.data || error.message || error);
      throw error;
    }
  }
};

export default chatService;
