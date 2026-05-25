# 📋 Roteiro de Implementação - Novo Fluxo Automático SSE

**Status Geral**: � FASE 1 CONCLUÍDA  
**Branch**: `feature/frontend-adaptacao-novo-fluxo`  
**Último Commit**: `39485cb` - feat(1.5): atualizar métodos de aceitar/recusar com novo fluxo automático (body)  
**Data Início**: 2026-05-23
**Data Conclusão Fase 1**: 2026-05-23

---

## 📊 Resumo Executivo

Implementação do novo fluxo automático de solicitações com SSE e agendamento de caronas conforme especificado em `Atualizacao.md`. O fluxo muda de **manual para automático**, onde o backend orquestra a busca por motoristas e o frontend apenas dispara eventos.

---

## 🚀 Fase 1: Core Automático (Prioridade: 🔴 ALTA)

### 1.1 Atualizar `ridesService.js`
- [ ] Verificar métodos já implementados:
  - `startAutomaticFlow()` - Iniciar fluxo automático
  - `acceptAutomaticByFila()` - Aceitar via filaId
  - `rejectAutomaticByFila()` - Recusar via filaId
- [ ] Adicionar/corrigir `acceptAutomatic()` com body: `{ solicitacaoId, filaId }`
- [ ] Adicionar/corrigir `rejectAutomatic()` com body: `{ solicitacaoId, filaId }`
- [ ] Adicionar helpers para agendamento:
  - `scheduleRideWeekly(rideId, diasSemana)`
  - `getScheduledWeekly()`
  - `desactivateScheduleWeekly(id, diasSemana)`
  - `scheduleRideInterval(rideId, dataInicio, intervaloDias)`
  - `getScheduledInterval()`
  - `desactivateScheduleInterval(id)`

**Status**: ✅ CONCLUÍDO  
**Commits Relacionados**: `ed1be32`

---

### 1.2 Atualizar `PassengerPage.jsx`
- [x] Refatorar fluxo de solicitação:
  - Criar solicitação: `POST /solicitacao` → pega `id` ✅
  - Iniciar fluxo automático: `POST /solicitacao/automatico/iniciar` com coords ✅
  - Navegar para `PassengerFollowPage` para acompanhar ✅
- [x] Adicionar validações:
  - Origem e destino selecionados ✅
  - Coordenadas disponíveis (obrigatórias) ✅
- [x] Melhorar UX:
  - Toast ao criar solicitação ✅
  - Loading durante processamento ✅
  - Desabilitar botões enquanto processando ✅

**Status**: ✅ CONCLUÍDO  
**Commits Relacionados**: `27afe9f`

---

### 1.3 **CRIAR** `PassengerFollowPage.jsx` (Nova Página)
- [x] Criar arquivo em `src/features/rides/pages/PassengerFollowPage.jsx` ✅
- [x] Implementar escuta de eventos SSE:
  - `solicitacao_aceita` → Mostrar "Motorista X aceitou!" ✅
  - `nenhum_motorista` → Mostrar "Nenhum motorista próximo" ✅
  - `falha_final` → Mostrar "Tempo esgotado, tente novamente" ✅
- [x] UI:
  - Card com informações da solicitação (origem/destino) ✅
  - Status em tempo real (pending/aceito/falha) ✅
  - Botão para cancelar solicitação ✅
  - Toast de notificação ao aceitar ✅
- [x] Lógica:
  - Auto-navegar para `ActiveRequestsPage` quando aceito ✅
  - Manter listener SSE ativo enquanto página aberta ✅
  - Timeout se muito tempo sem resposta ✅

**Status**: ✅ CONCLUÍDO  
**Commits Relacionados**: `27afe9f`

---

### 1.4 Atualizar `DriverPage.jsx`
- [x] Adicionar input `data_hora_viagem` (obrigatório) ✅
- [x] Validações:
  - Formato ISO-8601: `YYYY-MM-DDTHH:mm:ss` ✅
  - Não pode ser no passado ✅
  - Não pode ser vazio ✅
- [x] Incluir no payload ao criar carona: ✅
  ```javascript
  {
    originDTO: {...},
    destinationDTO: {...},
    vagas_disponiveis: Number,
    id_veiculo: Number,
    data_hora_viagem: "2026-05-23T08:30:00"  // ← NOVO
  }
  ```
- [x] UX:
  - Usar datetime input nativo HTML5 ✅
  - Mostrar erro se inválido ✅
  - Toast de sucesso ao criar ✅

**Status**: ✅ CONCLUÍDO  
**Commits Relacionados**: `6bf65e1`

---

### 1.5 Atualizar `ActiveRidesPage.jsx` (Motorista)
- [x] Escutar SSE `nova_solicitacao`:
  - Evento contém: `{solicitacaoId, filaId, passageiroNome, distanciaOrigemKm, origem, destino, tentativa}` ✅
  - Adicionar card novo à lista ✅
  - Toast notificando: "Nova solicitação de João — 2.5 km" ✅
- [x] Card de solicitação com:
  - Nome do passageiro ✅
  - Distância da origem ✅
  - Endereços de origem e destino ✅
  - Tentativa atual (1, 2, 3) ✅
  - Botões: Aceitar | Recusar ✅
- [x] Aceitar:
  - `POST /solicitacao/automatico/aceitar` com body: `{ solicitacaoId, filaId }` ✅
  - Loading enquanto processa ✅
  - Toast de sucesso ✅
  - Remover card da lista ✅
- [x] Recusar:
  - `POST /solicitacao/automatico/recusar` com body: `{ solicitacaoId, filaId }` ✅
  - Loading enquanto processa ✅
  - Toast de sucesso ✅
  - Remover card da lista ✅
- [x] Manter SSE conectado durante a sessão ✅

**Status**: ✅ CONCLUÍDO  
**Commits Relacionados**: `39485cb`

---

## 🗓️ Fase 2: Agendamento de Caronas (Prioridade: 🟡 MÉDIA)

### 2.1 **CRIAR** `ScheduleRideWeeklyPage.jsx`
- [ ] Criar arquivo em `src/features/rides/pages/ScheduleRideWeeklyPage.jsx`
- [ ] Seleção de carona (dropdown com `/rides/corridasAtivas`)
- [ ] Checkboxes para dias da semana (seg=1, ter=2, ..., dom=7)
- [ ] Botão "Agendar"
- [ ] `POST /agendar-ride-dia-semana` com body:
  ```javascript
  {
    ride: rideId,
    dia_semana_agendamento: [1, 3, 5]
  }
  ```
- [ ] Lista de agendas já criadas (GET)
- [ ] Botão para desativar agenda específica (PUT)

**Status**: ⬜ Não iniciado  
**Commits Relacionados**: TBD

---

### 2.2 **CRIAR** `ScheduleRideIntervalPage.jsx`
- [ ] Criar arquivo em `src/features/rides/pages/ScheduleRideIntervalPage.jsx`
- [ ] Seleção de carona (dropdown)
- [ ] Input data início (date picker, formato: YYYY-MM-DD)
- [ ] Input intervalo em dias (número)
- [ ] Botão "Agendar"
- [ ] `POST /agendar-compromisso-intervalo-dias` com body:
  ```javascript
  {
    ride: rideId,
    dataInicio: "2026-05-23",
    intervalo_dias: 7
  }
  ```
- [ ] Lista de agendas criadas (GET)
- [ ] Botão para desativar

**Status**: ⬜ Não iniciado  
**Commits Relacionados**: TBD

---

### 2.3 Adicionar Rotas em `routes.jsx`
- [ ] Adicionar rota `/agendar-carona-semanal` → `ScheduleRideWeeklyPage`
- [ ] Adicionar rota `/agendar-carona-intervalo` → `ScheduleRideIntervalPage`
- [ ] Proteger rotas com `ProtectedRoute` + `requiredRole="MOTORISTA"`

**Status**: ⬜ Não iniciado  
**Commits Relacionados**: TBD

---

### 2.4 Adicionar Links no Menu/NavBar
- [ ] Link "Agendar Carona (Semanal)" → `/agendar-carona-semanal`
- [ ] Link "Agendar Carona (Intervalo)" → `/agendar-carona-intervalo`
- [ ] Mostrar apenas para MOTORISTA ou AMBOS

**Status**: ⬜ Não iniciado  
**Commits Relacionados**: TBD

---

## 🎨 Fase 3: UX & Refinamentos (Prioridade: 🟢 BAIXA)

### 3.1 Melhorias de Notificação
- [ ] Toast com ícones (✅ sucesso, ❌ erro, ⚠️ aviso, ℹ️ info)
- [ ] Duração apropriada (erro 5s, sucesso 3s)
- [ ] Mensagens específicas por cenário

**Status**: ⬜ Não iniciado  
**Commits Relacionados**: TBD

---

### 3.2 Estados de Loading
- [ ] Spinner/Skeleton em `PassengerFollowPage` enquanto aguarda resposta
- [ ] Botões desabilitados enquanto processando aceitar/recusar
- [ ] Indicador de tentativa (1/3, 2/3, 3/3)

**Status**: ⬜ Não iniciado  
**Commits Relacionados**: TBD

---

### 3.3 Tratamento de Erros
- [ ] SSE desconectado → mostrar aviso
- [ ] Requisição falhou → toast + retry
- [ ] Timeout → mensagem apropriada
- [ ] Erro genérico → mensagem clara

**Status**: ⬜ Não iniciado  
**Commits Relacionados**: TBD

---

### 3.4 Validações Robustas
- [ ] Verificar SSE conectado antes de iniciar fluxo
- [ ] Validar coordinates antes de enviar
- [ ] Data/hora válida antes de criar carona
- [ ] Verificar tokens antes de operações críticas

**Status**: ⬜ Não iniciado  
**Commits Relacionados**: TBD

---

## ✅ Checklist de Testes

### Fluxo Passageiro
- [ ] Criar solicitação → Iniciar fluxo automático → Receber resposta
- [ ] Cancelar solicitação pendente
- [ ] Receber notificação SSE quando aceito
- [ ] Navegar para chat após aceito

### Fluxo Motorista
- [ ] Receber SSE `nova_solicitacao` com todas as informações
- [ ] Aceitar solicitação → Confirmar no backend
- [ ] Recusar solicitação → Confirmar no backend
- [ ] Múltiplas solicitações simultâneas

### Agendamento
- [ ] Agendar carona semanal → Listar agendas
- [ ] Desativar agenda semanal específica
- [ ] Agendar carona por intervalo → Listar agendas
- [ ] Desativar agenda de intervalo

### SSE & Conectividade
- [ ] Reconexão automática ao SSE desconectar
- [ ] Manter conexão durante sessão longa
- [ ] Múltiplas abas abertas → não duplicar listeners

---

## 📝 Notas de Implementação

### Payload Exatos Confirmados
```javascript
// Aceitar/Recusar Solicitação
POST /solicitacao/automatico/aceitar
POST /solicitacao/automatico/recusar
Body: { solicitacaoId: Number, filaId: Number }

// Desativar Agenda Semanal
PUT /agendar-ride-dia-semana/desativar/{id}
Body: { diasSemana: [1, 3, 5] }

// Criar Carona (obrigatório data_hora_viagem)
POST /rides
Body: {
  originDTO: {...},
  destinationDTO: {...},
  vagas_disponiveis: Number,
  id_veiculo: Number,
  data_hora_viagem: "2026-05-23T08:30:00"  // ISO-8601
}
```

### Status HTTP Esperados
- `POST /users/criar*` → **201** Created
- Demais `POST` → **200** OK
- `PUT` → **200** OK
- `GET` (vazio) → **204** No Content

### Configurações Backend (application.properties)
```properties
carona.auto.limite-tentativas=3
carona.auto.timeout-motorista-segundos=120
carona.auto.fila-verificacao-intervalo-ms=60000
```

---

## 🔗 Documentação de Referência

- [`Atualizacao.md`](./Atualizacao.md) - API completa + payloads
- [`FLUXO_NOTIFICACAO_SSE.md`](./FLUXO_NOTIFICACAO_SSE.md) - Fluxo SSE detalhado
- [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md) - Estrutura do projeto

---

## 📦 Commits Relacionados

| Fase | Commit | Descrição |
|------|--------|-----------|
| 1.1 | `ed1be32` | feat(1.1): adicionar métodos para fluxo automático e agendamento de caronas |
| 1.2-1.3 | `27afe9f` | feat(1.2-1.3): implementar novo fluxo de solicitação automática e página de acompanhamento em tempo real |
| 1.4 | `6bf65e1` | feat(1.4): adicionar campo data_hora_viagem obrigatório em DriverPage |
| 1.5 | `39485cb` | feat(1.5): atualizar métodos de aceitar/recusar com novo fluxo automático (body) |
| 2.1 | TBD | feat(schedule): criar página para agendar caronas semanalmente |
| 2.2 | TBD | feat(schedule): criar página para agendar caronas por intervalo |
| 2.3 | TBD | feat(routes): adicionar rotas para agendamento de caronas |
| 2.4 | TBD | feat(ui): adicionar links de agendamento no menu de navegação |
| 3.x | TBD | refactor(ux): melhorias de UI e tratamento de erros |

---

**Última Atualização**: 2026-05-23 (Fase 1 Concluída)  
**Próxima Revisão**: Iniciar Fase 2 quando agendado

