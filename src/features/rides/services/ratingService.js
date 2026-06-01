import api from '@shared/lib/api';

export const ratingService = {
  /**
   * Registra uma avaliação para o motorista de uma carona específica
   * @param {number} solicitacaoId ID da solicitação concluída
   * @param {object} payload { avaliacao: number, comentario: string }
   */
  rateDriver: async (solicitacaoId, payload) => {
    // O backend recebe o DTO de comentário e o ID da solicitação
    const { data } = await api.post(`/avaliacao/comentario/${solicitacaoId}`, payload);
    return data;
  },

  /**
   * Obtém a média de avaliações de um motorista
   * @param {number} motoristaId
   */
  getDriverRating: async (motoristaId) => {
    const { data } = await api.get(`/avaliacao/media/${motoristaId}`);
    return data; // Retorna o valor numérico da média
  }
};

export default ratingService;