
'use client';

import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Utensils, Check, Search, Carrot } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getGroceryCategoryTypes, getGroceryStores, getGroceryItems } from '@/services/restaurantClientService';
import type { GroceryCategory, GroceryStore, GroceryItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { GroceryStoreCard } from '@/components/grocery-owner/grocery-store-card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { GroceryItemSearchCard } from '@/components/customer/grocery-item-search-card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useGroceryCart } from '@/hooks/use-grocery-cart';
import { GroceryCart } from '@/components/customer/grocery-cart';
import { FloatingGroceryCartBar } from '@/components/customer/floating-grocery-cart-bar';


function SectionHeading({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={cn("text-left mb-6", className)}>
            <h2 className="text-2xl md:text-3xl font-bold font-headline">
                {children}
            </h2>
        </div>
    )
}

function CategoryItem({ name, imageUrl, isSelected, onSelect }: { name: string, imageUrl?: string, isSelected: boolean, onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="flex flex-col items-center justify-start gap-2 group text-center w-24"
    >
      <div
        className={cn(
            "relative w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 transition-all duration-300 transform group-hover:scale-105",
            isSelected ? "border-primary shadow-lg scale-105" : "border-transparent group-hover:border-primary/50"
        )}>
        <Image
          src={imageUrl || 'https://placehold.co/100x100.png'}
          alt={name}
          width={100}
          height={100}
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-125" />
        {isSelected && (
            <div className="absolute top-0 right-0 bg-primary rounded-full p-0.5">
                <Check className="h-3 w-3 text-primary-foreground" />
            </div>
        )}
      </div>
      <span
        className={cn(
            "font-semibold text-sm text-center w-full group-hover:text-primary transition-colors",
            isSelected && "text-primary"
        )}>
        {name}
      </span>
    </button>
  );
}

function MobileSearch() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/grocery/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="md:hidden mb-8">
      <form onSubmit={handleSearch} className="relative transition-shadow duration-300 focus-within:shadow-lg">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary animate-pulse" />
        <Input
          placeholder="Search for items or stores..."
          className="pl-12 text-sm h-14 rounded-full w-full bg-muted border-2 border-transparent focus-visible:ring-primary focus-visible:border-primary hover:shadow-md transition-all duration-300"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </form>
    </div>
  );
}


export default function GroceryPage() {
    const [categories, setCategories] = useState<GroceryCategory[]>([]);
    const [stores, setStores] = useState<GroceryStore[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [categoryItems, setCategoryItems] = useState<GroceryItem[]>([]);
    const [isCategoryLoading, setIsCategoryLoading] = useState(false);
    const { cart, store: cartStore } = useGroceryCart();

    const isCartVisible = cart.length > 0 && cartStore;

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [fetchedCategories, fetchedStores] = await Promise.all([
                    getGroceryCategoryTypes(),
                    getGroceryStores(),
                ]);
                setCategories(fetchedCategories);
                setStores(fetchedStores);
            } catch (error) {
                console.error("Failed to fetch grocery data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleCategoryClick = async (categoryName: string) => {
        if (selectedCategory === categoryName) {
            setSelectedCategory(null);
            setCategoryItems([]);
            return;
        }

        setSelectedCategory(categoryName);
        setIsCategoryLoading(true);
        try {
            const allItemsPromises = stores.map(s => getGroceryItems(s.id));
            const allItemsNested = await Promise.all(allItemsPromises);
            
            const allItems = allItemsNested.flat().filter(item => 
                item.category.toLowerCase() === categoryName.toLowerCase()
            );
            
            const enrichedItems = await Promise.all(
                allItems.map(async item => {
                    const store = stores.find(s => s.id === item.storeId);
                    return { ...item, store: store ? { name: store.name, isPromoted: store.isPromoted } : undefined };
                })
            );

            const promotedItems = enrichedItems.filter(item => item.store?.isPromoted);
            const otherItems = enrichedItems.filter(item => !item.store?.isPromoted);

            setCategoryItems([...promotedItems, ...otherItems]);
        } catch (e) {
            console.error("Failed to fetch items for category:", e);
            setCategoryItems([]);
        } finally {
            setIsCategoryLoading(false);
        }
    };

    const mainContent = (
      <>
        <MobileSearch />
        
        {loading && (
             <div className="space-y-4">
              <Skeleton className="h-8 w-1/3" />
               <div className="flex gap-4 overflow-hidden">
                   {Array.from({length: 5}).map((_, i) => <div key={i} className="space-y-2"><Skeleton className="h-20 w-20 rounded-full" /><Skeleton className="h-4 w-20" /></div>)}
               </div>
          </div>
        )}
        
        {!loading && categories.length > 0 && (
          <section className="py-2">
              <SectionHeading>Shop by Category</SectionHeading>
                 <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
                   <CarouselContent className="-ml-2">
                    {categories.map((cat) => (
                      <CarouselItem key={cat.name} className="basis-auto pl-2">
                        <CategoryItem 
                            key={cat.name}
                            name={cat.name} 
                            imageUrl={cat.imageUrl}
                            isSelected={selectedCategory === cat.name}
                            onSelect={() => handleCategoryClick(cat.name)}
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
              </Carousel>
          </section>
      )}

         {isCategoryLoading && (
          <div className="space-y-4 mt-8">
              <Skeleton className="h-8 w-1/3" />
               <div className="flex gap-4 overflow-hidden">
                   {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-64 w-48 rounded-lg flex-shrink-0" />)}
               </div>
          </div>
        )}

        {selectedCategory && !isCategoryLoading && categoryItems.length > 0 && (
           <section className="mt-8">
              <SectionHeading>
                Top Picks for {selectedCategory}
              </SectionHeading>
               <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
                   <CarouselContent>
                      {categoryItems.map((item) => (
                      <CarouselItem key={item.id} className="basis-4/5 sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                          <div className="p-1 h-full">
                            <GroceryItemSearchCard item={item} />
                          </div>
                      </CarouselItem>
                      ))}
                  </CarouselContent>
                   <CarouselPrevious className="hidden sm:flex" />
                  <CarouselNext className="hidden sm:flex" />
              </Carousel>
          </section>
      )}
      
       {selectedCategory && !isCategoryLoading && categoryItems.length === 0 && (
         <Alert className="mt-8">
            <Carrot className="h-4 w-4" />
            <AlertTitle>No Items Found</AlertTitle>
            <AlertDescription>
                There are no items available for {selectedCategory} at the moment. Try another category!
            </AlertDescription>
         </Alert>
       )}


       <section className="mt-12">
         <SectionHeading>All Stores</SectionHeading>
         {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-lg" />)}
              </div>
         ) : stores.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {stores.map(store => (
                    <GroceryStoreCard key={store.id} store={store} />
                ))}
             </div>
         ) : (
            <div className="text-center py-16">
                <Carrot className="mx-auto h-16 w-16 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-medium">No Grocery Stores Found</h3>
                <p className="mt-1 text-muted-foreground">
                    There are no available grocery stores in your area at the moment.
                </p>
            </div>
         )}
       </section>
      </>
    );


    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-8">
                <div className={cn("grid lg:gap-8", isCartVisible ? "lg:grid-cols-4" : "lg:grid-cols-1")}>
                    <div className={cn(isCartVisible ? "lg:col-span-3" : "lg:col-span-4")}>
                        {mainContent}
                    </div>
                    {isCartVisible && (
                        <aside className="hidden lg:block lg:col-span-1">
                            <div className="sticky top-24">
                                <GroceryCart store={cartStore!} />
                            </div>
                        </aside>
                    )}
                </div>
            </main>
            <FloatingGroceryCartBar />
        </div>
    )
}
