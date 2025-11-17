import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

/**
 * MapView - Componente de mapa interativo com Leaflet
 * 
 * Features:
 * - Exibe mapa com marcadores personalizados
 * - Suporta roteamento entre dois pontos
 * - Centraliza automaticamente na rota
 * - Responsivo e acessível
 * 
 * @param {Object} origin - {lat, lng, label} - Coordenadas e label do ponto de origem
 * @param {Object} destination - {lat, lng, label} - Coordenadas e label do destino
 * @param {Array} center - [lat, lng] - Centro inicial do mapa
 * @param {Number} zoom - Zoom inicial (default: 13)
 * @param {String} className - Classes CSS adicionais
 * @param {Boolean} showRoute - Se deve exibir rota entre origin e destination
 */

// Corrige ícones padrão do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/**
 * RoutingMachine - Componente interno para desenhar rota
 */
function RoutingMachine({ origin, destination }) {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!origin || !destination || !map) return;
    try {
      // Remove rota anterior se existir (try/catch para evitar erros se controle estiver em estado inconsistente)
      if (routingControlRef.current && map) {
        try {
          map.removeControl(routingControlRef.current);
        } catch (e) {
          console.warn('Aviso: falha ao remover controle de rota (ignorando):', e);
        }
      }

      // Cria nova rota
      routingControlRef.current = L.Routing.control({
      waypoints: [
        L.latLng(origin.lat, origin.lng),
        L.latLng(destination.lat, destination.lng)
      ],
      routeWhileDragging: false,
      show: false, // Oculta painel de instruções
      addWaypoints: false, // Não permite adicionar pontos na rota
      lineOptions: {
        styles: [{ color: '#0057b7', weight: 5, opacity: 0.7 }]
      },
      createMarker: () => null // Remove marcadores padrão (usamos os nossos)
      }).addTo(map);

      // Workaround: a biblioteca às vezes tenta manipular layers nulos ao receber respostas assíncronas.
      // Substituímos _clearLines por uma versão segura para evitar TypeError 'removeLayer' em null.
      try {
        if (routingControlRef.current && typeof routingControlRef.current._clearLines === 'function') {
          routingControlRef.current._clearLines = function safeClearLines() {
            try {
              if (this._line && this._line._map) {
                try {
                  // removeLayer pode lançar se já removido; protegemos com try/catch
                  this._map.removeLayer(this._line);
                } catch (e) {
                  // Ignorar erros de remoção
                }
              }
            } catch (e) {
              console.warn('Ignored routing clear error', e);
            }
            this._line = null;
          };
        }
      } catch (e) {
        console.warn('Não foi possível aplicar workaround no RoutingMachine:', e);
      }
    } catch (e) {
      console.warn('Erro ao iniciar RoutingMachine (ignorado):', e);
    }

    // Cleanup ao desmontar
    return () => {
      if (routingControlRef.current && map) {
        try {
          map.removeControl(routingControlRef.current);
        } catch (e) {
          console.warn('Aviso: falha ao remover controle de rota no cleanup (ignorando):', e);
        }
      }
      routingControlRef.current = null;
    };
  }, [origin, destination, map]);

  return null;
}

export function MapView({
  origin,
  destination,
  center = [-23.6009, -46.8805], // Fatec Cotia como padrão
  zoom = 13,
  className = '',
  showRoute = false
}) {
  const defaultCenter = center;

  return (
    <div className={`relative w-full h-full ${className}`}>
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        className="w-full h-full rounded-lg"
        style={{ minHeight: '400px' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Marcador de Origem */}
        {origin && (
          <Marker position={[origin.lat, origin.lng]}>
            <Popup>
              <div className="font-semibold">
                📍 {origin.label || 'Ponto de Partida'}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcador de Destino */}
        {destination && (
          <Marker position={[destination.lat, destination.lng]}>
            <Popup>
              <div className="font-semibold">
                🎯 {destination.label || 'Destino'}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Rota entre origem e destino */}
        {showRoute && origin && destination && (
          <RoutingMachine origin={origin} destination={destination} />
        )}
      </MapContainer>
    </div>
  );
}

export default MapView;
