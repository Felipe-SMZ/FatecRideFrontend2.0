// features/chat/hooks/useChat.js
import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@features/auth/stores/authStore';
import { useChatStore } from '../stores/chatStore';
import websocketService from '../services/websocketService';

/**
 * Hook para gerenciar chat com WebSocket
 * Conecta automaticamente quando o usuário está autenticado
 */
export function useChat() {
  const { token, messagesToken, isAuthenticated, user } = useAuthStore();
  const { 
    addMessage, 
    setConnected, 
    isConnected,
    markAsRead,
    incrementUnread
  } = useChatStore();
  
  const hasConnectedRef = useRef(false);
  const connectingRef = useRef(false);

  // Registrar handlers ANTES de qualquer conexão
  useEffect(() => {
    // conectar somente se autenticado e existir ao menos um token (principal ou messages)
    if (!isAuthenticated || (!token && !messagesToken)) return;
    
    console.log('🔌 Iniciando configuração WebSocket...');
    
    // Handler de mensagens recebidas (mais tolerante a formatos diferentes do servidor)
    const unsubscribeMessage = websocketService.onMessage((data) => {
      console.log('🎯 useChat - Handler de mensagem CHAMADO:', data);

      // Log completo para diagnóstico
      console.log('📨 Mensagem processada (raw):', data);

      // Tentar extrair o payload da mensagem em várias chaves possíveis
      const extractMessagePayload = (obj) => {
        if (!obj || typeof obj !== 'object') return null;
        // Possíveis lugares onde o servidor coloca o objeto da mensagem
        return obj.mensagem || obj.message || obj.data || obj.payload || obj.msg || null;
      };

      if (data.tipo === 'mensagem_recebida') {
        const incoming = extractMessagePayload(data);
        if (!incoming) {
          console.warn('⚠️ mensagem_recebida sem payload esperado:', data);
        } else {
          // Normalizar campos do payload para garantir id_solicitacao e coerência de tipos
          const msg = {
            id_sender: Number(incoming.id_sender ?? incoming.idSender ?? incoming.sender ?? incoming.id_remetente ?? null) || null,
            id_receiver: Number(incoming.id_receiver ?? incoming.idReceiver ?? incoming.receiver ?? incoming.id_destinatario ?? null) || null,
            id_solicitacao: Number(incoming.id_solicitacao ?? incoming.idSolicitacao ?? incoming.id ?? null) || null,
            message: incoming.message ?? incoming.mensagem ?? incoming.text ?? incoming.msg ?? null,
            data: incoming.data ?? incoming.timestamp ?? new Date().toISOString(),
            _id: incoming._id ?? incoming.id ?? `srv-${Date.now()}`
          };

          console.log('✉️ mensagem_recebida normalizada:', msg);

          const { addMessage, incrementUnread } = useChatStore.getState();
          addMessage(msg);

          if (window.location.pathname !== `/chat/${msg.id_solicitacao}`) {
            incrementUnread(msg.id_solicitacao);
          }
        }
      }

      if (data.tipo === 'mensagem_confirmada') {
        console.log('✅ Mensagem confirmada pelo servidor');
      }
    });

    // Handler de mudança de conexão
    const unsubscribeConnection = websocketService.onConnectionChange((connected) => {
      console.log('🔌 useChat - Status conexão mudou:', connected ? 'Conectado' : 'Desconectado');
      const { setConnected } = useChatStore.getState();
      console.log('📞 Chamando setConnected com:', connected);
      setConnected(connected);
      connectingRef.current = false;
      
      // Verificar se realmente mudou
      setTimeout(() => {
        const currentState = useChatStore.getState();
        console.log('✅ Estado atual do chatStore.isConnected:', currentState.isConnected);
      }, 100);
    });
    
    console.log('✅ Handlers registrados');
    
    // Conectar apenas na primeira vez
    if (!hasConnectedRef.current && !connectingRef.current) {
      console.log('🚀 Conectando WebSocket pela primeira vez...');
      hasConnectedRef.current = true;
      connectingRef.current = true;
      
      // IMPORTANTE: Conectar DEPOIS de registrar handlers
      const tokenToUse = messagesToken || token;
      websocketService.connect(tokenToUse);
      
      // CRÍTICO: Verificar estado após um pequeno delay
      setTimeout(() => {
        const jaConectado = websocketService.isConnected();
        console.log('🔍 Verificando se já está conectado:', jaConectado);
        
        if (jaConectado) {
          console.log('⚡ WebSocket já estava conectado! Sincronizando estado...');
          const { setConnected } = useChatStore.getState();
          setConnected(true);
          connectingRef.current = false;
        }
      }, 50);
    } else {
      // Se já estava conectado, sincronizar estado imediatamente
      console.log('🔄 WebSocket já iniciado, apenas registrando handlers...');
      const jaConectado = websocketService.isConnected();
      if (jaConectado) {
        const { setConnected } = useChatStore.getState();
        setConnected(true);
      }
    }

    // Cleanup ao desmontar
    return () => {
      console.log('🧹 Limpando handlers...');
      unsubscribeMessage();
      unsubscribeConnection();
    };
  }, [isAuthenticated, token, messagesToken]);

  // Desconectar ao fazer logout
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('🔌 Desconectando WebSocket (logout)...');
      websocketService.disconnect();
      const { setConnected } = useChatStore.getState();
      setConnected(false);
      hasConnectedRef.current = false;
      connectingRef.current = false;
    }
  }, [isAuthenticated]);

  /**
   * Enviar mensagem
   */
  const sendMessage = useCallback((message) => {
    if (!websocketService.isConnected()) {
      console.warn('⚠️ sendMessage chamado, mas WebSocket não está conectado');
      throw new Error('WebSocket não está conectado');
    }

    // Normalizar o payload antes de enviar
    const safePayload = {
      receiver: message.receiver != null ? Number(message.receiver) : message.receiver,
      id_solicitacao: message.id_solicitacao != null ? Number(message.id_solicitacao) : null,
      message: message.message,
      data: message.data || new Date().toISOString()
    };

    // Tenta enviar via WebSocket e logar resultado
    try {
      const sent = websocketService.sendMessage(safePayload);
      console.log('useChat.sendMessage -> websocketService.sendMessage retornou:', sent);
    } catch (err) {
      console.error('useChat.sendMessage -> erro ao enviar via WS, deve tratar fallback externamente:', err);
      throw err;
    }

    // Adicionar mensagem localmente (optimistic update)
    const senderId = user?.id_usuario ?? user?.id ?? user?.userId ?? null;
    addMessage({
      id_sender: senderId != null ? Number(senderId) : senderId,
      id_receiver: safePayload.receiver,
      id_solicitacao: safePayload.id_solicitacao,
      message: safePayload.message,
      data: safePayload.data,
      _id: `temp-${Date.now()}`
    });
  }, [addMessage, user]);

  return {
    sendMessage,
    isConnected,
    markAsRead
  };
}

export default useChat;
