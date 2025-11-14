import axios from 'axios';

const anunciosApi = axios.create({
    baseURL: import.meta.env.VITE_ADS_API_URL || 'http://localhost:8081/anuncio',
});

anunciosApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('anuncios_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

anunciosApi.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('Erro na API de anúncios:', error);
        if (error.response?.status === 401) {
            localStorage.removeItem('anuncios_token');
            window.location.href = '/anunciante/login';
        }
        const message = error.response?.data?.message || error.message || 'Erro desconhecido';
        return Promise.reject(new Error(message));
    }
);

export default anunciosApi;
