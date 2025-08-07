
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LocationData {
    latitude: number;
    longitude: number;
    city: string;
}

interface LocationContextType {
    location: LocationData | null;
    error: string | null;
    requestLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
    const [location, setLocation] = useState<LocationData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchCityName = async (latitude: number, longitude: number) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`);
            const data = await response.json();
            const city = data.address.city || data.address.town || data.address.village;
            setLocation({ latitude, longitude, city });
            setError(null);
        } catch (e) {
            setError('Could not fetch location name.');
        }
    };

    const requestLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchCityName(latitude, longitude);
            },
            () => {
                setError('Unable to retrieve your location. Please enable location services.');
            }
        );
    };

    useEffect(() => {
        // Automatically request location on initial load
        requestLocation();
    }, []);

    return (
        <LocationContext.Provider value={{ location, error, requestLocation }}>
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
}
