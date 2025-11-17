import websocketService from './websocketService';
import { chatService } from './chatService';
import { useAuthStore } from '@features/auth/stores/authStore';

/**
 * Serviço para enviar mensagens automáticas do sistema.
 * Tenta enviar via WebSocket quando possível; faz fallback via REST.
 */

async function _sendMessageWithFallback(messagePayload) {
  try {
    if (websocketService.isConnected()) {
      websocketService.sendMessage(messagePayload);
      return { via: 'ws' };
    }

    // fallback REST
    const token = useAuthStore.getState().messagesToken || useAuthStore.getState().token;
    const resp = await chatService.sendMessage(messagePayload, token);
    return { via: 'rest', resp };
  } catch (error) {
    console.warn('autoMessageService: erro ao enviar mensagem automática', error);
    return { error };
  }
}

export async function sendRideAcceptedMessage(id_solicitacao, driverName, passengerName, origem, destino) {
  const message = {
    receiver: null,
    id_solicitacao: parseInt(id_solicitacao),
    message: `🎉 Carona confirmada!\n\n${driverName} aceitou a solicitação de ${passengerName}.\n\nOrigem: ${origem}\nDestino: ${destino}\n\nBoa viagem! 🚗`,
    isSystemMessage: true,
    data: new Date().toISOString()
  };

  return await _sendMessageWithFallback(message);
}

export async function sendRideConfirmedMessage(id_solicitacao, passengerName, driverName) {
  const message = {
    receiver: null,
    id_solicitacao: parseInt(id_solicitacao),
    message: `✅ ${passengerName} confirmou presença na carona com ${driverName}!\n\nAguarde o horário combinado. 🕐`,
    isSystemMessage: true,
    data: new Date().toISOString()
  };

  return await _sendMessageWithFallback(message);
}

export async function sendWelcomeMessage(id_solicitacao, userName, otherUserName) {
  const message = {
    receiver: null,
    id_solicitacao: parseInt(id_solicitacao),
    message: `👋 Olá! Este é o chat entre ${userName} e ${otherUserName}.\n\nVocês podem usar este espaço para combinar detalhes da carona. 💬`,
    isSystemMessage: true,
    data: new Date().toISOString()
  };

  return await _sendMessageWithFallback(message);
}

export default {
  sendRideAcceptedMessage,
  sendRideConfirmedMessage,
  sendWelcomeMessage
};
