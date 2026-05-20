// features/rides/pages/PassengerPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
 
import { PageContainer } from '@shared/components/layout/PageContainer';
import { Card } from '@shared/components/ui/Card';
import { MapView } from '@shared/components/map/MapView';
import { ridesService } from '@features/rides/services/ridesService';
import { useAuthStore } from '@features/auth/stores/authStore';
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
    const [pendingRequests, setPendingRequests] = useState([]);
    const [cancelingId, setCancelingId] = useState(null);

    const { user } = useAuthStore();

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
     * Criar solicitação sem vincular a uma carona específica e iniciar o fluxo automático
     */
    async function handleCreateAutomaticRequest() {
        if (!originAddress || !destinationAddress) {
            toast.error('Dados de endereço incompletos');
            return;
        }

        try {
            setRequesting(true);

            const payload = {
                originDTO: originAddress,
                destinationDTO: destinationAddress
            };

            const created = await ridesService.requestRide(payload);

            const solicitacaoId = created?.id ?? created?.id_solicitacao ?? created?.idSolicitacao ?? null;
            try {
                if (solicitacaoId) {
                    await ridesService.startAutomaticFlow({
                        solicitacaoId,
                        latitudeOrigem: originCoords?.lat,
                        longitudeOrigem: originCoords?.lng,
                        latitudeDestino: destinationCoords?.lat,
                        longitudeDestino: destinationCoords?.lng
                    });
                    toast.success('Solicitação criada e fluxo automático iniciado!');
                } else {
                    toast.success('Solicitação criada!');
                }
            } catch (errAuto) {
                console.error('Erro ao iniciar fluxo automático:', errAuto);
                toast('Solicitação criada, mas falha ao iniciar fluxo automático.', { duration: 6000 });
            }

            navigate('/inicio');
        } catch (error) {
            console.error('Erro ao criar solicitação automática:', error);
            const backendMessage = error?.response?.data?.message || error?.message;
            toast.error(backendMessage || 'Erro ao criar solicitação');
        } finally {
            setRequesting(false);
        }
    }

    // Fetch pending requests do passageiro para mostrar botão de cancelar rápido
    const fetchPendingRequests = async () => {
        try {
            const data = await ridesService.getPending(0, 10);
            let arr = Array.isArray(data) ? data : (data?.content || []);
            if (data && typeof data === 'object' && !Array.isArray(data) && !data.content) arr = [data];
            setPendingRequests(arr.map(r => r));
        } catch (err) {
            console.warn('Falha ao buscar pending requests:', err);
            setPendingRequests([]);
        }
    };

    const handleCancelPending = async (requestId) => {
        try {
            setCancelingId(requestId);
            await ridesService.cancelRequest(requestId);
            toast.success('Solicitação cancelada');
            await fetchPendingRequests();
        } catch (err) {
            console.error('Erro ao cancelar pending:', err);
            toast.error('Erro ao cancelar solicitação');
        } finally {
            setCancelingId(null);
        }
    };

    // Atualizar pending quando usuário mudar ou após criar solicitação
    useEffect(() => {
        if (user?.tipo === 'PASSAGEIRO' || user?.tipo === 'AMBOS') fetchPendingRequests();
    }, [user?.id, user?.tipo]);

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
                    toast('Ainda não encontramos motoristas para essa rota. Tente ampliar a área de busca ou tente novamente mais tarde.', { duration: 5000 });
                } else {
                    toast.success(`${rides.length} carona(s) encontrada(s)!`);
                }
            } catch (err) {
                // axios error -> verificar response.data.message
                const backendMessage = err?.response?.data?.message || err?.message || '';
                console.error('❌ Erro do backend (service):', backendMessage, err);

                if (backendMessage.includes('Nenhum motorista')) {
                    setAvailableRides([]);
                    toast(
                        'Não encontramos motoristas próximos desta rota. Experimente procurar por locais próximos a pontos principais (ex.: terminais) ou tente novamente mais tarde.',
                        { duration: 6000 }
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

                const created = await ridesService.requestRide(payload);

                // Tenta iniciar o fluxo automático para a solicitação criada
                try {
                    const solicitacaoId = created?.id ?? created?.id_solicitacao ?? created?.idSolicitacao ?? null;
                    if (solicitacaoId) {
                        await ridesService.startAutomaticFlow({
                            solicitacaoId,
                            latitudeOrigem: originCoords?.lat,
                            longitudeOrigem: originCoords?.lng,
                            latitudeDestino: destinationCoords?.lat,
                            longitudeDestino: destinationCoords?.lng
                        });
                        toast.success('Solicitação enviada e fluxo automático iniciado!');
                    } else {
                        toast.success('Solicitação enviada com sucesso!');
                    }
                } catch (errAuto) {
                    console.error('Erro ao iniciar fluxo automático:', errAuto);
                    toast('Solicitação criada, mas falha ao iniciar fluxo automático. Você pode tentar novamente manualmente.', { duration: 6000 });
                }

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
            <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pt-2">
                <PageContainer title="Buscar Caronas" description="Encontre motoristas disponíveis na sua rota" centerTitle={true} maxWidth="full" className="max-w-screen-2xl px-6 py-2">
                    <div className="py-2">
                    {/* Seção rápida: Solicitação pendente do passageiro */}
                    {user?.tipo === 'PASSAGEIRO' && pendingRequests.length > 0 && (
                        <Card className="mb-4">
                            <div className="p-4 flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-gray-600">Você possui solicitações pendentes</div>
                                    <div className="font-medium">Solicitação #{pendingRequests[0].id_solicitacao || pendingRequests[0].id}</div>
                                </div>
                                <div>
                                    <Button variant="outline" onClick={() => handleCancelPending(pendingRequests[0].id || pendingRequests[0].id_solicitacao)} disabled={cancelingId === (pendingRequests[0].id || pendingRequests[0].id_solicitacao)}>
                                        {cancelingId === (pendingRequests[0].id || pendingRequests[0].id_solicitacao) ? 'Cancelando...' : 'Cancelar solicitação'}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Coluna do Mapa */}
                            <div className="lg:col-span-3">
                            <Card className="p-0 overflow-hidden h-[620px] w-full max-w-full relative z-0">
                                <MapView
                                    origin={originCoords ? { ...originCoords, label: 'Origem' } : null}
                                    destination={destinationCoords ? { ...destinationCoords, label: 'Destino' } : null}
                                    showRoute={!!(originCoords && destinationCoords)}
                                    className="h-full w-full"
                                />
                            </Card>
                        </div>
                        {/* Formulário - coluna 2 */}
                        <div className="lg:col-span-3">
                            <Card>
                                <div className="p-6">
                                    <h2 className="text-2xl font-semibold text-fatecride-blue mb-4 leading-tight">Informe sua rota</h2>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Origem</label>
                                            <AddressAutocomplete
                                                value={originInput}
                                                onChange={(e) => { setOriginInput(e.target.value); setOriginSelected(false); }}
                                                onSelect={handleOriginSelect}
                                                placeholder="Digite o endereço de origem..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Destino</label>
                                            <AddressAutocomplete
                                                value={destinationInput}
                                                onChange={(e) => { setDestinationInput(e.target.value); setDestinationSelected(false); }}
                                                onSelect={handleDestinationSelect}
                                                placeholder="Digite o endereço de destino..."
                                            />
                                        </div>

                                        <Button onClick={handleSearch} disabled={!originSelected || !destinationSelected || searching} className="w-full">
                                            {searching ? (<><Spinner size="sm" className="mr-2" />Buscando...</>) : (<><FiSearch className="mr-2" />Buscar Caronas</>) }
                                        </Button>

                                        <Button onClick={handleCreateAutomaticRequest} disabled={!originSelected || !destinationSelected || requesting} className="w-full mt-3 bg-fatecride-blue">
                                            {requesting ? (<><Spinner size="sm" className="mr-2" />Enviando...</>) : ('Solicitar Automaticamente')}
                                        </Button>

                                        {(!originSelected || !destinationSelected) && (
                                            <p className="text-sm text-amber-600 text-center">⚠️ Selecione origem e destino nas sugestões para buscar</p>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Resultados - coluna 3 */}
                        <div className="lg:col-span-3">
                            <Card>
                                <div className="p-6">
                                    <h3 className="text-2xl font-semibold text-fatecride-blue mb-4">Caronas Disponíveis</h3>

                                    {searching ? (
                                        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
                                    ) : availableRides.length > 0 ? (
                                        <div className="space-y-4 max-h-[640px] overflow-y-auto pr-2">
                                            {availableRides.map((ride) => (
                                                <RideCard key={ride.idCarona} ride={ride} onRequest={handleRequestRide} loading={requesting} />
                                            ))}
                                        </div>
                                    ) : (
                                        <EmptyState icon={FiSearch} title="Nenhuma carona encontrada" description="Tente buscar com endereços principais da região (ex: Terminal Cotia, Fatec Cotia) ou aguarde novas caronas serem cadastradas." />
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Anúncio - coluna 4 (última) */}
                        <div className="lg:col-span-3">
                                <div className="sticky top-16">
                                <AnuncioViewerCompact className="w-full max-w-sm" />
                            </div>
                        </div>
                    </div>
                </div>
            </PageContainer>
        </div>
    );
}