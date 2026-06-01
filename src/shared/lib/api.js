// shared/lib/api.js
import axios from 'axios';
import { useAuthStore } from '@features/auth/stores/authStore';
import { toast } from 'react-hot-toast';
import { checkTokenExpiration, clearExpiredToken } from '@shared/utils/tokenUtils';

const resolvedDefaultBase = (typeof window !== 'undefined' && window.location)
  ? `${window.location.protocol}//${window.location.host}`
  : 'http://localhost:3000';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || resolvedDefaultBase,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Debug: mostrar baseURL efetiva para facilitar diagnóstico durante dev
try { console.debug('api: baseURL =', api.defaults.baseURL); } catch (e) {}

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

        // Melhora o log de debug para verificar integridade do token
        if (config.url && config.url.includes('/solicitacao')) {
            const tokenPreview = token ? `${token.substring(0, 15)}... [len: ${token.length}]` : 'AUSENTE';
            console.log(`📡 API REQ [${config.method.toUpperCase()}] ${config.url}`, {
                token: tokenPreview,
                hasAuthHeader: !!config.headers.Authorization
            });
        }

        // DEBUG: Log detalhado apenas para o endpoint de login (temporário)
        try {
            if (config.url && config.url.includes('/users/login')) {
                console.log('DEBUG api.request -> /users/login - method:', config.method, 'url:', config.url);
                console.log('DEBUG api.request -> headers:', config.headers);
                console.log('DEBUG api.request -> data:', config.data);
            }
        } catch (e) {
            console.warn('DEBUG api.request logging failed', e);
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - trata erros globalmente
api.interceptors.response.use(
    (response) => {
        // DEBUG: log responses for login endpoint
        try {
            if (response.config?.url?.includes('/users/login')) {
                console.log('DEBUG api.response -> /users/login - status:', response.status);
                console.log('DEBUG api.response -> /users/login - headers:', response.headers);
                console.log('DEBUG api.response -> /users/login - data:', response.data);
            }
        } catch (e) {
            console.warn('DEBUG api.response logging failed', e);
        }
        return response;
    },
    (error) => {
        // DEBUG: log error responses for login endpoint
        try {
            const errConfig = error.config || {};
            if (errConfig.url && errConfig.url.includes('/users/login')) {
                console.error('DEBUG api.response.error -> /users/login - status:', error.response?.status);
                console.error('DEBUG api.response.error -> /users/login - headers:', error.response?.headers);
                console.error('DEBUG api.response.error -> /users/login - data:', error.response?.data);
            }
        } catch (e) {
            console.warn('DEBUG api.response.error logging failed', e);
        }

        // Normalizar casos onde o backend retorna 400 com corpo vazio (ex.: credenciais inválidas)
        // para que o frontend tenha sempre uma mensagem legível.
        const status = error.response?.status;
        if (status === 400 && (!error.response?.data || Object.keys(error.response.data).length === 0)) {
            error.response.data = { message: 'Email ou senha inválidos' };
        }

        const message = error.response?.data?.message || 'Erro ao processar requisição';
        const url = error.config?.url || '';

        // ⭐ NOVO: Endpoints "soft-fail" que podem retornar 401 sem fazer logout
        // Tipicamente endpoints de leitura que não devem forçar o logout imediato
        const softFailEndpoints = [
            '/solicitacao/pending',      // Passageiro listando solicitações
            '/solicitacao/concluidas',   // Passageiro buscando histórico
            '/rides/requestsForMyRide',  // Motorista buscando solicitações
        ];

        const isSoftFailEndpoint = softFailEndpoints.some(ep => url.includes(ep));

        // Logout automático se token expirou - MAS NÃO em endpoints soft-fail
        if (status === 401 && !isSoftFailEndpoint) {
            // Se não for soft-fail e não tiver token, ou token expirou de fato
            if (!useAuthStore.getState().token) {
                useAuthStore.getState().logout();
                toast.error('Sessão expirada. Faça login novamente.');
                window.location.href = '/login';
            } else {
                console.error(`❌ Erro 401 em rota protegida: ${url}. Verifique as permissões no Backend.`);
            }
        } else if (status === 401 && isSoftFailEndpoint) {
            // Para endpoints soft-fail, apenas log e passa o erro adiante
            console.warn('⚠️ SOFT-FAIL 401:', {
                url: error.config?.url,
                message: 'Endpoint retornou 401 mas não fará logout. O componente deve tratar.',
                isSoftFailEndpoint
            });
        }

        // Erros específicos
        if (status === 403) {
            toast.error('Você não tem permissão para essa ação');
        } else if (status === 404) {
            toast.error('Recurso não encontrado');
        } else if (status === 500) {
            toast.error('Erro no servidor. Tente novamente mais tarde.');
        } else if (status !== 401 || !isSoftFailEndpoint) {
            // Só mostra toast se não for 401 soft-fail
            toast.error(message);
        }

        return Promise.reject({ ...error, message });
    }
);

export default api;