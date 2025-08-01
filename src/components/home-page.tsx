
'use client';

import { Header } from '@/components/header';
import { RestaurantCard } from '@/components/restaurant-card';
import type { MenuItem, Restaurant } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ChefHat, Utensils } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getRestaurants, getTopRatedMenuItems } from '@/services/restaurantService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MenuItemSearchCard } from './customer/menu-item-search-card';

function LoadingSkeleton() {
  return (
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
  );
}

export function HomePage() {
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [topMenuItems, setTopMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [restaurants, menuItems] = await Promise.all([
        getRestaurants(),
        getTopRatedMenuItems()
      ]);
      setAllRestaurants(restaurants);
      setTopMenuItems(menuItems);
      setLoading(false);
    };
    fetchData();
  }, []);

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
        </section>

        <Tabs defaultValue="restaurants" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-10 h-12">
                <TabsTrigger value="restaurants" className="text-base h-10">
                    <ChefHat className="mr-2 h-5 w-5" /> Restaurants
                </TabsTrigger>
                <TabsTrigger value="dishes" className="text-base h-10">
                    <Utensils className="mr-2 h-5 w-5" /> Top Dishes
                </TabsTrigger>
            </TabsList>
            <TabsContent value="restaurants">
                 <section>
                    {loading ? (
                        <LoadingSkeleton />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {allRestaurants.map(restaurant => (
                            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                        ))}
                        </div>
                    )}
                </section>
            </TabsContent>
            <TabsContent value="dishes">
                 <section>
                    {loading ? (
                        <LoadingSkeleton />
                    ) : (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {topMenuItems.map(item => (
                                <MenuItemSearchCard key={item.id} item={item} />
                            ))}
                        </div>
                    )}
                </section>
            </TabsContent>
        </Tabs>

      </main>
    </div>
  );
}
