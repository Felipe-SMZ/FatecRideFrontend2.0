import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@shared/components/layout/Navbar';
import { Card } from '@shared/components/ui/Card';
import { Button } from '@shared/components/ui/Button';
import { EmptyState } from '@shared/components/ui/EmptyState';
import { Spinner } from '@shared/components/ui/Spinner';
import { useAuthStore } from '@features/auth/stores/authStore';

/**
 * ActiveRidesPage - Página de gerenciamento de caronas ativas
 * 
 * Para MOTORISTAS:
 * - Lista caronas criadas
 * - Mostra solicitações pendentes
 * - Aceitar/recusar solicitações
 * - Cancelar carona
 * 
 * Para PASSAGEIROS:
 * - Lista caronas solicitadas
 * - Status da solicitação
 * - Cancelar solicitação
 */

export function ActiveRidesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Buscar caronas ativas ao carregar
  useEffect(() => {
    fetchActiveRides();
  }, []);

  const fetchActiveRides = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Endpoint depende se é motorista ou passageiro
      const endpoint = '/rides/active'; // Ajustar conforme backend
      
      const response = await fetch(`http://localhost:8080${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRides(data);
      }
    } catch (error) {
      console.error('Erro ao buscar caronas ativas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (rideId, requestId) => {
    try {
      setProcessingId(requestId);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8080/rides/${rideId}/requests/${requestId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchActiveRides(); // Recarregar lista
      }
    } catch (error) {
      console.error('Erro ao aceitar solicitação:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (rideId, requestId) => {
    try {
      setProcessingId(requestId);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8080/rides/${rideId}/requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchActiveRides(); // Recarregar lista
      }
    } catch (error) {
      console.error('Erro ao recusar solicitação:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelRide = async (rideId) => {
    if (!confirm('Tem certeza que deseja cancelar esta carona?')) return;

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8080/rides/${rideId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchActiveRides(); // Recarregar lista
      }
    } catch (error) {
      console.error('Erro ao cancelar carona:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Navbar showAuthButton={true} />
      
      <div className="min-h-[calc(100vh-80px)] bg-gray-100 py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-fatecride-blue mb-2">
                Caronas Ativas
              </h1>
              <p className="text-gray-600">
                Gerencie suas caronas em andamento
              </p>
            </div>
            <Button
              onClick={() => navigate('/inicio')}
              className="bg-gray-500 hover:bg-gray-600"
            >
              Voltar
            </Button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          )}

          {/* Lista de caronas */}
          {!loading && rides.length === 0 && (
            <EmptyState
              icon="🚗"
              title="Nenhuma carona ativa"
              description="Você não possui caronas ativas no momento"
              action={{
                label: "Criar Carona",
                onClick: () => navigate('/motorista')
              }}
            />
          )}

          {!loading && rides.length > 0 && (
            <div className="space-y-6">
              {rides.map((ride) => (
                <Card key={ride.id} className="p-6 hover:shadow-lg transition-shadow">
                  {/* Informações da carona */}
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    {/* Origem e Destino */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        {/* Ícone de rota */}
                        <div className="flex flex-col items-center mt-1">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <div className="w-0.5 h-12 bg-gray-300"></div>
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        </div>

                        {/* Endereços */}
                        <div className="flex-1">
                          <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-1">Origem</p>
                            <p className="font-semibold text-gray-900">
                              {ride.origin?.logradouro || 'Origem não especificada'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {ride.origin?.bairro && `${ride.origin.bairro}, `}
                              {ride.origin?.cidade}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500 mb-1">Destino</p>
                            <p className="font-semibold text-gray-900">
                              {ride.destination?.logradouro || 'Destino não especificado'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {ride.destination?.bairro && `${ride.destination.bairro}, `}
                              {ride.destination?.cidade}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Informações adicionais */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-semibold">Data:</span>{' '}
                          {ride.departureTime ? formatDate(ride.departureTime) : 'Não definida'}
                        </div>
                        <div>
                          <span className="font-semibold">Vagas:</span>{' '}
                          {ride.availableSeats || 0}
                        </div>
                        {ride.vehicle && (
                          <div>
                            <span className="font-semibold">Veículo:</span>{' '}
                            {ride.vehicle.marca} {ride.vehicle.modelo}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleCancelRide(ride.id)}
                        variant="danger"
                        size="sm"
                      >
                        Cancelar Carona
                      </Button>
                    </div>
                  </div>

                  {/* Solicitações pendentes */}
                  {ride.requests && ride.requests.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="font-semibold text-gray-900 mb-4">
                        Solicitações Pendentes ({ride.requests.length})
                      </h3>
                      
                      <div className="space-y-3">
                        {ride.requests.map((request) => (
                          <div 
                            key={request.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                          >
                            {/* Info do passageiro */}
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-fatecride-blue text-white rounded-full flex items-center justify-center font-bold">
                                {request.passenger?.name?.[0]?.toUpperCase() || 'U'}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {request.passenger?.name || 'Usuário'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {request.passenger?.email || 'Email não disponível'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Solicitado em: {formatDate(request.createdAt)}
                                </p>
                              </div>
                            </div>

                            {/* Botões de ação */}
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleAcceptRequest(ride.id, request.id)}
                                disabled={processingId === request.id}
                                className="bg-green-600 hover:bg-green-700"
                                size="sm"
                              >
                                {processingId === request.id ? 'Processando...' : 'Aceitar'}
                              </Button>
                              <Button
                                onClick={() => handleRejectRequest(ride.id, request.id)}
                                disabled={processingId === request.id}
                                variant="danger"
                                size="sm"
                              >
                                Recusar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
