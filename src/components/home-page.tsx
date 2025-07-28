'use client';

import { Header } from '@/components/header';
import { RestaurantCard } from '@/components/restaurant-card';
import { useTrendingRestaurants } from '@/hooks/use-trending-restaurants';
import type { Restaurant } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const mockRestaurants: Restaurant[] = [
  {
    id: '3',
    name: 'The Curry Leaf',
    cuisine: 'South Indian',
    rating: 4.8,
    deliveryTime: '25-35 min',
    image: 'https://placehold.co/600x400',
    dataAiHint: 'indian food',
  },
  {
    id: '4',
    name: "Mama's Pizzeria",
    cuisine: 'Pizza',
    rating: 4.6,
    deliveryTime: '30-40 min',
    image: 'https://placehold.co/600x400',
    dataAiHint: 'pizza',
  },
  {
    id: '5',
    name: 'Sushi Samba',
    cuisine: 'Japanese',
    rating: 4.9,
    deliveryTime: '40-50 min',
    image: 'https://placehold.co/600x400',
    dataAiHint: 'sushi',
  },
  {
    id: '6',
    name: 'Burger Barn',
    cuisine: 'American',
    rating: 4.3,
    deliveryTime: '20-30 min',
    image: 'https://placehold.co/600x400',
    dataAiHint: 'burger',
  },
  {
    id: '7',
    name: 'Taco Town',
    cuisine: 'Mexican',
    rating: 4.7,
    deliveryTime: '25-35 min',
    image: 'https://placehold.co/600x400',
    dataAiHint: 'taco',
  },
  {
    id: '8',
    name: 'Noodle House',
    cuisine: 'Chinese',
    rating: 4.4,
    deliveryTime: '30-40 min',
    image: 'https://placehold.co/600x400',
    dataAiHint: 'noodles',
  },
];

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="flex flex-col space-y-3">
          <Skeleton className="h-[192px] w-full rounded-xl" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HomePage() {
  const { data: trendingRestaurants, loading: trendingLoading, error: trendingError } = useTrendingRestaurants('customer-123');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <section className="mb-12">
          <h2 className="text-3xl font-bold font-headline mb-6">🔥 Trending Restaurants</h2>
          {trendingLoading && <LoadingSkeleton />}
          {trendingError && (
             <Alert variant="destructive">
               <AlertTriangle className="h-4 w-4" />
               <AlertTitle>Error Fetching Recommendations</AlertTitle>
               <AlertDescription>
                 Could not load trending restaurants. Please try again later.
               </AlertDescription>
             </Alert>
          )}
          {trendingRestaurants && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingRestaurants.map(restaurant => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-3xl font-bold font-headline mb-6">All Restaurants</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mockRestaurants.map(restaurant => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
