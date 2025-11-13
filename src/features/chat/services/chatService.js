// features/chat/services/chatService.js
import api from '@shared/lib/api';

/**
 * Serviço HTTP para buscar histórico de mensagens
 * (caso precise implementar endpoint REST para buscar mensagens antigas)
 */
export const chatService = {
  /**
   * Buscar mensagens de uma solicitação
   * @param {number} id_solicitacao 
   */
  async getMessages(id_solicitacao) {
    // TODO: Implementar endpoint no backend Node.js para buscar histórico
    // Por enquanto retorna array vazio
    try {
      // const { data } = await api.get(`/chat/mensagens/${id_solicitacao}`);
      // return data;
      return [];
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      return [];
    }
  },

  /**
   * Buscar conversas do usuário
   */
  async getConversations() {
    // TODO: Implementar endpoint no backend
    try {
      // const { data } = await api.get('/chat/conversas');
      // return data;
      return [];
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
      return [];
    }
  }
};
