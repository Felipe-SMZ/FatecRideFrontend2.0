// features/auth/services/authService.js
import api from '@shared/lib/api';
import { useAuthStore } from '../stores/authStore';

export const authService = {
    login: async (email, senha) => {
        const { data } = await api.post('/users/login', { email, senha });
        return data;
    },

    register: async (userData) => {
        const { data } = await api.post('/users/criarPassageiro', userData);
        return data;
    },

    registerDriver: async (userData) => {
        const { data } = await api.post('/users/criarMotorista', userData);
        return data;
    },

    getCurrentUser: async () => {
        const { data } = await api.get('/users');
        return data;
    },

    updateUser: async (userData) => {
        const { data } = await api.put('/users', userData);
        return data;
    },

    deleteAccount: async () => {
        await api.delete('/users');
    }
};