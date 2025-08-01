
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { RestaurantCard } from '@/components/restaurant-card';
import { MenuItemSearchCard } from '@/components/customer/menu-item-search-card';
import { searchRestaurantsAndMenuItems } from '@/services/restaurantService';
import type { Restaurant, MenuItem } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ChefHat, Utensils } from 'lucide-react';

function SearchResults() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!query) {
            setLoading(false);
            return;
        }

        const performSearch = async () => {
            setLoading(true);
            setError(null);
            try {
                const { restaurants, menuItems } = await searchRestaurantsAndMenuItems(query);
                setRestaurants(restaurants);
                setMenuItems(menuItems);
            } catch (err: any) {
                setError('Failed to perform search. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        performSearch();
    }, [query]);
    
    if (loading) {
        return (
             <div className="space-y-12">
                 <div>
                    <Skeleton className="h-8 w-1/4 mb-6" />
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
                </div>
                 <div>
                    <Skeleton className="h-8 w-1/4 mb-6" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
                    </div>
                 </div>
            </div>
        )
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Search Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (restaurants.length === 0 && menuItems.length === 0) {
        return (
            <div className="text-center py-16">
                <h2 className="text-2xl font-bold">No results found for "{query}"</h2>
                <p className="text-muted-foreground mt-2">Try searching for something else.</p>
            </div>
        )
    }

    // Filter menu items to only show those whose restaurant is not already displayed
    const displayedRestaurantIds = new Set(restaurants.map(r => r.id));
    const uniqueMenuItems = menuItems.filter(item => !displayedRestaurantIds.has(item.restaurantId));


    return (
        <div className="space-y-12">
            {restaurants.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <ChefHat className="h-8 w-8 text-primary" />
                        <h2 className="text-3xl font-bold font-headline">Restaurants</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {restaurants.map(restaurant => (
                            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                        ))}
                    </div>
                </section>
            )}
             {uniqueMenuItems.length > 0 && (
                <section>
                     <div className="flex items-center gap-3 mb-6">
                        <Utensils className="h-8 w-8 text-primary" />
                        <h2 className="text-3xl font-bold font-headline">Dishes</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {uniqueMenuItems.map(item => (
                            <MenuItemSearchCard key={item.id} item={item} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-8">
                 <Suspense fallback={<Skeleton className="h-screen w-full" />}>
                    <SearchResults />
                </Suspense>
            </main>
        </div>
    )
}
