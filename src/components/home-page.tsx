

'use client';

import { Header } from '@/components/header';
import { RestaurantCard } from '@/components/restaurant-card';
import type { MenuItem, Restaurant, BannerConfig } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ChefHat, Utensils, MapPin, ArrowRight, AlertTriangle, Search, Star, Filter, Sparkles, Check } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { getRestaurants, getTopRatedMenuItems, getServiceableCities, getBannerConfig, getMenuItemsForRestaurant, getTrendingRestaurantRecommendations } from '@/services/restaurantClientService';
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
import { Input } from './ui/input';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/use-cart';
import { Cart } from './customer/cart';
import { cn } from '@/lib/utils';
import { FloatingCartBar } from './customer/floating-cart-bar';
import { useAuth } from '@/hooks/use-auth';


function LoadingSkeleton() {
  return (
    <div className="space-y-12">
      <div>
        <Skeleton className="h-8 w-1/4 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
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

function PromotionalBanner({ config }: { config: BannerConfig | null }) {
  if (!config?.isEnabled) {
    return null;
  }

  return (
    <section 
        className="mb-12 relative group"
    >
      {config.imageUrl ? (
        <div className="relative w-full h-auto aspect-[3/1] rounded-xl overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-300">
          <Image 
            src={config.imageUrl}
            alt={config.heading || 'Promotional banner'}
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="h-48 bg-muted rounded-xl"></div>
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/40 rounded-xl flex flex-col justify-center items-center text-center p-4">
        <div className="relative z-10 text-white">
            {config.isHeadingEnabled && (
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold font-headline mb-4" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}>
                  {config.heading}
                </h1>
            )}
            {config.isDescriptionEnabled && (
                <p className="text-lg md:text-xl text-white/90 max-w-2xl lg:max-w-3xl mx-auto mb-8" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>
                  {config.description}
                </p>
            )}
            {config.isButtonEnabled && (
                <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90 shadow-lg text-base md:text-lg px-8 py-6">
                    <Link href={config.buttonLink}>
                        {config.buttonText} <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </Button>
            )}
        </div>
      </div>
    </section>
  )
}

function MobileSearch() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="md:hidden mb-8">
      <form onSubmit={handleSearch} className="relative transition-shadow duration-300 focus-within:shadow-lg">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary animate-pulse" />
        <Input
          placeholder="Search restaurants or dishes..."
          className="pl-12 text-sm h-14 rounded-full w-full bg-muted border-2 border-transparent focus-visible:ring-primary focus-visible:border-primary hover:shadow-md transition-all duration-300"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </form>
    </div>
  );
}

function Footer() {
    return (
        <footer className="mt-12 text-center text-xs text-muted-foreground">
            <Link href="/terms" className="hover:text-primary transition-colors">
                Terms & Conditions
            </Link>
        </footer>
    )
}

export function HomePage() {
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [topMenuItems, setTopMenuItems] = useState<MenuItem[]>([]);
  const [serviceableCities, setServiceableCities] = useState<string[]>([]);
  const [bannerConfig, setBannerConfig] = useState<BannerConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const { location, error: locationError, requestLocation } = useLocation();
  const { cart, restaurant: cartRestaurant } = useCart();
  const { user } = useAuth();
  const [trendingRestaurants, setTrendingRestaurants] = useState<any[]>([]);
  const [isPureVegFilter, setIsPureVegFilter] = useState(false);
  const [isTopRatedFilter, setIsTopRatedFilter] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryMenuItems, setCategoryMenuItems] = useState<MenuItem[]>([]);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);


  const isCartVisible = cart.length > 0 && cartRestaurant;

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

    useEffect(() => {
        if(user?.uid) {
            getTrendingRestaurantRecommendations({customerId: user.uid}).then(res => {
                setTrendingRestaurants(res.restaurantRecommendations);
            }).catch(console.error);
        }
    }, [user]);

  const isServiceAvailable = useMemo(() => {
    if (!location || !location.city || serviceableCities.length === 0) return true;
    return serviceableCities.some(city => city.toLowerCase() === location.city.toLowerCase());
  }, [location, serviceableCities]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [restaurants, menuItems, cities, banner] = await Promise.all([
          getRestaurants(),
          getTopRatedMenuItems(),
          getServiceableCities(),
          getBannerConfig(),
        ]);
        setAllRestaurants(restaurants);
        setFilteredRestaurants(restaurants);
        setTopMenuItems(menuItems);
        setServiceableCities(cities);
        setBannerConfig(banner);
      } catch (error) {
        console.error("Failed to fetch homepage data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  const handleCategoryClick = async (categoryName: string) => {
    if (selectedCategory === categoryName) {
        setSelectedCategory(null);
        setCategoryMenuItems([]);
        return;
    }

    setSelectedCategory(categoryName);
    setIsCategoryLoading(true);

    try {
        const allItemsPromises = allRestaurants.map(r => getMenuItemsForRestaurant(r.id));
        const allItemsNested = await Promise.all(allItemsPromises);
        const allItems = allItemsNested.flat();
        
        const itemsForCategory = allItems.filter(item => item.category.toLowerCase() === categoryName.toLowerCase());

        const promotedItems = itemsForCategory.filter(item => {
            const restaurant = allRestaurants.find(r => r.id === item.restaurantId);
            return restaurant?.isPromoted;
        });

        const otherItems = itemsForCategory.filter(item => {
            const restaurant = allRestaurants.find(r => r.id === item.restaurantId);
            return !restaurant?.isPromoted;
        });

        setCategoryMenuItems([...promotedItems, ...otherItems]);
    } catch (e) {
        console.error("Failed to fetch menu items for category:", e);
        setCategoryMenuItems([]);
    } finally {
        setIsCategoryLoading(false);
    }
  };


    useEffect(() => {
        let results = [...allRestaurants];
        if (isPureVegFilter) {
            results = results.filter(r => r.isPureVeg);
        }
        if (isTopRatedFilter) {
            results = results.filter(r => r.rating >= 4.0);
        }
        setFilteredRestaurants(results);
    }, [isPureVegFilter, isTopRatedFilter, allRestaurants]);
  
  const categories = useMemo(() => {
      if (loading) return [];
      const cuisineMap = new Map<string, string | undefined>();
      allRestaurants.forEach(r => {
        if (r.cuisine && typeof r.cuisine === 'string' && r.cuisine.trim() !== '') {
            if (!cuisineMap.has(r.cuisine)) {
                cuisineMap.set(r.cuisine, r.categoryImageUrl);
            }
        }
      });
      return Array.from(cuisineMap.entries()).map(([name, imageUrl]) => ({ name, imageUrl }));
  }, [allRestaurants, loading]);
  
  const mainContent = (
    <>
      <div className="flex items-baseline gap-3 text-lg font-semibold mb-6 bg-card shadow-sm p-3 rounded-lg overflow-hidden">
            <MapPin className="h-6 w-6 text-primary animate-pulse flex-shrink-0" />
            <span className="text-muted-foreground whitespace-nowrap">Delivering to:</span>
            <div className="min-w-0">
                {location ? <span className="font-bold truncate">{location.city || 'your location'}</span> : <Skeleton className="h-5 w-24" />}
            </div>
        </div>

        <MobileSearch />

        {!isServiceAvailable && location && (
             <Alert variant="destructive" className="mb-8">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Service Not Available</AlertTitle>
                <AlertDescription>
                   We're sorry, but Village Eats is not yet available in {location.city}. We are expanding quickly, so please check back soon!
                </AlertDescription>
            </Alert>
        )}

        <PromotionalBanner config={bannerConfig} />
        
        {loading ? (
            <LoadingSkeleton />
        ) : (
          isServiceAvailable && (
            <div className="space-y-12">
              {categories.length > 0 && (
                  <section className="py-2">
                      <SectionHeading>What's on your mind?</SectionHeading>
                        <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
                           <CarouselContent className="-ml-2">
                              {categories.map((cat) => (
                              <CarouselItem key={cat.name} className="basis-auto pl-2">
                                  <CategoryItem 
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
                  <div className="space-y-4">
                      <Skeleton className="h-8 w-1/3" />
                       <div className="flex gap-4 overflow-hidden">
                           {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-48 w-40 rounded-lg flex-shrink-0" />)}
                       </div>
                  </div>
              )}

              {selectedCategory && !isCategoryLoading && categoryMenuItems.length > 0 && (
                   <section>
                      <SectionHeading>
                        Dishes for {selectedCategory}
                      </SectionHeading>
                       <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
                           <CarouselContent>
                              {categoryMenuItems.map((item) => (
                              <CarouselItem key={item.id} className="basis-4/5 sm:basis-1/2 md:basis-1/3">
                                  <div className="p-1 h-full">
                                    <MenuItemSearchCard item={item} />
                                  </div>
                              </CarouselItem>
                              ))}
                          </CarouselContent>
                           <CarouselPrevious className="hidden sm:flex" />
                          <CarouselNext className="hidden sm:flex" />
                      </Carousel>
                  </section>
              )}

               <section className="py-2">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                     <div className="bg-gradient-to-br from-red-500 to-orange-500 text-white p-6 rounded-xl flex items-center justify-between">
                         <div>
                             <h3 className="text-2xl font-bold">Offer Zone</h3>
                             <p className="opacity-80">Up to 60% OFF</p>
                         </div>
                         <Button variant="secondary" className="bg-white/20 hover:bg-white/30">View All</Button>
                     </div>
                      <div className="bg-gradient-to-br from-blue-500 to-teal-400 text-white p-6 rounded-xl flex items-center justify-between">
                         <div>
                             <h3 className="text-2xl font-bold">Fast Delivery</h3>
                             <p className="opacity-80">Restaurants under 30 mins</p>
                         </div>
                         <Button variant="secondary" className="bg-white/20 hover:bg-white/30">View All</Button>
                     </div>
                 </div>
              </section>

              <section className="py-2">
                 <div className="flex justify-between items-center mb-6">
                    <SectionHeading className="mb-0">{filteredRestaurants.length} restaurants to explore</SectionHeading>
                 </div>
                 <div className="flex flex-wrap items-center gap-2 mb-8">
                    <Button variant={isPureVegFilter ? 'default' : 'outline'} onClick={() => setIsPureVegFilter(p => !p)}>Pure Veg</Button>
                    <Button variant={isTopRatedFilter ? 'default' : 'outline'} onClick={() => setIsTopRatedFilter(p => !p)}>Rating 4.0+</Button>
                    <Button variant="outline">Sort By</Button>
                    <Button variant="outline">Offers</Button>
                 </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredRestaurants.map(restaurant => (
                    <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                ))}
                </div>
              </section>
            </div>
          )
        )}
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 sm:py-8">
        <div className={cn("grid lg:gap-8", isCartVisible ? "lg:grid-cols-4" : "lg:grid-cols-1")}>
          <div className={cn(isCartVisible ? "lg:col-span-3" : "lg:col-span-4")}>
            {mainContent}
          </div>
          {isCartVisible && (
            <aside className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24">
                <Cart restaurant={cartRestaurant!} />
              </div>
            </aside>
          )}
        </div>
        <Footer />
      </main>
      <FloatingCartBar />
    </div>
  );
}
