
'use client';

import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Utensils, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getGroceryCategoryTypes } from '@/services/restaurantClientService';
import type { GroceryCategory } from '@/lib/types';
import { cn } from '@/lib/utils';
import Image from 'next/image';

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


export default function GroceryPage() {
    const [categories, setCategories] = useState<GroceryCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoading(true);
                const fetchedCategories = await getGroceryCategoryTypes();
                setCategories(fetchedCategories);
            } catch (error) {
                console.error("Failed to fetch grocery categories:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    const handleCategoryClick = (categoryName: string) => {
        // This is just for UI selection for now.
        // Logic to filter items would be added here.
        setSelectedCategory(prev => prev === categoryName ? null : categoryName);
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-8">
                <h1 className="text-3xl font-bold mb-8">Groceries</h1>
                
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
                        <div className="flex flex-wrap gap-4">
                            {categories.map((cat) => (
                              <CategoryItem 
                                key={cat.name}
                                name={cat.name} 
                                imageUrl={cat.imageUrl}
                                isSelected={selectedCategory === cat.name}
                                onSelect={() => handleCategoryClick(cat.name)}
                              />
                            ))}
                        </div>
                  </section>
              )}


                <div className="flex items-center justify-center h-96">
                    <p className="text-muted-foreground">More grocery features coming soon!</p>
                </div>
            </main>
        </div>
    )
}
