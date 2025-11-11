// shared/components/ui/LoadingScreen.jsx
import { Spinner } from './Spinner';

export function LoadingScreen({ message = 'Carregando...' }) {
    return (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-50">
            <Spinner size="lg" />
            <p className="mt-4 text-lg font-medium text-gray-700">{message}</p>
        </div>
    );
}