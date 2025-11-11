// features/rides/pages/DriverPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Navbar } from '@shared/components/layout/Navbar';
import { PageContainer } from '@shared/components/layout/PageContainer';
import { Card } from '@shared/components/ui/Card';
import { Button } from '@shared/components/ui/Button';
import { Input } from '@shared/components/ui/Input';
import { Select } from '@shared/components/ui/Select';
import { MapView } from '@shared/components/map/MapView';
import { AddressCard } from '@shared/components/cards/AddressCard';
import { FiMapPin } from 'react-icons/fi';

/**
 * DriverPage - Página de criação de carona (Motorista)
 * 
 * Fluxo:
 * 1. Motorista informa origem e destino
 * 2. Sistema busca coordenadas e exibe no mapa
 * 3. Motorista seleciona veículo e vagas
 * 4. Cria a carona
 */

export function DriverPage() {
    const navigate = useNavigate();
    
    // Estados do formulário
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [vehicleId, setVehicleId] = useState('');
    const [availableSeats, setAvailableSeats] = useState(1);
    const [vehicles, setVehicles] = useState([]);
    
    // Estados de coordenadas e endereços
    const [originCoords, setOriginCoords] = useState(null);
    const [destinationCoords, setDestinationCoords] = useState(null);
    const [originAddress, setOriginAddress] = useState(null);
    const [destinationAddress, setDestinationAddress] = useState(null);
    
    // Estados de loading
    const [searchingRoute, setSearchingRoute] = useState(false);
    const [creatingRide, setCreatingRide] = useState(false);

    // Buscar veículos ao montar
    useState(() => {
        const fetchVehicles = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:8080/veiculos', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (!response.ok) throw new Error('Erro ao buscar veículos');
                
                const data = await response.json();
                setVehicles(data);
                
                if (data.length > 0) {
                    setVehicleId(data[0].id || data[0].id_veiculo || data[0].idVeiculo);
                }
            } catch (error) {
                console.error('Erro ao buscar veículos:', error);
                toast.error('Erro ao carregar veículos');
            }
        };
        
        fetchVehicles();
    }, []);

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
     * Gera rota e busca coordenadas
     */
    const handleGenerateRoute = async () => {
        if (!origin.trim() || !destination.trim()) {
            toast.error('Preencha origem e destino');
            return;
        }

        try {
            setSearchingRoute(true);

            const [originData, destData] = await Promise.all([
                searchCoordinates(origin),
                searchCoordinates(destination)
            ]);

            setOriginCoords(originData.coords);
            setDestinationCoords(destData.coords);
            setOriginAddress(originData.address);
            setDestinationAddress(destData.address);

            toast.success('Rota gerada com sucesso!');
        } catch (error) {
            console.error('Erro ao gerar rota:', error);
            toast.error('Erro ao buscar localizações');
        } finally {
            setSearchingRoute(false);
        }
    };

    /**
     * Cria a carona
     */
    const handleCreateRide = async () => {
        if (!originAddress || !destinationAddress) {
            toast.error('Gere a rota antes de criar a carona');
            return;
        }

        if (!vehicleId) {
            toast.error('Selecione um veículo');
            return;
        }

        try {
            setCreatingRide(true);
            const token = localStorage.getItem('token');

            const payload = {
                originDTO: originAddress,
                destinationDTO: destinationAddress,
                vagas_disponiveis: Number(availableSeats),
                id_veiculo: vehicleId
            };

            const response = await fetch('http://localhost:8080/rides', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Erro ao criar carona');
            }

            toast.success('Carona criada com sucesso!');
            navigate('/inicio');
        } catch (error) {
            console.error('Erro ao criar carona:', error);
            toast.error(error.message || 'Erro ao criar carona');
        } finally {
            setCreatingRide(false);
        }
    };

    return (
        <>
            <Navbar showAuthButton={true} />
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
                <PageContainer>
                    <div className="py-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-6">
                            Oferecer Carona 🚗
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

                            {/* Cards de Endereço */}
                            {(originAddress || destinationAddress) && (
                                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {originAddress && (
                                        <AddressCard
                                            title="Origem"
                                            address={originAddress}
                                            variant="origin"
                                        />
                                    )}
                                    {destinationAddress && (
                                        <AddressCard
                                            title="Destino"
                                            address={destinationAddress}
                                            variant="destination"
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Coluna do Formulário - 1/3 */}
                        <div className="lg:col-span-1">
                            <Card>
                                <div className="p-6">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                        Para onde vamos?
                                    </h2>

                                    <div className="space-y-4">
                                        {/* Origem */}
                                        <Input
                                            label="Ponto de Partida"
                                            placeholder="Ex: Fatec Cotia"
                                            value={origin}
                                            onChange={(e) => setOrigin(e.target.value)}
                                            leftIcon={FiMapPin}
                                            disabled={searchingRoute || creatingRide}
                                        />

                                        {/* Destino */}
                                        <Input
                                            label="Destino"
                                            placeholder="Ex: Avenida Paulista"
                                            value={destination}
                                            onChange={(e) => setDestination(e.target.value)}
                                            leftIcon={FiMapPin}
                                            disabled={searchingRoute || creatingRide}
                                        />

                                        {/* Veículo */}
                                        <Select
                                            label="Veículo"
                                            value={vehicleId}
                                            onChange={(e) => setVehicleId(e.target.value)}
                                            disabled={searchingRoute || creatingRide}
                                            options={vehicles.map(v => ({
                                                value: v.id || v.id_veiculo || v.idVeiculo,
                                                label: `${v.marca} ${v.modelo} (${v.placa})`
                                            }))}
                                        />

                                        {/* Vagas */}
                                        <Input
                                            label="Vagas Disponíveis"
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={availableSeats}
                                            onChange={(e) => setAvailableSeats(e.target.value)}
                                            disabled={searchingRoute || creatingRide}
                                        />

                                        {/* Botão Gerar Rota */}
                                        <Button
                                            onClick={handleGenerateRoute}
                                            fullWidth
                                            loading={searchingRoute}
                                            disabled={creatingRide}
                                            variant="secondary"
                                        >
                                            {searchingRoute ? 'Gerando...' : 'Gerar Rota'}
                                        </Button>

                                        {/* Botão Criar Carona */}
                                        <Button
                                            onClick={handleCreateRide}
                                            fullWidth
                                            loading={creatingRide}
                                            disabled={searchingRoute || !originAddress || !destinationAddress}
                                        >
                                            {creatingRide ? 'Criando...' : 'Criar Carona'}
                                        </Button>
                                    </div>
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