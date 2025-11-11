# 🚀 SPRINTS - FatecRide Frontend Refatoração

> **Projeto Acadêmico**: Este documento foi criado para guiar o aprendizado e desenvolvimento do projeto.
> **Data de Início**: Novembro 2025
> **Duração Estimada**: 12-15 dias (2-3 semanas)

---

## 📚 OBJETIVO PEDAGÓGICO

Cada sprint foi desenhada para você **aprender** conceitos importantes de React moderno:

- **Sprint 1**: Componentização e Design System
- **Sprint 2**: Formulários complexos e validação
- **Sprint 3**: CRUD e gerenciamento de estado
- **Sprint 4**: Integração de APIs e lógica de negócio
- **Sprint 5**: Perfis de usuário e geolocalização avançada
- **Sprint 6**: Boas práticas, testes e qualidade

---

## 📊 PROGRESSO GERAL

```
✅ Setup Inicial (100%)
✅ Infraestrutura Core (100%)
✅ Componentes Base UI (70%)
✅ Feature: Auth (60%)
✅ Feature: Rides (50%)
🚧 Feature: Vehicles (20%)
🚧 Feature: Profile (0%)
🚧 Feature: Map (50%)

TOTAL: 60% Concluído
```

---

## 🎯 SPRINT 1: Componentes UI & Layout

**Duração**: 2-3 dias  
**Prioridade**: ALTA  
**Objetivo**: Completar a biblioteca de componentes reutilizáveis

### 📖 O que você vai aprender:
- Criar componentes acessíveis (WCAG)
- Composition Pattern
- Compound Components
- Props drilling vs Context
- Tailwind avançado (variants, animations)
- React.forwardRef e useImperativeHandle

### ✅ Tarefas

#### 1.1. Select Component (Dropdown)
```jsx
// Aprender: Controlled components, acessibilidade
□ Criar Select.jsx em shared/components/ui/
□ Implementar com label, error, helper text
□ Adicionar suporte a ícones
□ Testar com options dinâmicas
```

**Exemplo de uso**:
```jsx
<Select
  label="Curso"
  options={courses}
  value={selectedCourse}
  onChange={setCourse}
  error={errors.course}
/>
```

#### 1.2. Alert Component
```jsx
// Aprender: Variants pattern, ícones dinâmicos
□ Criar Alert.jsx
□ Variants: info, success, warning, danger
□ Suporte a título + descrição
□ Botão de fechar (opcional)
```

**Exemplo de uso**:
```jsx
<Alert variant="success">
  <AlertTitle>Sucesso!</AlertTitle>
  <AlertDescription>Carona criada.</AlertDescription>
</Alert>
```

#### 1.3. Badge Component
```jsx
// Aprender: Micro-componentes, design system
□ Criar Badge.jsx
□ Variants: primary, success, warning, danger
□ Sizes: sm, md, lg
□ Suporte a ícones
```

**Exemplo de uso**:
```jsx
<Badge variant="success">Ativa</Badge>
<Badge variant="warning">3 vagas</Badge>
```

#### 1.4. Modal Component
```jsx
// Aprender: Portals, focus trap, acessibilidade
□ Criar Modal.jsx
□ Usar ReactDOM.createPortal
□ Implementar overlay + backdrop
□ Focus trap (focar primeiro input)
□ Fechar com ESC
□ Prevenir scroll do body
```

**Exemplo de uso**:
```jsx
<Modal isOpen={isOpen} onClose={onClose} title="Confirmar">
  <p>Deseja deletar este veículo?</p>
  <Button variant="danger" onClick={handleDelete}>
    Confirmar
  </Button>
</Modal>
```

#### 1.5. Tooltip Component
```jsx
// Aprender: Positioning, hover states
□ Criar Tooltip.jsx
□ Posições: top, bottom, left, right
□ Delay no hover
□ Acessível (aria-describedby)
```

**Exemplo de uso**:
```jsx
<Tooltip content="Número de passageiros permitidos">
  <InfoIcon />
</Tooltip>
```

#### 1.6. Header Component
```jsx
// Aprender: Layout, navegação, responsive menu
□ Criar Header.jsx em shared/components/layout/
□ Logo da FATEC
□ Nome do usuário + foto
□ Botão de logout
□ Responsivo (menu hamburger mobile)
```

#### 1.7. HeaderMenu Component
```jsx
// Aprender: Navegação condicional por role
□ Criar HeaderMenu.jsx
□ Links diferentes para Passageiro/Motorista
□ Active state no link atual
□ Usar react-router-dom NavLink
```

#### 1.8. PageContainer Component
```jsx
// Aprender: Layout wrapper, children pattern
□ Criar PageContainer.jsx
□ Wrapper com padding e max-width
□ Opcional: breadcrumbs
□ Opcional: page title
```

### 🎓 Recursos de Estudo:
- [React Patterns - Compound Components](https://www.patterns.dev/posts/compound-pattern)
- [React Portals](https://react.dev/reference/react-dom/createPortal)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Tailwind Variants](https://tailwindcss.com/docs/hover-focus-and-other-states)

---

## 🔐 SPRINT 2: Auth Completo

**Duração**: 2 dias  
**Prioridade**: CRÍTICA  
**Objetivo**: Sistema de autenticação completo e seguro

### 📖 O que você vai aprender:
- Formulários multi-step
- React Hook Form avançado
- Validação condicional (Zod)
- Protected Routes
- JWT e persistência de sessão
- Upload de imagens (base64)

### ✅ Tarefas

#### 2.1. RegisterForm Multi-Step
```jsx
// Aprender: Wizard pattern, state management
□ Criar RegisterForm.jsx
□ Step 1: Dados pessoais (nome, email, senha)
□ Step 2: Tipo de usuário (Passageiro/Motorista/Ambos)
□ Step 3: Endereço (integração ViaCEP)
□ Step 4: Veículo (se motorista)
□ Navegação entre steps
□ Validação por step
□ Progresso visual (stepper)
```

**Estrutura**:
```
auth/components/RegisterSteps/
├── Step1Personal.jsx
├── Step2UserType.jsx
├── Step3Address.jsx
├── Step4Vehicle.jsx (opcional)
└── StepIndicator.jsx
```

#### 2.2. LoginPage & RegisterPage
```jsx
// Aprender: Layout de autenticação
□ Criar LoginPage.jsx
□ Criar RegisterPage.jsx
□ Layout centralizado com logo
□ Link entre login/cadastro
□ Responsivo mobile
```

#### 2.3. ProtectedRoute Component
```jsx
// Aprender: Route guards, redirecionamento
□ Criar ProtectedRoute.jsx em shared/components/
□ Verificar autenticação (useAuthStore)
□ Redirecionar para login se não autenticado
□ Verificar tipo de usuário (opcional)
```

**Exemplo**:
```jsx
<Route 
  path="/motorista" 
  element={
    <ProtectedRoute requiredType="motorista">
      <DriverPage />
    </ProtectedRoute>
  } 
/>
```

#### 2.4. Integração ViaCEP
```jsx
// Aprender: APIs externas, debounce
□ Criar hook useCep.js
□ Auto-preencher endereço por CEP
□ Loading state durante busca
□ Tratamento de erro (CEP inválido)
```

#### 2.5. Upload de Foto (opcional)
```jsx
// Aprender: FileReader API, preview, base64
□ Criar ImageUpload.jsx
□ Preview da imagem
□ Validação (tamanho, tipo)
□ Converter para base64 ou URL
```

### 🎓 Recursos de Estudo:
- [React Hook Form Wizard](https://react-hook-form.com/advanced-usage#WizardFormFunnel)
- [Zod Conditional Validation](https://zod.dev/?id=conditional-validation)
- [ViaCEP API](https://viacep.com.br/)
- [React Router Protected Routes](https://ui.dev/react-router-protected-routes)

---

## 🚗 SPRINT 3: Vehicles CRUD Completo

**Duração**: 1-2 dias  
**Prioridade**: ALTA  
**Objetivo**: Sistema completo de gerenciamento de veículos

### 📖 O que você vai aprender:
- CRUD completo com React Query
- Mutations (create, update, delete)
- Optimistic updates
- Cache invalidation
- Confirmações modais
- Lista vazia (empty states)

### ✅ Tarefas

#### 3.1. VehicleCard Component
```jsx
// Aprender: Cards interativos, actions
□ Criar VehicleCard.jsx
□ Exibir: marca, modelo, placa, cor, ano, vagas
□ Botões: Editar, Deletar
□ Badge de "Veículo Ativo"
□ Hover effects
```

#### 3.2. VehiclesList Component
```jsx
// Aprender: Listas, loading, empty states
□ Criar VehiclesList.jsx
□ Grid responsivo de cards
□ Skeleton loading
□ EmptyState se não houver veículos
□ Botão "Adicionar Veículo"
```

#### 3.3. Vehicles Service
```jsx
// Aprender: Abstrair API calls
□ Criar vehiclesService.js
□ getVehicles() - GET /veiculos
□ createVehicle(data) - POST /veiculos
□ updateVehicle(id, data) - PUT /veiculos/{id}
□ deleteVehicle(id) - DELETE /veiculos/{id}
```

#### 3.4. useVehicles Hook
```jsx
// Aprender: Custom hooks, React Query mutations
□ Criar useVehicles.js
□ useVehicles() - listar
□ useCreateVehicle() - criar com toast
□ useUpdateVehicle() - editar com toast
□ useDeleteVehicle() - deletar com confirmação
□ Invalidar cache após mutations
```

#### 3.5. VehiclesPage
```jsx
// Aprender: Página completa, modal para form
□ Criar VehiclesPage.jsx
□ Header com título
□ VehiclesList
□ Modal para adicionar/editar
□ Reutilizar VehicleForm (já existe)
□ Confirmação antes de deletar
```

### 🎓 Recursos de Estudo:
- [React Query Mutations](https://tanstack.com/query/latest/docs/react/guides/mutations)
- [Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
- [Cache Invalidation](https://tanstack.com/query/latest/docs/react/guides/query-invalidation)

---

## 🚖 SPRINT 4: Rides - Componentes & Lógica

**Duração**: 2-3 dias  
**Prioridade**: CRÍTICA  
**Objetivo**: Sistema completo de caronas (core do app)

### 📖 O que você vai aprender:
- Busca geolocalizada complexa
- Integração com múltiplas APIs (backend + OpenStreetMap)
- Gerenciamento de estado complexo
- Paginação
- Filtros em tempo real

### ✅ Tarefas

#### 4.1. RideCard Component
```jsx
// Aprender: Cards informativos, badges de status
□ Criar RideCard.jsx em features/rides/components/
□ Exibir: origem → destino
□ Motorista: nome, foto, curso
□ Veículo: marca, modelo, cor
□ Vagas disponíveis (badge)
□ Status: ativa, concluída, cancelada
□ Botão de ação (conforme contexto)
```

#### 4.2. RidesList Component
```jsx
// Aprender: Listas filtráveis, infinite scroll
□ Criar RidesList.jsx
□ Grid/Lista de RideCards
□ Skeleton loading
□ EmptyState personalizado
□ Filtros opcionais (por status, data)
```

#### 4.3. SearchRidesForm Component
```jsx
// Aprender: Geolocalização, autocomplete
□ Criar SearchRidesForm.jsx
□ Inputs: Origem e Destino
□ Integrar com OpenStreetMap (autocomplete)
□ Botão "Buscar Caronas"
□ Validação de endereços
□ Loading durante busca
```

#### 4.4. AddressCards Component
```jsx
// Aprender: Visualização de dados geo
□ Criar AddressCards.jsx
□ Card de Origem
□ Card de Destino
□ Exibir: endereço completo, coordenadas
□ Ícones de localização
```

#### 4.5. ConfirmRidePage
```jsx
// Aprender: Confirmação de ações importantes
□ Criar ConfirmRidePage.jsx
□ Resumo da carona criada
□ Mapa com rota
□ Detalhes completos
□ Botões: Voltar, Ver Caronas Ativas
```

#### 4.6. HistoryPage
```jsx
// Aprender: Paginação, histórico
□ Criar HistoryPage.jsx
□ Tabs: Caronas como Motorista / como Passageiro
□ Lista paginada (5 por página)
□ Navegação de páginas
□ Filtro por período (opcional)
```

#### 4.7. useSearchRides Hook
```jsx
// Aprender: Busca geolocalizada (Haversine)
□ Criar useSearchRides.js
□ Buscar caronas próximas (POST /solicitacao/proximos)
□ Calcular distâncias
□ Filtrar por raio (9km origem, 300m destino)
```

#### 4.8. useRequestRide Hook
```jsx
// Aprender: Solicitações, status
□ Criar useRequestRide.js
□ Solicitar carona (POST /solicitacao)
□ Verificar solicitação pendente (GET /solicitacao/pending)
□ Cancelar solicitação (PUT /solicitacao/cancelar/{id})
```

### 🎓 Recursos de Estudo:
- [Haversine Formula](https://en.wikipedia.org/wiki/Haversine_formula)
- [OpenStreetMap Nominatim API](https://nominatim.org/release-docs/latest/api/Overview/)
- [React Query Pagination](https://tanstack.com/query/latest/docs/react/guides/paginated-queries)

---

## 👤 SPRINT 5: Profile & Map Avançado

**Duração**: 1-2 dias  
**Prioridade**: MÉDIA  
**Objetivo**: Perfil editável e melhorias no mapa

### 📖 O que você vai aprender:
- Formulários de edição com valores iniciais
- Upload e crop de imagens
- Leaflet Routing Machine
- Separação de concerns (features)

### ✅ Tarefas

#### 5.1. ProfileForm Component
```jsx
// Aprender: Edição de dados do usuário
□ Criar ProfileForm.jsx em features/profile/components/
□ Campos: nome, sobrenome, email, telefone, foto
□ Senha obrigatória (backend exige)
□ Validação
□ Preview da foto
```

#### 5.2. AddressForm Component
```jsx
// Aprender: Formulário de endereço separado
□ Criar AddressForm.jsx
□ Integração ViaCEP
□ Campos: CEP, logradouro, número, bairro, cidade, UF
□ Auto-preenchimento
```

#### 5.3. useProfile Hook
```jsx
// Aprender: Gerenciar dados do perfil
□ Criar useProfile.js
□ useProfile() - buscar dados (GET /users)
□ useUpdateProfile() - atualizar (PUT /users)
□ Sincronizar com authStore
```

#### 5.4. ProfilePage
```jsx
// Aprender: Página de perfil completa
□ Criar ProfilePage.jsx
□ Tabs: Dados Pessoais / Endereço / Segurança
□ ProfileForm
□ AddressForm
□ Botão "Deletar Conta" (com confirmação)
```

#### 5.5. RoutingMachine Component
```jsx
// Aprender: Leaflet Routing Machine
□ Criar RoutingMachine.jsx em features/map/components/
□ Integrar leaflet-routing-machine
□ Calcular rota entre origem/destino
□ Exibir distância e tempo
□ Estilização customizada
```

#### 5.6. Reorganizar Map Feature
```jsx
// Aprender: Organização de código
□ Mover RideMap.jsx para features/map/
□ Mover useGeolocation.js para features/map/hooks/
□ Atualizar imports
```

### 🎓 Recursos de Estudo:
- [Leaflet Routing Machine](https://www.liedman.net/leaflet-routing-machine/)
- [React Leaflet](https://react-leaflet.js.org/)
- [Image Crop React](https://www.npmjs.com/package/react-image-crop)

---

## 🎨 SPRINT 6: Polimento, Testes & Qualidade

**Duração**: 2-3 dias  
**Prioridade**: ALTA  
**Objetivo**: Garantir qualidade, UX e acessibilidade

### 📖 O que você vai aprender:
- Testes manuais sistemáticos
- Validação de IHC (Heurísticas de Nielsen)
- Acessibilidade (WCAG 2.1 AA)
- Performance optimization
- Error boundaries
- Code review próprio

### ✅ Tarefas

#### 6.1. Testes de Fluxos Completos
```
□ Fluxo: Cadastro → Login → Dashboard
□ Fluxo: Cadastrar veículo → Criar carona
□ Fluxo: Buscar carona → Solicitar → Confirmar
□ Fluxo: Ver histórico paginado
□ Fluxo: Editar perfil → Logout
□ Fluxo: Cancelar carona/solicitação
□ Testar erros: campos vazios, API offline
```

#### 6.2. Responsividade
```
□ Testar em 320px (mobile small)
□ Testar em 768px (tablet)
□ Testar em 1024px (desktop)
□ Testar em 1920px (large desktop)
□ Verificar áreas de toque (min 44x44px)
□ Menu hamburger funcionando
```

#### 6.3. Acessibilidade (WCAG)
```
□ Alt text em todas as imagens
□ Labels em todos os inputs
□ Contraste mínimo 4.5:1 (texto)
□ Navegação por teclado (Tab)
□ Focus visível em todos os elementos
□ ARIA labels onde necessário
□ Skip links
□ Testar com leitor de tela (NVDA/JAWS)
```

#### 6.4. IHC - Heurísticas de Nielsen
```
□ Visibilidade do status (loading, confirmações)
□ Correspondência com mundo real (linguagem clara)
□ Controle e liberdade (cancelar ações)
□ Consistência (cores, botões, padrões)
□ Prevenção de erros (validação, confirmações)
□ Reconhecimento vs memorização (dropdowns)
□ Flexibilidade (atalhos, ações rápidas)
□ Design minimalista (sem info desnecessária)
□ Recuperação de erros (mensagens claras)
□ Ajuda e documentação (tooltips, helper text)
```

#### 6.5. Performance
```
□ Implementar lazy loading de rotas
□ Code splitting por feature
□ Otimizar imagens (WebP, compress)
□ Verificar bundle size (npm run build)
□ Memoização onde necessário (useMemo, useCallback)
□ Verificar re-renders desnecessários
```

#### 6.6. Error Handling
```
□ ErrorBoundary em App.jsx
□ Tratamento de erros API (já feito no interceptor)
□ Fallback UI para erros críticos
□ Mensagens de erro amigáveis
□ Logs no console (apenas dev)
```

#### 6.7. Code Quality
```
□ Remover console.logs desnecessários
□ Remover código comentado
□ Padronizar nomes (camelCase, PascalCase)
□ Adicionar comentários em lógica complexa
□ Verificar imports não utilizados
□ ESLint sem warnings
```

#### 6.8. Documentação
```
□ Atualizar README.md
□ Documentar como rodar o projeto
□ Documentar estrutura de pastas
□ Adicionar screenshots (opcional)
□ Criar .env.example
```

### 🎓 Recursos de Estudo:
- [10 Heurísticas de Nielsen](https://www.nngroup.com/articles/ten-usability-heuristics/)
- [WCAG 2.1 Checklist](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview/)

---

## 🔧 RECOMENDAÇÕES TÉCNICAS IMEDIATAS

### 1. Instalar Dependências Faltantes
```bash
npm install clsx tailwind-merge
```

### 2. Criar `.env.example`
```bash
# Arquivo: .env.example
VITE_API_URL=http://localhost:8080
```

### 3. Ajustar Estrutura de Pastas (Opcional)
```bash
# Renomear feature → features (plural)
mv src/feature src/features

# Atualizar vite.config.js
# Já está correto: '@features': './src/features'
```

### 4. Verificar ErrorBoundary no App.jsx
```jsx
// Garantir que está envolvendo tudo
<ErrorBoundary>
  <QueryClientProvider>
    <AppRoutes />
  </QueryClientProvider>
</ErrorBoundary>
```

### 5. Adicionar Lazy Loading
```jsx
// app/routes.jsx
import { lazy, Suspense } from 'react';

const DriverPage = lazy(() => import('@features/rides/pages/DriverPage'));
const PassengerPage = lazy(() => import('@features/rides/pages/PassengerPage'));

// No Route:
<Route 
  path="/motorista" 
  element={
    <Suspense fallback={<LoadingScreen />}>
      <DriverPage />
    </Suspense>
  } 
/>
```

---

## 📅 CRONOGRAMA SUGERIDO

### Semana 1
```
Segunda:    Sprint 1 (parte 1) - Select, Alert, Badge
Terça:      Sprint 1 (parte 2) - Modal, Tooltip, Layouts
Quarta:     Sprint 2 (parte 1) - RegisterForm multi-step
Quinta:     Sprint 2 (parte 2) - Pages, ProtectedRoute
Sexta:      Sprint 3 - Vehicles CRUD completo
```

### Semana 2
```
Segunda:    Sprint 4 (parte 1) - RideCard, RidesList, SearchForm
Terça:      Sprint 4 (parte 2) - ConfirmPage, HistoryPage, Hooks
Quarta:     Sprint 5 - Profile & Map avançado
Quinta:     Sprint 6 (parte 1) - Testes e responsividade
Sexta:      Sprint 6 (parte 2) - Polimento final e documentação
```

---

## ✅ CHECKLIST FINAL

### Setup
- [ ] Dependências instaladas
- [ ] .env.example criado
- [ ] Estrutura de pastas ok
- [ ] ErrorBoundary configurado

### Sprints
- [ ] Sprint 1: UI Components (8 componentes)
- [ ] Sprint 2: Auth Completo (5 itens)
- [ ] Sprint 3: Vehicles CRUD (5 componentes)
- [ ] Sprint 4: Rides Sistema (8 componentes)
- [ ] Sprint 5: Profile & Map (6 itens)
- [ ] Sprint 6: Qualidade (8 categorias)

### Qualidade
- [ ] Todos os fluxos testados
- [ ] Responsivo em 4 breakpoints
- [ ] Acessibilidade WCAG 2.1 AA
- [ ] IHC - 10 heurísticas validadas
- [ ] Performance otimizada
- [ ] Code quality (ESLint sem warnings)
- [ ] Documentação atualizada

---

## 💡 DICAS FINAIS

### 🎯 Foco no Aprendizado
- Não copie e cole código sem entender
- Pesquise conceitos que não conhece
- Experimente variações
- Comente seu código para estudar depois
- Faça commits frequentes com mensagens descritivas

### 🐛 Debug
- Use React DevTools
- Use console.log estratégicos
- Leia mensagens de erro com atenção
- Teste incrementalmente (não faça tudo de uma vez)

### 📚 Recursos Extras
- [React Docs](https://react.dev)
- [Tailwind Docs](https://tailwindcss.com)
- [React Query Docs](https://tanstack.com/query/latest)
- [React Hook Form Docs](https://react-hook-form.com)
- [Zod Docs](https://zod.dev)

### 🤝 Trabalho em Dupla/Grupo
Se estiver fazendo com colegas:
- Dividam as sprints
- Façam code review mútuos
- Compartilhem aprendizados
- Usem Git com branches

---

## 🎓 CRITÉRIOS DE AVALIAÇÃO ACADÊMICA

### Técnicos (60%)
- [ ] Funcionalidades completas
- [ ] Código organizado e limpo
- [ ] Componentização adequada
- [ ] Integração com backend funcional
- [ ] Responsividade

### IHC (20%)
- [ ] Usabilidade (Heurísticas de Nielsen)
- [ ] Acessibilidade (WCAG)
- [ ] Feedback visual
- [ ] Consistência

### Apresentação (20%)
- [ ] README bem escrito
- [ ] Demonstração funcionando
- [ ] Explicação da arquitetura
- [ ] Justificativa das escolhas técnicas

---

## 🚀 COMECE AGORA!

**Próximo passo**: Execute as recomendações técnicas e inicie a Sprint 1!

```bash
# 1. Instalar dependências
npm install clsx tailwind-merge

# 2. Criar .env.example
echo "VITE_API_URL=http://localhost:8080" > .env.example

# 3. Rodar o projeto
npm run dev

# 4. Abrir o primeiro arquivo da Sprint 1
# src/shared/components/ui/Select.jsx
```

**Boa sorte! Você vai arrasar! 🎉**
