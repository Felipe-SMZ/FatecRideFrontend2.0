# 🚗 Endpoint: Finalizar/Concluir Carona

## ⚠️ Endpoint Necessário (não implementado)

O frontend precisa do seguinte endpoint para permitir que o motorista finalize/conclua uma carona:

---

## 📋 Especificação

### **Endpoint:**
```
PUT /rides/finalizar/{rideId}
```

### **Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

### **Path Parameter:**
- `rideId` (Long): ID da carona a ser finalizada

### **Response - Sucesso (200 OK):**
```json
{
  "message": "Carona finalizada com sucesso"
}
```

---

## 🔧 Implementação para RideController.java

### **Adicione este método no seu RideController:**

```java
/**
 * Finaliza uma carona ativa
 * Atualiza status da carona e das solicitações aceitas para CONCLUÍDA
 */
@PutMapping("/finalizar/{rideId}")
public ResponseEntity<Map<String, String>> finalizarCarona(
        @PathVariable Long rideId,
        @RequestHeader("Authorization") String authHeader) {
    
    Long driverId = tokenService.extractUserIdFromHeader(authHeader);
    System.out.println("Finalizando carona ID: " + rideId + " pelo motorista ID: " + driverId);
    
    rideService.finalizarCarona(rideId, driverId);
    
    return ResponseEntity.ok(Map.of("message", "Carona finalizada com sucesso"));
}
```

---

## 🔧 Implementação para RideService.java

### **Adicione este método no seu RideService:**

```java
@Transactional
public void finalizarCarona(Long rideId, Long driverId) {
    // 1. Buscar carona
    Ride ride = rideRepository.findById(rideId)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND, 
            "Carona não encontrada"
        ));
    
    // 2. Verificar se o usuário é o motorista da carona
    if (!ride.getDriver().getId().equals(driverId)) {
        throw new ResponseStatusException(
            HttpStatus.FORBIDDEN, 
            "Você não tem permissão para finalizar esta carona"
        );
    }
    
    // 3. Verificar se carona já está finalizada
    if (ride.getStatus().getId() == 5L) { // 5 = CONCLUÍDA
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST, 
            "Esta carona já foi finalizada"
        );
    }
    
    // 4. Atualizar status da carona para CONCLUÍDA (id_status = 5)
    RideStatus statusConcluida = rideStatusRepository.findById(5L)
        .orElseThrow(() -> new RuntimeException("Status CONCLUÍDA não encontrado"));
    
    ride.setStatus(statusConcluida);
    rideRepository.save(ride);
    
    // 5. Atualizar todas as solicitações ACEITAS para CONCLUÍDA
    List<PassageRequests> solicitacoesAceitas = passageRequestsRepository
        .findByRideIdAndStatusId(rideId, 2L); // 2 = ACEITA
    
    if (!solicitacoesAceitas.isEmpty()) {
        RequestStatus statusSolicitacaoConcluida = requestStatusRepository.findById(5L)
            .orElseThrow(() -> new RuntimeException("Status CONCLUÍDA não encontrado"));
        
        for (PassageRequests solicitacao : solicitacoesAceitas) {
            solicitacao.setStatus(statusSolicitacaoConcluida);
            passageRequestsRepository.save(solicitacao);
        }
        
        System.out.println("Atualizadas " + solicitacoesAceitas.size() + " solicitações para CONCLUÍDA");
    }
    
    System.out.println("Carona ID " + rideId + " finalizada com sucesso");
}
```

---

## 📊 Fluxo de Estados

### **Status da Carona (ride_status):**
- `1` = ATIVA (aguardando passageiros ou em andamento)
- `4` = CANCELADA (motorista cancelou)
- `5` = CONCLUÍDA (carona finalizada)

### **Status da Solicitação (request_status):**
- `1` = PENDENTE (aguardando aceitação do motorista)
- `2` = ACEITA (passageiro confirmado na carona)
- `3` = RECUSADA (motorista recusou)
- `4` = CANCELADA (passageiro ou motorista cancelou)
- `5` = CONCLUÍDA (carona foi finalizada)

---

## 🎯 O que acontece ao finalizar:

1. ✅ Carona muda de `id_status = 1` para `id_status = 5`
2. ✅ Todas as solicitações com `id_status = 2` (ACEITAS) mudam para `id_status = 5` (CONCLUÍDAS)
3. ✅ Carona desaparece da lista "Caronas Ativas" do motorista
4. ✅ Passageiros veem a carona na aba "Concluídas"
5. ✅ Histórico de caronas fica disponível

---

## 🧪 Teste no Postman

```bash
PUT http://localhost:8080/rides/finalizar/3
Headers:
  Authorization: Bearer {seu_token_jwt_motorista}
  Content-Type: application/json
```

**Resposta esperada:**
```json
{
  "message": "Carona finalizada com sucesso"
}
```

---

## 🔒 Validações Necessárias:

- [x] Token JWT válido
- [x] Carona existe no banco
- [x] Usuário autenticado é o motorista da carona
- [x] Carona não está já finalizada
- [x] Atualizar status da carona para CONCLUÍDA
- [x] Atualizar status de todas as solicitações ACEITAS para CONCLUÍDA

---

## ⚠️ Dependências necessárias no Service:

```java
@Autowired
private RideRepository rideRepository;

@Autowired
private PassageRequestsRepository passageRequestsRepository;

@Autowired
private RideStatusRepository rideStatusRepository;

@Autowired
private RequestStatusRepository requestStatusRepository;
```

---

## 🐛 Correção Necessária no Controller:

**IMPORTANTE:** Você tem 2 endpoints usando `@PutExchange` que deveria ser `@PutMapping`:

### ❌ Errado:
```java
@PutExchange("cancelar/{rideId}")
public ResponseEntity<String> cancelRideByDriver(...)

@PutExchange("/{rideId}")
public ResponseEntity<RideDTO> atualizarDriverRotas(...)
```

### ✅ Correto:
```java
@PutMapping("/cancelar/{rideId}")
public ResponseEntity<String> cancelRideByDriver(...)

@PutMapping("/{rideId}")
public ResponseEntity<RideDTO> atualizarDriverRotas(...)
```

**Nota:** `@PutExchange` é para HTTP Interfaces (cliente HTTP), não para Controllers REST!

---

## 📝 Checklist de Implementação:

- [ ] Adicionar método `finalizarCarona()` no `RideController`
- [ ] Adicionar método `finalizarCarona()` no `RideService`
- [ ] Corrigir `@PutExchange` para `@PutMapping` nos endpoints existentes
- [ ] Testar no Postman
- [ ] Testar no frontend

