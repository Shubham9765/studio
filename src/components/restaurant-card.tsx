
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Clock } from 'lucide-react';
import type { Restaurant } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  
  const cardContent = (
     <Card className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out group border shadow-sm w-full h-full flex flex-col rounded-xl",
        restaurant.isOpen ? "hover:shadow-lg hover:-translate-y-1" : "cursor-not-allowed"
    )}>
      <div className="relative">
        <Image
          src={restaurant.image || 'https://placehold.co/600x400.png'}
          alt={restaurant.name}
          width={600}
          height={400}
          className={cn("object-cover w-full h-40", !restaurant.isOpen && "grayscale")}
          data-ai-hint={restaurant.dataAiHint}
        />
         <div className={cn(
             "absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent",
             restaurant.isOpen && "group-hover:from-black/70 transition-all duration-300"
         )} />
         {!restaurant.isOpen && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white font-bold text-lg tracking-wider">CLOSED</span>
            </div>
         )}
      </div>
      <CardContent className="p-3 flex-grow flex flex-col">
        <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg leading-tight truncate flex-grow pr-2">{restaurant.name}</h3>
            <div className="flex-shrink-0 flex items-center gap-1 bg-green-600 text-white rounded-md px-2 py-0.5 text-sm font-bold">
                 <span>{restaurant.rating.toFixed(1)}</span>
                 <Star className="w-3 h-3 fill-white" />
            </div>
        </div>
        <p className="text-sm text-muted-foreground truncate">{restaurant.cuisine}</p>
        <div className="flex justify-between items-center text-xs text-muted-foreground mt-auto pt-2">
            <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{restaurant.deliveryTime}</span>
            </div>
            <span>{restaurant.deliveryCharge > 0 ? `Rs.${restaurant.deliveryCharge.toFixed(2)} delivery` : 'Free Delivery'}</span>
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
