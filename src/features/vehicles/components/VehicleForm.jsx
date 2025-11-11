// features/vehicles/components/VehicleForm.jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vehicleSchema } from '@shared/utils/validators';
import { Button } from '@shared/components/ui/Button';
import { Input } from '@shared/components/ui/Input';

export function VehicleForm({ onSubmit, initialData, isLoading }) {
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(vehicleSchema),
        defaultValues: initialData || {
            marca: '',
            modelo: '',
            placa: '',
            cor: '',
            ano: new Date().getFullYear(),
            vagas_disponiveis: 1
        }
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
                label="Marca"
                {...register('marca')}
                error={errors.marca?.message}
                placeholder="Ex: Toyota"
            />

            <Input
                label="Modelo"
                {...register('modelo')}
                error={errors.modelo?.message}
                placeholder="Ex: Corolla"
            />

            <Input
                label="Placa"
                {...register('placa')}
                error={errors.placa?.message}
                placeholder="ABC1D23"
                maxLength={7}
            />

            <Input
                label="Cor"
                {...register('cor')}
                error={errors.cor?.message}
                placeholder="Ex: Prata"
            />

            <Input
                label="Ano"
                type="number"
                {...register('ano', { valueAsNumber: true })}
                error={errors.ano?.message}
                min={1900}
                max={new Date().getFullYear()}
            />

            <Input
                label="Vagas Disponíveis"
                type="number"
                {...register('vagas_disponiveis', { valueAsNumber: true })}
                error={errors.vagas_disponiveis?.message}
                min={1}
                max={10}
            />

            <Button
                type="submit"
                loading={isLoading}
                fullWidth
            >
                {initialData ? 'Atualizar Veículo' : 'Cadastrar Veículo'}
            </Button>
        </form>
    );
}