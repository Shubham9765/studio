
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getRestaurantById, getMenuItemsForRestaurant } from '@/services/restaurantService';
import type { Restaurant, MenuItem } from '@/lib/types';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Star, Clock, Utensils } from 'lucide-react';
import { notFound } from 'next/navigation';
import { MenuItemCard } from '@/components/customer/menu-item-card';
import { Cart } from '@/components/customer/cart';


interface RestaurantPageParams {
  params: { id: string };
}

interface GroupedMenuItems {
  [category: string]: MenuItem[];
}

export default function RestaurantPage({ params: { id } }: RestaurantPageParams) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [restaurantData, menuItemsData] = await Promise.all([
          getRestaurantById(id),
          getMenuItemsForRestaurant(id)
        ]);

        if (!restaurantData) {
          notFound();
          return;
        }

        if(restaurantData.status !== 'approved' || !restaurantData.isOpen) {
            setError('This restaurant is currently unavailable.');
        }

        setRestaurant(restaurantData);
        setMenuItems(menuItemsData);
      } catch (e: any) {
        setError('Failed to load restaurant details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const groupedMenuItems = menuItems.reduce((acc, item) => {
    const { category } = item;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as GroupedMenuItems);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Skeleton className="h-48 w-full rounded-lg mb-8" />
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <Skeleton className="h-12 w-1/2" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div>
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  if (error) {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-8 flex items-center justify-center">
                <Alert variant="destructive" className="w-1/2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>An Error Occurred</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </main>
        </div>
    )
  }


  if (!restaurant) {
    return null; // Should be handled by notFound, but as a fallback.
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        {/* Restaurant Header */}
        <div className="relative h-64 rounded-xl overflow-hidden mb-8 -mx-4 sm:-mx-6 md:-mx-8">
          <Image
            src={restaurant.image || 'https://placehold.co/1200x400.png'}
            alt={restaurant.name}
            layout="fill"
            objectFit="cover"
            className="w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8 text-white">
            <h1 className="text-4xl md:text-5xl font-extrabold font-headline">{restaurant.name}</h1>
            <p className="text-lg text-gray-200 mt-1">{restaurant.cuisine}</p>
             <div className="flex items-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-1.5">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <span className="font-bold text-lg">{restaurant.rating.toFixed(1)}</span>
                </div>
                 <div className="flex items-center gap-1.5">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">{restaurant.deliveryTime}</span>
                </div>
                 <div className="flex items-center gap-1.5">
                    <span className="font-medium">{restaurant.deliveryCharge > 0 ? `$${restaurant.deliveryCharge.toFixed(2)} Delivery` : 'Free Delivery'}</span>
                </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8">
          {/* Menu Section */}
          <div className="md:col-span-2 lg:col-span-3">
            {Object.keys(groupedMenuItems).length > 0 ? (
                Object.entries(groupedMenuItems).map(([category, items]) => (
                    <section key={category} className="mb-12">
                        <h2 className="text-3xl font-bold font-headline mb-6 border-b-2 border-primary pb-2">{category}</h2>
                        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {items.map(item => (
                                <MenuItemCard key={item.id} item={item} restaurantId={restaurant.id} />
                            ))}
                        </div>
                    </section>
                ))
            ) : (
                <div className="text-center py-16">
                    <Utensils className="mx-auto h-16 w-16 text-muted-foreground" />
                    <h3 className="mt-4 text-xl font-medium">No Menu Items Found</h3>
                    <p className="mt-1 text-muted-foreground">This restaurant has not added any menu items yet.</p>
                </div>
            )}
          </div>
          {/* Cart Section */}
          <aside className="lg:col-span-1">
             <div className="sticky top-24">
                <Cart restaurant={restaurant} />
             </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
