// app/App.jsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@shared/lib/queryClient';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProviders>
        <Routes />
      </AppProviders>
    </QueryClientProvider>
  );
}