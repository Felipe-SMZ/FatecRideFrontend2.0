import api from '@shared/lib/api';
import notificationsService from '@shared/services/notificationsService';
import { useAuthStore } from '@features/auth/stores/authStore';

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

  // Aceitar solicitação usando o fluxo automático com body (NOVO - recomendado)
  acceptAutomatic: async (solicitacaoId, filaId) => {
    const { data } = await api.post('/solicitacao/automatico/aceitar', {
      solicitacaoId,
      filaId
    });
    return data;
  },

  // Recusar solicitação usando o fluxo automático com body (NOVO - recomendado)
  rejectAutomatic: async (solicitacaoId, filaId) => {
    const { data } = await api.post('/solicitacao/automatico/recusar', {
      solicitacaoId,
      filaId
    });
    return data;
  },

  // Aceitar solicitação usando o fluxo automático com filaId (LEGADO - path params)
  acceptAutomaticByFila: async (filaId, solicitacaoId) => {
    const { data } = await api.post(`/solicitacao/automatico/${filaId}/aceitar/${solicitacaoId}`);
    return data;
  },

  // Recusar solicitação usando o fluxo automático com filaId (LEGADO - path params)
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
    console.log('🔍 ridesService.getPassengerHistory: Chamando GET /solicitacao/concluidas');
    
    // ⭐ DEBUG: Logar token sendo enviado
    const token = useAuthStore.getState().token;
    console.log('🔑 Token disponível:', !!token);
    if (token) {
      console.log('   Token preview:', `${token.substring(0, 20)}...`);
    }
    
    try {
      const { data } = await api.get('/solicitacao/concluidas', { params: { pagina, itens } });
      console.log('✅ ridesService.getPassengerHistory: Resposta recebida:', data);
      return data;
    } catch (err) {
      // ⭐ NOVO: Se for 401, apenas warn e retorna array vazio (não lança erro)
      if (err?.response?.status === 401) {
        console.warn('⚠️ getPassengerHistory retornou 401 - retornando array vazio', {
          message: err?.message || err?.response?.data?.message,
          tokenExists: !!token,
          endpoint: '/solicitacao/concluidas'
        });
        return []; // Retorna array vazio em vez de lançar erro
      }
      
      console.error('❌ ridesService.getPassengerHistory ERRO:', {
        message: err?.message,
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        data: err?.response?.data
      });
      throw err;
    }
  },

  // Solicitações pendentes/ativas do passageiro
  getPending: async (pagina = 0, itens = 100) => {
    try {
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
    } catch (err) {
      // ⭐ NOVO: Se for 401, apenas warn e retorna array vazio (não lança erro)
      if (err?.response?.status === 401) {
        console.warn('⚠️ getPending retornou 401 - retornando array vazio para não quebrar a página', {
          message: err?.message || err?.response?.data?.message
        });
        return []; // Retorna array vazio em vez de lançar erro
      }
      // Para outros erros, propaga normalmente
      throw err;
    }
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

  // ⭐ NOVO: Buscar solicitação por ID (para PassengerFollowPage)
  getSolicitacaoById: async (solicitacaoId) => {
    try {
      console.log(`📡 ridesService.getSolicitacaoById(${solicitacaoId})`);
      
      // ⭐ OTIMIZADO: Pular GET direto (endpoint /solicitacao/{id} não existe no backend)
      // Ir direto para fallback: buscar da lista pendente
      try {
        const pending = await ridesService.getPending(0, 1000);
        let pendingArray = [];
        if (Array.isArray(pending)) pendingArray = pending;
        else if (pending?.content && Array.isArray(pending.content)) pendingArray = pending.content;
        
        const found = pendingArray.find(p => {
          const id = p?.id_solicitacao ?? p?.id;
          return Number(id) === Number(solicitacaoId);
        });
        
        if (found) {
          console.log('✅ Solicitação encontrada via /solicitacao/pending:', found);
          return found;
        }
        
        console.warn(`❌ Solicitação ${solicitacaoId} não encontrada em /solicitacao/pending`);
        return null;
      } catch (err) {
        // Se getPending falhar, apenas retornar null (não propagar erro)
        console.warn(`⚠️ Erro ao buscar de /solicitacao/pending:`, err?.message);
        return null;
      }
    } catch (err) {
      // Fallback final: sempre retornar null em vez de lançar erro
      console.error('Erro crítico ao buscar solicitação:', err?.message);
      return null;
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
  },

  // ============ AGENDAMENTO DE CARONAS ============

  // Agendar carona por dias da semana (seg=1, ter=2, ..., dom=7)
  scheduleRideWeekly: async (rideId, diasSemana) => {
    console.log('📅 Agendando carona semanal:', { ride: rideId, dia_semana_agendamento: diasSemana });
    const { data } = await api.post('/agendar-ride-dia-semana', {
      ride: rideId,
      dia_semana_agendamento: diasSemana
    });
    return data;
  },

  // Obter agendamentos semanais do motorista
  getScheduledWeekly: async () => {
    console.log('📅 Buscando agendamentos semanais...');
    const { data } = await api.get('/agendar-ride-dia-semana');
    return data;
  },

  // Desativar dias específicos de um agendamento semanal
  desactivateScheduleWeekly: async (scheduleId, diasSemana) => {
    console.log('📅 Desativando dias do agendamento:', { id: scheduleId, diasSemana });
    const { data } = await api.put(`/agendar-ride-dia-semana/desativar/${scheduleId}`, {
      diasSemana
    });
    return data;
  },

  // Agendar carona por intervalo de dias
  scheduleRideInterval: async (rideId, dataInicio, intervaloDias) => {
    console.log('📅 Agendando carona por intervalo:', { ride: rideId, dataInicio, intervalo_dias: intervaloDias });
    const { data } = await api.post('/agendar-compromisso-intervalo-dias', {
      ride: rideId,
      dataInicio,
      intervalo_dias: intervaloDias
    });
    return data;
  },

  // Obter agendamentos por intervalo do motorista
  getScheduledInterval: async () => {
    console.log('📅 Buscando agendamentos por intervalo...');
    const { data } = await api.get('/agendar-compromisso-intervalo-dias');
    return data;
  },

  // Desativar agendamento por intervalo
  desactivateScheduleInterval: async (scheduleId) => {
    console.log('📅 Desativando agendamento por intervalo:', { id: scheduleId });
    const { data } = await api.put(`/agendar-compromisso-intervalo-dias/desativar/${scheduleId}`);
    return data;
  },

  // ⭐ NOVO: Polling para recuperar evento perdido (se SSE não chegar a tempo)
  // Faz polling a cada 2s por até 30s
  pollForLostEvent: async (solicitacaoId, maxAttempts = 10, intervalMs = 3000) => {
    console.log('🔄 Iniciando polling para recuperar evento perdido:', { solicitacaoId, maxAttempts, intervalMs });
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Aguardar antes de fazer requisição (exceto primeira vez)
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
        
        const solicitacao = await ridesService.getSolicitacaoById(solicitacaoId);
        
        if (solicitacao) {
          console.log(`✅ Polling tentativa ${attempt + 1}: Solicitação encontrada`, solicitacao);
          
          // Verificar se está no status que esperamos (enviada/com fila)
          const status = solicitacao?.status || solicitacao?.solicitacao_status;
          if (status === 'ENVIADA' || status === 'enviada' || solicitacao?.fila?.length > 0) {
            console.log('🎯 Evento recuperado via polling! Retornando:', solicitacao);
            return solicitacao;
          }
        }
      } catch (err) {
        console.warn(`⚠️ Polling tentativa ${attempt + 1} falhou:`, err?.message);
      }
    }
    
    console.warn('⚠️ Polling completou', maxAttempts, 'tentativas sem recuperar evento');
    return null;
  },

  // ⭐ NOVO: Recuperar evento perdido (use para PassengerFollowPage)
  // Tenta usar localStorage primeiro, depois polling
  recoverLostEvent: async (solicitacaoId) => {
    console.log('🔍 Tentando recuperar evento perdido:', { solicitacaoId });
    
    // 1. Verificar se está em localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('sse-pending-events') || '[]');
      const found = stored.find(ev => 
        ev.data?.solicitacaoId === solicitacaoId || 
        ev.data?.id_solicitacao === solicitacaoId
      );
      
      if (found) {
        console.log('✅ Evento encontrado em localStorage:', found);
        // Disparar manualmente via notificationsService
        notificationsService.retryLostEvent('nova_solicitacao', found.data);
        // Também disparar via CustomEvent para compatibilidade
        window.dispatchEvent(new CustomEvent('sse-nova-solicitacao', {
          detail: found.data
        }));
        return found.data;
      }
    } catch (err) {
      console.warn('⚠️ Erro ao verificar localStorage:', err);
    }
    
    // 2. Fazer polling como fallback
    console.log('📡 localStorage vazio, iniciando polling...');
    const recovered = await ridesService.pollForLostEvent(solicitacaoId);
    
    if (recovered) {
      // Disparar manualmente via notificationsService
      notificationsService.retryLostEvent('nova_solicitacao', recovered);
      // Também disparar via CustomEvent para compatibilidade
      window.dispatchEvent(new CustomEvent('sse-nova-solicitacao', {
        detail: recovered
      }));
      return recovered;
    }
    
    return null;
  }
};

export { ridesService };
export default ridesService;