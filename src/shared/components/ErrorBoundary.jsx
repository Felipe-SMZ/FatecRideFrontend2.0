// shared/components/ErrorBoundary.jsx
import { Component } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import { Button } from './ui/Button';

export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="text-center max-w-md">
                        <AlertTriangle className="w-16 h-16 text-danger mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">
                            Ops! Algo deu errado
                        </h1>
                        <p className="text-gray-600 mb-6">
                            Ocorreu um erro inesperado. Por favor, recarregue a página.
                        </p>
                        <Button onClick={() => window.location.reload()}>
                            Recarregar Página
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}