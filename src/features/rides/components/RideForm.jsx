// features/rides/components/RideForm.jsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '@shared/components/ui/Card';
import { Input } from '@shared/components/ui/Input';
import { Button } from '@shared/components/ui/Button';
import { MapPin, Car } from 'lucide-react';
import { useVehicles } from '@features/vehicles/hooks/useVehicles';

export function RideForm({ onGenerateRoute, onSubmit, isLoading }) {
    const { data: vehicles = [] } = useVehicles();
    const [routeGenerated, setRouteGenerated] = useState(false);

    const { register, handleSubmit, watch, formState: { errors } } = useForm({
        defaultValues: {
            origin: '',
            destination: '',
            idVeiculo: vehicles[0]?.id || '',
            vagas: 1
        }
    });

    const origin = watch('origin');
    const destination = watch('destination');

    useEffect(() => {
        if (vehicles.length > 0 && !watch('idVeiculo')) {
            register('idVeiculo', { value: vehicles[0].id });
        }
    }, [vehicles]);

    const handleGenerateRoute = () => {
        if (!origin || !destination) {
            toast.error('Preencha origem e destino');
            return;
        }
        onGenerateRoute(origin, destination);
        setRouteGenerated(true);
    };

    return (
        <Card className="overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Para onde vamos?
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    label="Ponto de Partida"
                    leftIcon={MapPin}
                    placeholder="Ex: Fatec Cotia"
                    {...register('origin')}
                    error={errors.origin?.message}
                />

                <Input
                    label="Ponto Final"
                    leftIcon={MapPin}
                    placeholder="Ex: Avenida Paulista"
                    {...register('destination')}
                    error={errors.destination?.message}
                />

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Selecione o veículo
                    </label>
                    <select
                        {...register('idVeiculo')}
                        className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary"
                    >
                        {vehicles.map(v => (
                            <option key={v.id} value={v.id}>
                                {v.marca} {v.modelo} - {v.placa}
                            </option>
                        ))}
                    </select>
                </div>

                <Input
                    label="Vagas Disponíveis"
                    type="number"
                    min={1}
                    max={5}
                    {...register('vagas', { valueAsNumber: true })}
                    error={errors.vagas?.message}
                />

                <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    onClick={handleGenerateRoute}
                    disabled={isLoading}
                >
                    Gerar Rota
                </Button>

                <Button
                    type="submit"
                    fullWidth
                    loading={isLoading}
                    disabled={!routeGenerated}
                >
                    Criar Carona
                </Button>
            </form>
        </Card>
    );
}