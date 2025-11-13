// features/chat/services/autoMessageService.js
import websocketService from './websocketService';

/**
 * Serviço para enviar mensagens automáticas do sistema
 */

/**
 * Envia mensagem automática quando motorista aceita carona
 */
export function sendRideAcceptedMessage(id_solicitacao, driverName, passengerName, origem, destino) {
  const message = {
    receiver: null, // Backend identifica pelo id_solicitacao
    id_solicitacao: parseInt(id_solicitacao),
    message: `🎉 Carona confirmada!\n\n${driverName} aceitou a solicitação de ${passengerName}.\n\nOrigem: ${origem}\nDestino: ${destino}\n\nBoa viagem! 🚗`,
    isSystemMessage: true
  };

  if (websocketService.isConnected()) {
    websocketService.sendMessage(message);
  }
}

/**
 * Envia mensagem automática quando passageiro confirma carona
 */
export function sendRideConfirmedMessage(id_solicitacao, passengerName, driverName) {
  const message = {
    receiver: null,
    id_solicitacao: parseInt(id_solicitacao),
    message: `✅ ${passengerName} confirmou presença na carona com ${driverName}!\n\nAguarde o horário combinado. 🕐`,
    isSystemMessage: true
  };

  if (websocketService.isConnected()) {
    websocketService.sendMessage(message);
  }
}

/**
 * Envia mensagem de boas-vindas ao chat
 */
export function sendWelcomeMessage(id_solicitacao, userName, otherUserName) {
  const message = {
    receiver: null,
    id_solicitacao: parseInt(id_solicitacao),
    message: `👋 Olá! Este é o chat entre ${userName} e ${otherUserName}.\n\nVocês podem usar este espaço para combinar detalhes da carona. 💬`,
    isSystemMessage: true
  };

  if (websocketService.isConnected()) {
    websocketService.sendMessage(message);
  }
}
