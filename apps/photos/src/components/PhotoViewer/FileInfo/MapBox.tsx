// import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';

const MapBox: React.FC = () => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        return () => {
            if (isClient) {
                const mapContainer = document.getElementById('map-container');
                if (mapContainer) {
                    mapContainer.remove();
                }
            }
        };
    }, []);

    const position: [number, number] = [51.505, -0.09]; // Example coordinates

    useEffect(() => {
        if (isClient) {
            const mapContainer = document.getElementById('map-container');
            if (mapContainer && !mapContainer.hasChildNodes()) {
                const map = L.map(mapContainer).setView(position, 13);
                L.tileLayer(
                    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    {
                        attribution:
                            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    }
                ).addTo(map);

                L.marker(position)
                    .addTo(map)
                    .bindPopup(
                        'A pretty CSS3 popup. <br /> Easily customizable.'
                    )
                    .openPopup();
            }
        }
    }, [isClient, position]);

    if (!isClient) {
        return null; // Render nothing on the server-side
    }

    return (
        <div id="map-container" style={{ height: '100%', width: '100%' }}></div>
    );
};
export default MapBox;
