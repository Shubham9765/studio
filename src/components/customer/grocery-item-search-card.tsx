

'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { GroceryItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PlusCircle, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGroceryCart } from '@/hooks/use-grocery-cart';
import { getGroceryStoreById } from '@/services/restaurantClientService';

interface GroceryItemSearchCardProps {
    item: GroceryItem;
}


export function GroceryItemSearchCard({ item }: GroceryItemSearchCardProps) {
    const { addItem } = useGroceryCart();
    const { toast } = useToast();

    const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!item.isAvailable) return;
        
        const fullStore = await getGroceryStoreById(item.storeId);
        if (!fullStore) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not find store information.",
            });
            return;
        }
        
        addItem({ ...item, quantity: 1 }, fullStore);
        toast({
            title: "Added to cart",
            description: `${item.name} has been added to your grocery cart.`,
        });
    }

    const isPromoted = item.store?.isPromoted;

    return (
         <div className={cn(
            "group relative rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col justify-between transition-all duration-300 h-full",
            !item.isAvailable && "bg-muted/50 text-muted-foreground cursor-not-allowed",
            item.isAvailable && "hover:shadow-lg hover:-translate-y-1",
            isPromoted && "border-amber-400 border-2"
        )}>
             <Link href={`/grocery/store/${item.storeId}`} className="block flex flex-col h-full">
                <div className="relative overflow-hidden">
                     {isPromoted && (
                        <div className="absolute top-2 -left-10 bg-amber-400 text-black px-12 py-1 text-xs font-bold shadow-lg transform -rotate-45 z-10 flex items-center gap-1">
                            <Sparkles className="w-3 h-3"/>
                            <span>Promoted</span>
                        </div>
                    )}
                    <Image
                        src={item.imageUrl || 'https://placehold.co/300x200.png'}
                        alt={item.name}
                        width={300}
                        height={200}
                        className={cn("object-cover w-full h-32 transition-transform duration-300 group-hover:scale-105", !item.isAvailable && "grayscale")}
                    />
                    {!item.isAvailable && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-white font-bold text-sm tracking-wider">UNAVAILABLE</span>
                        </div>
                    )}
                </div>
                <div className="p-3 flex-grow flex flex-col">
                    <h3 className="font-semibold text-sm leading-tight flex-grow group-hover:text-primary">{item.name}</h3>
                     <p className="text-xs text-muted-foreground mt-1 font-medium">{item.store?.name}</p>
                </div>
                <div className="flex justify-between items-center px-3 pb-3 mt-auto">
                    <p className="font-bold text-primary text-base">Rs.{item.price.toFixed(2)} / {item.unit}</p>
                    <Button size="sm" className="h-8 text-xs" disabled={!item.isAvailable} onClick={handleAddToCart}>
                        <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                        Add
                    </Button>
                </div>
             </Link>
        </div>
    );
}

