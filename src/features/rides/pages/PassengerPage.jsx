// features/rides/pages/PassengerPage.jsx
import { useState } from 'react';
import { HeaderMenu } from '@shared/components/layout/HeaderMenu';
import { RideMap } from '@features/map/components/RideMap';
import { SearchRidesForm } from '../components/SearchRidesForm';
import { RidesList } from '../components/RidesList';
import { useSearchRides } from '../hooks/useSearchRides';
import { useRequestRide } from '../hooks/useRequestRide';

export function PassengerPage() {
    const [originData, setOriginData] = useState(null);
    const [destinationData, setDestinationData] = useState(null);

    const { mutate: searchRides, data: rides = [], isLoading } = useSearchRides();
    const { mutate: requestRide } = useRequestRide();

    const handleSearch = async (origin, destination, originCoords, destCoords) => {
        setOriginData({ coords: originCoords, address: origin });
        setDestinationData({ coords: destCoords, address: destination });

        searchRides({
            latitudeOrigem: originCoords.lat,
            longitudeOrigem: originCoords.lon,
            latitudeDestino: destCoords.lat,
            longitudeDestino: destCoords.lon
        });
    };

    const handleRequestRide = (ride) => {
        requestRide({
            id_carona: ride.idCarona,
            originDTO: originData.address,
            destinationDTO: destinationData.address
        });
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <HeaderMenu />

            <main className="flex-1 p-5">
                <div className="flex gap-6 h-[calc(100vh-140px)]">
                    <div className="flex-[2] rounded-xl overflow-hidden shadow-lg">
                        <RideMap
                            origin={originData?.coords}
                            destination={destinationData?.coords}
                        />
                    </div>

                    <div className="flex-1 flex flex-col gap-4">
                        <SearchRidesForm
                            onSearch={handleSearch}
                            isLoading={isLoading}
                        />

                        <RidesList
                            rides={rides}
                            onRequestRide={handleRequestRide}
                            isLoading={isLoading}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}