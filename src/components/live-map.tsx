
'use client';

import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';

interface LiveMapProps {
    customerLat: number;
    customerLng: number;
    deliveryBoyLat: number;
    deliveryBoyLng: number;
    isInteractive?: boolean;
}

// Inline SVG for the delivery icon to avoid dealing with static file paths
const deliveryIconSvg = `
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill="#FF6B6B" stroke="#FFFFFF" stroke-width="4"/>
    <path d="M25,55 L35,45 L45,55 M35,45 L35,25" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M55,60 L75,60 L70,75 L60,75 L55,60" fill="#FFFFFF" />
    <circle cx="30" cy="75" r="8" fill="#FFFFFF" stroke="#FF6B6B" stroke-width="2"/>
    <circle cx="80" cy="75" r="8" fill="#FFFFFF" stroke="#FF6B6B" stroke-width="2"/>
  </svg>
`;

const deliveryIcon = new L.DivIcon({
    html: deliveryIconSvg,
    className: 'bg-transparent border-0',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
});

const homeIconSvg = `
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
     <path d="M 50,10 L 90,50 L 80,50 L 80,90 L 60,90 L 60,60 L 40,60 L 40,90 L 20,90 L 20,50 L 10,50 Z" fill="#4A90E2" stroke="#FFFFFF" stroke-width="4"/>
  </svg>
`;

const homeIcon = new L.DivIcon({
    html: homeIconSvg,
    className: 'bg-transparent border-0',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
})


function Routing({ map, from, to }: { map: L.Map | null, from: [number, number], to: [number, number] }) {
    useEffect(() => {
        if (!map) return;
        
        // @ts-ignore - L.Routing is from the leaflet-routing-machine plugin
        const routingControl = L.Routing.control({
            waypoints: [
                L.latLng(from[0], from[1]),
                L.latLng(to[0], to[1])
            ],
            routeWhileDragging: true,
            show: false, // Hide the default ugly itinerary
            addWaypoints: false, // Prevent users from adding new waypoints
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            // Custom icons
            createMarker: function() { return null; }, // Use our own markers
             lineOptions: {
                styles: [{ color: '#FF6B6B', opacity: 0.8, weight: 6 }]
            }
        }).addTo(map);

        return () => {
            if (map && routingControl) {
                map.removeControl(routingControl);
            }
        };
    }, [map, from, to]);

    return null;
}


export function LiveMap({ customerLat, customerLng, deliveryBoyLat, deliveryBoyLng, isInteractive = true }: LiveMapProps) {
    const [map, setMap] = useState<L.Map | null>(null);

    if (!deliveryBoyLat || !deliveryBoyLng || !customerLat || !customerLng) {
        return <div className="h-full w-full rounded-md bg-muted flex items-center justify-center text-muted-foreground">Map loading...</div>;
    }
    
    const bounds = L.latLngBounds([deliveryBoyLat, deliveryBoyLng], [customerLat, customerLng]);

    return (
        <MapContainer
            bounds={bounds}
            scrollWheelZoom={isInteractive}
            zoomControl={isInteractive}
            dragging={isInteractive}
            touchZoom={isInteractive}
            doubleClickZoom={isInteractive}
            className="h-full w-full z-0"
            boundsOptions={{ padding: [50, 50] }}
            whenCreated={setMap}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <Marker position={[customerLat, customerLng]} icon={homeIcon}/>
            <Marker position={[deliveryBoyLat, deliveryBoyLng]} icon={deliveryIcon} />
            
            <Routing map={map} from={[deliveryBoyLat, deliveryBoyLng]} to={[customerLat, customerLng]} />
        </MapContainer>
    );
}
