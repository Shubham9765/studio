
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { useLocation } from '@/hooks/use-location';

interface LocationPickerMapProps {
    onLocationSelect: (location: { latitude: number; longitude: number; address: string }) => void;
}

const pinIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
});

function DraggableMarker({ onPositionChange, initialPosition }: { onPositionChange: (pos: L.LatLng) => void; initialPosition: L.LatLngTuple }) {
    const markerRef = useRef<L.Marker>(null);
    const map = useMap();
    
    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    onPositionChange(marker.getLatLng());
                }
            },
        }),
        [onPositionChange],
    );

    useEffect(() => {
        map.setView(initialPosition, 16);
    }, [initialPosition, map]);

    return (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={initialPosition}
            ref={markerRef}
            icon={pinIcon}
        >
        </Marker>
    );
}

export function LocationPickerMap({ onLocationSelect }: LocationPickerMapProps) {
    const { location: currentLocation, error: locationError } = useLocation();
    const [selectedPosition, setSelectedPosition] = useState<L.LatLng | null>(null);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [address, setAddress] = useState<string>('');

    useEffect(() => {
        if (currentLocation && !selectedPosition) {
            setSelectedPosition(new L.LatLng(currentLocation.latitude, currentLocation.longitude));
        }
    }, [currentLocation, selectedPosition]);

    const reverseGeocode = async (lat: number, lng: number) => {
        setIsGeocoding(true);
        setAddress('Fetching address...');
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`);
            const data = await response.json();
            if (data && data.display_name) {
                setAddress(data.display_name);
            } else {
                setAddress('Could not find address for this location.');
            }
        } catch (error) {
            setAddress('Failed to fetch address.');
        } finally {
            setIsGeocoding(false);
        }
    };
    
    useEffect(() => {
        if (selectedPosition) {
            reverseGeocode(selectedPosition.lat, selectedPosition.lng);
        }
    }, [selectedPosition]);
    
    const handleConfirm = () => {
        if (selectedPosition && address) {
            onLocationSelect({
                latitude: selectedPosition.lat,
                longitude: selectedPosition.lng,
                address: address,
            });
        }
    };

    if (!currentLocation && !locationError) {
        return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>
    }

    const initialMapPosition: L.LatLngTuple = currentLocation 
        ? [currentLocation.latitude, currentLocation.longitude] 
        : [51.505, -0.09]; // Fallback to London

    return (
        <div className="flex flex-col h-full">
            <div className="h-96 w-full rounded-md overflow-hidden relative">
                 <MapContainer center={initialMapPosition} zoom={13} scrollWheelZoom={true} className="h-full w-full">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <DraggableMarker 
                        onPositionChange={(pos) => setSelectedPosition(pos)} 
                        initialPosition={selectedPosition ? [selectedPosition.lat, selectedPosition.lng] : initialMapPosition}
                    />
                </MapContainer>
            </div>
             <div className="mt-4 p-4 rounded-md bg-muted text-sm">
                <p className="font-bold">Selected Location:</p>
                <p>{isGeocoding ? 'Fetching address...' : address || 'Drag the pin to set your location.'}</p>
             </div>
             <div className="mt-auto pt-4">
                 <Button className="w-full" onClick={handleConfirm} disabled={isGeocoding || !selectedPosition}>
                    Confirm Location
                 </Button>
             </div>
        </div>
    );
}
