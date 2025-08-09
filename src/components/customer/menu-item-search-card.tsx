
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { MenuItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/use-cart';
import { getRestaurantById } from '@/services/restaurantClientService';

interface MenuItemSearchCardProps {
    item: MenuItem;
}

export function MenuItemSearchCard({ item }: MenuItemSearchCardProps) {
    const { addItem } = useCart();
    const { toast } = useToast();

    const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!item.isAvailable) return;
        
        const fullRestaurant = await getRestaurantById(item.restaurantId);
        if (!fullRestaurant) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not find restaurant information.",
            });
            return;
        }
        
        addItem({ ...item, quantity: 1 }, fullRestaurant);
        toast({
            title: "Added to cart",
            description: `${item.name} has been added to your order.`,
        });
    }


    return (
        <div className={cn(
            "group relative rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col justify-between transition-all duration-300",
            !item.isAvailable && "bg-muted/50 text-muted-foreground cursor-not-allowed",
            item.isAvailable && "hover:shadow-lg hover:-translate-y-1"
        )}>
             <Link href={`/restaurant/${item.restaurantId}`} className="block flex flex-col h-full">
                {item.imageUrl && (
                    <div className="relative overflow-hidden">
                        <Image
                            src={item.imageUrl}
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
                )}
                <div className="p-3 flex-grow flex flex-col">
                    <h3 className="font-semibold text-sm leading-tight truncate flex-grow group-hover:text-primary">{item.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 h-8">{item.description}</p>
                </div>
            </Link>
             <div className="flex justify-between items-center px-3 pb-3 mt-auto">
                <p className="font-bold text-primary text-base">${item.price.toFixed(2)}</p>
                <Button size="sm" className="h-8 text-xs" disabled={!item.isAvailable} onClick={handleAddToCart}>
                    <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                    Add
                </Button>
            </div>
        </div>
    );
}
