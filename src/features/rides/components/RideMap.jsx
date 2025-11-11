// features/map/components/RideMap.jsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { RoutingMachine } from './RoutingMachine';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [-23.6009, -46.8805]; // Fatec Cotia

export function RideMap({ origin, destination }) {
    return (
        <MapContainer
            center={DEFAULT_CENTER}
            zoom={13}
            className="w-full h-full"
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
            />

            {origin && (
                <Marker position={[origin.lat, origin.lon]}>
                    <Popup>Ponto de Partida</Popup>
                </Marker>
            )}

            {destination && (
                <Marker position={[destination.lat, destination.lon]}>
                    <Popup>Ponto Final</Popup>
                </Marker>
            )}

            {origin && destination && (
                <RoutingMachine origin={origin} destination={destination} />
            )}
        </MapContainer>
    );
}