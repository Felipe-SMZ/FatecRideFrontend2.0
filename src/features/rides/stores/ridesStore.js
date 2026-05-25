import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * ridesStore - Estado global de caronas
 * Armazena solicitações pendentes que precisam persistir entre páginas
 */
export const useRidesStore = create(
  persist(
    (set, get) => ({
      // State
      pendingSolicitacao: null, // Solicitação em aberto (nova_solicitacao SSE)

      // Actions
      setPendingSolicitacao: (solicitacao) => {
        console.log('🎯 ridesStore.setPendingSolicitacao:', solicitacao?.solicitacaoId);
        set({ pendingSolicitacao: solicitacao });
      },

      clearPendingSolicitacao: () => {
        console.log('🗑️ ridesStore.clearPendingSolicitacao');
        set({ pendingSolicitacao: null });
      },

      getPendingSolicitacao: () => get().pendingSolicitacao,
    }),
    {
      name: 'rides-store', // Key no localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        pendingSolicitacao: state.pendingSolicitacao,
      }),
    }
  )
);
