// app/routes.jsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadingScreen } from '@shared/components/ui/LoadingScreen';

// Eager loading (páginas críticas)
import { LoginPage } from '@features/auth/pages/LoginPage';
import { HomePage } from '@pages/HomePage';

// Lazy loading (páginas secundárias)
const DriverPage = lazy(() => import('@features/rides/pages/DriverPage'));
const PassengerPage = lazy(() => import('@features/rides/pages/PassengerPage'));
const ProfilePage = lazy(() => import('@features/profile/pages/ProfilePage'));
const VehiclesPage = lazy(() => import('@features/vehicles/pages/VehiclesPage'));
const HistoryPage = lazy(() => import('@features/rides/pages/HistoryPage'));

export function AppRoutes() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/inicio" element={<HomePage />} />
                <Route path="/motorista" element={<DriverPage />} />
                <Route path="/passageiro" element={<PassengerPage />} />
                <Route path="/perfil" element={<ProfilePage />} />
                <Route path="/veiculos" element={<VehiclesPage />} />
                <Route path="/historico" element={<HistoryPage />} />
            </Routes>
        </Suspense>
    );
}