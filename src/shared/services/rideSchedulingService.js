import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const rideSchedulingService = {
  /**
   * Agendar Ride por Dia da Semana
   * @param {number} rideId - ID da ride
   * @param {number[]} daysOfWeek - IDs dos dias da semana (1-7)
   */
  scheduleWeekly: async (rideId, daysOfWeek) => {
    const response = await axios.post(`${API_URL}/agendar-ride-dia-semana`, {
      ride: rideId,
      dia_semana_agendamento: daysOfWeek
    }, { headers: getAuthHeader() });
    return response.data;
  },

  deactivateWeekly: async (rideId, daysOfWeek) => {
    await axios.put(`${API_URL}/agendar-ride-dia-semana/desativar`, {
      rideId,
      diasSemana: daysOfWeek
    }, { headers: getAuthHeader() });
  },

  getWeeklySchedules: async () => {
    const response = await axios.get(`${API_URL}/agendar-ride-dia-semana`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  /**
   * Agendar Ride por Intervalo de Dias
   * @param {number} rideId - ID da ride
   * @param {string} startDate - Data de início (yyyy-MM-dd)
   * @param {number} intervalId - ID do intervalo (1-5)
   */
  scheduleInterval: async (rideId, startDate, intervalId) => {
    const response = await axios.post(`${API_URL}/agendar-compromisso-intervalo-dias`, {
      ride: rideId,
      dataInicio: startDate,
      intervalo_dias: intervalId
    }, { headers: getAuthHeader() });
    return response.data;
  },

  deactivateInterval: async (id) => {
    await axios.put(`${API_URL}/agendar-compromisso-intervalo-dias/desativar/${id}`, {}, {
      headers: getAuthHeader()
    });
  },

  getIntervalSchedules: async () => {
    const response = await axios.get(`${API_URL}/agendar-compromisso-intervalo-dias`, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};