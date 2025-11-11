// features/rides/services/ridesService.js
import api from '@shared/lib/api';

export const ridesService = {
    create: async (rideData) => {
        const { data } = await api.post('/rides', rideData);
        return data;
    },

    getActive: async () => {
        const { data } = await api.get('/rides/corridasAtivas');
        return data;
    },

    cancel: async (id) => {
        await api.put(`/rides/cancelar/${id}`);
    },

    update: async (id, rideData) => {
        const { data } = await api.put(`/rides/${id}`, rideData);
        return data;
    },

    searchNearby: async (searchParams) => {
        const { data } = await api.post('/solicitacao/proximos', searchParams);
        return data;
    },

    getHistory: async (page = 0, size = 5) => {
        const { data } = await api.get(`/rides/concluidas?pagina=${page}&itens=${size}`);
        return data;
    }
};