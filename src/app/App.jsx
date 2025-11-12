// app/App.jsx
import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@shared/lib/queryClient';
import { useAuthStore } from '@features/auth/stores/authStore';
import { AppProviders } from './providers';
import { AppRoutes } from './routes';

function AppContent() {
  const { isAuthenticated, loadUserData, user } = useAuthStore();

  // Carregar dados completos do usuário ao iniciar (somente se não tiver tipo)
  useEffect(() => {
    if (isAuthenticated && !user?.tipo) {
      console.log('🔄 App.jsx - Tentando carregar dados do usuário...');
      console.log('👤 User atual:', user);
      loadUserData();
    }
  }, [isAuthenticated, loadUserData, user?.tipo]);

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