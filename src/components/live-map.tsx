
'use client';

import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';

interface LiveMapProps {
    customerLat: number;
    customerLng: number;
    deliveryBoyLat: number;
    deliveryBoyLng: number;
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


export function LiveMap({ customerLat, customerLng, deliveryBoyLat, deliveryBoyLng }: LiveMapProps) {
    if (!deliveryBoyLat || !deliveryBoyLng || !customerLat || !customerLng) {
        return <div className="h-64 w-full rounded-md bg-muted flex items-center justify-center text-muted-foreground">Map loading...</div>;
    }
    
    // Create a straight line as a placeholder for the route
    const route: [number, number][] = [[deliveryBoyLat, deliveryBoyLng], [customerLat, customerLng]];
    const bounds = L.latLngBounds(route);

    return (
        <MapContainer
            bounds={bounds}
            scrollWheelZoom={true}
            className="h-64 w-full rounded-md z-0"
            // Pad the bounds slightly to ensure markers aren't on the edge
            boundsOptions={{ padding: [50, 50] }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Customer's Location Marker */}
            <Marker position={[customerLat, customerLng]} icon={homeIcon}/>

            {/* Delivery Person's Moving Marker */}
            <Marker position={[deliveryBoyLat, deliveryBoyLng]} icon={deliveryIcon} />

            {/* The Route Line */}
            <Polyline positions={route} color="#FF6B6B" weight={3} dashArray="5, 10" />
        </MapContainer>
    );
}
