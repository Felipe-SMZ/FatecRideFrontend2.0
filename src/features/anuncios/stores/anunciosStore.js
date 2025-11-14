import { create } from 'zustand';
import { decodeToken } from '../services/anunciosService';

export const useAnunciosStore = create((set, get) => ({
  token: localStorage.getItem('anuncios_token') || null,
  setToken: (token) => {
    localStorage.setItem('anuncios_token', token);
    set({ token });
  },
  clearToken: () => {
    localStorage.removeItem('anuncios_token');
    set({ token: null });
  },
  isAuthenticated: () => {
    const t = get().token;
    if (!t) return false;
    const dec = decodeToken(t);
    if (!dec || !dec.exp) return false;
    return Date.now() < dec.exp * 1000;
  },
}));

export default useAnunciosStore;
