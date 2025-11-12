# 🚗 FatecRide - Sistema de Carona Universitária# 🚗 FatecRide - Sistema de Caronas Universitário



![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react)> **Projeto Acadêmico** - FATEC Cotia  

![Vite](https://img.shields.io/badge/Vite-6.0.7-646CFF?logo=vite)> **Versão**: 2.0 (Refatoração)  

![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.17-06B6D4?logo=tailwindcss)> **Stack**: React + Vite + Tailwind CSS

![License](https://img.shields.io/badge/License-MIT-green)

---

Sistema web moderno de compartilhamento de caronas desenvolvido para a comunidade universitária da Fatec. Permite que alunos ofereçam e solicitem caronas de forma segura e eficiente.

## 📚 Documentação

## 📋 Índice

| Arquivo | Descrição |

- [Sobre o Projeto](#sobre-o-projeto)|---------|-----------|

- [Funcionalidades](#funcionalidades)| **[QUICK-START.md](./QUICK-START.md)** | 🚀 **Comece por aqui!** Guia rápido de setup |

- [Tecnologias](#tecnologias)| **[SPRINTS.md](./SPRINTS.md)** | 📋 Guia completo das 6 sprints de desenvolvimento |

- [Pré-requisitos](#pré-requisitos)| **[RECOMENDACOES-APLICADAS.md](./RECOMENDACOES-APLICADAS.md)** | ✅ Lista de configurações já aplicadas |

- [Instalação](#instalação)| **[# 📚 FatecRide - Guia Completo de R.txt](./# 📚 FatecRide - Guia Completo de R.txt)** | 📖 Documentação técnica completa |

- [Uso](#uso)

- [Estrutura do Projeto](#estrutura-do-projeto)---

- [Contribuindo](#contribuindo)

- [Licença](#licença)## 🎯 Sobre o Projeto

- [Autores](#autores)

Sistema de caronas para estudantes da FATEC Cotia com:

## 🎯 Sobre o Projeto

- 🔐 Autenticação JWT

O **FatecRide** é uma aplicação web desenvolvida como Projeto Integrador do 3º semestre do curso de Desenvolvimento de Software Multiplataforma (DSM) da Fatec. O sistema facilita o compartilhamento de caronas entre estudantes, promovendo economia, sustentabilidade e integração da comunidade universitária.- 🚗 Cadastro de veículos

- 🗺️ Busca geolocalizada de caronas

### Objetivos- 📍 Integração com mapas (Leaflet + OpenStreetMap)

- 📊 Histórico de caronas

- ✅ Conectar alunos motoristas e passageiros- 👥 Perfis de usuário (Passageiro/Motorista)

- ✅ Reduzir custos de transporte

- ✅ Diminuir emissões de carbono---

- ✅ Fortalecer a comunidade universitária

- ✅ Proporcionar uma experiência de usuário intuitiva e segura## 🚀 Quick Start



## ✨ Funcionalidades```bash

# 1. Instalar dependências

### Para Passageirosnpm install

- 🔍 Buscar caronas disponíveis por origem e destino

- 📍 Visualizar rotas no mapa# 2. Criar arquivo .env

- 📝 Solicitar participação em caronascp .env.example .env

- 📊 Acompanhar status de solicitações

- 📜 Visualizar histórico de caronas# 3. Rodar o projeto

npm run dev

### Para Motoristas```

- 🚗 Cadastrar e gerenciar veículos

- 🗺️ Criar ofertas de carona com rota personalizadaAcesse: http://localhost:3000

- ✅ Aceitar ou recusar solicitações de passageiros

- 🏁 Finalizar caronas**⚠️ Importante**: O backend deve estar rodando em http://localhost:8080

- 📈 Visualizar histórico de corridas oferecidas

---

### Para Usuários AMBOS

- 🔄 Alternar entre modo passageiro e motorista## 🛠️ Stack Tecnológica

- 📊 Visualizar históricos separados

- 🎯 Acesso completo a todas as funcionalidades### Core

- **React** 19.1.1 - UI Library

### Gerais- **Vite** 7.1.7 - Build tool

- 🔐 Autenticação segura com JWT- **Tailwind CSS** 3.4.18 - Styling

- 👤 Perfil do usuário com foto

- 📍 Sistema de endereços com autocomplete de CEP### Estado e Dados

- 🔔 Notificações em tempo real- **React Query** 5.90.6 - Server state management

- 📱 Design responsivo- **Zustand** 5.0.8 - Client state management

- ♿ Interface acessível- **Axios** 1.13.2 - HTTP client



## 🛠️ Tecnologias### Formulários e Validação

- **React Hook Form** 7.66.0 - Form handling

### Frontend- **Zod** 4.1.12 - Schema validation

- **React 19.1.1** - Biblioteca JavaScript para interfaces

- **Vite 6.0.7** - Build tool e dev server### Mapas

- **React Router DOM 7.1.1** - Roteamento- **Leaflet** 1.9.4 - Maps library

- **TailwindCSS 3.4.17** - Framework CSS utility-first- **React Leaflet** 5.0.0 - React bindings

- **Zustand 5.0.2** - Gerenciamento de estado- **Leaflet Routing Machine** 3.2.12 - Routing

- **React Query 5.64.2** - Gerenciamento de dados assíncronos

- **React Hot Toast 2.4.1** - Notificações### UI/UX

- **React Icons 5.4.0** - Biblioteca de ícones- **React Hot Toast** 2.6.0 - Notifications

- **Axios 1.7.9** - Cliente HTTP- **React Icons** 5.5.0 - Icon library

- **clsx** + **tailwind-merge** - Class utilities

### Integrações

- **Leaflet 1.9.4** - Mapas interativos---

- **ViaCEP API** - Consulta de CEPs brasileiros

- **Backend API REST** - Spring Boot (Java)## 📁 Estrutura do Projeto



## 📦 Pré-requisitos```

src/

- Node.js 18+ ├── app/                      # Configuração raiz

- npm ou yarn│   ├── App.jsx

- Backend API em execução (Spring Boot)│   ├── routes.jsx

│   └── providers.jsx

## 🚀 Instalação│

├── features/                 # Features por domínio

1. **Clone o repositório**│   ├── auth/                # Autenticação

```bash│   ├── rides/               # Caronas

git clone https://github.com/Felipe-SMZ/FatecRideFrontend2.0.git│   ├── vehicles/            # Veículos

cd fatecride-vite│   ├── profile/             # Perfil

```│   └── map/                 # Mapas

│

2. **Instale as dependências**└── shared/                   # Código compartilhado

```bash    ├── components/

npm install    │   ├── ui/              # Componentes base

```    │   └── layout/          # Layouts

    ├── lib/                 # Configs (api, queryClient)

3. **Configure as variáveis de ambiente**    └── utils/               # Utilitários

```bash```

# Crie um arquivo .env na raiz do projeto

VITE_API_URL=http://localhost:8080---

```

## 📋 Comandos Disponíveis

4. **Inicie o servidor de desenvolvimento**

```bash```bash

npm run dev# Desenvolvimento

```npm run dev



5. **Acesse no navegador**# Build para produção

```npm run build

http://localhost:5173

```# Preview do build

npm run preview

## 📖 Uso

# Lint

### Primeiro Acessonpm run lint

```

1. **Criar uma conta**

   - Clique em "Criar Conta"---

   - Escolha entre "Passageiro" ou "Motorista"

   - Preencha seus dados pessoais## 🎓 Para Desenvolvedores/Alunos

   - Adicione seu endereço

### 1. Leia a documentação na ordem:

2. **Para Motoristas**1. **QUICK-START.md** - Setup inicial

   - Após login, vá em "Veículos"2. **SPRINTS.md** - Guia de desenvolvimento

   - Cadastre seu veículo3. **Guia Completo** - Referência técnica

   - Crie uma oferta de carona em "Criar Carona"

### 2. Siga as sprints:

3. **Para Passageiros**- **Sprint 1**: Componentes UI (2-3 dias)

   - Após login, vá em "Buscar Caronas"- **Sprint 2**: Auth completo (2 dias)

   - Digite origem e destino- **Sprint 3**: Vehicles CRUD (1-2 dias)

   - Solicite participação em uma carona- **Sprint 4**: Rides sistema (2-3 dias)

- **Sprint 5**: Profile & Map (1-2 dias)

### Comandos Disponíveis- **Sprint 6**: Qualidade & testes (2-3 dias)



```bash### 3. Aprenda fazendo:

# DesenvolvimentoCada sprint tem objetivos pedagógicos claros e recursos de estudo.

npm run dev          # Inicia servidor de desenvolvimento

---

# Build

npm run build        # Gera build de produção## 🔗 Links Úteis

npm run preview      # Preview do build de produção

- [React Docs](https://react.dev)

# Linting- [Tailwind CSS](https://tailwindcss.com)

npm run lint         # Executa ESLint- [React Query](https://tanstack.com/query/latest)

```- [React Hook Form](https://react-hook-form.com)

- [Leaflet](https://leafletjs.com)

## 📁 Estrutura do Projeto

---

```

fatecride-vite/## 👥 Autores

├── public/              # Arquivos estáticos

├── src/- Felipe SMZ

│   ├── app/            # Configuração da aplicação- Marcos Santos

│   │   ├── App.jsx- Guilherme Rufino

│   │   ├── routes.jsx

│   │   └── providers.jsx---

│   ├── features/       # Módulos por funcionalidade

│   │   ├── auth/      # Autenticação## 📄 Licença

│   │   ├── rides/     # Caronas

│   │   ├── vehicles/  # VeículosProjeto acadêmico - FATEC Cotia

│   │   ├── profile/   # Perfil
│   │   └── map/       # Mapas
│   ├── shared/        # Componentes compartilhados
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── utils/
│   ├── assets/        # Imagens e recursos
│   ├── main.jsx       # Entry point
│   └── index.css      # Estilos globais
├── .env.example       # Exemplo de variáveis de ambiente
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

### Organização por Feature

Cada feature segue a estrutura:
```
feature/
├── components/    # Componentes da feature
├── hooks/        # Hooks customizados
├── pages/        # Páginas da feature
├── services/     # Serviços de API
└── stores/       # Estado global (Zustand)
```

## 🎨 Design System

### Cores Principais
- **Azul FatecRide**: `#1E40AF` (primária)
- **Azul Escuro**: `#1E3A8A` (hover)
- **Azul Claro**: `#DBEAFE` (backgrounds)
- **Vermelho**: `#DC2626` (ativo/alerta)

### Componentes Reutilizáveis
- `Button` - Botões com variantes
- `Card` - Containers com sombra
- `Input` - Campos de entrada
- `Spinner` - Loading states
- `EmptyState` - Estados vazios
- `Skeleton` - Loading placeholders

## 🧪 Testes

```bash
# Executar testes (quando implementados)
npm run test

# Cobertura de testes
npm run test:coverage
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

**Equipe FatecRide**
- Desenvolvedor Principal - [@Felipe-SMZ](https://github.com/Felipe-SMZ)

## 🙏 Agradecimentos

- Fatec - Faculdade de Tecnologia
- Professores orientadores
- Comunidade universitária
- Contribuidores open source

## 📞 Contato

- Email: fatecride@fatec.sp.gov.br
- GitHub: [@Felipe-SMZ](https://github.com/Felipe-SMZ)

---

<p align="center">
  Feito com ❤️ pela equipe FatecRide
</p>
