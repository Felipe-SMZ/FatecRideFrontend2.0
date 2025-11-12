# 🚗 FatecRide - Sistema de Carona Universitária  

![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react)  
![Vite](https://img.shields.io/badge/Vite-6.0.7-646CFF?logo=vite)  
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.17-06B6D4?logo=tailwindcss)  
![License](https://img.shields.io/badge/License-MIT-green)

**Projeto Acadêmico - FATEC Cotia**  
Versão **2.0 (Refatoração)**  

---

## 📖 Sobre o Projeto
O **FatecRide** é uma aplicação web desenvolvida como Projeto Integrador do 3º semestre do curso de **Desenvolvimento de Software Multiplataforma (DSM)** da Fatec Cotia.  

O sistema facilita o compartilhamento de caronas entre estudantes, promovendo:  
- 🚗 Economia de transporte  
- 🌱 Sustentabilidade (redução de emissões de carbono)  
- 🤝 Integração da comunidade universitária  

---

## ✨ Funcionalidades

### Para Passageiros
- 🔍 Buscar caronas disponíveis por origem e destino  
- 📍 Visualizar rotas no mapa  
- 📝 Solicitar participação em caronas  
- 📊 Acompanhar status de solicitações  
- 📜 Histórico de caronas  

### Para Motoristas
- 🚗 Cadastrar e gerenciar veículos  
- 🗺️ Criar ofertas de carona com rota personalizada  
- ✅ Aceitar ou recusar solicitações  
- 🏁 Finalizar caronas  
- 📈 Histórico de corridas oferecidas  

### Para Todos
- 🔄 Alternar entre modo passageiro e motorista  
- 👤 Perfil de usuário com foto  
- 🔔 Notificações em tempo real  
- 📱 Design responsivo e acessível  

---

## 🛠️ Stack Tecnológica

- **Frontend**: React, Vite, TailwindCSS  
- **Estado**: React Query, Zustand  
- **Formulários**: React Hook Form + Zod  
- **Mapas**: Leaflet, React Leaflet, Routing Machine  
- **Integrações**: ViaCEP API, Backend REST (Spring Boot)  
- **UI/UX**: React Icons, React Hot Toast, clsx, tailwind-merge  

---

## 📦 Pré-requisitos
- Node.js 18+  
- npm ou yarn  
- Backend API em execução (Spring Boot)  

---

## 🚀 Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/Felipe-SMZ/FatecRideFrontend2.0.git
cd fatecride-vite

# 2. Instale as dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env
# edite o arquivo .env com:
VITE_API_URL=http://localhost:8080

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse em: **http://localhost:5173**  
> ⚠️ O backend deve estar rodando em **http://localhost:8080**

---

## 📋 Comandos Disponíveis

```bash
npm run dev            # Desenvolvimento
npm run build          # Build de produção
npm run preview        # Preview do build
npm run lint           # Linting
npm run test           # Executar testes
npm run test:coverage  # Cobertura de testes
```

---

## 📁 Estrutura do Projeto

```
fatecride-vite/
├── public/              # Arquivos estáticos
├── src/
│   ├── app/             # Configuração da aplicação
│   ├── features/        # Módulos por funcionalidade
│   │   ├── auth/        # Autenticação
│   │   ├── rides/       # Caronas
│   │   ├── vehicles/    # Veículos
│   │   ├── profile/     # Perfil
│   │   └── map/         # Mapas
│   ├── shared/          # Código compartilhado
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── utils/
│   ├── assets/          # Imagens e recursos
│   ├── main.jsx         # Entry point
│   └── index.css        # Estilos globais
├── .env.example
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

## 🎨 Design System

**Cores principais**  
- Azul FatecRide: `#1E40AF`  
- Azul Escuro: `#1E3A8A`  
- Azul Claro: `#DBEAFE`  
- Vermelho: `#DC2626`  

**Componentes reutilizáveis**  
- `Button`, `Card`, `Input`, `Spinner`, `EmptyState`, `Skeleton`  

---

## 👥 Autores

**Equipe FatecRide**  
- [Felipe SMZ](https://github.com/Felipe-SMZ)  
- [Marcos Santos](https://github.com/MarcosVVSantos)  
- [Guilherme Rufino](https://github.com/rufinoguilherme633)  

---

## 📄 Licença
Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.  

---

## 🙏 Agradecimentos
- Fatec Cotia  
- Professores orientadores  
- Comunidade universitária  

---

