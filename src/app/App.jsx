// app/App.jsx
import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@shared/lib/queryClient';
import { useAuthStore } from '@features/auth/stores/authStore';
import { useChat } from '@features/chat/hooks/useChat';
import { AppProviders } from './providers';
import { AppRoutes } from './routes';
import notificationsService from '@shared/services/notificationsService';

function AppContent() {
  const { isAuthenticated, loadUserData, user } = useAuthStore();
  const { token } = useAuthStore();
  
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
  
  // Log para monitorar mudanças no user
  useEffect(() => {
    console.log('\n🔍 APP.JSX - User mudou:');
    console.log('  👤 User:', user);
    console.log('  🎭 Tipo:', user?.tipo);
    console.log('  🔐 Autenticado:', isAuthenticated);
  }, [user, isAuthenticated]);
  
  // SEMPRE chamar useChat (mesmo que não conecte)
  // Hooks devem ser chamados na mesma ordem em cada render
  useChat();

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
      console.log('🔔 App.jsx - Conectando SSE de notificações');
      notificationsService.connect(token);
    }

    return () => {
      // desconectar ao desmontar ou ao deslogar
      if (!isAuthenticated) {
        notificationsService.disconnect();
      }
    };
  }, [isAuthenticated, token]);

  return (
    <QueryClientProvider client={queryClient}>
      <AppProviders>
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