
'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, MapPin,IndianRupee } from 'lucide-react';
import type { Restaurant } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useLocation } from '@/hooks/use-location';
import { getDistanceFromLatLonInKm } from '@/services/restaurantClientService';
import { useState, useEffect } from 'react';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const { location } = useLocation();
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    if (location && restaurant.latitude && restaurant.longitude) {
      const dist = getDistanceFromLatLonInKm(
        location.latitude,
        location.longitude,
        restaurant.latitude,
        restaurant.longitude
      );
      setDistance(dist);
    }
  }, [location, restaurant.latitude, restaurant.longitude]);
  
  const cardContent = (
     <Card className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out group border shadow-sm w-full h-full flex flex-col rounded-xl",
        restaurant.isOpen ? "hover:shadow-xl hover:-translate-y-1.5" : "cursor-not-allowed"
    )}>
      <div className="relative overflow-hidden">
        <Image
          src={restaurant.image || 'https://placehold.co/600x400.png'}
          alt={restaurant.name}
          width={600}
          height={400}
          className={cn("object-cover w-full h-48 transition-transform duration-500 ease-in-out group-hover:scale-110", !restaurant.isOpen && "grayscale")}
          data-ai-hint={restaurant.dataAiHint}
        />
         <div className={cn(
             "absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent",
             restaurant.isOpen && "group-hover:from-black/80 transition-all duration-300"
         )} />
         {restaurant.isPromoted && (
             <Badge variant="default" className="absolute top-2 left-2 bg-amber-400 text-black hover:bg-amber-400 shadow-lg">
                <Star className="h-3 w-3 mr-1 fill-black"/> Featured
            </Badge>
         )}
         {!restaurant.isOpen && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white font-bold text-2xl tracking-wider">CLOSED</span>
            </div>
         )}
      </div>
      <CardContent className="p-4 flex-grow flex flex-col">
        <div className="flex justify-between items-start gap-2">
            <h3 className="font-bold text-lg leading-tight flex-grow pr-2 transition-colors duration-300 group-hover:text-primary">{restaurant.name}</h3>
            <div className="flex-shrink-0 flex items-center gap-1 bg-green-600 text-white rounded-md px-2 py-0.5 text-sm font-bold shadow">
                 <span>{restaurant.rating.toFixed(1)}</span>
                 <Star className="w-3 h-3 fill-white" />
            </div>
        </div>
        <p className="text-sm text-muted-foreground truncate">{restaurant.cuisine}</p>
        
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-auto pt-3">
            <div className="flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-full">
                <Clock className="w-3 h-3 text-primary" />
                <span>{restaurant.deliveryTime}</span>
            </div>
             {distance !== null && (
                <div className="flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-full">
                    <MapPin className="w-3 h-3 text-primary" />
                    <span>{distance.toFixed(1)} km</span>
                </div>
             )}
        </div>
        
        <div className="text-sm font-semibold text-foreground mt-2 flex items-center gap-1">
            <IndianRupee className="w-4 h-4 text-muted-foreground" />
            <span>{restaurant.deliveryCharge > 0 ? `${restaurant.deliveryCharge.toFixed(2)} delivery` : 'Free Delivery'}</span>
        </div>
      </CardContent>
    </Card>
  );

   if (!restaurant.isOpen) {
    return <div className="cursor-not-allowed">{cardContent}</div>;
  }

  return (
     <Link href={`/restaurant/${restaurant.id}`} className="h-full block">
        {cardContent}
    </Link>
  );
}
