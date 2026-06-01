import { useEffect } from 'react';
import { useAuthStore } from '@features/auth/stores/authStore';
import { useRidesStore } from '@features/rides/stores/ridesStore';
import notificationsService from '@shared/services/notificationsService';

/**
 * Hook global para escutar eventos SSE de solicitações
 * Registra listeners GLOBALMENTE (não depende de qual página está ativa)
 * 
 * IMPORTANTE: Registra listeners MESMO ANTES do tipo estar disponível
 * para garantir que eventos não se percam durante carregamento do tipo
 */
export function useSolicitacoesSSE() {
  const { user } = useAuthStore();
  const isDriver = user?.tipo === 'MOTORISTA' || user?.tipo === 'AMBOS';
  const isAuthenticated = useAuthStore.getState().isAuthenticated;

  console.log('🌍 useSolicitacoesSSE - Hook renderizado', {
    isDriver,
    isAuthenticated,
    userTipo: user?.tipo,
    userId: user?.id,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    // ⭐ IMPORTANTE: Registrar listeners MESMO QUE NÃO SAIBAMOS SE É MOTORISTA YET
    // Isso garante que eventos não se percam enquanto carregamos o tipo do usuário
    if (!isAuthenticated) {
      console.log('🌍 useSolicitacoesSSE - Não autenticado, pulando setup');
      return;
    }

    console.log('🌍 useSolicitacoesSSE - SETUP: Registrando listeners GLOBAIS', {
      timestamp: new Date().toISOString(),
      isDriver,
      sseStatus: notificationsService.es?.readyState === 1 ? 'OPEN ✓' : 'CLOSED ✗'
    });

    // ✨ Registrar handlers que processam eventos
    const handleNovaSolicitacao = (data) => {
      try {
        console.log('🌍 GLOBAL HANDLER: nova_solicitacao recebido', {
          solicitacaoId: data?.solicitacaoId,
          passageiroNome: data?.passageiroNome,
          timestamp: new Date().toISOString()
        });

        // ⭐ Salvar em Zustand store para persistência
        // Isso vai atualizar o componente PendingSolicitacaoCard em QUALQUER página
        const store = useRidesStore.getState();
        store.setPendingSolicitacao(data);
        console.log('✅ Salvo no store - Card flutuante será renderizado');

        // Dispatch evento global para qualquer componente escutar
        window.dispatchEvent(
          new CustomEvent('sse-nova-solicitacao', { detail: data })
        );
        console.log('✅ Window event disparado');
      } catch (e) {
        console.error('❌ Erro em handleNovaSolicitacao:', e.message);
      }
    };

    const handleSolicitacaoAceita = (data) => {
      console.log('🌍 GLOBAL HANDLER: solicitacao_aceita recebido', {
        rawData: JSON.stringify(data),
        keys: Object.keys(data || {}),
        solicitacaoId: data?.solicitacaoId,
        id_solicitacao: data?.id_solicitacao,
        motorista: data?.motorista,
        motorista_keys: data?.motorista ? Object.keys(data.motorista) : null,
        id_motorista: data?.id_motorista,
        hasAllFields: !!(data?.solicitacaoId || data?.id_solicitacao) && !!(data?.motorista?.id || data?.id_motorista),
        timestamp: new Date().toISOString()
      });

      useRidesStore.getState().clearPendingSolicitacao();

      // Montar objeto com todos os dados normalizados para o window event
      const eventPayload = {
        ...data,
        // garantir que tem id da solicitacao
        solicitacaoId: data?.solicitacaoId || data?.id_solicitacao || null,
        id_solicitacao: data?.id_solicitacao || data?.solicitacaoId || null,
        // garantir que tem id do motorista
        id_motorista: data?.motorista?.id || data?.id_motorista || null,
        // guardar nome do motorista
        nome_motorista: data?.motorista?.nome || data?.nome_motorista || null,
        motoristaNome: data?.motorista?.nome || data?.motoristaNome || null
      };

      console.log('✅ Window event sse-solicitacao-aceita será disparado com payload:', eventPayload);

      window.dispatchEvent(
        new CustomEvent('sse-solicitacao-aceita', { detail: eventPayload })
      );
    };

    const handleNenhumMotorista = (data) => {
      console.log('🌍 GLOBAL HANDLER: nenhum_motorista recebido', {
        solicitacaoId: data?.solicitacaoId,
        timestamp: new Date().toISOString()
      });

      useRidesStore.getState().clearPendingSolicitacao();

      window.dispatchEvent(
        new CustomEvent('sse-nenhum-motorista', { detail: data })
      );
    };

    const handleFalhaFinal = (data) => {
      console.log('🌍 GLOBAL HANDLER: falha_final recebido', {
        solicitacaoId: data?.solicitacaoId,
        timestamp: new Date().toISOString()
      });

      useRidesStore.getState().clearPendingSolicitacao();

      window.dispatchEvent(
        new CustomEvent('sse-falha-final', { detail: data })
      );
    };

    // Registrar todos os listeners NO NOTIFICATIONSSERVICE
    // (não esperar por isDriver estar pronto)
    const offNova = notificationsService.on('nova_solicitacao', handleNovaSolicitacao);
    const offAceita = notificationsService.on('solicitacao_aceita', handleSolicitacaoAceita);
    const offNenhum = notificationsService.on('nenhum_motorista', handleNenhumMotorista);
    const offFalha = notificationsService.on('falha_final', handleFalhaFinal);

    console.log('✅ useSolicitacoesSSE: TODOS 4 listeners registrados globalmente', {
      timestamp: new Date().toISOString(),
      note: 'Listeners ativos MESMO ANTES de saber se é motorista'
    });

    // Cleanup: remover listeners quando hook desmontar
    return () => {
      console.log('🔌 useSolicitacoesSSE: CLEANUP - Removendo 4 listeners globais', {
        timestamp: new Date().toISOString()
      });
      offNova?.();
      offAceita?.();
      offNenhum?.();
      offFalha?.();
    };
  }, [isAuthenticated]); // Depende APENAS de autenticação, não de tipo!
}
