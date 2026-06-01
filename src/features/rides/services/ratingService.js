import api from '@shared/lib/api';

export const ratingService = {
  /**
   * Registra uma avaliação para o motorista de uma carona específica
   * @param {number} solicitacaoId ID da solicitação concluída
   * @param {object} payload { avaliacao: number, texto: string }
   */
  rateDriver: async (solicitacaoId, payload) => {
    // O backend recebe o ComentarioRequestDTO e o ID da solicitação no path
    const { data } = await api.post(`/comentar/${solicitacaoId}`, payload);
    return data;
  },

  /**
   * Obtém a média de avaliações de um motorista
   * @param {number} motoristaId
   */
  getDriverRating: async (motoristaId) => {
    const { data } = await api.get(`/comentar/${motoristaId}`);
    return data; // Retorna o valor numérico da média
  }
};

export default ratingService;