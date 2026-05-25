import { useEffect, useState, useRef } from 'react';
import { FiWifi, FiWifiOff, FiLoader } from 'react-icons/fi';
import notificationsService from '@shared/services/notificationsService';

/**
 * ⭐ Indicador visual de status de conexão SSE
 * Mostra em tempo real: Conectado, Desconectado, Reconectando
 * Renderiza em canto fixo (inferior direito)
 */
export function SSEStatusIndicator() {
  const [status, setStatus] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const hideTimerRef = useRef(null);

  // ⭐ NOVO: Atualizar status
  useEffect(() => {
    const currentStatus = notificationsService.getConnectionStatus();
    setStatus(currentStatus);
    setIsVisible(true);
  }, []);

  // ⭐ NOVO: Listener para eventos de conexão
  useEffect(() => {
    const handleConnected = () => {
      setStatus(prev => ({
        ...prev,
        isConnected: true,
        isReconnecting: false,
        readyState: 1,
        readyStateLabel: 'OPEN'
      }));
      setIsVisible(true);
    };

    const handleDisconnected = () => {
      setStatus(prev => ({
        ...prev,
        isConnected: false,
        readyState: 3,
        readyStateLabel: 'CLOSED'
      }));
      setIsVisible(true);
    };

    const offConnected = notificationsService.on('conexao_estabelecida', handleConnected);
    const offDisconnected = notificationsService.on('conexao_falha_permanente', handleDisconnected);

    return () => {
      offConnected?.();
      offDisconnected?.();
    };
  }, []);

  // ⭐ NOVO: Polling para atualizar status
  useEffect(() => {
    const pollInterval = setInterval(() => {
      setStatus(notificationsService.getConnectionStatus());
    }, 2000);

    return () => clearInterval(pollInterval);
  }, []);

  // ⭐ NOVO: Auto-hide quando conectado (sempre executa, sem condição)
  useEffect(() => {
    if (!status || !status.isConnected) return;

    // Se conectado, agendar para esconder
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    
    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [status?.isConnected]);

  if (!isVisible || !status) return null;

  // Determinar cor e ícone baseado no status
  let bgColor = 'bg-green-500';
  let icon = <FiWifi size={16} />;
  let label = 'Conectado';
  let tooltip = 'Conexão SSE ativa';

  if (status.isReconnecting) {
    bgColor = 'bg-amber-500';
    icon = <FiLoader size={16} className="animate-spin" />;
    label = 'Reconectando...';
    tooltip = `Tentativa ${status.reconnectAttempts}/${status.maxReconnectAttempts}`;
  } else if (!status.isConnected) {
    bgColor = 'bg-red-500';
    icon = <FiWifiOff size={16} />;
    label = 'Desconectado';
    tooltip = 'Sem conexão com servidor de notificações';
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full text-white text-sm font-medium shadow-lg transition-all duration-300 ${bgColor}`}
      title={tooltip}
    >
      {icon}
      <span>{label}</span>
      {status.isReconnecting && (
        <span className="text-xs opacity-75 ml-1">
          {status.reconnectAttempts}/{status.maxReconnectAttempts}
        </span>
      )}
    </div>
  );
}
