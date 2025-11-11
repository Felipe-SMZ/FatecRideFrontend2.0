import { Card } from '@shared/components/ui/Card';
import { FiMapPin, FiHome } from 'react-icons/fi';

/**
 * AddressCard - Card para exibir endereço formatado
 * 
 * Componente reutilizável para mostrar informações de endereço
 * de forma consistente em toda aplicação.
 * 
 * @param {String} title - Título do card (ex: "Endereço de Partida")
 * @param {Object} address - Objeto com dados do endereço
 * @param {String} address.logradouro - Nome da rua
 * @param {String} address.numero - Número do imóvel
 * @param {String} address.bairro - Bairro
 * @param {String} address.cidade - Cidade
 * @param {String} address.cep - CEP formatado
 * @param {String} className - Classes CSS adicionais
 * @param {String} variant - Variante visual: 'origin' ou 'destination'
 */

export function AddressCard({
  title,
  address,
  className = '',
  variant = 'origin'
}) {
  if (!address) return null;

  const variantStyles = {
    origin: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-900'
    },
    destination: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      title: 'text-green-900'
    }
  };

  const styles = variantStyles[variant] || variantStyles.origin;

  return (
    <Card 
      className={`${styles.bg} ${styles.border} border-2 ${className}`}
    >
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className={`${styles.icon}`}>
            {variant === 'origin' ? (
              <FiMapPin className="w-6 h-6" />
            ) : (
              <FiHome className="w-6 h-6" />
            )}
          </div>
          <h3 className={`text-lg font-bold ${styles.title}`}>
            {title}
          </h3>
        </div>

        <div className="space-y-2 text-gray-700">
          {/* Logradouro e Número */}
          {(address.logradouro || address.numero) && (
            <div className="flex items-start gap-2">
              <span className="font-semibold min-w-[80px]">Rua:</span>
              <span>
                {address.logradouro || '-'}
                {address.numero && `, ${address.numero}`}
              </span>
            </div>
          )}

          {/* Bairro */}
          {address.bairro && (
            <div className="flex items-start gap-2">
              <span className="font-semibold min-w-[80px]">Bairro:</span>
              <span>{address.bairro}</span>
            </div>
          )}

          {/* Cidade */}
          {address.cidade && (
            <div className="flex items-start gap-2">
              <span className="font-semibold min-w-[80px]">Cidade:</span>
              <span>{address.cidade}</span>
            </div>
          )}

          {/* CEP */}
          {address.cep && (
            <div className="flex items-start gap-2">
              <span className="font-semibold min-w-[80px]">CEP:</span>
              <span>{address.cep}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default AddressCard;
