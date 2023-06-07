import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const MapBox: React.FC = () => {
    const [isClient, setIsClient] = useState(false);
    const position: [number, number] = [51.505, -0.09]; // Example coordinates

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isClient) {
            const mapContainer = document.getElementById('map-container');
            if (mapContainer && !mapContainer.hasChildNodes()) {
                const map = L.map(mapContainer).setView([51.505, -0.09], 1);

                L.tileLayer(
                    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    {
                        attribution:
                            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    }
                ).addTo(map);

                L.marker(position)
                    .addTo(map)
                    .bindPopup('You were here.')
                    .openPopup();
            }
        }
    }, [isClient, position]);

    if (!isClient) {
        return null; // Render nothing on the server-side
    }

    return (
        <div
            id="map-container"
            style={{ height: '200px', width: '100%' }}></div>
    );
};

export default dynamic(() => Promise.resolve(MapBox), { ssr: false });
