// features/auth/hooks/useAuth.js
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'react-hot-toast';

export function useLogin() {
    const navigate = useNavigate();
    const setAuth = useAuthStore(state => state.setAuth);

    return useMutation({
        mutationFn: authService.login,
        onSuccess: (data) => {
            setAuth(data.user, data.token);
            toast.success(`Bem-vindo, ${data.nome}!`);
            navigate('/inicio');
        },
        onError: (error) => {
            toast.error('Email ou senha inválidos');
        }
    });
}

export function useLogout() {
    const navigate = useNavigate();
    const logout = useAuthStore(state => state.logout);

    return useMutation({
        mutationFn: async () => {
            logout();
        },
        onSuccess: () => {
            navigate('/');
            toast.success('Logout realizado com sucesso');
        }
    });
}

export function useCurrentUser() {
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);

    return useQuery({
        queryKey: ['user', 'current'],
        queryFn: authService.getCurrentUser,
        enabled: isAuthenticated, // Só busca se estiver autenticado
        staleTime: Infinity // Dados do usuário raramente mudam
    });
}