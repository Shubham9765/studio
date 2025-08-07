
'use client';

import { Header } from '@/components/header';
import { RestaurantCard } from '@/components/restaurant-card';
import type { MenuItem, Restaurant, BannerConfig } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ChefHat, Utensils, MapPin, ArrowRight, AlertTriangle, Search } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { getRestaurants, getTopRatedMenuItems, getServiceableCities, getBannerConfig } from '@/services/restaurantClientService';
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

function PromotionalBanner({ config }: { config: BannerConfig | null }) {
  if (!config?.isEnabled) {
    return null;
  }

  return (
    <section 
        className="mb-12 relative group"
    >
      {config.imageUrl ? (
        <Image 
          src={config.imageUrl}
          alt={config.heading || 'Promotional banner'}
          width={1200}
          height={400}
          className="w-full h-auto object-contain rounded-xl shadow-lg group-hover:shadow-2xl transition-all duration-300"
        />
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
    <div className="md:hidden mb-6">
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search restaurants or dishes..."
          className="pl-12 text-base h-12 rounded-full w-full bg-muted border-transparent focus-visible:ring-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </form>
    </div>
  );
}

export function HomePage() {
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [topMenuItems, setTopMenuItems] = useState<MenuItem[]>([]);
  const [serviceableCities, setServiceableCities] = useState<string[]>([]);
  const [bannerConfig, setBannerConfig] = useState<BannerConfig | null>(null);
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
        const [restaurants, menuItems, cities, banner] = await Promise.all([
          getRestaurants(),
          getTopRatedMenuItems(),
          getServiceableCities(),
          getBannerConfig(),
        ]);
        setAllRestaurants(restaurants);
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
