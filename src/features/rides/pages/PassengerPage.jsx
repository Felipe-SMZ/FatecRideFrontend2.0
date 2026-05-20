// features/rides/pages/PassengerPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
 
import { PageContainer } from '@shared/components/layout/PageContainer';
import { Card } from '@shared/components/ui/Card';
import { MapView } from '@shared/components/map/MapView';
import { ridesService } from '@features/rides/services/ridesService';
import { Spinner } from '@shared/components/ui/Spinner';
import { AddressAutocomplete } from '@shared/components/ui/AddressAutocomplete';
import { Button } from '@shared/components/ui/Button';
import { AnuncioViewerCompact } from '@features/anuncios/components/AnuncioViewer';

/**
 * PassengerPage - Página de solicitação de carona (Passageiro)
 * 
 * Novo Fluxo Simplificado:
 * 1. Passageiro seleciona origem e destino
 * 2. Clica em "Solicitar Carona"
 * 3. Sistema cria solicitação e inicia fluxo automático via SSE
 * 4. Motoristas recebem notificação em tempo real
 * 5. Passageiro acompanha status via eventos SSE
 */

export function PassengerPage() {
    const navigate = useNavigate();
    
    // Estados de seleção
    const [originCoords, setOriginCoords] = useState(null);
    const [destinationCoords, setDestinationCoords] = useState(null);
    const [originAddress, setOriginAddress] = useState(null);
    const [destinationAddress, setDestinationAddress] = useState(null);
    const [originSelected, setOriginSelected] = useState(false);
    const [destinationSelected, setDestinationSelected] = useState(false);
    
    // Estados de loading
    const [requesting, setRequesting] = useState(false);

    /**
     * Handler quando origem é selecionada
     */
    const handleOriginSelect = (data) => {
        setOriginCoords(data.coords);
        setOriginAddress(data.address);
        setOriginSelected(true);
    };

    /**
     * Handler quando destino é selecionado
     */
    const handleDestinationSelect = (data) => {
        setDestinationCoords(data.coords);
        setDestinationAddress(data.address);
        setDestinationSelected(true);
    };

    /**
     * Cria solicitação e inicia fluxo automático
     * O backend via SSE notificará motoristas próximos em tempo real
     */
    const handleRequestRide = async () => {
        if (!originAddress || !destinationAddress) {
            toast.error('Selecione origem e destino nas sugestões');
            return;
        }

        try {
            setRequesting(true);

            // Criar solicitação sem vincular a carona específica (fluxo novo)
            const payload = {
                originDTO: originAddress,
                destinationDTO: destinationAddress
            };

            const created = await ridesService.requestRide(payload);

            // Extrair ID da solicitação
            const solicitacaoId = created?.id ?? created?.id_solicitacao ?? created?.idSolicitacao ?? null;
            
            try {
                // Iniciar fluxo automático (backend envia SSE aos motoristas próximos)
                if (solicitacaoId) {
                    await ridesService.startAutomaticFlow({
                        solicitacaoId,
                        latitudeOrigem: originCoords?.lat,
                        longitudeOrigem: originCoords?.lng,
                        latitudeDestino: destinationCoords?.lat,
                        longitudeDestino: destinationCoords?.lng
                    });
                    toast.success('Carona solicitada! Procurando motoristas próximos...');
                } else {
                    toast.success('Carona solicitada!');
                }
            } catch (errAuto) {
                console.error('Erro ao iniciar fluxo automático:', errAuto);
                toast('Solicitação criada! Você pode acompanhar o status em Minhas Solicitações.', { 
                    duration: 5000 
                });
            }

            // Navegar para página de solicitações ativas
            navigate('/minhas-solicitacoes');
        } catch (error) {
            console.error('Erro ao solicitar carona:', error);
            const backendMessage = error?.response?.data?.message || error?.message;
            toast.error(backendMessage || 'Erro ao solicitar carona');
        } finally {
            setRequesting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pt-2">
            <PageContainer 
                title="Solicitar Carona" 
                description="Encontre um motorista para sua rota" 
                centerTitle={true} 
                maxWidth="full" 
                className="max-w-screen-2xl px-6 py-2"
            >
                <div className="py-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Coluna do Mapa - Lado Esquerdo */}
                        <div className="lg:col-span-5 order-2 lg:order-1">
                            <Card className="p-0 overflow-hidden h-[500px] lg:h-[650px] w-full max-w-full relative z-0 shadow-lg rounded-xl">
                                <MapView
                                    origin={originCoords ? { ...originCoords, label: 'Origem' } : null}
                                    destination={destinationCoords ? { ...destinationCoords, label: 'Destino' } : null}
                                    showRoute={!!(originCoords && destinationCoords)}
                                    className="h-full w-full"
                                />
                            </Card>
                        </div>

                        {/* Coluna do Formulário - Lado Direito */}
                        <div className="lg:col-span-4 order-1 lg:order-2">
                            <Card className="shadow-lg rounded-xl overflow-hidden">
                                <div className="p-8">
                                    {/* Header */}
                                    <div className="mb-6">
                                        <h2 className="text-3xl font-bold text-fatecride-blue mb-2">
                                            Sua Rota
                                        </h2>
                                        <p className="text-sm text-gray-600">
                                            Informe origem e destino para encontrar um motorista
                                        </p>
                                    </div>

                                    {/* Formulário */}
                                    <div className="space-y-6">
                                        {/* Origem */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-800 mb-3">
                                                📍 Ponto de Partida
                                            </label>
                                            <AddressAutocomplete
                                                value={originAddress?.endereco || ''}
                                                onChange={(e) => { setOriginSelected(false); }}
                                                onSelect={handleOriginSelect}
                                                placeholder="Digite o endereço de origem..."
                                                disabled={requesting}
                                            />
                                        </div>

                                        {/* Destino */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-800 mb-3">
                                                🎯 Destino
                                            </label>
                                            <AddressAutocomplete
                                                value={destinationAddress?.endereco || ''}
                                                onChange={(e) => { setDestinationSelected(false); }}
                                                onSelect={handleDestinationSelect}
                                                placeholder="Digite o endereço de destino..."
                                                disabled={requesting}
                                            />
                                        </div>

                                        {/* Aviso */}
                                        {(!originSelected || !destinationSelected) && (
                                            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
                                                <p className="text-sm text-amber-800">
                                                    <strong>⚠️ Dica:</strong> Selecione origem e destino nas sugestões do autocomplete
                                                </p>
                                            </div>
                                        )}

                                        {/* Botão Principal */}
                                        <Button
                                            onClick={handleRequestRide}
                                            disabled={!originSelected || !destinationSelected || requesting}
                                            className="w-full h-14 bg-gradient-to-r from-fatecride-blue to-fatecride-blue-dark hover:shadow-lg text-white font-bold text-lg rounded-lg transition-all duration-300"
                                        >
                                            {requesting ? (
                                                <>
                                                    <Spinner size="sm" className="mr-2" />
                                                    Solicitando...
                                                </>
                                            ) : (
                                                '🚗 Solicitar Carona'
                                            )}
                                        </Button>

                                        {/* Info extra */}
                                        <div className="bg-blue-50 rounded-lg p-4">
                                            <p className="text-xs text-gray-700 text-center">
                                                Motoristas próximos serão notificados em tempo real. Você acompanhará o status da sua solicitação.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Coluna do Anúncio - Lado Direito (Abaixo no Mobile) */}
                        <div className="lg:col-span-3 order-3">
                            <div className="sticky top-20 lg:top-24">
                                <AnuncioViewerCompact className="w-full rounded-xl overflow-hidden shadow-lg" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Seção de Informações */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                        <div className="text-4xl mb-3">⚡</div>
                        <h3 className="font-bold text-gray-900 mb-2">Rápido</h3>
                        <p className="text-sm text-gray-600">Motoristas são notificados em tempo real</p>
                    </Card>
                    
                    <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                        <div className="text-4xl mb-3">🔒</div>
                        <h3 className="font-bold text-gray-900 mb-2">Seguro</h3>
                        <p className="text-sm text-gray-600">Todas as solicitações são rastreadas</p>
                    </Card>
                    
                    <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                        <div className="text-4xl mb-3">💬</div>
                        <h3 className="font-bold text-gray-900 mb-2">Comunicação</h3>
                        <p className="text-sm text-gray-600">Chat integrado com seu motorista</p>
                    </Card>
                </div>
            </PageContainer>
        </div>
    );
}

export default PassengerPage;
