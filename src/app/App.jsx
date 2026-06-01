// app/App.jsx
import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@shared/lib/queryClient';
import { useAuthStore } from '@features/auth/stores/authStore';
import { useChat } from '@features/chat/hooks/useChat';
import { useSolicitacoesSSE } from '@features/rides/hooks/useSolicitacoesSSE';
import { AppProviders } from './providers';
import { AppRoutes } from './routes';
import { PendingSolicitacaoCard } from '@features/rides/components/PendingSolicitacaoCard';
import ChatWidget from '@features/chat/components/ChatWidget';
import notificationsService from '@shared/services/notificationsService';

function AppContent() {
  const { isAuthenticated, loadUserData, user } = useAuthStore();
  const { token } = useAuthStore();
  
  console.log('🚀 AppContent - Render', {
    isAuthenticated,
    user: user ? `${user.nome} (${user.tipo})` : 'null',
    timestamp: new Date().toISOString()
  });
  
  // ✅ Registrar listeners SSE globalmente SEMPRE (não esperar por página montar)
  // Este hook garante que listeners estão ativos ANTES de qualquer página montar
  useSolicitacoesSSE();
  
  // Outro hook global para chat
  useChat();
  
  // Log inicial ao montar o App
  useEffect(() => {
    console.log('🚀 APP.JSX - Montando aplicação...');
    console.log('📊 Estado inicial do Zustand:', {
      isAuthenticated,
      user,
      token: useAuthStore.getState().token ? 'Presente' : 'Ausente'
    });
    console.log('💾 localStorage auth:', localStorage.getItem('fatecride-auth'));
  }, []);

  // Carregar dados completos do usuário ao iniciar (somente se não tiver tipo)
  useEffect(() => {
    if (isAuthenticated && !user?.tipo) {
      console.log('🔄 App.jsx - Tentando carregar dados do usuário...');
      console.log('👤 User atual:', user);
      loadUserData();
    }
  }, [isAuthenticated, loadUserData, user?.tipo]);

  // Conectar SSE de notificações quando autenticado
  useEffect(() => {
    if (isAuthenticated && token) {
      console.log('🔔 App.jsx - Conectando SSE de notificações', {
        userId: user?.id,
        userTipo: user?.tipo,
        timestamp: new Date().toISOString()
      });
      notificationsService.connect(token);
      
      // Log de status em 1 segundo (para debug)
      const timer = setTimeout(() => {
        const status = notificationsService.es?.readyState;
        const states = { 0: 'CONNECTING', 1: 'OPEN ✓', 2: 'CLOSING', 3: 'CLOSED' };
        console.log(`📊 SSE status após 1s: readyState=${status} (${states[status] || 'UNKNOWN'})`);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (!isAuthenticated && token === null) {
      // Se não autenticado E token foi removido, garantir desconexão
      console.log('🔌 App.jsx - Desconectando SSE (logout detectado)');
      notificationsService.disconnect(true);
    }

    return () => {
      // cleanup: desconectar ao desmontar
      if (!isAuthenticated) {
        console.log('🔌 App.jsx - Cleanup: desconectando SSE');
        notificationsService.disconnect(true);
      }
    };
  }, [isAuthenticated, token, user?.id, user?.tipo]);

  return (
    <QueryClientProvider client={queryClient}>
      <AppProviders>
        <Toaster
          position="top-right"
          toastOptions={{ duration: 5000 }}
        />
        {/* ⭐ Card flutuante de solicitação pendente - aparece em QUALQUER página */}
        <PendingSolicitacaoCard />
        {/* Chat flutuante persistente (abre ao aceitar solicitação) */}
        <ChatWidget />
        <div className="min-h-screen bg-gray-50">
          <main>
            <AppRoutes />
          </main>
        </div>
      </AppProviders>
    </QueryClientProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}