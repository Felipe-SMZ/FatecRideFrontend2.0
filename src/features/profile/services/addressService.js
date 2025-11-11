// features/profile/services/addressService.js
import api from '@shared/lib/api';

export const addressService = {
    // Buscar endereço do usuário
    getAddress: async () => {
        const { data } = await api.get('/address');
        return data;
    },

    // Criar endereço (primeira vez)
    createAddress: async (addressData) => {
        const { data } = await api.post('/address', addressData);
        return data;
    },

    // Atualizar endereço existente
    updateAddress: async (addressId, addressData) => {
        const { data } = await api.put(`/address/${addressId}`, addressData);
        return data;
    },

    // Buscar CEP via ViaCEP
    searchCep: async (cep) => {
        const { data } = await api.get(`/cep/${cep}`);
        return data;
    }
};
