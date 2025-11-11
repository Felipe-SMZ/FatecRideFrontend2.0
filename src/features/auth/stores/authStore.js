// features/auth/stores/authStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authService } from '../services/authService';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            // State
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,

            // Actions
            login: async (email, senha) => {
                set({ isLoading: true });
                try {
                    const response = await authService.login(email, senha);
                    const { user, token } = response;
                    set({
                        user,
                        token,
                        isAuthenticated: true,
                        isLoading: false
                    });
                    localStorage.setItem('token', token);
                    return response;
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            setAuth: (user, token) => set({
                user,
                token,
                isAuthenticated: true
            }),

            updateUser: (userData) => set(state => ({
                user: { ...state.user, ...userData }
            })),

            logout: () => {
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false
                });
                localStorage.removeItem('token');
            },

            setLoading: (isLoading) => set({ isLoading }),

            // Getters
            getUserType: () => get().user?.userTypeId,
            hasVehicle: () => get().user?.hasVehicle || false
        }),
        {
            name: 'fatecride-auth',
            storage: createJSONStorage(() => localStorage),
            // Persistir apenas dados não sensíveis
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                token: state.token, // Precisamos do token para as requisições
            })
        }
    )
);