import { toast } from 'react-hot-toast';
import { ridesService } from '@features/rides/services/ridesService';
import { useAuthStore } from '@features/auth/stores/authStore';

class NotificationsService {
  constructor() {
    this.es = null;
    this.listeners = new Map(); // eventName -> Set of handlers
    this.reconnectTimer = null;
    this.retryDelay = 3000;
    this._lastToken = null;
    this._isDisconnectingExplicitly = false; // Flag para prevenir reconexão após logout explícito
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      try { window.__notificationsService = this; } catch (e) { }
    }
  }

  getBaseUrl() {
    const env = import.meta.env.VITE_API_URL;
    if (env) return env.replace(/\/$/, '');
    try {
      return `${window.location.protocol}//${window.location.host}`;
    } catch (e) {
      return 'http://localhost:8080';
    }
  }

  connect(token) {
    if (!token) {
      console.warn('notificationsService.connect: token ausente');
      return;
    }

    // guardar token atual para reconexões automáticas
    this._lastToken = token;

    if (this.es) {
      console.log('notificationsService: EventSource já conectado');
      return;
    }

    const base = this.getBaseUrl();
    const url = `${base}/notificacoes/stream?token=${encodeURIComponent(token)}`;

    try {
      console.log('🔗 notificationsService.connect -> iniciando conexão SSE', { url });
      this.es = new EventSource(url);

      this.es.onopen = () => {
        console.log('✅ SSE CONECTADO com sucesso!', {
          url,
          timestamp: new Date().toISOString(),
          readyState: this.es.readyState
        });
        this.emit('conexao_estabelecida', 'Conexão SSE estabelecida com sucesso');
        toast.success('Conexão com servidor de notificações estabelecida');
      };

      this.es.onerror = (err) => {
        console.error('❌ SSE ERROR:', {
          error: err,
          readyState: this.es?.readyState,
          url,
          timestamp: new Date().toISOString(),
          isDisconnectingExplicitly: this._isDisconnectingExplicitly
        });
        this.cleanupEventSource();
        this.scheduleReconnect(token);
      };

      const known = ['conexao_estabelecida','nova_solicitacao','solicitacao_aceita','nenhum_motorista','falha_final'];
      known.forEach((evt) => {
        this.es.addEventListener(evt, (e) => {
          try {
            const data = (e && e.data) ? (() => {
              try { return JSON.parse(e.data); } catch (err) { return e.data; }
            })() : null;
            console.log(`📢 SSE EVENT RECEBIDO: ${evt}`, {
              event: evt,
              data,
              timestamp: new Date().toISOString()
            });
            if (evt === 'nova_solicitacao' && data) {
              try {
                const id = data.solicitacaoId ?? data.id_solicitacao ?? data.id;
                const motorista = data.idMotorista ?? data.id_motorista ?? null;
                const passageiro = data.passageiroId ?? data.passageiro_id ?? data.passageiro ?? null;
                if (id) ridesService.saveSolicitacaoMapping(id, { motorista, passageiro });
              } catch (err) {
                console.warn('notificationsService: falha ao salvar mapeamento nova_solicitacao', err);
              }
            }
            this.emit(evt, data);
          } catch (err) {
            console.error('Erro ao processar evento SSE', err);
          }
        });
      });

    } catch (err) {
      console.error('notificationsService.connect failed', err);
      this.scheduleReconnect(token);
    }
  }

  scheduleReconnect(token) {
    // 🚫 Não reconectar se foi desconectado explicitamente (logout)
    if (this._isDisconnectingExplicitly) {
      console.log('🚫 notificationsService: desconexão explícita - pulando reconexão automática');
      return;
    }

    if (this.reconnectTimer) return;

    // Não tentar reconectar se o usuário não estiver autenticado
    try {
      const authState = useAuthStore.getState();
      const isAuth = !!authState?.isAuthenticated;
      const liveToken = authState?.token || this._lastToken;
      if (!isAuth || !liveToken) {
        console.log('notificationsService: usuário não autenticado, pulando reconexão');
        return;
      }
      console.log(`notificationsService: agendando reconexão em ${this.retryDelay}ms`);
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        // usar token mais recente (pode ter sido renovado)
        const currentToken = useAuthStore.getState()?.token || this._lastToken;
        if (useAuthStore.getState()?.isAuthenticated && currentToken) {
          console.log('✅ notificationsService: reconectando ao SSE...');
          this.connect(currentToken);
        } else {
          console.log('notificationsService: não reconectando pois usuário deslogou');
        }
      }, this.retryDelay);
    } catch (err) {
      console.warn('notificationsService.scheduleReconnect checagem auth falhou', err);
    }
  }

  cleanupEventSource() {
    if (!this.es) return;
    try { this.es.close(); } catch (e) {}
    this.es = null;
  }

  disconnect(clearListeners = false) {
    console.log('🔌 notificationsService.disconnect() chamado', { clearListeners });
    
    // Flag para prevenir reconexão automática durante logout explícito
    this._isDisconnectingExplicitly = true;

    if (this.reconnectTimer) { 
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
      console.log('  ⏰ Timer de reconexão cancelado');
    }

    if (this.es) {
      try { 
        console.log('  📡 Fechando EventSource, readyState=', this.es.readyState);
      } catch (e) { }
    }

    this.cleanupEventSource();

    if (clearListeners) {
      try { 
        this.listeners.clear();
        console.log('  🗑️ Listeners limpos');
      } catch (e) { }
    }

    // limpar token salvo para evitar reconexões posteriores
    this._lastToken = null;

    // Reset flag após um pequeno delay para garantir que tudo foi processado
    setTimeout(() => {
      this._isDisconnectingExplicitly = false;
      console.log('  ✅ Flag de desconexão explícita resetada');
    }, 100);

    console.log('🔌 notificationsService: desconectado com sucesso');
  }

  isConnected() {
    try { return !!(this.es && this.es.readyState === 1); } catch (e) { return false; }
  }

  getEventSource() { return this.es; }

  on(eventName, handler) {
    if (!this.listeners.has(eventName)) this.listeners.set(eventName, new Set());
    this.listeners.get(eventName).add(handler);
    
    const readyStateMap = {
      0: 'CONNECTING',
      1: 'OPEN ✓',
      2: 'CLOSING',
      3: 'CLOSED'
    };
    const currentState = this.es?.readyState;
    const stateLabel = readyStateMap[currentState] || 'UNKNOWN';
    
    const allListeners = Array.from(this.listeners.keys())
      .map(e => `${e}:${this.listeners.get(e).size}`)
      .join(' | ');
    
    console.log(`✅ notificationsService.on('${eventName}') - listener registrado`, {
      eventoAgora: eventName,
      totalListenersDoEvento: this.listeners.get(eventName).size,
      sseReadyState: currentState,
      sseState: stateLabel,
      hasEventSource: !!this.es,
      todosOsListeners: allListeners
    });
    
    return () => {
      this.listeners.get(eventName)?.delete(handler);
      console.log(`🔌 notificationsService.off('${eventName}') - listener removido`, {
        restantes: this.listeners.get(eventName)?.size || 0
      });
    };
  }

  /**
   * DEBUG: Mostrar estado dos listeners
   */
  debug() {
    const allListeners = Array.from(this.listeners.keys())
      .map(e => `${e}: ${this.listeners.get(e).size} listeners`)
      .join('\n  ');
    
    return {
      sseConnected: this.isConnected(),
      sseReadyState: this.es?.readyState || 'null',
      totalEvents: this.listeners.size,
      listeners: allListeners || 'NENHUM'
    };
  }

  /**
   * onEvent - Escuta TODOS os eventos SSE relevantes
   * Útil quando você quer um handler genérico que processa vários tipos de eventos
   * @param {Function} handler - Chamado com (eventData)
   * @returns {Function} Função para desinscrever
   */
  onEvent(handler) {
    const eventNames = ['conexao_estabelecida', 'nova_solicitacao', 'solicitacao_aceita', 'nenhum_motorista', 'falha_final'];
    const unsubscribers = eventNames.map(eventName => {
      return this.on(eventName, handler);
    });

    console.log(`✅ notificationsService.onEvent() - listener genérico registrado para ${eventNames.length} eventos`);

    // Retornar função que desinscreve todos os eventos
    return () => {
      unsubscribers.forEach(unsub => unsub?.());
      console.log(`🔌 notificationsService.onEvent() - listener genérico removido`);
    };
  }

  emit(eventName, payload) {
    const set = this.listeners.get(eventName);
    
    // Log para debug: mostrar todos os eventos registrados
    const allEventNames = Array.from(this.listeners.keys());
    const listenerCounts = allEventNames.map(e => `${e}:${this.listeners.get(e).size}`).join(' | ');
    
    if (!set || set.size === 0) {
      console.warn(`⚠️ notificationsService.emit('${eventName}'): nenhum listener registrado!`, {
        eventoSolicitado: eventName,
        todosOsEventos: listenerCounts || 'NENHUM EVENT REGISTRADO',
        temListeners: !!set,
        listeners: set ? set.size : 0
      });
      return;
    }
    
    console.log(`🎯 notificationsService.emit('${eventName}') -> chamando ${set.size} listener(s)`, { 
      payload,
      todosOsEventos: listenerCounts
    });
    
    set.forEach((h) => { 
      try { 
        h(payload); 
      } catch (e) { 
        console.error('notificationsService handler error', e); 
      } 
    });
  }
}

const notificationsService = new NotificationsService();

// 🔧 DEBUG: Expor notificationsService no window para testes manuais
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  try {
    window.__notificationsService = notificationsService;
    window.__debugNotifications = () => {
      console.log('📊 DEBUG Notifications Service:');
      const debug = notificationsService.debug();
      console.log('  SSE Connected:', debug.sseConnected);
      console.log('  SSE ReadyState:', debug.sseReadyState);
      console.log('  Total Events:', debug.totalEvents);
      console.log('  Listeners:');
      console.log('  ' + debug.listeners.replace(/\n/g, '\n  '));
      return debug;
    };
    
    // Add a test listener to nova_solicitacao
    window.__addTestListener = () => {
      console.log('🧪 Adicionando listener de teste para nova_solicitacao...');
      const off = notificationsService.on('nova_solicitacao', (data) => {
        console.log('🧪 TEST LISTENER DISPAROU!', data);
      });
      window.__removeTestListener = () => {
        console.log('🧪 Removendo listener de teste...');
        off();
      };
      return 'Listener adicionado. Use __removeTestListener() para remover.';
    };
  } catch (e) { }
}

export default notificationsService;
