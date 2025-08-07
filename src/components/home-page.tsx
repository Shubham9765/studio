
'use client';

import { Header } from '@/components/header';
import { RestaurantCard } from '@/components/restaurant-card';
import type { MenuItem, Restaurant } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ChefHat, Utensils, MapPin, ArrowRight, AlertTriangle } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { getRestaurants, getTopRatedMenuItems, getServiceableCities } from '@/services/restaurantClientService';
import { MenuItemSearchCard } from './customer/menu-item-search-card';
import { Button } from './ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useLocation } from '@/hooks/use-location';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Alert, AlertDescription, AlertTitle } from './ui/alert';


function LoadingSkeleton() {
  return (
    <div className="space-y-12">
      <div>
        <Skeleton className="h-8 w-1/4 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
             <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="h-[220px] w-full rounded-xl" />
                <div className="space-y-2 p-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
          ))}
        </div>
      </div>
       <div>
        <Skeleton className="h-8 w-1/4 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
             <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="h-[220px] w-full rounded-xl" />
                <div className="space-y-2 p-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CategoryItem({ name, imageUrl }: { name: string, imageUrl?: string }) {
  return (
    <Link href={`/search?q=${name}`} className="flex flex-col items-center gap-2 group">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-primary transition-all">
        <Image src={imageUrl || 'https://placehold.co/100x100.png'} alt={name} width={80} height={80} className="object-cover w-full h-full" />
      </div>
      <span className="font-semibold text-sm">{name}</span>
    </Link>
  )
}

export function HomePage() {
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [topMenuItems, setTopMenuItems] = useState<MenuItem[]>([]);
  const [serviceableCities, setServiceableCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { location, error: locationError } = useLocation();

  const isServiceAvailable = useMemo(() => {
    if (!location || serviceableCities.length === 0) return true; // Default to true if location or cities aren't loaded yet
    return serviceableCities.some(city => city.toLowerCase() === location.city.toLowerCase());
  }, [location, serviceableCities]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [restaurants, menuItems, cities] = await Promise.all([
          getRestaurants(),
          getTopRatedMenuItems(),
          getServiceableCities()
        ]);
        setAllRestaurants(restaurants);
        setTopMenuItems(menuItems);
        setServiceableCities(cities);
      } catch (error) {
        console.error("Failed to fetch homepage data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  const categories = useMemo(() => {
      if (loading) return [];
      const cuisineMap = new Map<string, string | undefined>();
      allRestaurants.forEach(r => {
        if (!cuisineMap.has(r.cuisine)) {
            cuisineMap.set(r.cuisine, r.categoryImageUrl);
        }
      });
      return Array.from(cuisineMap.entries()).map(([name, imageUrl]) => ({ name, imageUrl }));
  }, [allRestaurants, loading]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 sm:py-8">
        <div className="flex items-center gap-2 text-xl font-semibold mb-6">
            <MapPin className="h-6 w-6 text-primary" />
            <div className="flex items-center gap-2">
              <span>Delivering to:</span>
              {location ? <span className="font-bold">{location.city || 'your location'}</span> : <Skeleton className="h-5 w-24" />}
            </div>
        </div>

        {!isServiceAvailable && location && (
             <Alert variant="destructive" className="mb-8">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Service Not Available</AlertTitle>
                <AlertDescription>
                   We're sorry, but Village Eats is not yet available in {location.city}. We are expanding quickly, so please check back soon!
                </AlertDescription>
            </Alert>
        )}

        <section className="text-center py-10 sm:py-12 rounded-xl bg-primary/10 mb-12 relative overflow-hidden">
             <div className="absolute -bottom-8 -right-8">
                <Utensils className="h-32 w-32 text-primary/10" />
            </div>
            <div className="relative z-10">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-headline text-primary mb-4">
                Get 50% Off Your First Order!
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Use code <span className="font-bold text-primary bg-background/50 px-2 py-1 rounded-md">FIRST50</span> at checkout. Hurry, offer ends soon!
                </p>
                <Button size="lg" asChild>
                    <Link href="#restaurants">
                        Order Now <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </Button>
            </div>
        </section>
        
        {loading ? (
            <LoadingSkeleton />
        ) : (
          isServiceAvailable && (
            <div className="space-y-12">
              {categories.length > 0 && (
                  <section>
                      <h2 className="text-3xl font-bold font-headline mb-6">Categories</h2>
                      <div className="flex gap-6 overflow-x-auto pb-4">
                          {categories.map(cat => <CategoryItem key={cat.name} name={cat.name} imageUrl={cat.imageUrl} />)}
                      </div>
                  </section>
              )}

              {topMenuItems.length > 0 && (
                  <section>
                      <h2 className="text-3xl font-bold font-headline mb-6">Top Rated Dishes</h2>
                      <Carousel opts={{ align: "start", loop: true, }} className="w-full">
                          <CarouselContent>
                              {topMenuItems.map((item) => (
                              <CarouselItem key={item.id} className="md:basis-1/2 lg:basis-1/3">
                                  <MenuItemSearchCard item={item} />
                              </CarouselItem>
                              ))}
                          </CarouselContent>
                          <CarouselPrevious className="hidden sm:flex" />
                          <CarouselNext className="hidden sm:flex" />
                      </Carousel>
                  </section>
              )}

              <section id="restaurants">
                <h2 className="text-3xl font-bold font-headline mb-6">All Restaurants</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {allRestaurants.map(restaurant => (
                    <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                ))}
                </div>
              </section>
            </div>
          )
        )}

      </main>
    </div>
  );
}

    