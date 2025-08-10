
'use client';

import Image from 'next/image';
import type { MenuItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { getRestaurantById } from '@/services/restaurantClientService';

interface MenuItemCardProps {
    item: MenuItem;
    restaurantId: string;
}

function VegNonVegIcon({ type }: { type: 'veg' | 'non-veg' }) {
    const isVeg = type === 'veg';
    return (
        <div className={cn("w-4 h-4 rounded-sm border flex items-center justify-center", isVeg ? "border-green-600" : "border-red-600")}>
            <div className={cn("w-2 h-2 rounded-full", isVeg ? "bg-green-600" : "bg-red-600")}></div>
        </div>
    )
}

export function MenuItemCard({ item, restaurantId }: MenuItemCardProps) {
    const { addItem } = useCart();
    const { toast } = useToast();

    const handleAddToCart = async () => {
        if (!item.isAvailable) return;

        const fullRestaurant = await getRestaurantById(restaurantId);
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
            )}
            <div className="p-3 flex-grow flex flex-col">
                 <div className="flex items-center gap-2">
                    <VegNonVegIcon type={item.type} />
                    <h3 className="font-semibold text-sm leading-tight flex-grow">{item.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 h-8">{item.description}</p>
            </div>
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
