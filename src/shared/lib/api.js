// shared/lib/api.js
import axios from 'axios';
import { useAuthStore } from '@features/auth/stores/authStore';
import { toast } from 'react-hot-toast';
import { checkTokenExpiration, clearExpiredToken } from '@shared/utils/tokenUtils';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor - verifica expiração antes de enviar
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        
        if (token) {
            // Verificar se token está expirado ANTES de fazer requisição
            const tokenInfo = checkTokenExpiration(token);
            
            if (tokenInfo.isExpired) {
                console.error('❌ Token expirado detectado no interceptor');
                clearExpiredToken();
                useAuthStore.getState().logout();
                
                // Prevenir requisição
                return Promise.reject({
                    response: {
                        status: 401,
                        data: { message: 'Token expirado' }
                    }
                });
            }
            
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - trata erros globalmente
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message || 'Erro ao processar requisição';

        // Logout automático se token expirou
        if (status === 401) {
            useAuthStore.getState().logout();
            toast.error('Sessão expirada. Faça login novamente.');
            window.location.href = '/';
        }

        // Erros específicos
        if (status === 403) {
            toast.error('Você não tem permissão para essa ação');
        } else if (status === 404) {
            toast.error('Recurso não encontrado');
        } else if (status === 500) {
            toast.error('Erro no servidor. Tente novamente mais tarde.');
        } else {
            toast.error(message);
        }

        return Promise.reject({ ...error, message });
    }
);

export default api;