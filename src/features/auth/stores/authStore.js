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
                    const token = response.token;
                    
                    // Salvar token imediatamente para usar na próxima requisição
                    localStorage.setItem('token', token);
                    
                    // Buscar dados completos do usuário
                    try {
                        console.log('📡 Login: Buscando dados completos do usuário...');
                        const userDataResponse = await authService.getCurrentUser();
                        console.log('✅ Login: Dados recebidos:', userDataResponse);
                        
                        // Mapear userTypeId para tipo string
                        let tipo = 'PASSAGEIRO'; // Default
                        if (userDataResponse.userTypeId === 1) {
                            tipo = 'MOTORISTA';
                        } else if (userDataResponse.userTypeId === 2) {
                            tipo = 'PASSAGEIRO';
                        } else if (userDataResponse.userTypeId === 3) {
                            tipo = 'AMBOS';
                        } else if (userDataResponse.tipo) {
                            // Se vier diretamente como string, usar
                            tipo = userDataResponse.tipo;
                        }
                        
                        console.log(`🔧 Login: userTypeId=${userDataResponse.userTypeId} → tipo="${tipo}"`);
                        
                        const user = {
                            name: userDataResponse.nome || response.name,
                            email: email,
                            tipo: tipo,
                            id: userDataResponse.id,
                            userTypeId: userDataResponse.userTypeId,
                            foto: userDataResponse.foto || null
                        };
                        
                        set({
                            user,
                            token,
                            isAuthenticated: true,
                            isLoading: false
                        });
                    } catch (userError) {
                        // Se falhar ao buscar dados completos, inferir tipo pelo email
                        console.warn('❌ Login: Erro ao buscar dados do usuário:', userError);
                        console.warn('❌ Status:', userError?.response?.status);
                        
                        // Inferir tipo pelo padrão do email (workaround temporário)
                        let inferredTipo = 'PASSAGEIRO'; // Default
                        if (email.includes('motorista') || email.startsWith('fm')) {
                            inferredTipo = 'MOTORISTA';
                        } else if (email.includes('passageiro') || email.startsWith('fp')) {
                            inferredTipo = 'PASSAGEIRO';
                        } else if (email.includes('ambos') || email.startsWith('fa')) {
                            inferredTipo = 'AMBOS';
                        }
                        
                        console.log(`🔧 Login: Tipo inferido: ${inferredTipo} (baseado no email)`);
                        
                        const user = {
                            name: response.name,
                            email: email,
                            tipo: inferredTipo,
                            userTypeId: inferredTipo === 'MOTORISTA' ? 1 : inferredTipo === 'PASSAGEIRO' ? 2 : 3
                        };
                        
                        console.log('👤 User object criado:', user);
                        
                        set({
                            user,
                            token,
                            isAuthenticated: true,
                            isLoading: false
                        });
                    }
                    
                    return response;
                } catch (error) {
                    set({ isLoading: false });
                    localStorage.removeItem('token');
                    throw error;
                }
            },

            setAuth: (user, token) => set({
                user,
                token,
                isAuthenticated: true
            }),

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