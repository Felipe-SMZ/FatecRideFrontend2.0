// features/rides/pages/PassengerPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
 
import { PageContainer } from '@shared/components/layout/PageContainer';
import { Card } from '@shared/components/ui/Card';
import { MapView } from '@shared/components/map/MapView';
import { ridesService } from '@features/rides/services/ridesService';
import { RideCard } from '@shared/components/cards/RideCard';
import { EmptyState } from '@shared/components/ui/EmptyState';
import { Spinner } from '@shared/components/ui/Spinner';
import { AddressAutocomplete } from '@shared/components/ui/AddressAutocomplete';
import { Button } from '@shared/components/ui/Button';
import { FiSearch } from 'react-icons/fi';
import { AnuncioViewerCompact } from '@features/anuncios/components/AnuncioViewer';

/**
 * PassengerPage - Página de busca de caronas (Passageiro)
 * 
 * Fluxo:
 * 1. Passageiro seleciona origem e destino do autocomplete
 * 2. Sistema busca caronas disponíveis próximas
 * 3. Exibe lista de caronas com mapa
 * 4. Passageiro solicita carona
 */

export function PassengerPage() {
    const navigate = useNavigate();
    
    // Estados de busca
    const [originCoords, setOriginCoords] = useState(null);
    const [destinationCoords, setDestinationCoords] = useState(null);
    const [originAddress, setOriginAddress] = useState(null);
    const [destinationAddress, setDestinationAddress] = useState(null);
    
    // Estados de seleção do autocomplete
    const [originSelected, setOriginSelected] = useState(false);
    const [destinationSelected, setDestinationSelected] = useState(false);
    
    // Campos de texto (controlados)
    const [originInput, setOriginInput] = useState('');
    const [destinationInput, setDestinationInput] = useState('');
    
    // Estados de caronas
    const [availableRides, setAvailableRides] = useState([]);
    const [searching, setSearching] = useState(false);
    const [requesting, setRequesting] = useState(false);

    /**
     * Handler quando origem é selecionada
     */
    const handleOriginSelect = (data) => {
        console.log('✅ Origem selecionada:', data);
        setOriginCoords(data.coords);
        setOriginAddress(data.address);
        setOriginSelected(true);
    };

    /**
     * Handler quando destino é selecionado
     */
    const handleDestinationSelect = (data) => {
        console.log('✅ Destino selecionado:', data);
        setDestinationCoords(data.coords);
        setDestinationAddress(data.address);
        setDestinationSelected(true);
    };

    /**
     * Busca caronas disponíveis
     */
    const handleSearch = async () => {
        if (!originSelected || !destinationSelected) {
            toast.error('Selecione origem e destino nas sugestões antes de buscar');
            return;
        }

        try {
            setSearching(true);
            setAvailableRides([]);

            // Busca caronas próximas via service (usa `api` com interceptor)
            const payload = {
                latitudeOrigem: originCoords.lat,
                longitudeOrigem: originCoords.lng,
                latitudeDestino: destinationCoords.lat,
                longitudeDestino: destinationCoords.lng
            };

            console.log('🔍 Buscando caronas com payload:', payload);

            try {
                const rides = await ridesService.searchNearby(payload);
                console.log('✅ Caronas encontradas (service):', rides);
                setAvailableRides(rides || []);

                if (!rides || rides.length === 0) {
                    toast.info('Nenhuma carona encontrada para esta rota');
                } else {
                    toast.success(`${rides.length} carona(s) encontrada(s)!`);
                }
            } catch (err) {
                // axios error -> verificar response.data.message
                const backendMessage = err?.response?.data?.message || err?.message || '';
                console.error('❌ Erro do backend (service):', backendMessage, err);

                if (backendMessage.includes('Nenhum motorista')) {
                    setAvailableRides([]);
                    toast.info(
                        'Nenhuma carona encontrada para esta rota. Tente buscar com endereços próximos ou principais da região.',
                        { duration: 5000 }
                    );
                    setSearching(false);
                    return;
                }

                throw new Error(backendMessage || 'Erro ao buscar caronas');
            }
        } catch (error) {
            console.error('❌ Erro ao buscar caronas:', error);
            toast.error(error.message || 'Erro ao buscar caronas disponíveis');
        } finally {
            setSearching(false);
        }
    };

    /**
     * Solicita carona
     * PassageRequestsDTO: originDTO, destinationDTO, id_carona
     */
    const handleRequestRide = async (ride) => {
        if (!originAddress || !destinationAddress) {
            toast.error('Dados de endereço incompletos');
            return;
        }

            try {
                setRequesting(true);

                const payload = {
                    id_carona: ride.idCarona,
                    originDTO: originAddress,
                    destinationDTO: destinationAddress
                };

                await ridesService.requestRide(payload);

                toast.success('Solicitação enviada com sucesso!');
                navigate('/inicio');
            } catch (error) {
                console.error('Erro ao solicitar carona (service):', error);
                const backendMessage = error?.response?.data?.message || error?.message;
                toast.error(backendMessage || 'Erro ao solicitar carona');
            } finally {
                setRequesting(false);
            }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
                <PageContainer>
                    <div className="py-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-6">
                            Buscar Caronas 🔍
                        </h1>

                        <div className="mb-6">
                            <AnuncioViewerCompact className="w-full rounded-lg overflow-hidden" />
                        </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Coluna do Mapa - 2/3 */}
                        <div className="lg:col-span-2">
                            <Card className="p-0 overflow-hidden h-[500px]">
                                <MapView
                                    origin={originCoords ? { ...originCoords, label: 'Origem' } : null}
                                    destination={destinationCoords ? { ...destinationCoords, label: 'Destino' } : null}
                                    showRoute={!!(originCoords && destinationCoords)}
                                    className="h-full"
                                />
                            </Card>
                        </div>

                        {/* Coluna de Busca e Resultados - 1/3 */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Formulário de Busca */}
                            <Card>
                                <div className="p-6">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                        Informe sua rota
                                    </h2>
                                    
                                    <div className="space-y-4">
                                        {/* Origem */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Origem
                                            </label>
                                            <AddressAutocomplete
                                                value={originInput}
                                                onChange={(e) => {
                                                    setOriginInput(e.target.value);
                                                    setOriginSelected(false); // Reset quando digita
                                                }}
                                                onSelect={handleOriginSelect}
                                                placeholder="Digite o endereço de origem..."
                                            />
                                        </div>

                                        {/* Destino */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Destino
                                            </label>
                                            <AddressAutocomplete
                                                value={destinationInput}
                                                onChange={(e) => {
                                                    setDestinationInput(e.target.value);
                                                    setDestinationSelected(false); // Reset quando digita
                                                }}
                                                onSelect={handleDestinationSelect}
                                                placeholder="Digite o endereço de destino..."
                                            />
                                        </div>

                                        {/* Botão de Buscar */}
                                        <Button
                                            onClick={handleSearch}
                                            disabled={!originSelected || !destinationSelected || searching}
                                            className="w-full"
                                        >
                                            {searching ? (
                                                <>
                                                    <Spinner size="sm" className="mr-2" />
                                                    Buscando...
                                                </>
                                            ) : (
                                                <>
                                                    <FiSearch className="mr-2" />
                                                    Buscar Caronas
                                                </>
                                            )}
                                        </Button>

                                        {/* Aviso se não selecionou */}
                                        {(!originSelected || !destinationSelected) && (
                                            <p className="text-sm text-amber-600 text-center">
                                                ⚠️ Selecione origem e destino nas sugestões para buscar
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Card>

                            {/* Lista de Caronas */}
                            <Card>
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                                        Caronas Disponíveis
                                    </h3>

                                    {searching ? (
                                        <div className="flex justify-center py-12">
                                            <Spinner size="lg" />
                                        </div>
                                    ) : availableRides.length > 0 ? (
                                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                            {availableRides.map((ride) => (
                                                <RideCard
                                                    key={ride.idCarona}
                                                    ride={ride}
                                                    onRequest={handleRequestRide}
                                                    loading={requesting}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <EmptyState
                                            icon={FiSearch}
                                            title="Nenhuma carona encontrada"
                                            description="Tente buscar com endereços principais da região (ex: Terminal Cotia, Fatec Cotia) ou aguarde novas caronas serem cadastradas."
                                        />
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </PageContainer>
        </div>
    );
}