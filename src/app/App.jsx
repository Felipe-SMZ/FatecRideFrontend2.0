// app/App.jsx
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@shared/lib/queryClient';
import { AppProviders } from './providers';
import { AppRoutes } from './routes';
import { Header } from '@shared/components/layout/Header';

export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AppProviders>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <main>
              <AppRoutes />
            </main>
          </div>
        </AppProviders>
      </QueryClientProvider>
    </BrowserRouter>
  );
}