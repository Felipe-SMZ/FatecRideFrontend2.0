import { Card } from '@shared/components/ui/Card';
import { Button } from '@shared/components/ui/Button';
import { FiUser, FiMapPin, FiTruck, FiUsers } from 'react-icons/fi';

/**
 * RideCard - Card para exibir informações de carona disponível
 * 
 * Componente reutilizável que mostra:
 * - Informações do motorista
 * - Detalhes do veículo
 * - Origem e destino
 * - Vagas disponíveis
 * - Ação de solicitar carona
 * 
 * @param {Object} ride - Dados da carona
 * @param {String} ride.nome - Nome do motorista
 * @param {String} ride.sobrenome - Sobrenome do motorista
 * @param {String} ride.foto - URL da foto do motorista
 * @param {String} ride.logradouroOrigem - Rua de origem
 * @param {String} ride.cidadeOrigem - Cidade de origem
 * @param {String} ride.logradouroDestino - Rua de destino
 * @param {String} ride.cidadeDestino - Cidade de destino
 * @param {String} ride.marcaCarro - Marca do veículo
 * @param {String} ride.modeloCarro - Modelo do veículo
 * @param {Number} ride.anoCarro - Ano do veículo
 * @param {Number} ride.vagasDisponiveis - Vagas disponíveis
 * @param {Function} onRequest - Callback ao solicitar carona
 * @param {Boolean} loading - Estado de carregamento
 * @param {String} className - Classes CSS adicionais
 */

export function RideCard({
  ride,
  onRequest,
  loading = false,
  className = ''
}) {
  if (!ride) return null;

  return (
    <Card className={`hover:shadow-lg transition-shadow ${className}`}>
      <div className="p-5">
        {/* Header: Motorista */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
            {ride.foto ? (
              <img
                src={ride.foto}
                alt={`${ride.nome} ${ride.sobrenome}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <FiUser className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">
              {ride.nome} {ride.sobrenome}
            </h3>
            <p className="text-sm text-gray-500">Motorista</p>
          </div>
        </div>

        {/* Detalhes da Carona */}
        <div className="space-y-3 mb-4">
          {/* Origem */}
          <div className="flex items-start gap-3">
            <FiMapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-700">Origem</p>
              <p className="text-gray-900">
                {ride.logradouroOrigem}, {ride.cidadeOrigem}
              </p>
            </div>
          </div>

          {/* Destino */}
          <div className="flex items-start gap-3">
            <FiMapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-700">Destino</p>
              <p className="text-gray-900">
                {ride.logradouroDestino}, {ride.cidadeDestino}
              </p>
            </div>
          </div>

          {/* Veículo */}
          <div className="flex items-start gap-3">
            <FiTruck className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-700">Veículo</p>
              <p className="text-gray-900">
                {ride.marcaCarro} {ride.modeloCarro} ({ride.anoCarro})
              </p>
            </div>
          </div>

          {/* Vagas */}
          <div className="flex items-start gap-3">
            <FiUsers className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-700">Vagas disponíveis</p>
              <p className="text-gray-900 font-bold">
                {ride.vagasDisponiveis} {ride.vagasDisponiveis === 1 ? 'vaga' : 'vagas'}
              </p>
            </div>
          </div>
        </div>

        {/* Ação */}
        <Button
          onClick={() => onRequest(ride)}
          fullWidth
          disabled={loading || ride.vagasDisponiveis === 0}
          loading={loading}
          className="mt-2"
        >
          {ride.vagasDisponiveis === 0 ? 'Sem vagas' : 'Solicitar Carona'}
        </Button>
      </div>
    </Card>
  );
}

export default RideCard;
