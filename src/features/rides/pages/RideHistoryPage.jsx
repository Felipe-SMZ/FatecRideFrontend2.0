import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@shared/components/layout/Navbar';
import { Card } from '@shared/components/ui/Card';
import { Button } from '@shared/components/ui/Button';
import { EmptyState } from '@shared/components/ui/EmptyState';
import { Spinner } from '@shared/components/ui/Spinner';

/**
 * RideHistoryPage - Histórico de caronas
 * Mostra todas as caronas passadas (concluídas ou canceladas)
 */

export function RideHistoryPage() {
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Buscar caronas concluídas (motorista)
      const response = await fetch('http://localhost:8080/rides/concluidas?pagina=0&itens=50', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Backend retorna Page, pegar o conteúdo
        setRides(data.content || data);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setLoading(false);
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

  const getStatusBadge = (status) => {
    const badges = {
      'CONCLUIDA': { text: 'Concluída', color: 'bg-green-100 text-green-800' },
      'CANCELADA': { text: 'Cancelada', color: 'bg-red-100 text-red-800' },
      'ATIVA': { text: 'Ativa', color: 'bg-blue-100 text-blue-800' },
      'PENDENTE': { text: 'Pendente', color: 'bg-yellow-100 text-yellow-800' }
    };
    
    const badge = badges[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <>
      <Navbar showAuthButton={true} />
      
      <div className="min-h-[calc(100vh-80px)] bg-gray-100 py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-fatecride-blue mb-2">
                Histórico de Caronas
              </h1>
              <p className="text-gray-600">
                Suas caronas anteriores
              </p>
            </div>
            <Button
              onClick={() => navigate('/inicio')}
              className="bg-gray-500 hover:bg-gray-600"
            >
              Voltar
            </Button>
          </div>

          {loading && (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          )}

          {!loading && rides.length === 0 && (
            <EmptyState
              icon="📜"
              title="Nenhum histórico"
              description="Você ainda não possui histórico de caronas"
            />
          )}

          {!loading && rides.length > 0 && (
            <div className="space-y-4">
              {rides.map((ride) => (
                <Card key={ride.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {ride.origin?.cidade} → {ride.destination?.cidade}
                        </h3>
                        {getStatusBadge(ride.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {formatDate(ride.data_hora)}
                      </p>
                      {ride.vehicle && (
                        <p className="text-sm text-gray-500">
                          {ride.vehicle.marca} {ride.vehicle.modelo} - {ride.vehicle.placa}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        Vagas disponíveis: {ride.vagas_disponiveis || 0}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
