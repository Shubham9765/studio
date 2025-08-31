
'use client';

import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useRef } from 'react';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';

interface LiveMapProps {
    customerLat: number;
    customerLng: number;
    deliveryBoyLat: number;
    deliveryBoyLng: number;
    isInteractive?: boolean;
}

// Inline SVG for the delivery icon
const deliveryIconSvg = `
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
    <g transform="translate(5, 5) scale(0.9)">
      <circle cx="50" cy="50" r="48" fill="#FF6B6B" stroke="#FFFFFF" stroke-width="4"/>
      <path d="M66.3 36.6c-1.3-1.6-3.1-2.6-5-3.1-1.2-.3-2.4-.4-3.6-.2-2.1.3-4.1 1.2-5.7 2.6l-2.4 2.1-5.5-6.6c-.6-.7-1.4-1.2-2.3-1.5-1.1-.3-2.2-.3-3.3.1-.9.3-1.8.8-2.5 1.5l-9.3 9.3c-.6.6-.9 1.3-.9 2.1s.3 1.5.9 2.1l2.8 2.8c.6.6 1.3.9 2.1.9s1.5-.3 2.1-.9l5-5 4.5 5.4c1.1 1.3 2.7 2.1 4.4 2.1.5 0 1-.1 1.5-.2 2.1-.5 3.9-1.9 4.8-3.8l5.3-10.7 2.4-2.4c.5-.4 1-.6 1.5-.6.6 0 1.2.2 1.6.7z" fill="#fff"/>
      <path d="M47.5 70.2c-2.8 0-5.1 2.3-5.1 5.1s2.3 5.1 5.1 5.1 5.1-2.3 5.1-5.1-2.3-5.1-5.1-5.1zm-24.8 0c-2.8 0-5.1 2.3-5.1 5.1s2.3 5.1 5.1 5.1 5.1-2.3 5.1-5.1-2.3-5.1-5.1-5.1z" fill="#fff"/>
    </g>
  </svg>
`;

const deliveryIcon = new L.DivIcon({
    html: deliveryIconSvg,
    className: 'bg-transparent border-0',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
});

// Inline SVG for the home icon
const homeIconSvg = `
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
    <g transform="translate(5, 5) scale(0.9)">
        <path d="M 50,15 L 10,50 L 22,50 L 22,85 L 42,85 L 42,60 L 58,60 L 58,85 L 78,85 L 78,50 L 90,50 Z" fill="#4A90E2" stroke="#FFFFFF" stroke-width="4" />
    </g>
  </svg>
`;

const homeIcon = new L.DivIcon({
    html: homeIconSvg,
    className: 'bg-transparent border-0',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
})


function Routing({ from, to }: { from: [number, number], to: [number, number] }) {
    const map = useMap();
    const routingControlRef = useRef<L.Routing.Control | null>(null);

    useEffect(() => {
        if (!map) return;

        if (routingControlRef.current) {
            map.removeControl(routingControlRef.current);
        }

        // @ts-ignore - L.Routing is from the leaflet-routing-machine plugin
        routingControlRef.current = L.Routing.control({
            waypoints: [
                L.latLng(from[0], from[1]),
                L.latLng(to[0], to[1])
            ],
            routeWhileDragging: false,
            show: false,
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            createMarker: () => null,
            lineOptions: {
                styles: [{ color: '#FF6B6B', opacity: 0.8, weight: 6 }]
            }
        }).addTo(map);
        
        return () => {
             if (routingControlRef.current && routingControlRef.current.getPlan().getWaypoints().length) {
                map.removeControl(routingControlRef.current);
            }
        }
    }, [map, from, to]);

    return null;
}


export function LiveMap({ customerLat, customerLng, deliveryBoyLat, deliveryBoyLng, isInteractive = true }: LiveMapProps) {
    if (!deliveryBoyLat || !deliveryBoyLng || !customerLat || !customerLng) {
        return <div className="h-full w-full rounded-md bg-muted flex items-center justify-center text-muted-foreground">Map loading...</div>;
    }
    
    const bounds = L.latLngBounds([deliveryBoyLat, deliveryBoyLng], [customerLat, customerLng]);

    return (
        <MapContainer
            key={`${deliveryBoyLat}-${deliveryBoyLng}-${customerLat}-${customerLng}`} // Re-render map when location changes to update route
            bounds={bounds}
            scrollWheelZoom={isInteractive}
            zoomControl={isInteractive}
            dragging={isInteractive}
            touchZoom={isInteractive}
            doubleClickZoom={isInteractive}
            className="h-full w-full z-0"
            boundsOptions={{ padding: [50, 50] }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <Marker position={[customerLat, customerLng]} icon={homeIcon}/>
            <Marker position={[deliveryBoyLat, deliveryBoyLng]} icon={deliveryIcon} />
            
            <Routing from={[deliveryBoyLat, deliveryBoyLng]} to={[customerLat, customerLng]} />
        </MapContainer>
    );
}
