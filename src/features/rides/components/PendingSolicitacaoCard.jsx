import { useState, useEffect } from 'react';
import { useRidesStore } from '@features/rides/stores/ridesStore';
import ridesService from '@features/rides/services/ridesService';
import { toast } from 'react-hot-toast';

/**
 * ⭐ CARD FLUTUANTE que aparece em QUALQUER página
 * Renderiza a solicitação pendente do store
 * Permite aceitar/recusar de qualquer lugar
 */
export function PendingSolicitacaoCard() {
  const pendingSolicitacao = useRidesStore((state) => state.pendingSolicitacao);
  const clearPendingSolicitacao = useRidesStore((state) => state.clearPendingSolicitacao);
  
  const [loading, setLoading] = useState(false);

  if (!pendingSolicitacao) {
    return null; // Não renderiza nada se não houver solicitação
  }

  const handleAccept = async () => {
    try {
      setLoading(true);
      const filaId = pendingSolicitacao?.filaId ?? pendingSolicitacao?.fila_id ?? pendingSolicitacao?.id_fila;
      const solicitacaoId = pendingSolicitacao?.solicitacaoId ?? pendingSolicitacao?.id_solicitacao;
      
      console.log('🎯 PendingSolicitacaoCard: Aceitando solicitação', { solicitacaoId, filaId });
      
      if (!filaId || !solicitacaoId) {
        toast.error('⚠️ Dados incompletos para aceitar', { duration: 3000 });
        return;
      }

      // Chamar API para aceitar
      await ridesService.acceptAutomatic(solicitacaoId, filaId);

      // Limpar store e mostrar sucesso
      clearPendingSolicitacao();
      toast.success('✅ Solicitação aceita!', { duration: 3000 });
      console.log('✅ Solicitação aceita com sucesso');
      
      // ⭐ NOVO: Disparar evento para ActiveRidesPage refetch dados
      window.dispatchEvent(new CustomEvent('pendingSolicitacao-updated'));
    } catch (error) {
      console.error('❌ Erro ao aceitar:', error);
      toast.error('Erro ao aceitar solicitação', { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      const filaId = pendingSolicitacao?.filaId ?? pendingSolicitacao?.fila_id ?? pendingSolicitacao?.id_fila;
      const solicitacaoId = pendingSolicitacao?.solicitacaoId ?? pendingSolicitacao?.id_solicitacao;
      
      console.log('🎯 PendingSolicitacaoCard: Rejeitando solicitação', { solicitacaoId, filaId });
      
      if (!filaId || !solicitacaoId) {
        toast.error('⚠️ Dados incompletos para recusar', { duration: 3000 });
        return;
      }

      // Chamar API para recusar
      await ridesService.rejectAutomatic(solicitacaoId, filaId);

      // Limpar store e mostrar sucesso
      clearPendingSolicitacao();
      toast.success('✅ Solicitação recusada', { duration: 3000 });
      console.log('✅ Solicitação recusada com sucesso');
      
      // ⭐ NOVO: Disparar evento para ActiveRidesPage refetch dados
      window.dispatchEvent(new CustomEvent('pendingSolicitacao-updated'));
    } catch (error) {
      console.error('❌ Erro ao recusar:', error);
      toast.error('Erro ao recusar solicitação', { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const name = pendingSolicitacao?.passageiroNome || 'Passageiro';
  const dist = pendingSolicitacao?.distanciaOrigemKm ?? 0;
  const tentativa = pendingSolicitacao?.tentativa ?? 1;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm animate-in slide-in-from-bottom-4">
      <div className="bg-white rounded-lg border-2 border-green-300 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-green-50 border-b border-green-200 px-4 py-3 flex items-center gap-2">
          <span className="text-2xl">🔔</span>
          <h3 className="font-bold text-gray-700">Nova Solicitação!</h3>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Passageiro */}
          <div>
            <p className="text-sm text-gray-600">Passageiro</p>
            <p className="font-semibold text-gray-800">{name}</p>
          </div>

          {/* Distância */}
          <div>
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <span className="text-lg">⏱️</span>
              Distância: <span className="font-medium">{dist.toFixed(1)} km</span>
            </p>
          </div>

          {/* Tentativa */}
          <div className="text-xs text-gray-500">
            Tentativa: {tentativa}
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleAccept}
              disabled={loading}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-2 px-3 rounded transition-colors flex items-center justify-center gap-1"
            >
              ✓ Aceitar
            </button>
            <button
              onClick={handleReject}
              disabled={loading}
              className="flex-1 bg-red-200 hover:bg-red-300 disabled:bg-gray-300 text-red-800 font-bold py-2 px-3 rounded transition-colors flex items-center justify-center gap-1"
            >
              ✕ Recusar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
