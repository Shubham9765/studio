
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getRestaurantById, getMenuItemsForRestaurant } from '@/services/restaurantService';
import type { Restaurant, MenuItem } from '@/lib/types';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Star, Clock, Utensils, Search, ShoppingCart, X } from 'lucide-react';
import { MenuItemCard } from '@/components/customer/menu-item-card';
import { Cart } from '@/components/customer/cart';
import { Input } from '@/components/ui/input';
import { usePathname } from 'next/navigation';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';


interface GroupedMenuItems {
  [category: string]: MenuItem[];
}

function FloatingCartBar() {
    const { cart, cartCount, totalPrice, restaurant } = useCart();
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    if (cartCount === 0) return null;

    return (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-background/95 backdrop-blur-sm p-4 border-t z-40">
                 <SheetTrigger asChild>
                    <Button className="w-full h-14 text-lg">
                        <div className="flex justify-between items-center w-full">
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-base">{cartCount}</Badge>
                                <span>View Your Cart</span>
                            </div>
                            <span>${totalPrice.toFixed(2)}</span>
                        </div>
                    </Button>
                 </SheetTrigger>
            </div>
            <SheetContent side="bottom" className="h-4/5 flex flex-col">
                <SheetHeader className="text-left">
                    <SheetTitle>Your Order</SheetTitle>
                </SheetHeader>
                <div className="flex-grow overflow-hidden">
                    {restaurant && <Cart restaurant={restaurant} isSheet={true} />}
                </div>
                 <Button className="w-full h-12 text-lg mt-4" onClick={() => setIsSheetOpen(false)}>
                    Continue Browsing
                </Button>
            </SheetContent>
        </Sheet>
    )
}


export default function RestaurantPage() {
  const pathname = usePathname();
  const id = pathname.split('/').pop() || '';
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [restaurantData, menuItemsData] = await Promise.all([
          getRestaurantById(id),
          getMenuItemsForRestaurant(id)
        ]);

        if (!restaurantData) {
          setError('Restaurant not found.');
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

    if (id) {
        fetchData();
    }
  }, [id]);

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

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Menu Section */}
          <div className="lg:col-span-3">
             <div className="mb-8 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Search this menu..." 
                    className="pl-12 text-base h-12 rounded-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {Object.keys(groupedMenuItems).length > 0 ? (
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
                <div className="text-center py-16">
                    <Utensils className="mx-auto h-16 w-16 text-muted-foreground" />
                    <h3 className="mt-4 text-xl font-medium">
                        {searchTerm ? 'No items match your search' : 'No Menu Items Found'}
                    </h3>
                    <p className="mt-1 text-muted-foreground">
                        {searchTerm ? 'Try a different search term.' : 'This restaurant has not added any menu items yet.'}
                    </p>
                </div>
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
