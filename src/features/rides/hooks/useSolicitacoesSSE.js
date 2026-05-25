import { useEffect } from 'react';
import { useAuthStore } from '@features/auth/stores/authStore';
import notificationsService from '@shared/services/notificationsService';

/**
 * Hook global para escutar eventos SSE de solicitações
 * Registra listeners GLOBALMENTE (não depende de qual página está ativa)
 * Armazena em Zustand para qualquer componente acessar
 */
export function useSolicitacoesSSE() {
  const { user } = useAuthStore();
  const isDriver = user?.tipo === 'MOTORISTA' || user?.tipo === 'AMBOS';

  console.log('🌍 useSolicitacoesSSE - Hook renderizado', {
    isDriver,
    userTipo: user?.tipo,
    userId: user?.id,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    if (!isDriver) {
      console.log('🌍 useSolicitacoesSSE - Usuário não é motorista, pulando setup');
      return;
    }

    console.log('🌍 useSolicitacoesSSE - SETUP: Registrando listeners GLOBAIS para motorista', {
      timestamp: new Date().toISOString(),
      sseStatus: notificationsService.es?.readyState ? 'OPEN' : 'CLOSED'
    });

    // Listener para nova_solicitacao
    const handleNovaSolicitacao = (data) => {
      console.log('🌍 GLOBAL HANDLER: nova_solicitacao recebido em useSolicitacoesSSE', {
        solicitacaoId: data?.solicitacaoId,
        passageiroNome: data?.passageiroNome,
        timestamp: new Date().toISOString()
      });

      // Dispatch evento global para qualquer componente escutar
      window.dispatchEvent(
        new CustomEvent('sse-nova-solicitacao', { detail: data })
      );
    };

    const handleSolicitacaoAceita = (data) => {
      console.log('🌍 GLOBAL HANDLER: solicitacao_aceita recebido em useSolicitacoesSSE', {
        solicitacaoId: data?.solicitacaoId,
        timestamp: new Date().toISOString()
      });

      window.dispatchEvent(
        new CustomEvent('sse-solicitacao-aceita', { detail: data })
      );
    };

    const handleNenhumMotorista = (data) => {
      console.log('🌍 GLOBAL HANDLER: nenhum_motorista recebido em useSolicitacoesSSE', {
        solicitacaoId: data?.solicitacaoId,
        timestamp: new Date().toISOString()
      });

      window.dispatchEvent(
        new CustomEvent('sse-nenhum-motorista', { detail: data })
      );
    };

    const handleFalhaFinal = (data) => {
      console.log('🌍 GLOBAL HANDLER: falha_final recebido em useSolicitacoesSSE', {
        solicitacaoId: data?.solicitacaoId,
        timestamp: new Date().toISOString()
      });

      window.dispatchEvent(
        new CustomEvent('sse-falha-final', { detail: data })
      );
    };

    // Registrar todos os listeners
    const offNova = notificationsService.on('nova_solicitacao', handleNovaSolicitacao);
    const offAceita = notificationsService.on('solicitacao_aceita', handleSolicitacaoAceita);
    const offNenhum = notificationsService.on('nenhum_motorista', handleNenhumMotorista);
    const offFalha = notificationsService.on('falha_final', handleFalhaFinal);

    console.log('✅ useSolicitacoesSSE: TODOS 4 listeners registrados globalmente', {
      timestamp: new Date().toISOString()
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
  }, [isDriver]);
}
