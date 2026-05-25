import { useEffect } from 'react';
import { useAuthStore } from '@features/auth/stores/authStore';
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
      console.log('🌍 GLOBAL HANDLER: nova_solicitacao recebido', {
        solicitacaoId: data?.solicitacaoId,
        passageiroNome: data?.passageiroNome,
        timestamp: new Date().toISOString()
      });

      // Armazenar em localStorage como backup
      try {
        const stored = JSON.parse(localStorage.getItem('sse-pending-events') || '[]');
        stored.push({ type: 'nova_solicitacao', data, timestamp: new Date().toISOString() });
        localStorage.setItem('sse-pending-events', JSON.stringify(stored.slice(-10))); // Guardar últimos 10
      } catch (e) { /* ignorar */ }

      // Dispatch evento global para qualquer componente escutar
      window.dispatchEvent(
        new CustomEvent('sse-nova-solicitacao', { detail: data })
      );
    };

    const handleSolicitacaoAceita = (data) => {
      console.log('🌍 GLOBAL HANDLER: solicitacao_aceita recebido', {
        solicitacaoId: data?.solicitacaoId,
        timestamp: new Date().toISOString()
      });

      window.dispatchEvent(
        new CustomEvent('sse-solicitacao-aceita', { detail: data })
      );
    };

    const handleNenhumMotorista = (data) => {
      console.log('🌍 GLOBAL HANDLER: nenhum_motorista recebido', {
        solicitacaoId: data?.solicitacaoId,
        timestamp: new Date().toISOString()
      });

      window.dispatchEvent(
        new CustomEvent('sse-nenhum-motorista', { detail: data })
      );
    };

    const handleFalhaFinal = (data) => {
      console.log('🌍 GLOBAL HANDLER: falha_final recebido', {
        solicitacaoId: data?.solicitacaoId,
        timestamp: new Date().toISOString()
      });

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
