import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Clock } from 'lucide-react';
import type { Restaurant } from '@/lib/types';

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
        // Not a perfect half-star, but a decent representation
        stars.push(<Star key="half" className="w-4 h-4 fill-amber-200 text-amber-400" />);
    }

    const emptyStars = 5 - Math.ceil(restaurant.rating);
    for (let i = 0; i < emptyStars; i++) {
        stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300 fill-gray-200" />);
    }

    return stars;
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1.5 cursor-pointer group border-0 shadow-sm">
      <div className="relative">
        <Image
          src={restaurant.image}
          alt={restaurant.name}
          width={600}
          height={400}
          className="object-cover w-full h-56 rounded-t-lg"
          data-ai-hint={restaurant.dataAiHint}
        />
         <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent group-hover:from-black/60 transition-all duration-300" />
         <Badge variant="destructive" className="absolute top-3 right-3">{restaurant.deliveryTime}</Badge>
      </div>
      <CardHeader className="p-4">
        <CardTitle className="font-headline text-xl font-bold truncate">{restaurant.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{restaurant.cuisine}</p>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            {renderStars()}
            <span className="font-semibold text-foreground ml-1">{restaurant.rating.toFixed(1)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
