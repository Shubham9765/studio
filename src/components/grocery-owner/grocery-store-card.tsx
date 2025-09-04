

'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, MapPin, IndianRupee } from 'lucide-react';
import type { GroceryStore } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useLocation } from '@/hooks/use-location';
import { getDistanceFromLatLonInKm } from '@/services/restaurantClientService';
import { useState, useEffect } from 'react';

interface GroceryStoreCardProps {
  store: GroceryStore;
}

export function GroceryStoreCard({ store }: GroceryStoreCardProps) {
  const { location } = useLocation();
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    if (location && store.latitude && store.longitude) {
      const dist = getDistanceFromLatLonInKm(
        location.latitude,
        location.longitude,
        store.latitude,
        store.longitude
      );
      setDistance(dist);
    }
  }, [location, store.latitude, store.longitude]);
  
  const cardContent = (
     <Card className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out group border shadow-sm w-full h-full flex flex-col rounded-xl",
        store.isOpen ? "hover:shadow-xl hover:-translate-y-1.5" : "cursor-not-allowed",
        store.isPromoted && "border-amber-400 border-2"
    )}>
      <div className="relative overflow-hidden">
        <Image
          src={store.image || 'https://placehold.co/600x400.png'}
          alt={store.name}
          width={600}
          height={400}
          className={cn("object-cover w-full h-48 transition-transform duration-500 ease-in-out group-hover:scale-110", !store.isOpen && "grayscale")}
        />
         <div className={cn(
             "absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent",
             store.isOpen && "group-hover:from-black/80 transition-all duration-300"
         )} />
         {store.isPromoted && (
             <Badge variant="default" className="absolute top-2 left-2 bg-amber-400 text-black hover:bg-amber-400 shadow-lg">
                <Star className="h-3 w-3 mr-1 fill-black"/> Promoted
            </Badge>
         )}
         {!store.isOpen && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white font-bold text-2xl tracking-wider">CLOSED</span>
            </div>
         )}
      </div>
      <CardContent className="p-4 flex-grow flex flex-col">
        <div className="flex justify-between items-start gap-2">
            <h3 className="font-bold text-lg leading-tight flex-grow pr-2 transition-colors duration-300 group-hover:text-primary">{store.name}</h3>
            {store.rating !== undefined && (
                 <div className="flex-shrink-0 flex items-center gap-1 bg-green-600 text-white rounded-md px-2 py-0.5 text-sm font-bold shadow">
                     <span>{store.rating.toFixed(1)}</span>
                     <Star className="w-3 h-3 fill-white" />
                </div>
            )}
        </div>
        
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-auto pt-3">
            {store.deliveryTime && (
                 <div className="flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-full">
                    <Clock className="w-3 h-3 text-primary" />
                    <span>{store.deliveryTime}</span>
                </div>
            )}
             {distance !== null && (
                <div className="flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-full">
                    <MapPin className="w-3 h-3 text-primary" />
                    <span>{distance.toFixed(1)} km</span>
                </div>
             )}
        </div>
        
        <div className="text-sm font-semibold text-foreground mt-2 flex items-center gap-1">
            <IndianRupee className="w-4 h-4 text-muted-foreground" />
            <span>{store.deliveryCharge > 0 ? `${store.deliveryCharge.toFixed(2)} delivery` : 'Free Delivery'}</span>
        </div>
      </CardContent>
    </Card>
  );

   if (!store.isOpen) {
    return <div className="cursor-not-allowed">{cardContent}</div>;
  }

  // Update this link when the grocery store page is created
  return (
     <Link href={`/`} className="h-full block">
        {cardContent}
    </Link>
  );
}
