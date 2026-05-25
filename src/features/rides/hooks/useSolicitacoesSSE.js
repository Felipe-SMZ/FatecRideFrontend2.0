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

  useEffect(() => {
    if (!isDriver) return;

    console.log('🌍 useSolicitacoesSSE: Registrando listeners GLOBAIS para motorista');

    // Listener para nova_solicitacao
    const handleNovaSolicitacao = (data) => {
      console.log('🌍 GLOBAL EVENT: nova_solicitacao recebido', {
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
      console.log('🌍 GLOBAL EVENT: solicitacao_aceita recebido', {
        solicitacaoId: data?.solicitacaoId,
        timestamp: new Date().toISOString()
      });

      window.dispatchEvent(
        new CustomEvent('sse-solicitacao-aceita', { detail: data })
      );
    };

    const handleNenhumMotorista = (data) => {
      console.log('🌍 GLOBAL EVENT: nenhum_motorista recebido', {
        solicitacaoId: data?.solicitacaoId,
        timestamp: new Date().toISOString()
      });

      window.dispatchEvent(
        new CustomEvent('sse-nenhum-motorista', { detail: data })
      );
    };

    const handleFalhaFinal = (data) => {
      console.log('🌍 GLOBAL EVENT: falha_final recebido', {
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

    console.log('✅ useSolicitacoesSSE: Todos os listeners registrados globalmente');

    // Cleanup: remover listeners quando hook desmontar
    return () => {
      console.log('🔌 useSolicitacoesSSE: Removendo listeners globais');
      offNova?.();
      offAceita?.();
      offNenhum?.();
      offFalha?.();
    };
  }, [isDriver]);
}
