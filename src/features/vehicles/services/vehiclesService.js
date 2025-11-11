import api from "@shared/lib/api";

/**
 * vehiclesService - Camada de serviço para operações de veículos
 * 
 * Abstrai chamadas à API REST do backend.
 * Endpoints assumem padrão RESTful: GET /api/veiculos, POST /api/veiculos, etc.
 */

export const vehiclesService = {
  /**
   * Lista todos os veículos do usuário autenticado
   * Backend filtra por usuário através do token JWT
   */
  getAll: async () => {
    const { data } = await api.get("/veiculos");
    return data;
  },

  /**
   * Busca um veículo específico por ID
   * Usado para visualização de detalhes ou edição
   */
  getById: async (id) => {
    const { data } = await api.get(`/veiculos/${id}`);
    return data;
  },

  /**
   * Cria novo veículo
   * @param vehicleData - { modelo, placa, cor, ano, capacidade }
   */
  create: async (vehicleData) => {
    const { data } = await api.post("/veiculos", vehicleData);
    return data;
  },

  /**
   * Atualiza veículo existente
   * PUT envia todos os campos, PATCH apenas campos modificados
   */
  update: async (id, vehicleData) => {
    const { data } = await api.put(`/veiculos/${id}`, vehicleData);
    return data;
  },

  /**
   * Remove veículo
   * Validação no backend previne exclusão se há caronas ativas
   */
  delete: async (id) => {
    const { data } = await api.delete(`/veiculos/${id}`);
    return data;
  },
};
