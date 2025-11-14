import { useQuery, useMutation } from '@tanstack/react-query';
import * as anunciosService from '../services/anunciosService';
import { useAnunciosStore } from '../stores/anunciosStore';

export function useAnuncios() {
  const token = useAnunciosStore((s) => s.token);

  const { data: ad, isLoading: isLoadingAd, refetch: refetchAd } = useQuery(
    ['anuncio', 'divulgar'],
    anunciosService.divulgarAnuncio,
    {
      enabled: true,
      retry: false,
    }
  );

  const loginMutation = useMutation(anunciosService.loginAnunciante, {
    onSuccess(data) {
      useAnunciosStore.getState().setToken(data);
    },
  });

  const logout = () => useAnunciosStore.getState().clearToken();

  return {
    ad,
    isLoadingAd,
    refetchAd,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isLoading,
    logout,
  };
}

export function useAnunciosAuth() {
  const loginMutation = useMutation(anunciosService.loginAnunciante, {
    onSuccess(data) {
      useAnunciosStore.getState().setToken(data);
    },
  });

  const logout = () => useAnunciosStore.getState().clearToken();

  return {
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isLoading,
    logout,
  };
}

export default useAnuncios;
