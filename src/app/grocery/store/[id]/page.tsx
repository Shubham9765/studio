
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getGroceryStoreById, getGroceryItems } from '@/services/restaurantClientService';
import type { GroceryStore, GroceryItem } from '@/lib/types';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Star, Clock, Search, BadgeCheck, MapPin, IndianRupee, Carrot } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { FloatingCartBar } from '@/components/customer/floating-cart-bar';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { GroceryItemCard } from '@/components/grocery-owner/grocery-item-card';

interface GroupedMenuItems {
  [category: string]: GroceryItem[];
}

export default function GroceryStorePage() {
  const pathname = usePathname();
  const id = pathname.split('/').pop() || '';
  const [store, setStore] = useState<GroceryStore | null>(null);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const storeData = await getGroceryStoreById(id);

        if (!storeData) {
          setError('Store not found.');
          setLoading(false);
          return;
        }

        if(storeData.status !== 'approved' || !storeData.isOpen) {
            setError('This store is currently unavailable.');
            setStore(storeData);
            setLoading(false);
            return;
        }
        
        const itemsData = await getGroceryItems(id);

        setStore(storeData);
        setItems(itemsData);

      } catch (e: any) {
        setError('Failed to load store details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedItems = filteredItems.reduce((acc, item) => {
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
          <div className="space-y-8">
              <Skeleton className="h-12 w-1/2" />
              <Skeleton className="h-64 w-full" />
            </div>
        </main>
      </div>
    );
  }
  
  if (!store && error) {
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

  if (!store) {
      return null;
  }
  
  const isStoreUnavailable = store.status !== 'approved' || !store.isOpen;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="relative h-48 md:h-64 rounded-xl overflow-hidden mb-6 shadow-lg">
          <Image
            src={store.image || 'https://placehold.co/1200x400.png'}
            alt={store.name}
            fill
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <Card className="mb-8 p-6 bg-card rounded-xl shadow-lg border">
            <CardContent className="p-0">
                 <h1 className="text-3xl md:text-4xl font-extrabold font-headline">{store.name}</h1>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center my-6">
                    <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center gap-1.5 text-2xl font-bold text-amber-500">
                            <Star className="w-6 h-6 fill-amber-500" />
                            <span>{store.rating?.toFixed(1) || 'New'}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{store.reviewCount || 0}+ ratings</p>
                    </div>
                     <div className="flex flex-col items-center justify-center">
                        <p className="text-xl font-bold">{store.deliveryTime}</p>
                        <p className="text-xs text-muted-foreground">Delivery Time</p>
                    </div>
                     <div className="flex flex-col items-center justify-center">
                        <p className="text-xl font-bold">{store.deliveryCharge > 0 ? `Rs.${store.deliveryCharge.toFixed(2)}` : 'Free'}</p>
                        <p className="text-xs text-muted-foreground">Delivery Fee</p>
                    </div>
                </div>

                <Separator />
                
                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{store.address}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
        
        {isStoreUnavailable && (
             <Alert variant="destructive" className="my-8">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Store Currently Unavailable</AlertTitle>
                <AlertDescription>
                    {error || 'This store is not accepting orders at the moment. Please check back later.'}
                </AlertDescription>
            </Alert>
        )}

        <div className="mt-8">
             <div className="mb-8 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Search this store..." 
                    className="pl-12 text-base h-12 rounded-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={isStoreUnavailable}
                />
            </div>

            {Object.keys(groupedItems).length > 0 && !isStoreUnavailable ? (
                Object.entries(groupedItems).map(([category, catItems]) => (
                    <section key={category} className="mb-12">
                        <h2 className="text-3xl font-bold font-headline mb-6 border-b-2 border-primary pb-2">{category}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                            {catItems.map(item => (
                                <GroceryItemCard key={item.id} item={item} storeId={store.id} />
                            ))}
                        </div>
                    </section>
                ))
            ) : (
                !isStoreUnavailable && (
                    <div className="text-center py-16">
                        <Carrot className="mx-auto h-16 w-16 text-muted-foreground" />
                        <h3 className="mt-4 text-xl font-medium">
                            {searchTerm ? 'No items match your search' : 'No Items Found'}
                        </h3>
                        <p className="mt-1 text-muted-foreground">
                            {searchTerm ? 'Try a different search term.' : 'This store has not added any items yet.'}
                        </p>
                    </div>
                )
            )}
        </div>
      </main>
      <FloatingCartBar />
    </div>
  );
}
