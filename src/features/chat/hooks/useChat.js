// features/chat/hooks/useChat.js
import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@features/auth/stores/authStore';
import { useChatStore } from '../stores/chatStore';
import websocketService from '../services/websocketService';
import { chatService } from '../services/chatService';
import { ridesService } from '@features/rides/services/ridesService';

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

          // Persistir mapeamento id_solicitacao -> participantes para fallback
          try {
            if (msg.id_solicitacao) {
              const motorista = Number(msg.id_sender) || null;
              const passageiro = Number(msg.id_receiver) || null;
              ridesService.saveSolicitacaoMapping(msg.id_solicitacao, { motorista, passageiro });
              console.log('💾 mapeamento salvo via useChat (mensagem_recebida):', { id_solicitacao: msg.id_solicitacao, motorista, passageiro });
            }
          } catch (e) {
            console.warn('Falha ao salvar mapeamento via useChat:', e?.message || e);
          }

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
  const sendMessage = useCallback(async (message) => {
    // Normalizar o payload antes de enviar
    const safePayload = {
      receiver: message.receiver != null ? Number(message.receiver) : message.receiver,
      id_solicitacao: message.id_solicitacao != null ? Number(message.id_solicitacao) : null,
      message: message.message,
      data: message.data || new Date().toISOString()
    };

    const tokenToUse = messagesToken || token;

    // Tentar enviar via WS quando conectado; caso contrário, usar REST. Aguadar resultados para consistência.
    const senderId = user?.id_usuario ?? user?.id ?? user?.userId ?? null;
    const localMsgTemplate = {
      id_sender: senderId != null ? Number(senderId) : senderId,
      id_receiver: safePayload.receiver,
      id_solicitacao: safePayload.id_solicitacao,
      message: safePayload.message,
      data: safePayload.data,
      _id: `temp-${Date.now()}`
    };

    try {
      if (websocketService.isConnected()) {
        console.log('useChat.sendMessage -> enviando via WS', safePayload);
        websocketService.sendMessage(safePayload);
        // optimistic add
        addMessage(localMsgTemplate);
        return { via: 'ws' };
      }

      // WS não conectado -> enviar por REST
      console.log('useChat.sendMessage -> WS desconectado, usando REST', safePayload);
      const resp = await chatService.sendMessage(safePayload, tokenToUse);
      // se backend retornou o objeto persistido, use-o; caso contrário, usa optimistic local
      const persisted = resp && (resp.data || resp.message || resp);
      if (persisted && typeof persisted === 'object') {
        const serverMsg = {
          id_sender: persisted.id_sender ?? persisted.sender ?? persisted.from ?? senderId,
          id_receiver: persisted.id_receiver ?? persisted.receiver ?? safePayload.receiver,
          id_solicitacao: persisted.id_solicitacao ?? safePayload.id_solicitacao,
          message: persisted.message ?? persisted.mensagem ?? safePayload.message,
          data: persisted.data ?? persisted.timestamp ?? safePayload.data,
          _id: persisted._id ?? persisted.id ?? `rest-${Date.now()}`
        };
        addMessage(serverMsg);
        return { via: 'rest', serverMsg };
      }

      // fallback optimistic
      addMessage(localMsgTemplate);
      return { via: 'rest', optimistic: true };
    } catch (err) {
      console.error('useChat.sendMessage -> erro ao enviar mensagem:', err);
      throw err;
    }
  }, [addMessage, user]);

  return {
    sendMessage,
    isConnected,
    markAsRead
  };
}

export default useChat;
