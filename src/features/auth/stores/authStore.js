// features/auth/stores/authStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authService } from '../services/authService';
import notificationsService from '@shared/services/notificationsService';
import { toast } from 'react-hot-toast';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            // State
            user: null,
            token: null,
            messagesToken: null,
            isAuthenticated: false,
            isLoading: false,

            // Actions
            login: async (email, senha) => {
                set({ isLoading: true });
                try {
                    const response = await authService.login(email, senha);
                    console.log('🔍 authStore - Resposta completa do backend:', response);
                    console.log('📋 authStore - userTypeId recebido:', response.userTypeId, '| Tipo:', typeof response.userTypeId);
                    
                    const token = response.token;
                    
                    // Salvar token no Zustand para o interceptor axios funcionar
                    set({ token });
                    
                    // Backend agora retorna id e userTypeId diretamente no login
                    // Mapear userTypeId para tipo string (Backend: 1=PASSAGEIRO, 2=MOTORISTA, 3=AMBOS)
                    let tipo = 'PASSAGEIRO'; // Default
                    if (response.userTypeId === 1) {
                        tipo = 'PASSAGEIRO';
                    } else if (response.userTypeId === 2) {
                        tipo = 'MOTORISTA';
                    } else if (response.userTypeId === 3) {
                        tipo = 'AMBOS';
                    }
                    
                    console.log('🎭 authStore - Tipo mapeado:', tipo, '(userTypeId:', response.userTypeId, ')');
                    
                    const user = {
                        name: response.name,
                        email: email,
                        tipo: tipo,
                        id: response.id,
                        userTypeId: response.userTypeId,
                        foto: null // Foto virá do GET /users se necessário
                    };
                    
                    set({
                        user,
                        token,
                        isAuthenticated: true,
                        isLoading: false
                    });
                    
                    return response;
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            setAuth: (user, token, messagesToken = null) => set({
                user,
                token,
                messagesToken,
                isAuthenticated: true
            }),

            setMessagesToken: (messagesToken) => set({ messagesToken }),

            loadUserData: async () => {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        console.log('⚠️ loadUserData: Sem token no localStorage');
                        return;
                    }
                    
                    console.log('📡 loadUserData: Chamando getCurrentUser (/users)...');
                    const userDataResponse = await authService.getCurrentUser();
                    console.log('✅ loadUserData: Dados recebidos:', userDataResponse);
                    
                    // Mapear userTypeId para tipo string
                    let tipo = get().user?.tipo || 'PASSAGEIRO'; // Manter atual ou default
                    if (userDataResponse.userTypeId === 1) {
                        tipo = 'MOTORISTA';
                    } else if (userDataResponse.userTypeId === 2) {
                        tipo = 'PASSAGEIRO';
                    } else if (userDataResponse.userTypeId === 3) {
                        tipo = 'AMBOS';
                    } else if (userDataResponse.tipo) {
                        tipo = userDataResponse.tipo;
                    }
                    
                    console.log(`🔧 loadUserData: userTypeId=${userDataResponse.userTypeId} → tipo="${tipo}"`);
                    
                    set(state => ({
                        user: {
                            ...state.user,
                            name: userDataResponse.nome || state.user?.name,
                            tipo: tipo,
                            id: userDataResponse.id || state.user?.id,
                            userTypeId: userDataResponse.userTypeId,
                            foto: userDataResponse.foto || state.user?.foto || null
                        }
                    }));
                    console.log('✅ loadUserData: User atualizado com tipo:', get().user?.tipo);
                } catch (error) {
                    console.error('❌ loadUserData: Erro ao buscar dados:', error);
                    console.error('❌ Status:', error?.response?.status);
                    console.error('❌ Resposta:', error?.response?.data);
                    
                    // Erro 403/500 = endpoint com problema no backend
                    // Como workaround, vamos tentar inferir o tipo pelo email
                    if (error?.response?.status === 403 || error?.response?.status === 500) {
                        const currentUser = get().user;
                        console.warn('⚠️ Backend retornou erro. Tentando inferir tipo pelo email...');
                        
                        // Inferir tipo pelo padrão do email (temporário até backend ser corrigido)
                        let inferredTipo = 'PASSAGEIRO'; // Default
                        if (currentUser?.email) {
                            if (currentUser.email.includes('motorista') || currentUser.email.startsWith('fm')) {
                                inferredTipo = 'MOTORISTA';
                            } else if (currentUser.email.includes('passageiro') || currentUser.email.startsWith('fp')) {
                                inferredTipo = 'PASSAGEIRO';
                            }
                        }
                        
                        console.log(`🔧 Tipo inferido: ${inferredTipo} (baseado no email: ${currentUser?.email})`);
                        
                        set(state => ({
                            user: {
                                ...state.user,
                                tipo: inferredTipo
                            }
                        }));
                    }
                }
            },

            updateUser: (userData) => set(state => ({
                user: { ...state.user, ...userData }
            })),

            logout: () => {
                set({
                    user: null,
                    token: null,
                    messagesToken: null,
                    isAuthenticated: false
                });
                localStorage.removeItem('token');
                try {
                    notificationsService.disconnect(true);
                    toast.success('Notificações desconectadas');
                } catch (e) { console.warn('Falha ao desconectar notificationsService', e); }
            },

            setLoading: (isLoading) => set({ isLoading }),

            // Getters
            getUserType: () => get().user?.userTypeId,
            hasVehicle: () => get().user?.hasVehicle || false,
            getMessagesToken: () => get().messagesToken
        }),
        {
            name: 'fatecride-auth',
            storage: createJSONStorage(() => localStorage),
            // Persistir apenas dados não sensíveis
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                token: state.token, // Precisamos do token para as requisições
                messagesToken: state.messagesToken
            })
        }
    )
);