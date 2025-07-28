'use client';

import { Header } from '@/components/header';
import { RestaurantCard } from '@/components/restaurant-card';
import { useTrendingRestaurants } from '@/hooks/use-trending-restaurants';
import type { Restaurant } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getRestaurants } from '@/services/restaurantService';

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
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [allRestaurantsLoading, setAllRestaurantsLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      setAllRestaurantsLoading(true);
      const restaurants = await getRestaurants();
      setAllRestaurants(restaurants);
      setAllRestaurantsLoading(false);
    };
    fetchRestaurants();
  }, []);

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
          {allRestaurantsLoading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                 <div key={i} className="flex flex-col space-y-3">
                    <Skeleton className="h-[192px] w-full rounded-xl" />
                    <div className="space-y-2 p-4">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allRestaurants.map(restaurant => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
