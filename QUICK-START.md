# 🚀 QUICK START - FatecRide Frontend

## 📋 Pré-requisitos

- ✅ Node.js instalado (v18+)
- ✅ Backend rodando em http://localhost:8080
- ✅ Editor de código (VS Code recomendado)

---

## ⚡ Início Rápido

### 1. Instalar dependências (se ainda não fez)
```bash
npm install
```

### 2. Criar arquivo `.env`
```bash
# Windows PowerShell
Copy-Item .env.example .env

# Ou criar manualmente com o conteúdo:
# VITE_API_URL=http://localhost:8080
```

### 3. Rodar o projeto
```bash
npm run dev
```

O projeto abrirá automaticamente em http://localhost:3000

---

## 📚 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `SPRINTS.md` | **COMECE AQUI** - Guia completo das sprints de desenvolvimento |
| `RECOMENDACOES-APLICADAS.md` | Lista do que já foi configurado |
| `# 📚 FatecRide - Guia Completo de R.txt` | Documentação técnica detalhada |

---

## 🎯 Primeiro Passo

Abra o arquivo **`SPRINTS.md`** e comece pela **Sprint 1**:

```
Sprint 1: Componentes UI & Layout
├── Select.jsx
├── Alert.jsx
├── Badge.jsx
├── Modal.jsx
├── Tooltip.jsx
├── Header.jsx
├── HeaderMenu.jsx
└── PageContainer.jsx
```

---

## 🗂️ Estrutura do Projeto

```
src/
├── app/                    # Configuração raiz (rotas, providers)
├── features/               # Features isoladas por domínio
│   ├── auth/              # Autenticação
│   ├── rides/             # Caronas
│   ├── vehicles/          # Veículos
│   ├── profile/           # Perfil
│   └── map/               # Mapas
└── shared/                 # Código compartilhado
    ├── components/
    │   ├── ui/            # Componentes base (Button, Input, etc)
    │   └── layout/        # Layouts (Header, etc)
    ├── lib/               # Configurações (api, queryClient)
    └── utils/             # Utilitários (validadores, formatadores)
```

---

## 🔧 Comandos Úteis

```bash
# Desenvolvimento com hot reload
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Lint (verificar erros)
npm run lint
```

---

## 📖 Fluxo de Desenvolvimento

### Para cada componente novo:

1. **Ler a sprint** correspondente em `SPRINTS.md`
2. **Entender** o que vai aprender
3. **Criar** o arquivo na pasta correta
4. **Implementar** seguindo os exemplos
5. **Testar** no navegador
6. **Commitar** com mensagem descritiva

---

## 💡 Dicas

### Imports com Alias
```jsx
// ✅ Use aliases (já configurados)
import { Button } from '@shared/components/ui/Button';
import { useAuth } from '@features/auth/hooks/useAuth';

// ❌ Evite imports relativos longos
import { Button } from '../../../shared/components/ui/Button';
```

### Tailwind CSS
```jsx
// Classes já configuradas no design system
className="bg-primary hover:bg-primary-hover"
className="text-danger"
className="shadow-card"
```

### React Query
```jsx
// Sempre use os hooks customizados
import { useLogin } from '@features/auth/hooks/useAuth';

const { mutate: login, isLoading } = useLogin();
```

---

## 🐛 Problemas Comuns

### Erro: "Cannot find module '@shared/...'"
**Solução**: Reinicie o servidor de dev (`Ctrl+C` e `npm run dev`)

### Erro: "API não responde"
**Solução**: Verifique se o backend está rodando em http://localhost:8080

### Erro: "Token expirado"
**Solução**: Faça login novamente (token JWT expira em 2h)

### Tailwind não está funcionando
**Solução**: Verifique se importou `@shared/styles/index.css` no `main.jsx`

---

## 🎓 Recursos de Estudo

### React
- [React Docs Oficial](https://react.dev)
- [React Patterns](https://www.patterns.dev/posts/reactjs)

### Tailwind CSS
- [Tailwind Docs](https://tailwindcss.com)
- [Tailwind UI Components](https://tailwindui.com/components)

### React Query
- [TanStack Query Docs](https://tanstack.com/query/latest)

### React Hook Form
- [React Hook Form Docs](https://react-hook-form.com)

### Zod (Validação)
- [Zod Docs](https://zod.dev)

---

## 📞 Suporte

### Erro no código?
1. Leia a mensagem de erro com atenção
2. Verifique o console do navegador (F12)
3. Use `console.log()` para debug
4. Consulte a documentação da lib específica

### Dúvida de conceito?
1. Consulte o arquivo `SPRINTS.md` (tem links de estudo)
2. Leia a documentação oficial da tecnologia
3. Pesquise no Google/StackOverflow
4. Pergunte aos colegas/professores

---

## ✅ Checklist Antes de Começar

- [ ] Node.js instalado
- [ ] Dependências instaladas (`npm install`)
- [ ] `.env` criado
- [ ] Backend rodando
- [ ] Projeto rodando (`npm run dev`)
- [ ] Abriu o `SPRINTS.md`
- [ ] Leu a Sprint 1
- [ ] Pronto para codar! 🚀

---

## 🎯 Meta Final

Ao final das 6 sprints, você terá:

✅ Sistema completo de caronas funcionando  
✅ Conhecimento sólido de React moderno  
✅ Portfolio com projeto real  
✅ Experiência com arquitetura escalável  
✅ Práticas de IHC e acessibilidade  

---

**Boa sorte e bons estudos! 💪🎓**
