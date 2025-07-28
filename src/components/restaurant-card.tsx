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

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="w-4 h-4 fill-amber-400 text-amber-400" />);
    }

    const emptyStars = 5 - fullStars;
    for (let i = 0; i < emptyStars; i++) {
        stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300 fill-gray-300" />);
    }

    return stars;
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer group">
      <div className="relative">
        <Image
          src={restaurant.image}
          alt={restaurant.name}
          width={600}
          height={400}
          className="object-cover w-full h-48"
          data-ai-hint={restaurant.dataAiHint}
        />
         <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
      </div>
      <CardHeader>
        <CardTitle className="font-headline text-lg truncate">{restaurant.name}</CardTitle>
        <Badge variant="outline" className="w-fit">{restaurant.cuisine}</Badge>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            {renderStars()}
            <span className="font-semibold text-foreground">{restaurant.rating.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{restaurant.deliveryTime}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
