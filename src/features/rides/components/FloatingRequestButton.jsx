import { useState } from 'react';
import { FiBell, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { Button } from '@shared/components/ui/Button';

/**
 * FloatingRequestButton - Mostra nova solicitação em um floating button
 * Aparece mesmo quando o motorista está em outra aba/página
 */
export function FloatingRequestButton({
  newRequest,
  onAccept,
  onReject,
  onClose,
  loading = false
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!newRequest) return null;

  const passengerName = newRequest?.passageiroNome || 'Passageiro';
  const distance = newRequest?.distanciaOrigemKm?.toFixed(1) ?? '?';
  const distanceText = distance !== '?' ? `${distance} km` : 'distância desconhecida';

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Button Expandido */}
      {isExpanded && (
        <div className="bg-white rounded-lg shadow-2xl border-2 border-green-500 p-4 w-80 max-w-[calc(100vw-2rem)] animate-pulse">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FiBell className="text-green-600 animate-bounce" size={20} />
              <h3 className="font-bold text-gray-900">Nova Solicitação!</h3>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Conteúdo */}
          <div className="space-y-3 mb-4">
            <div>
              <p className="text-sm text-gray-600">Passageiro</p>
              <p className="font-semibold text-gray-900">{passengerName}</p>
            </div>
            
            <div className="flex items-center gap-2 bg-blue-50 p-2 rounded">
              <FiAlertCircle className="text-blue-600" size={16} />
              <p className="text-sm text-blue-800">Distância: {distanceText}</p>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-2">
            <Button
              onClick={() => {
                onAccept?.();
              }}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2"
              size="sm"
            >
              <FiCheck className="mr-1" />
              {loading ? 'Processando...' : 'Aceitar'}
            </Button>
            <Button
              onClick={() => {
                onReject?.();
              }}
              disabled={loading}
              className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2"
              size="sm"
            >
              <FiX className="mr-1" />
              Recusar
            </Button>
          </div>

          {/* Info de distância */}
          <div className="mt-3 text-xs text-gray-500 text-center">
            Tentativa: {newRequest?.tentativa || '?'}
          </div>
        </div>
      )}

      {/* Floating Button Minimizado */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-green-600 hover:bg-green-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg animate-bounce border-4 border-green-300"
          title={`Nova solicitação de ${passengerName}`}
        >
          <FiBell size={24} />
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            1
          </span>
        </button>
      )}
    </div>
  );
}
