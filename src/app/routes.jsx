// app/routes.jsx
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingScreen } from '@shared/components/ui/LoadingScreen';
import { ProtectedRoute } from '@features/auth/components/ProtectedRoute';

// Eager loading (páginas críticas)
import { LoginPage } from '@features/auth/pages/LoginPage';
import { RegisterPage } from '@features/auth/pages/RegisterPage';

// Lazy loading (páginas secundárias)
const HomePage = lazy(() => import('../pages/HomePage').then(m => ({ default: m.HomePage })));
const DriverPage = lazy(() => import('@features/rides/pages/DriverPage'));
const PassengerPage = lazy(() => import('@features/rides/pages/PassengerPage'));
const ProfilePage = lazy(() => import('@features/profile/pages/ProfilePage'));
const VehiclesPage = lazy(() => import('@features/vehicles/pages/VehiclesPage'));

export function AppRoutes() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <Routes>
                {/* Rotas públicas */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/cadastro" element={<RegisterPage />} />

                {/* Rotas protegidas */}
                <Route path="/" element={
                    <ProtectedRoute>
                        <HomePage />
                    </ProtectedRoute>
                } />
                <Route path="/caronas" element={
                    <ProtectedRoute>
                        <PassengerPage />
                    </ProtectedRoute>
                } />
                <Route path="/oferecer-carona" element={
                    <ProtectedRoute requiredRole="MOTORISTA">
                        <DriverPage />
                    </ProtectedRoute>
                } />
                <Route path="/meus-veiculos" element={
                    <ProtectedRoute requiredRole="MOTORISTA">
                        <VehiclesPage />
                    </ProtectedRoute>
                } />
                <Route path="/perfil" element={
                    <ProtectedRoute>
                        <ProfilePage />
                    </ProtectedRoute>
                } />

                {/* Redirect para home */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
}