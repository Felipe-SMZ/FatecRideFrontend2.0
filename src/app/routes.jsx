// app/routes.jsx
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingScreen } from '@shared/components/ui/LoadingScreen';
import { ProtectedRoute } from '@features/auth/components/ProtectedRoute';

// Eager loading (páginas críticas)
import { LoginPage } from '@features/auth/pages/LoginPage';
import { RegisterPage } from '@features/auth/pages/RegisterPage';
import { SelectUserTypePage } from '@features/auth/pages/SelectUserTypePage';
import { ForgotPasswordPage } from '@features/auth/pages/ForgotPasswordPage';

// Lazy loading (páginas secundárias)
const InicioPage = lazy(() => import('../pages/InicioPage').then(m => ({ default: m.InicioPage })));
const HomePage = lazy(() => import('../pages/HomePage').then(m => ({ default: m.HomePage })));
const DriverPage = lazy(() => import('@features/rides/pages/DriverPage').then(m => ({ default: m.DriverPage })));
const PassengerPage = lazy(() => import('@features/rides/pages/PassengerPage').then(m => ({ default: m.PassengerPage })));
const ActiveRidesPage = lazy(() => import('@features/rides/pages/ActiveRidesPage').then(m => ({ default: m.ActiveRidesPage })));
const RideHistoryPage = lazy(() => import('@features/rides/pages/RideHistoryPage').then(m => ({ default: m.RideHistoryPage })));
const ProfilePage = lazy(() => import('@features/profile/pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const VehiclesPage = lazy(() => import('@features/vehicles/pages/VehiclesPage').then(m => ({ default: m.VehiclesPage })));
const AddressRegisterPage = lazy(() => import('@features/profile/pages/AddressRegisterPage').then(m => ({ default: m.AddressRegisterPage })));
const VehicleRegisterPage = lazy(() => import('@features/vehicles/pages/VehicleRegisterPage').then(m => ({ default: m.VehicleRegisterPage })));

export function AppRoutes() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <Routes>
                {/* Rotas públicas */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/select-user-type" element={<SelectUserTypePage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/cadastro" element={<RegisterPage />} />
                <Route path="/cadastro-endereco" element={<AddressRegisterPage />} />
                <Route path="/cadastro-veiculo" element={<VehicleRegisterPage />} />

                {/* Rotas protegidas */}
                <Route path="/" element={
                    <ProtectedRoute>
                        <InicioPage />
                    </ProtectedRoute>
                } />
                <Route path="/inicio" element={
                    <ProtectedRoute>
                        <InicioPage />
                    </ProtectedRoute>
                } />
                <Route path="/motorista" element={
                    <ProtectedRoute>
                        <DriverPage />
                    </ProtectedRoute>
                } />
                <Route path="/passageiro" element={
                    <ProtectedRoute>
                        <PassengerPage />
                    </ProtectedRoute>
                } />
                <Route path="/caronas" element={
                    <ProtectedRoute>
                        <PassengerPage />
                    </ProtectedRoute>
                } />
                <Route path="/caronas-ativas" element={
                    <ProtectedRoute>
                        <ActiveRidesPage />
                    </ProtectedRoute>
                } />
                <Route path="/historico" element={
                    <ProtectedRoute>
                        <RideHistoryPage />
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
                <Route path="/veiculos" element={
                    <ProtectedRoute>
                        <VehiclesPage />
                    </ProtectedRoute>
                } />
                <Route path="/perfil" element={
                    <ProtectedRoute>
                        <ProfilePage />
                    </ProtectedRoute>
                } />

                {/* Redirect para inicio */}
                <Route path="*" element={<Navigate to="/inicio" replace />} />
            </Routes>
        </Suspense>
    );
}