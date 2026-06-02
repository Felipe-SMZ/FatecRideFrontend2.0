// features/rides/pages/DriverPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
 
import { PageContainer } from '@shared/components/layout/PageContainer';
import { Card } from '@shared/components/ui/Card';
import { Button } from '@shared/components/ui/Button';
import { Input } from '@shared/components/ui/Input';
import { Select } from '@shared/components/ui/Select';
import { AddressAutocomplete } from '@shared/components/ui/AddressAutocomplete';
import { MapView } from '@shared/components/map/MapView';
import { AddressCard } from '@shared/components/cards/AddressCard';
import { FiMapPin } from 'react-icons/fi';
import { ridesService } from '@features/rides/services/ridesService';
import { vehiclesService } from '@features/vehicles/services/vehiclesService';
import { AnuncioViewerCompact } from '@features/anuncios/components/AnuncioViewer';

/**
 * DriverPage - Página de criação de carona (Motorista)
 * 
 * Fluxo:
 * 1. Motorista informa origem e destino
 * 2. Sistema busca coordenadas e exibe no mapa
 * 3. Motorista seleciona veículo e vagas
 * 4. Cria a carona
 */

const DIAS = [
    { id: 1, label: 'Seg' },
    { id: 2, label: 'Ter' },
    { id: 3, label: 'Qua' },
    { id: 4, label: 'Qui' },
    { id: 5, label: 'Sex' },
    { id: 6, label: 'Sáb' },
    { id: 7, label: 'Dom' },
];

const INTERVALOS = [
    { id: 1, label: 'Diário (1 dia)' },
    { id: 2, label: 'A cada 5 dias' },
    { id: 3, label: 'Semanal (7 dias)' },
    { id: 4, label: 'Quinzenal (15 dias)' },
    { id: 5, label: 'Mensal (30 dias)' },
];

export function DriverPage() {
    const navigate = useNavigate();
    
    // Estados do formulário
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [vehicleId, setVehicleId] = useState('');
    const [availableSeats, setAvailableSeats] = useState(1);
    const [rideDateTime, setRideDateTime] = useState(''); // Novo campo: data/hora da viagem
    const [vehicles, setVehicles] = useState([]);

    // Estados de Recorrência (Correção do ReferenceError)
    const [schedulingType, setSchedulingType] = useState('NONE'); // 'NONE', 'WEEKLY', 'INTERVAL'
    const [selectedDays, setSelectedDays] = useState([]);
    const [intervalId, setIntervalId] = useState(3); // Default: Semanal
    
    // Estados de coordenadas e endereços
    const [originCoords, setOriginCoords] = useState(null);
    const [destinationCoords, setDestinationCoords] = useState(null);
    const [originAddress, setOriginAddress] = useState(null);
    const [destinationAddress, setDestinationAddress] = useState(null);
    const [originSelected, setOriginSelected] = useState(false);
    const [destinationSelected, setDestinationSelected] = useState(false);
    
    // Estados de loading
    const [searchingRoute, setSearchingRoute] = useState(false);
    const [creatingRide, setCreatingRide] = useState(false);

    // Buscar veículos ao montar
    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const data = await vehiclesService.getAll();
                console.log('🚗 Veículos carregados (service):', data);

                if (!data || data.length === 0) {
                    toast.error('Você precisa cadastrar um veículo primeiro', { duration: 5000 });
                    setTimeout(() => navigate('/cadastrar-veiculo'), 2000);
                    return;
                }

                setVehicles(data);

                if (data.length > 0) {
                    setVehicleId(data[0].id || data[0].id_veiculo || data[0].idVeiculo);
                }
            } catch (error) {
                console.error('❌ Exceção ao buscar veículos (service):', error);
                // Se backend retornou 403, indicar que usuário não tem permissão
                const status = error?.response?.status || error?.status;
                if (status === 403) {
                    toast.error('Você não tem permissão para ver veículos', { duration: 5000 });
                    return;
                }
                toast.error('Erro ao carregar veículos');
            }
        };
        
        fetchVehicles();
    }, [navigate]);

    /**
     * Quando usuário seleciona endereço de origem no autocomplete
     */
    const handleOriginSelect = (data) => {
        setOriginCoords(data.coords);
        setOriginAddress(data.address);
        setOriginSelected(true);
        console.log('✅ Origem selecionada:', data);
    };

    /**
     * Quando usuário seleciona endereço de destino no autocomplete
     */
    const handleDestinationSelect = (data) => {
        setDestinationCoords(data.coords);
        setDestinationAddress(data.address);
        setDestinationSelected(true);
        console.log('✅ Destino selecionado:', data);
    };

    /**
     * Valida se a data/hora é válida (não no passado)
     */
    const isValidDateTime = (dateTime) => {
        if (!dateTime) return false;
        const selected = new Date(dateTime);
        const now = new Date();
        return selected > now;
    };

    const handleToggleDay = (id) => {
        setSelectedDays(prev => 
            prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
        );
    };

    /**
     * Cria a carona
     */
    const handleCreateRide = async () => {
        if (!originAddress || !destinationAddress) {
            toast.error('Selecione a origem e o destino nas sugestões');
            return;
        }

        if (!vehicleId) {
            toast.error('Selecione um veículo');
            return;
        }

        if (!rideDateTime) {
            toast.error('Informe a data e hora da viagem');
            return;
        }

        if (!isValidDateTime(rideDateTime)) {
            toast.error('A data/hora deve ser no futuro');
            return;
        }

        try {
            setCreatingRide(true);

            // Formata data para incluir segundos (YYYY-MM-DDTHH:mm:00)
            const formattedDateTime = rideDateTime.length === 16 ? `${rideDateTime}:00` : rideDateTime;

            // 1. Criar a Carona Base (Template) - Obrigatório para ambos os fluxos
            const basePayload = {
                originDTO: originAddress,
                destinationDTO: destinationAddress,
                vagas_disponiveis: Number(availableSeats),
                id_veiculo: Number(vehicleId),
                data_hora_viagem: formattedDateTime
            };

            // Log detalhado da requisição para depuração
            console.log('🚀 [DriverPage] Iniciando criação de carona:', {
                etapa: '1. Carona Base (POST /rides)',
                payload: basePayload,
                fluxoRecorrencia: schedulingType !== 'NONE' ? {
                    tipo: schedulingType,
                    detalhes: schedulingType === 'WEEKLY' ? { dias: selectedDays } : { intervaloId, dataInicio: rideDateTime.split('T')[0] }
                } : 'Nenhuma'
            });

            const createdRide = await ridesService.createRide(basePayload);
            // Captura ID: Tenta objeto DTO ou o próprio retorno caso venha apenas o ID
            const rideId = createdRide?.id || createdRide?.id_carona || createdRide?.idCarona || (typeof createdRide === 'number' ? createdRide : null);

            if (!rideId) throw new Error('Falha ao obter ID da carona base.');

            // 2. Se houver recorrência, disparar a segunda etapa
            if (schedulingType === 'WEEKLY') {
                const weeklyPayload = {
                    ride: Number(rideId),
                    dia_semana_agendamento: selectedDays
                };
                console.log('📅 [DriverPage] Enviando agendamento semanal (POST /agendar-ride-dia-semana):', weeklyPayload);
                await ridesService.scheduleRideWeekly(weeklyPayload);
                toast.success('Carona e agendamento semanal criados!');
            } 
            else if (schedulingType === 'INTERVAL') {
                const dataInicio = rideDateTime.split('T')[0]; // Extrai apenas YYYY-MM-DD
                const intervalPayload = {
                    ride: Number(rideId),
                    dataInicio: dataInicio,
                    intervalo_dias: Number(intervalId)
                };
                console.log('🔄 [DriverPage] Enviando agendamento por intervalo (POST /agendar-compromisso-intervalo-dias):', intervalPayload);
                await ridesService.scheduleRideInterval(intervalPayload);
                toast.success('Carona e agendamento por intervalo criados!');
            } 
            else {
                toast.success('Carona única criada com sucesso!');
            }

            navigate('/inicio');
        } catch (error) {
            console.error('Erro ao criar carona:', error);
            const detail = error.response?.data?.details || error.response?.data?.error || error.message;
            toast.error(`Falha: ${detail}`);
        } finally {
            setCreatingRide(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-2">
            <PageContainer centerTitle={true} maxWidth="full" className="max-w-screen-2xl px-6 py-2">
                    <div className="py-6">
                        <h1 className="text-3xl font-bold text-fatecride-blue mb-6 text-center">
                            Oferecer Carona 🚗
                        </h1>
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Coluna do Mapa */}
                        <div className="lg:col-span-4 flex justify-center">
                            <Card className="p-0 overflow-hidden h-[520px] w-[520px] max-w-full relative z-0">
                                <MapView
                                    origin={originCoords ? { ...originCoords, label: 'Origem' } : null}
                                    destination={destinationCoords ? { ...destinationCoords, label: 'Destino' } : null}
                                    showRoute={!!(originCoords && destinationCoords)}
                                    className="h-full w-full"
                                />
                            </Card>

                            {/* Pequena pré-visualização de endereços abaixo do mapa (mobile) */}
                            {(originAddress || destinationAddress) && (
                                <div className="mt-4 md:mt-6 grid grid-cols-1 gap-4 lg:hidden">
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

                        {/* Coluna do Formulário */}
                        <div className="lg:col-span-4">
                            <Card>
                                <div className="p-6">
                                    <h2 className="text-2xl font-semibold text-fatecride-blue mb-4 leading-tight">Para onde vamos?</h2>

                                    <div className="space-y-4">
                                        {/* Origem com Autocomplete */}
                                        <AddressAutocomplete
                                            label="Ponto de Partida"
                                            placeholder="Digite o endereço de origem..."
                                            value={origin}
                                            onChange={(e) => {
                                                setOrigin(e.target.value);
                                                setOriginSelected(false);
                                            }}
                                            onSelect={handleOriginSelect}
                                            disabled={creatingRide}
                                        />

                                        {/* Destino com Autocomplete */}
                                        <AddressAutocomplete
                                            label="Destino"
                                            placeholder="Digite o endereço de destino..."
                                            value={destination}
                                            onChange={(e) => {
                                                setDestination(e.target.value);
                                                setDestinationSelected(false);
                                            }}
                                            onSelect={handleDestinationSelect}
                                            disabled={creatingRide}
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
                                            disabled={creatingRide}
                                        />

                                        {/* Data e Hora da Viagem (NOVO) */}
                                        <Input
                                            label="📅 Data e Hora da Viagem"
                                            type="datetime-local"
                                            value={rideDateTime}
                                            onChange={(e) => setRideDateTime(e.target.value)}
                                            disabled={creatingRide}
                                            required
                                        />
                                        {rideDateTime && !isValidDateTime(rideDateTime) && (
                                            <p className="text-xs text-red-600">
                                                ⚠️ A data/hora deve ser no futuro
                                            </p>
                                        )}

                                        {/* Seção de Recorrência */}
                                        <div className="pt-4 border-t border-gray-100 mt-2">
                                            <label className="block text-sm font-semibold text-fatecride-blue mb-2">
                                                🔄 Agendar Recorrência?
                                            </label>
                                            <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg">
                                                <button
                                                    type="button"
                                                    onClick={() => setSchedulingType('NONE')}
                                                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${schedulingType === 'NONE' ? 'bg-white shadow text-fatecride-blue' : 'text-gray-500'}`}
                                                >Única</button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSchedulingType('WEEKLY')}
                                                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${schedulingType === 'WEEKLY' ? 'bg-white shadow text-fatecride-blue' : 'text-gray-500'}`}
                                                >Semanal</button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSchedulingType('INTERVAL')}
                                                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${schedulingType === 'INTERVAL' ? 'bg-white shadow text-fatecride-blue' : 'text-gray-500'}`}
                                                >Intervalo</button>
                                            </div>

                                            {schedulingType === 'WEEKLY' && (
                                                <div className="space-y-2 mb-4 animate-in fade-in slide-in-from-top-1">
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Dias da semana:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {DIAS.map(dia => (
                                                            <button
                                                                key={dia.id}
                                                                type="button"
                                                                onClick={() => handleToggleDay(dia.id)}
                                                                className={`px-2 py-1 text-[10px] font-bold rounded border transition-colors ${selectedDays.includes(dia.id) ? 'bg-fatecride-blue text-white border-fatecride-blue' : 'bg-white text-gray-400 border-gray-200'}`}
                                                            >
                                                                {dia.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {schedulingType === 'INTERVAL' && (
                                                <div className="mb-4 animate-in fade-in slide-in-from-top-1">
                                                    <Select
                                                        label="Frequência"
                                                        value={intervalId}
                                                        onChange={(e) => setIntervalId(e.target.value)}
                                                        options={INTERVALOS.map(opt => ({ value: opt.id, label: opt.label }))}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Botão Criar Carona */}
                                        <Button
                                            onClick={handleCreateRide}
                                            fullWidth
                                            loading={creatingRide}
                                            disabled={!originSelected || !destinationSelected || !rideDateTime || !isValidDateTime(rideDateTime)}
                                        >
                                            {creatingRide ? 'Criando...' : 'Criar Carona'}
                                        </Button>

                                        {/* Aviso */}
                                        {(!originSelected || !destinationSelected) && (
                                            <p className="text-xs text-amber-600 text-center">
                                                ⚠️ Selecione origem e destino nas sugestões para criar a carona
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Coluna do Anúncio */}
                        <div className="lg:col-span-4">
                            <div className="sticky top-16">
                                <AnuncioViewerCompact className="w-full rounded-lg overflow-hidden" />
                            </div>
                        </div>
                    </div>
                </div>
            </PageContainer>
        </div>
    );
}