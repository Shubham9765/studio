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
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(restaurant.rating);
    const hasHalfStar = restaurant.rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="w-4 h-4 fill-amber-400 text-amber-400" />);
    }

    if (hasHalfStar) {
        stars.push(<Star key="half" className="w-4 h-4 fill-amber-200 text-amber-400" />);
    }

    const emptyStars = 5 - Math.ceil(restaurant.rating);
    for (let i = 0; i < emptyStars; i++) {
        stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300 fill-gray-200" />);
    }

    return stars;
  };

  const cardContent = (
     <Card className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out group border-0 shadow-sm w-full h-full flex flex-col",
        restaurant.isOpen ? "hover:shadow-xl hover:-translate-y-1" : "cursor-not-allowed"
    )}>
      <div className="relative">
        <Image
          src={restaurant.image || 'https://placehold.co/600x400.png'}
          alt={restaurant.name}
          width={600}
          height={400}
          className={cn("object-cover w-full h-56", !restaurant.isOpen && "grayscale")}
          data-ai-hint={restaurant.dataAiHint}
        />
         <div className={cn(
             "absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent",
             restaurant.isOpen && "group-hover:from-black/60 transition-all duration-300"
         )} />
         {!restaurant.isOpen && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white font-bold text-xl tracking-wider">CLOSED</span>
            </div>
         )}
         <Badge variant="destructive" className="absolute top-3 right-3">{restaurant.deliveryTime}</Badge>
      </div>
      <CardHeader className="p-4">
        <CardTitle className="font-headline text-xl font-bold truncate">{restaurant.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{restaurant.cuisine}</p>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow flex flex-col justify-end">
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            {renderStars()}
            <span className="font-semibold text-foreground ml-1">{restaurant.rating.toFixed(1)}</span>
          </div>
           <div className="text-sm font-medium">
             {restaurant.deliveryCharge > 0 ? `$${restaurant.deliveryCharge.toFixed(2)}` : 'Free'} Delivery
           </div>
        </div>
      </CardContent>
    </Card>
  );

   if (!restaurant.isOpen) {
    return <div className="cursor-not-allowed">{cardContent}</div>;
  }

  return (
     <Link href={`/restaurant/${restaurant.id}`} className="h-full">
        {cardContent}
    </Link>
  );
}
