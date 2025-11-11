// features/rides/pages/DriverPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeaderMenu } from '@shared/components/layout/HeaderMenu';
import { RideMap } from '@features/map/components/RideMap';
import { RideForm } from '../components/RideForm';
import { AddressCards } from '../components/AddressCards';
import { useCreateRide } from '../hooks/useRides';
import { useGeolocation } from '@features/map/hooks/useGeolocation';

export function DriverPage() {
    const navigate = useNavigate();
    const { mutate: createRide, isLoading } = useCreateRide();
    const { searchLocation } = useGeolocation();

    const [originData, setOriginData] = useState(null);
    const [destinationData, setDestinationData] = useState(null);

    const handleGenerateRoute = async (origin, destination) => {
        const [originResult, destinationResult] = await Promise.all([
            searchLocation(origin),
            searchLocation(destination)
        ]);

        setOriginData(originResult);
        setDestinationData(destinationResult);
    };

    const handleCreateRide = (formData) => {
        if (!originData || !destinationData) {
            toast.error('Gere a rota antes de criar a carona');
            return;
        }

        createRide({
            originDTO: originData.address,
            destinationDTO: destinationData.address,
            vagas_disponiveis: formData.vagas,
            id_veiculo: formData.idVeiculo
        }, {
            onSuccess: () => navigate('/confirmarcarona')
        });
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <HeaderMenu />

            <main className="flex-1 p-5 max-w-7xl mx-auto w-full">
                <div className="flex gap-5 h-[calc(100vh-140px)]">
                    {/* Mapa - 65% */}
                    <div className="flex-[0.65] rounded-xl overflow-hidden shadow-lg">
                        <RideMap
                            origin={originData?.coords}
                            destination={destinationData?.coords}
                        />
                    </div>

                    {/* Formulário - 35% */}
                    <div className="flex-[0.35] flex flex-col gap-5">
                        <RideForm
                            onGenerateRoute={handleGenerateRoute}
                            onSubmit={handleCreateRide}
                            isLoading={isLoading}
                        />

                        {(originData || destinationData) && (
                            <AddressCards
                                origin={originData}
                                destination={destinationData}
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}