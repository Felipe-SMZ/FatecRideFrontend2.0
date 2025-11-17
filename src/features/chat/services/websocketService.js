// features/chat/services/websocketService.js
/**
 * WebSocket Service para comunicação em tempo real
 * Conecta ao servidor Node.js na porta 9000
 */

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectInterval = null;
    // Suportar múltiplos handlers simultâneos (Set evita duplicatas)
    this.messageHandlers = new Set();
    this.connectionHandlers = new Set();
    this.isConnecting = false;
    this.hasEverConnected = false; // Flag global para evitar múltiplas conexões
  }

  /**
   * Conecta ao WebSocket usando o token JWT
   * @param {string} token - JWT token
   */
  connect(token) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket já está conectado');
      return;
    }

    if (this.isConnecting) {
      console.log('WebSocket já está tentando conectar');
      return;
    }

    this.isConnecting = true;

    try {
      // Usa URL configurável e envia token como subprotocol (array)
      const WS_URL = (import.meta.env.VITE_WS_URL || 'ws://localhost:9000');
      // Se houver token, enviar como subprotocol; caso contrário, conectar sem subprotocol
      if (token) {
        this.ws = new WebSocket(WS_URL, [token]);
      } else {
        this.ws = new WebSocket(WS_URL);
      }

      this.ws.onopen = () => {
        console.log('✅ WebSocket conectado');
        this.isConnecting = false;
        
        // Notificar todos os handlers de conexão
        if (this.connectionHandlers.size > 0) {
          console.log('📢 Notificando handlers de conexão:', this.connectionHandlers.size);
          this.connectionHandlers.forEach((h) => {
            try { h(true); } catch (e) { console.error('Erro em connection handler:', e); }
          });
        }
        
        // Limpar tentativas de reconexão
        if (this.reconnectInterval) {
          clearInterval(this.reconnectInterval);
          this.reconnectInterval = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Mensagem WebSocket (raw):', data);

          // Entregar a todos os handlers registrados
          if (this.messageHandlers.size > 0) {
            this.messageHandlers.forEach((h) => {
              try { h(data); } catch (e) { console.error('Erro em message handler:', e); }
            });
          }
        } catch (error) {
          console.error('❌ Erro ao parsear mensagem:', error, event.data);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ Erro no WebSocket:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket desconectado', event.code, event.reason);
        this.isConnecting = false;
        
        // Notificar todos os handlers de conexão
        if (this.connectionHandlers.size > 0) {
          this.connectionHandlers.forEach((h) => {
            try { h(false); } catch (e) { console.error('Erro em connection handler:', e); }
          });
        }
        
        // Tentar reconectar após 3 segundos se não foi fechamento intencional
        if (event.code !== 1000) {
          this.scheduleReconnect(token);
        }
      };
    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error);
      this.isConnecting = false;
    }
  }

  /**
   * Agenda reconexão automática
   */
  scheduleReconnect(token) {
    if (this.reconnectInterval) return;

    this.reconnectInterval = setTimeout(() => {
      console.log('🔄 Tentando reconectar...');
      this.reconnectInterval = null;
      this.connect(token);
    }, 3000);
  }

  /**
   * Envia mensagem pelo WebSocket
   * @param {Object} message - Dados da mensagem
   */
  sendMessage(message) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket não está conectado');
      throw new Error('WebSocket não conectado');
    }

    // Normalizar tipos: backend espera numbers para as chaves de busca
    const payload = {
      receiver: message.receiver != null ? Number(message.receiver) : message.receiver,
      id_solicitacao: message.id_solicitacao != null ? Number(message.id_solicitacao) : null,
      data: message.data || new Date().toISOString(),
      message: message.message
    };

    try {
      console.log('📤 Enviando mensagem via WS:', payload);
      this.ws.send(JSON.stringify(payload));
      console.log('🟢 Mensagem enviada via WS (socket.send retornado)');
      return true;
    } catch (err) {
      console.error('❌ Falha ao enviar mensagem via WS:', err);
      throw err;
    }
  }

  /**
   * Define handler para mensagens recebidas
   * Substitui o handler anterior (apenas 1 por vez)
   */
  onMessage(handler) {
    this.messageHandlers.add(handler);
    return () => { this.messageHandlers.delete(handler); };
  }

  /**
   * Define handler para mudanças de conexão
   * Substitui o handler anterior (apenas 1 por vez)
   */
  onConnectionChange(handler) {
    this.connectionHandlers.add(handler);
    return () => { this.connectionHandlers.delete(handler); };
  }

  /**
   * Desconecta o WebSocket
   */
  disconnect() {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Desconexão intencional');
      this.ws = null;
    }

    // Não limpar os sets para que handlers possam ser re-registrados por componentes que persistem
    // Porém, se quiser limpar tudo, pode usar clearHandlers()
  }

  // Limpa todos os handlers registrados (uso controlado)
  clearHandlers() {
    this.messageHandlers.clear();
    this.connectionHandlers.clear();
  }

  /**
   * Verifica se está conectado
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton
const websocketService = new WebSocketService();

export default websocketService;
