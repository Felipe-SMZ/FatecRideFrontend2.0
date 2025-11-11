# 🚗 FatecRide - Sistema de Caronas Universitário

> **Projeto Acadêmico** - FATEC Cotia  
> **Versão**: 2.0 (Refatoração)  
> **Stack**: React + Vite + Tailwind CSS

---

## 📚 Documentação

| Arquivo | Descrição |
|---------|-----------|
| **[QUICK-START.md](./QUICK-START.md)** | 🚀 **Comece por aqui!** Guia rápido de setup |
| **[SPRINTS.md](./SPRINTS.md)** | 📋 Guia completo das 6 sprints de desenvolvimento |
| **[RECOMENDACOES-APLICADAS.md](./RECOMENDACOES-APLICADAS.md)** | ✅ Lista de configurações já aplicadas |
| **[# 📚 FatecRide - Guia Completo de R.txt](./# 📚 FatecRide - Guia Completo de R.txt)** | 📖 Documentação técnica completa |

---

## 🎯 Sobre o Projeto

Sistema de caronas para estudantes da FATEC Cotia com:

- 🔐 Autenticação JWT
- 🚗 Cadastro de veículos
- 🗺️ Busca geolocalizada de caronas
- 📍 Integração com mapas (Leaflet + OpenStreetMap)
- 📊 Histórico de caronas
- 👥 Perfis de usuário (Passageiro/Motorista)

---

## 🚀 Quick Start

```bash
# 1. Instalar dependências
npm install

# 2. Criar arquivo .env
cp .env.example .env

# 3. Rodar o projeto
npm run dev
```

Acesse: http://localhost:3000

**⚠️ Importante**: O backend deve estar rodando em http://localhost:8080

---

## 🛠️ Stack Tecnológica

### Core
- **React** 19.1.1 - UI Library
- **Vite** 7.1.7 - Build tool
- **Tailwind CSS** 3.4.18 - Styling

### Estado e Dados
- **React Query** 5.90.6 - Server state management
- **Zustand** 5.0.8 - Client state management
- **Axios** 1.13.2 - HTTP client

### Formulários e Validação
- **React Hook Form** 7.66.0 - Form handling
- **Zod** 4.1.12 - Schema validation

### Mapas
- **Leaflet** 1.9.4 - Maps library
- **React Leaflet** 5.0.0 - React bindings
- **Leaflet Routing Machine** 3.2.12 - Routing

### UI/UX
- **React Hot Toast** 2.6.0 - Notifications
- **React Icons** 5.5.0 - Icon library
- **clsx** + **tailwind-merge** - Class utilities

---

## 📁 Estrutura do Projeto

```
src/
├── app/                      # Configuração raiz
│   ├── App.jsx
│   ├── routes.jsx
│   └── providers.jsx
│
├── features/                 # Features por domínio
│   ├── auth/                # Autenticação
│   ├── rides/               # Caronas
│   ├── vehicles/            # Veículos
│   ├── profile/             # Perfil
│   └── map/                 # Mapas
│
└── shared/                   # Código compartilhado
    ├── components/
    │   ├── ui/              # Componentes base
    │   └── layout/          # Layouts
    ├── lib/                 # Configs (api, queryClient)
    └── utils/               # Utilitários
```

---

## 📋 Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

---

## 🎓 Para Desenvolvedores/Alunos

### 1. Leia a documentação na ordem:
1. **QUICK-START.md** - Setup inicial
2. **SPRINTS.md** - Guia de desenvolvimento
3. **Guia Completo** - Referência técnica

### 2. Siga as sprints:
- **Sprint 1**: Componentes UI (2-3 dias)
- **Sprint 2**: Auth completo (2 dias)
- **Sprint 3**: Vehicles CRUD (1-2 dias)
- **Sprint 4**: Rides sistema (2-3 dias)
- **Sprint 5**: Profile & Map (1-2 dias)
- **Sprint 6**: Qualidade & testes (2-3 dias)

### 3. Aprenda fazendo:
Cada sprint tem objetivos pedagógicos claros e recursos de estudo.

---

## 🔗 Links Úteis

- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [React Query](https://tanstack.com/query/latest)
- [React Hook Form](https://react-hook-form.com)
- [Leaflet](https://leafletjs.com)

---

## 👥 Autores

- Felipe SMZ
- Marcos Santos
- Guilherme Rufino

---

## 📄 Licença

Projeto acadêmico - FATEC Cotia
