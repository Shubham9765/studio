
'use client';

import { Header } from '@/components/header';
import { RestaurantCard } from '@/components/restaurant-card';
import { useTrendingRestaurants } from '@/hooks/use-trending-restaurants';
import type { Restaurant } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ChefHat, Search, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getRestaurants } from '@/services/restaurantService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col space-y-3">
          <Skeleton className="h-[220px] w-full rounded-xl" />
          <div className="space-y-2 p-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HomePage() {
  const router = useRouter();
  const { data: trendingRestaurants, loading: trendingLoading, error: trendingError } = useTrendingRestaurants();
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [allRestaurantsLoading, setAllRestaurantsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchRestaurants = async () => {
      setAllRestaurantsLoading(true);
      const restaurants = await getRestaurants();
      setAllRestaurants(restaurants);
      setAllRestaurantsLoading(false);
    };
    fetchRestaurants();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 sm:py-8">
        <section className="text-center py-12 sm:py-20 rounded-xl bg-primary/10 mb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-headline text-primary mb-4">
              Craving something delicious?
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Get your favorite meals delivered fast, right to your door.
            </p>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-lg mx-auto">
              <div className="relative flex-1">
                <Input 
                  placeholder="Search by restaurant or dish..." 
                  className="h-12 text-lg pl-4 pr-12 rounded-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                 <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
              <Button type="submit" size="lg" className="h-12 text-lg rounded-full">
                Find Food
              </Button>
            </form>
        </section>

        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="h-8 w-8 text-accent" />
            <h2 className="text-3xl font-bold font-headline">AI Recommended</h2>
          </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {trendingRestaurants.map(restaurant => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
             <ChefHat className="h-8 w-8 text-primary" />
             <h2 className="text-3xl font-bold font-headline">All Restaurants</h2>
          </div>
          {allRestaurantsLoading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {Array.from({ length: 8 }).map((_, i) => (
                 <div key={i} className="flex flex-col space-y-3">
                    <Skeleton className="h-[220px] w-full rounded-xl" />
                    <div className="space-y-2 p-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
