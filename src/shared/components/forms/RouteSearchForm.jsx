import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@shared/components/ui/Input';
import { Button } from '@shared/components/ui/Button';
import { FiMapPin, FiSearch } from 'react-icons/fi';

/**
 * RouteSearchForm - Formulário de busca de rota
 * 
 * Componente reutilizável para buscar rotas com validação.
 * Usado tanto em MotoristaPage quanto PassageiroPage.
 * 
 * @param {Function} onSearch - Callback com {origin, destination}
 * @param {Boolean} loading - Estado de carregamento
 * @param {String} submitLabel - Texto do botão (default: "Buscar Rota")
 * @param {String} className - Classes CSS adicionais
 */

const routeSchema = z.object({
  origin: z.string().min(3, 'Ponto de partida deve ter pelo menos 3 caracteres'),
  destination: z.string().min(3, 'Destino deve ter pelo menos 3 caracteres')
});

export function RouteSearchForm({
  onSearch,
  loading = false,
  submitLabel = 'Buscar Rota',
  className = ''
}) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      origin: '',
      destination: ''
    }
  });

  const onSubmit = (data) => {
    onSearch(data);
  };

  return (
    <form 
      onSubmit={handleSubmit(onSubmit)} 
      className={`space-y-4 ${className}`}
    >
      <Input
        label="Ponto de Partida"
        placeholder="Ex: Fatec Cotia"
        leftIcon={FiMapPin}
        error={errors.origin?.message}
        disabled={loading}
        {...register('origin')}
      />

      <Input
        label="Destino"
        placeholder="Ex: Avenida Paulista"
        leftIcon={FiMapPin}
        error={errors.destination?.message}
        disabled={loading}
        {...register('destination')}
      />

      <Button
        type="submit"
        fullWidth
        loading={loading}
        className="gap-2"
      >
        <FiSearch className="w-5 h-5" />
        {submitLabel}
      </Button>
    </form>
  );
}

export default RouteSearchForm;
