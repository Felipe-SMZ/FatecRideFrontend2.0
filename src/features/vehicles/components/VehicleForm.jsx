// features/vehicles/components/VehicleForm.jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@shared/components/ui/Button';
import { Input } from '@shared/components/ui/Input';

/**
 * VehicleForm - Formulário reutilizável para criar/editar veículos
 * 
 * Usado tanto em modal quanto em página dedicada.
 * defaultValues preenche campos para edição.
 */

// Schema com validações específicas para veículos
const vehicleSchema = z.object({
  modelo: z.string().min(2, "Modelo deve ter pelo menos 2 caracteres"),
  placa: z.string()
    .regex(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/, "Placa inválida (formato: ABC1D23 ou ABC1234)")
    .transform(val => val.toUpperCase()),
  cor: z.string().min(3, "Cor inválida"),
  ano: z.coerce.number()
    .int("Ano deve ser inteiro")
    .min(1990, "Ano deve ser 1990 ou posterior")
    .max(new Date().getFullYear() + 1, "Ano inválido"),
  capacidade: z.coerce.number()
    .int("Capacidade deve ser inteira")
    .min(1, "Mínimo 1 passageiro")
    .max(8, "Máximo 8 passageiros"),
});

export function VehicleForm({ onSubmit, initialData, isLoading, onCancel }) {
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(vehicleSchema),
        defaultValues: initialData || {
            modelo: '',
            placa: '',
            cor: '',
            ano: new Date().getFullYear(),
            capacidade: 4
        }
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
                label="Modelo"
                {...register('modelo')}
                error={errors.modelo?.message}
                placeholder="Ex: Fiat Uno, Honda Civic"
            />

            <Input
                label="Placa"
                {...register('placa')}
                error={errors.placa?.message}
                placeholder="ABC1D23"
                maxLength={7}
            />

            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Cor"
                    {...register('cor')}
                    error={errors.cor?.message}
                    placeholder="Ex: Preto, Branco"
                />

                <Input
                    label="Ano"
                    type="number"
                    {...register('ano')}
                    error={errors.ano?.message}
                    placeholder="2020"
                />
            </div>

            <Input
                label="Capacidade de passageiros"
                type="number"
                {...register('capacidade')}
                error={errors.capacidade?.message}
                placeholder="4"
                min={1}
                max={8}
            />

            <div className="flex gap-3 justify-end">
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Cancelar
                    </Button>
                )}
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Salvando...' : (initialData ? 'Atualizar veículo' : 'Salvar veículo')}
                </Button>
            </div>
        </form>
    );
}