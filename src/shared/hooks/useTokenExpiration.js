// shared/hooks/useTokenExpiration.js
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@features/auth/stores/authStore';
import { checkTokenExpiration, clearExpiredToken } from '@shared/utils/tokenUtils';

/**
 * Hook que monitora a expiração do token e faz logout automático
 * Verifica a cada 60 segundos se o token está válido
 */
export function useTokenExpiration() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();
  const intervalRef = useRef(null);
  const hasShownWarningRef = useRef(false);

  useEffect(() => {
    // Só monitorar se estiver autenticado
    if (!isAuthenticated) {
      return;
    }

    // Verificar imediatamente ao montar
    checkToken();

    // Verificar a cada 60 segundos
    intervalRef.current = setInterval(() => {
      checkToken();
    }, 60000); // 60 segundos

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAuthenticated]);

  const checkToken = () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('🔐 Token não encontrado');
      return;
    }

    const tokenInfo = checkTokenExpiration(token);
    
    if (tokenInfo.isExpired) {
      console.error('❌ Token expirado detectado! Fazendo logout automático...');
      handleExpiredToken();
      return;
    }

    // Avisar quando faltarem menos de 10 minutos
    const payload = tokenInfo.payload;
    if (payload && payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      const timeRemaining = payload.exp - now;
      const minutesRemaining = Math.floor(timeRemaining / 60);

      if (minutesRemaining <= 10 && minutesRemaining > 0 && !hasShownWarningRef.current) {
        console.warn(`⚠️ Token expira em ${minutesRemaining} minutos`);
        toast(`Sua sessão expira em ${minutesRemaining} minutos`, {
          duration: 5000,
          icon: '⏰',
          style: {
            background: '#FFA500',
            color: '#fff',
          }
        });
        hasShownWarningRef.current = true;
      }

      // Resetar warning se renovar o token
      if (minutesRemaining > 10) {
        hasShownWarningRef.current = false;
      }
    }
  };

  const handleExpiredToken = () => {
    clearExpiredToken();
    logout();
    toast.error('Sua sessão expirou. Faça login novamente.', {
      duration: 5000,
      icon: '🔒'
    });
    navigate('/login');
  };

  return null;
}
