
'use client';

import Image from 'next/image';
import type { MenuItem, Restaurant } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { getRestaurantById } from '@/services/restaurantService';

interface MenuItemCardProps {
    item: MenuItem;
    restaurantId: string;
}

export function MenuItemCard({ item, restaurantId }: MenuItemCardProps) {
    const { addItem, restaurant: cartRestaurant, clearCart } = useCart();
    const { toast } = useToast();

    const handleAddToCart = async () => {
        if (!item.isAvailable) return;

        const handleAddItem = async () => {
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
        
        if (cartRestaurant && cartRestaurant.id !== restaurantId) {
             if (confirm('Your cart contains items from another restaurant. Would you like to clear it and add this item instead?')) {
                clearCart();
                await handleAddItem();
            }
        } else {
            await handleAddItem();
        }
    }

    return (
        <div className={cn(
            "rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col justify-between transition-all duration-300",
            !item.isAvailable && "bg-muted/50 text-muted-foreground"
        )}>
            {item.imageUrl && (
                 <div className="relative">
                    <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={400}
                        height={250}
                        className={cn("object-cover w-full h-48", !item.isAvailable && "grayscale")}
                    />
                     {!item.isAvailable && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white font-bold text-lg tracking-wider">UNAVAILABLE</span>
                        </div>
                     )}
                </div>
            )}
            <div className="p-4 flex-grow">
                <h3 className="font-bold text-lg">{item.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 h-12 overflow-hidden">{item.description}</p>
            </div>
             <div className="flex justify-between items-center p-4 pt-2">
                <p className="font-semibold text-primary text-lg">${item.price.toFixed(2)}</p>
                <Button size="sm" disabled={!item.isAvailable} onClick={handleAddToCart}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add
                </Button>
            </div>
        </div>
    );
}
