import { toast } from 'react-hot-toast';
import { ridesService } from '@features/rides/services/ridesService';

class NotificationsService {
  constructor() {
    this.es = null;
    this.listeners = new Map(); // eventName -> Set of handlers
    this.reconnectTimer = null;
    this.retryDelay = 3000;
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

    if (this.es) {
      console.log('notificationsService: EventSource já conectado');
      return;
    }

    const base = this.getBaseUrl();
    const url = `${base}/notificacoes/stream?token=${encodeURIComponent(token)}`;

    try {
      console.log('notificationsService.connect ->', url);
      this.es = new EventSource(url);

      this.es.onopen = () => {
        console.log('✅ SSE conectado');
        this.emit('conexao_estabelecida', 'Conexão SSE estabelecida com sucesso');
        toast.success('Conexão com servidor de notificações estabelecida');
      };

      this.es.onerror = (err) => {
        console.error('⚠️ SSE error', err);
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
            console.log(`🔔 SSE event ${evt}:`, data);
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
    if (this.reconnectTimer) return;
    console.log(`notificationsService: agendando reconexão em ${this.retryDelay}ms`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(token);
    }, this.retryDelay);
  }

  cleanupEventSource() {
    if (!this.es) return;
    try { this.es.close(); } catch (e) {}
    this.es = null;
  }

  disconnect() {
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    this.cleanupEventSource();
    console.log('notificationsService: desconectado');
  }

  on(eventName, handler) {
    if (!this.listeners.has(eventName)) this.listeners.set(eventName, new Set());
    this.listeners.get(eventName).add(handler);
    return () => this.listeners.get(eventName).delete(handler);
  }

  emit(eventName, payload) {
    const set = this.listeners.get(eventName);
    if (!set) return;
    set.forEach((h) => { try { h(payload); } catch (e) { console.error('notificationsService handler error', e); } });
  }
}

const notificationsService = new NotificationsService();

export default notificationsService;
