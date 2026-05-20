import api from '@shared/lib/api';

const ridesService = {
  // Criar carona (motorista)
  createRide: async (payload) => {
    const { data } = await api.post('/rides', payload);
    return data;
  },

  // Alias backward-compatível
  create: async (payload) => {
    return ridesService.createRide(payload);
  },

  // Buscar caronas próximas (passageiro)
  searchNearby: async (payload) => {
    const { data } = await api.post('/solicitacao/proximos', payload);
    return data;
  },

  // Solicitar carona (passageiro)
  requestRide: async (payload) => {
    const { data } = await api.post('/solicitacao', payload);
    return data;
  },

  // Iniciar fluxo automático para uma solicitação existente
  startAutomaticFlow: async ({ solicitacaoId, latitudeOrigem, longitudeOrigem, latitudeDestino, longitudeDestino } = {}) => {
    const body = { solicitacaoId };
    if (latitudeOrigem !== undefined && latitudeOrigem !== null) body.latitudeOrigem = latitudeOrigem;
    if (longitudeOrigem !== undefined && longitudeOrigem !== null) body.longitudeOrigem = longitudeOrigem;
    if (latitudeDestino !== undefined && latitudeDestino !== null) body.latitudeDestino = latitudeDestino;
    if (longitudeDestino !== undefined && longitudeDestino !== null) body.longitudeDestino = longitudeDestino;

    const { data } = await api.post('/solicitacao/automatico/iniciar', body);
    return data;
  },

  // Aceitar solicitação usando o fluxo automático com filaId
  acceptAutomaticByFila: async (filaId, solicitacaoId) => {
    const { data } = await api.post(`/solicitacao/automatico/${filaId}/aceitar/${solicitacaoId}`);
    return data;
  },

  // Recusar solicitação usando o fluxo automático com filaId
  rejectAutomaticByFila: async (filaId, solicitacaoId) => {
    const { data } = await api.post(`/solicitacao/automatico/${filaId}/recusar/${solicitacaoId}`);
    return data;
  },

  // Histórico de motorista
  getHistory: async (pagina = 0, itens = 50) => {
    const { data } = await api.get('/rides/history', { params: { pagina, itens } });
    return data;
  },

  // Histórico de solicitações do passageiro
  getPassengerHistory: async (pagina = 0, itens = 50) => {
    const { data } = await api.get('/solicitacao/concluidas', { params: { pagina, itens } });
    return data;
  },

  // Solicitações pendentes/ativas do passageiro
  getPending: async (pagina = 0, itens = 100) => {
    const { data } = await api.get('/solicitacao/pending', { params: { pagina, itens } });

    // Persistir mapeamento id_solicitacao -> { motorista, passageiro } em localStorage para fallback
    try {
      const STORAGE_KEY = 'fatecride_solicitacao_to_users';
      const raw = localStorage.getItem(STORAGE_KEY);
      const map = raw ? JSON.parse(raw) : {};

      let pendingArray = [];
      if (Array.isArray(data)) pendingArray = data;
      else if (data?.content && Array.isArray(data.content)) pendingArray = data.content;
      else if (data && typeof data === 'object') pendingArray = [data];

      pendingArray.forEach(p => {
        const idSolicitacao = p?.id_solicitacao ?? p?.id ?? null;
        const motorista = p?.id_motorista ?? p?.idMotorista ?? (p?.carona && (p.carona.id_motorista ?? p.carona.idMotorista)) ?? null;
        const passageiro = p?.id_passageiro ?? p?.idPassageiro ?? (p?.passageiro && (p.passageiro.id ?? null)) ?? null;
        if (idSolicitacao != null) {
          map[String(idSolicitacao)] = {
            motorista: motorista != null ? Number(motorista) : null,
            passageiro: passageiro != null ? Number(passageiro) : null
          };
        }
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch (err) {
      // não bloquear a resposta por falha no localStorage
      console.warn('ridesService: falha ao persistir mapeamento pending ->', err?.message || err);
    }

    return data;
  },

  // Para MOTORISTAS: buscar solicitações referentes às minhas caronas (driver view)
  getRequestsForMyRide: async () => {
    try {
      const { data } = await api.get('/rides/requestsForMyRide');
      return data;
    } catch (err) {
      // Propaga para o chamador tratar
      throw err;
    }
  },

  // Helpers para persistência/recuperação local do mapeamento id_solicitacao -> {motorista, passageiro}
  saveSolicitacaoMapping: (idSolicitacao, { motorista = null, passageiro = null } = {}) => {
    try {
      const STORAGE_KEY = 'fatecride_solicitacao_to_users';
      const raw = localStorage.getItem(STORAGE_KEY);
      const map = raw ? JSON.parse(raw) : {};
      const key = String(idSolicitacao);
      const prev = map[key] || { motorista: null, passageiro: null };
      if (idSolicitacao != null) {
        map[key] = {
          motorista: motorista != null ? Number(motorista) : prev.motorista || null,
          passageiro: passageiro != null ? Number(passageiro) : prev.passageiro || null
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
      }
    } catch (err) {
      console.warn('ridesService: falha ao salvar mapeamento ->', err?.message || err);
    }
  },

  // Se `myUserId` for passado, retorna o outro participante (por exemplo, para motorista retorna passageiro e vice-versa)
  getSolicitacaoMapping: (idSolicitacao, myUserId = null) => {
    try {
      const STORAGE_KEY = 'fatecride_solicitacao_to_users';
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const map = JSON.parse(raw);
      const entry = map[String(idSolicitacao)];
      if (!entry) return null;
      const motorista = entry.motorista ?? null;
      const passageiro = entry.passageiro ?? null;
      if (myUserId != null) {
        const idNum = Number(myUserId);
        if (motorista && motorista === idNum) return passageiro || null;
        if (passageiro && passageiro === idNum) return motorista || null;
        // Se myUserId não corresponde a nenhum, preferir motorista quando existir
      }
      return motorista != null ? motorista : (passageiro != null ? passageiro : null);
    } catch (err) {
      console.warn('ridesService: falha ao ler mapeamento ->', err?.message || err);
      return null;
    }
  },

  // Buscar carona por id (se o backend suportar /rides/{id})
  getRideById: async (id) => {
    try {
      const { data } = await api.get(`/rides/${id}`);
      return data;
    } catch (err) {
      // Propaga erro para o chamador, que faz fallback
      throw err;
    }
  },

  // Corridas ativas
  getActive: async () => {
    const { data } = await api.get('/rides/corridasAtivas');
    return data;
  },

  // Cancelar carona
  cancel: async (id) => {
    await api.put(`/rides/cancelar/${id}`);
  },

  // Cancelar solicitação (passageiro)
  cancelRequest: async (requestId) => {
    const { data } = await api.put(`/solicitacao/${requestId}/cancelar`);
    return data;
  },

  // Atualizar carona
  update: async (id, rideData) => {
    const { data } = await api.put(`/rides/${id}`, rideData);
    return data;
  }
};

export { ridesService };
export default ridesService;