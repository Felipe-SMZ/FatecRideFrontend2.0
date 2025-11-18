// features/auth/services/authService.js
import api from '@shared/lib/api';

export const authService = {
    login: async (email, senha) => {
        try {
            const { data } = await api.post('/users/login', { email, senha });
            console.log('✅ authService.login - backend response:', data);
            return data;
        } catch (err) {
            // Log detalhado para debugging: request/response/status
            console.error('❌ authService.login - erro ao chamar /users/login');
            console.error('Request payload:', { email, senha });
            console.error('Axios error:', err);
            console.error('Response (if any):', err?.response?.data, 'Status:', err?.response?.status);

            // Nota: não reenviaremos automaticamente com 'password' — isso causou 500 quando o
            // backend recebeu campo nulo. Tratar 400 vazio como credenciais inválidas no frontend.
            throw err;
        }
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
        // Backend usa GET /users (não /users/getCurrentUser)
        const { data } = await api.get('/users');
        return data;
    },

    updateUser: async (userData) => {
        // DEBUG: log payload to verify `rawPassword` is present (remove in production)
        try {
            console.log('DEBUG authService.updateUser payload:', JSON.parse(JSON.stringify(userData)));
        } catch (e) {
            console.log('DEBUG authService.updateUser payload (stringify failed):', userData);
        }
        const { data } = await api.put('/users', userData);
        return data;
    },

    deleteAccount: async () => {
        await api.delete('/users');
    }
};