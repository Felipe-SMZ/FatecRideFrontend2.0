// features/rides/pages/PassengerPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Navbar } from '@shared/components/layout/Navbar';
import { PageContainer } from '@shared/components/layout/PageContainer';
import { Card } from '@shared/components/ui/Card';
import { MapView } from '@shared/components/map/MapView';
import { RideCard } from '@shared/components/cards/RideCard';
import { RouteSearchForm } from '@shared/components/forms/RouteSearchForm';
import { EmptyState } from '@shared/components/ui/EmptyState';
import { Spinner } from '@shared/components/ui/Spinner';

/**
 * PassengerPage - Página de busca de caronas (Passageiro)
 * 
 * Fluxo:
 * 1. Passageiro informa origem e destino
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
    
    // Estados de caronas
    const [availableRides, setAvailableRides] = useState([]);
    const [searching, setSearching] = useState(false);
    const [requesting, setRequesting] = useState(false);

    /**
     * Busca coordenadas no backend
     * Mapeia OpenstreetmapDTO para OriginDTO/DestinationDTO
     */
    const searchCoordinates = async (address) => {
        const token = localStorage.getItem('token');
        const response = await fetch(
            `http://localhost:8080/local?local=${encodeURIComponent(address)}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.ok) throw new Error('Localização não encontrada');

        const data = await response.json();
        
        return {
            coords: { lat: parseFloat(data.lat), lng: parseFloat(data.lon) },
            address: {
                cidade: data.address?.city || data.address?.town || data.address?.village || '',
                logradouro: data.address?.road || '',
                numero: data.address?.house_number || 'S/N',
                bairro: data.address?.suburb || data.address?.neighbourhood || '',
                cep: data.address?.postcode || ''
            }
        };
    };

    /**
     * Busca caronas disponíveis
     */
    const handleSearch = async ({ origin, destination }) => {
        try {
            setSearching(true);
            setAvailableRides([]);

            // Busca coordenadas
            const [originData, destData] = await Promise.all([
                searchCoordinates(origin),
                searchCoordinates(destination)
            ]);

            setOriginCoords(originData.coords);
            setDestinationCoords(destData.coords);
            setOriginAddress(originData.address);
            setDestinationAddress(destData.address);

            // Busca caronas próximas
            // PassengerSearchRequest: latitudeOrigem, longitudeOrigem, latitudeDestino, longitudeDestino
            const token = localStorage.getItem('token');
            const payload = {
                latitudeOrigem: originData.coords.lat,
                longitudeOrigem: originData.coords.lng,
                latitudeDestino: destData.coords.lat,
                longitudeDestino: destData.coords.lng
            };

            console.log('🔍 Buscando caronas com payload:', payload);

            const response = await fetch('http://localhost:8080/solicitacao/proximos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Erro do backend:', errorText);
                
                // Backend retorna 500 quando não há motoristas próximos
                // Idealmente deveria retornar 200 com array vazio
                try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.message?.includes('Nenhum motorista')) {
                        setAvailableRides([]);
                        toast.info(
                            'Nenhuma carona encontrada para esta rota. ' +
                            'Tente buscar com endereços próximos ou principais da região.',
                            { duration: 5000 }
                        );
                        setSearching(false);
                        return;
                    }
                } catch (e) {
                    // Se não for JSON, continua com erro normal
                }
                
                throw new Error(errorText || 'Erro ao buscar caronas');
            }

            const rides = await response.json();
            console.log('✅ Caronas encontradas:', rides);
            setAvailableRides(rides);

            if (rides.length === 0) {
                toast.info('Nenhuma carona encontrada para esta rota');
            } else {
                toast.success(`${rides.length} carona(s) encontrada(s)!`);
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
            const token = localStorage.getItem('token');

            const payload = {
                id_carona: ride.idCarona,
                originDTO: originAddress,
                destinationDTO: destinationAddress
            };

            const response = await fetch('http://localhost:8080/solicitacao', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Erro ao solicitar carona');
            }

            toast.success('Solicitação enviada com sucesso!');
            navigate('/inicio');
        } catch (error) {
            console.error('Erro ao solicitar carona:', error);
            toast.error(error.message || 'Erro ao solicitar carona');
        } finally {
            setRequesting(false);
        }
    };

    return (
        <>
            <Navbar showAuthButton={true} />
            <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
                <PageContainer>
                    <div className="py-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-6">
                            Buscar Caronas 🔍
                        </h1>

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
                                    
                                    <RouteSearchForm
                                        onSearch={handleSearch}
                                        loading={searching}
                                        submitLabel="Buscar Caronas"
                                    />
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
                                            icon="🔍"
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
        </>
    );
}