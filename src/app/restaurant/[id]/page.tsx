
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getRestaurantById, getMenuItemsForRestaurant, getDistanceFromLatLonInKm } from '@/services/restaurantClientService';
import type { Restaurant, MenuItem } from '@/lib/types';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Star, Clock, Utensils, Search, BadgeCheck, MapPin, IndianRupee } from 'lucide-react';
import { MenuItemCard } from '@/components/customer/menu-item-card';
import { Cart } from '@/components/customer/cart';
import { Input } from '@/components/ui/input';
import { usePathname } from 'next/navigation';
import { FloatingCartBar } from '@/components/customer/floating-cart-bar';
import { useLocation } from '@/hooks/use-location';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface GroupedMenuItems {
  [category: string]: MenuItem[];
}

export default function RestaurantPage() {
  const pathname = usePathname();
  const id = pathname.split('/').pop() || '';
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { location } = useLocation();
  const [distance, setDistance] = useState<number | null>(null);


  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const restaurantData = await getRestaurantById(id);

        if (!restaurantData) {
          setError('Restaurant not found.');
          setLoading(false);
          return;
        }

        if(restaurantData.status !== 'approved' || !restaurantData.isOpen) {
            setError('This restaurant is currently unavailable.');
            setRestaurant(restaurantData);
            setLoading(false);
            return;
        }
        
        const menuItemsData = await getMenuItemsForRestaurant(id);

        setRestaurant(restaurantData);
        setMenuItems(menuItemsData);

        if (location && restaurantData.latitude && restaurantData.longitude) {
            const dist = getDistanceFromLatLonInKm(
                location.latitude,
                location.longitude,
                restaurantData.latitude,
                restaurantData.longitude
            );
            setDistance(dist);
        }

      } catch (e: any) {
        setError('Failed to load restaurant details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, location]);

  const filteredMenuItems = menuItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedMenuItems = filteredMenuItems.reduce((acc, item) => {
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
  
  if (!restaurant && error) {
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
      return null;
  }
  
  const isRestaurantUnavailable = restaurant.status !== 'approved' || !restaurant.isOpen;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="relative h-48 md:h-64 rounded-xl overflow-hidden mb-6 shadow-lg">
          <Image
            src={restaurant.image || 'https://placehold.co/1200x400.png'}
            alt={restaurant.name}
            fill
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <Card className="-mt-16 mx-4 md:mx-8 p-6 bg-background rounded-xl shadow-xl border-t-4 border-primary">
            <CardContent className="p-0">
                 <h1 className="text-3xl md:text-4xl font-extrabold font-headline">{restaurant.name}</h1>
                <p className="text-lg text-muted-foreground mt-1">{restaurant.cuisine}</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center my-6">
                    <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center gap-1.5 text-2xl font-bold text-amber-500">
                            <Star className="w-6 h-6 fill-amber-500" />
                            <span>{restaurant.rating.toFixed(1)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{restaurant.reviewCount}+ ratings</p>
                    </div>
                     <div className="flex flex-col items-center justify-center">
                        <p className="text-xl font-bold">{restaurant.deliveryTime}</p>
                        <p className="text-xs text-muted-foreground">Delivery Time</p>
                    </div>
                     <div className="flex flex-col items-center justify-center">
                        <p className="text-xl font-bold">{restaurant.deliveryCharge > 0 ? `Rs.${restaurant.deliveryCharge.toFixed(2)}` : 'Free'}</p>
                        <p className="text-xs text-muted-foreground">Delivery Fee</p>
                    </div>
                    {distance !== null && (
                        <div className="flex flex-col items-center justify-center">
                            <p className="text-xl font-bold">{distance.toFixed(1)} km</p>
                            <p className="text-xs text-muted-foreground">Distance</p>
                        </div>
                    )}
                </div>

                <Separator />
                
                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{restaurant.address}</span>
                    </div>
                     {restaurant.fssaiLicense && (
                      <div className="flex items-center gap-2">
                        <BadgeCheck className="h-4 w-4 text-green-500" />
                        <span>FSSAI: {restaurant.fssaiLicense}</span>
                      </div>
                    )}
                </div>
            </CardContent>
        </Card>
        
        {isRestaurantUnavailable && (
             <Alert variant="destructive" className="my-8">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Restaurant Currently Unavailable</AlertTitle>
                <AlertDescription>
                    {error || 'This restaurant is not accepting orders at the moment. Please check back later.'}
                </AlertDescription>
            </Alert>
        )}

        <div className="grid lg:grid-cols-4 gap-8 mt-8">
          {/* Menu Section */}
          <div className="lg:col-span-3">
             <div className="mb-8 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Search this menu..." 
                    className="pl-12 text-base h-12 rounded-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={isRestaurantUnavailable}
                />
            </div>

            {Object.keys(groupedMenuItems).length > 0 && !isRestaurantUnavailable ? (
                Object.entries(groupedMenuItems).map(([category, items]) => (
                    <section key={category} className="mb-12">
                        <h2 className="text-3xl font-bold font-headline mb-6 border-b-2 border-primary pb-2">{category}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {items.map(item => (
                                <MenuItemCard key={item.id} item={item} restaurantId={restaurant.id} />
                            ))}
                        </div>
                    </section>
                ))
            ) : (
                !isRestaurantUnavailable && (
                    <div className="text-center py-16">
                        <Utensils className="mx-auto h-16 w-16 text-muted-foreground" />
                        <h3 className="mt-4 text-xl font-medium">
                            {searchTerm ? 'No items match your search' : 'No Menu Items Found'}
                        </h3>
                        <p className="mt-1 text-muted-foreground">
                            {searchTerm ? 'Try a different search term.' : 'This restaurant has not added any menu items yet.'}
                        </p>
                    </div>
                )
            )}
          </div>
          {/* Cart Section for Desktop */}
          <aside className="hidden lg:block lg:col-span-1">
             <div className="sticky top-24">
                <Cart restaurant={restaurant} />
             </div>
          </aside>
        </div>
      </main>
      <FloatingCartBar />
    </div>
  );
}
