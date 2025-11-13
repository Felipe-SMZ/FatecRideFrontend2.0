// features/chat/services/websocketService.js
/**
 * WebSocket Service para comunicação em tempo real
 * Conecta ao servidor Node.js na porta 9000
 */

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectInterval = null;
    this.messageHandler = null; // ÚNICO handler para mensagens
    this.connectionHandler = null; // ÚNICO handler para conexão
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
      // WebSocket com token no protocolo (Sec-WebSocket-Protocol header)
      this.ws = new WebSocket('ws://localhost:9000', token);

      this.ws.onopen = () => {
        console.log('✅ WebSocket conectado');
        this.isConnecting = false;
        
        // Notificar handler de conexão
        if (this.connectionHandler) {
          console.log('📢 Notificando handler de conexão');
          this.connectionHandler(true);
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
          console.log('📨 Mensagem WebSocket:', data.tipo);
          
          if (this.messageHandler) {
            this.messageHandler(data);
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
        
        if (this.connectionHandler) {
          this.connectionHandler(false);
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

    const payload = {
      receiver: message.receiver,
      id_solicitacao: message.id_solicitacao,
      data: new Date().toISOString(),
      message: message.message
    };

    console.log('📤 Enviando mensagem:', payload);
    this.ws.send(JSON.stringify(payload));
  }

  /**
   * Define handler para mensagens recebidas
   * Substitui o handler anterior (apenas 1 por vez)
   */
  onMessage(handler) {
    this.messageHandler = handler;
    return () => { this.messageHandler = null; };
  }

  /**
   * Define handler para mudanças de conexão
   * Substitui o handler anterior (apenas 1 por vez)
   */
  onConnectionChange(handler) {
    this.connectionHandler = handler;
    return () => { this.connectionHandler = null; };
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

    this.messageHandler = null;
    this.connectionHandler = null;
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
