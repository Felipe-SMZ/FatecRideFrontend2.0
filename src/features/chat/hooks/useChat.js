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
  const { token, isAuthenticated, user } = useAuthStore();
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
    if (!isAuthenticated || !token) return;
    
    console.log('🔌 Iniciando configuração WebSocket...');
    
    // Handler de mensagens recebidas
    const unsubscribeMessage = websocketService.onMessage((data) => {
      console.log('🎯 useChat - Handler de mensagem CHAMADO:', data);
      console.log('📨 Mensagem processada:', data);

      if (data.tipo === 'mensagem_recebida' && data.mensagem) {
        console.log('✉️ Tipo mensagem_recebida detectado, adicionando ao store...');
        // Usar getState para evitar dependência
        const { addMessage, incrementUnread } = useChatStore.getState();
        addMessage(data.mensagem);
        // Incrementar contador de não lidas se não estiver na conversa
        if (window.location.pathname !== `/chat/${data.mensagem.id_solicitacao}`) {
          incrementUnread(data.mensagem.id_solicitacao);
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
      websocketService.connect(token);
      
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
  }, [isAuthenticated, token]);

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
      throw new Error('WebSocket não está conectado');
    }

    websocketService.sendMessage(message);

    // Adicionar mensagem localmente (otimistic update)
    addMessage({
      id_sender: user.id,
      id_receiver: message.receiver,
      id_solicitacao: message.id_solicitacao,
      message: message.message,
      data: new Date().toISOString(),
      _id: `temp-${Date.now()}`
    });
  }, [addMessage, user]);

  return {
    sendMessage,
    isConnected,
    markAsRead
  };
}
