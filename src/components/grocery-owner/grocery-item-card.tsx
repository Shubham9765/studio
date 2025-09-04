
'use client';

import Image from 'next/image';
import type { GroceryItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useGroceryCart } from '@/hooks/use-grocery-cart';
import { useToast } from '@/hooks/use-toast';
import { getGroceryStoreById } from '@/services/restaurantClientService';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface GroceryItemCardProps {
    item: GroceryItem;
    storeId: string;
}


export function GroceryItemCard({ item, storeId }: GroceryItemCardProps) {
    const { addItem } = useGroceryCart();
    const { toast } = useToast();

    const handleAddToCart = async () => {
        if (!item.isAvailable) return;

        const fullStore = await getGroceryStoreById(storeId);
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

    return (
        <div className={cn(
            "group relative rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col justify-between transition-all duration-300",
            !item.isAvailable && "bg-muted/50 text-muted-foreground cursor-not-allowed",
            item.isAvailable && "hover:shadow-lg hover:-translate-y-1"
        )}>
            <Dialog>
                <DialogTrigger asChild>
                    <div className="relative overflow-hidden cursor-pointer">
                        {item.imageUrl ? (
                            <Image
                                src={item.imageUrl}
                                alt={item.name}
                                width={300}
                                height={200}
                                className={cn("object-cover w-full h-32 transition-transform duration-300 group-hover:scale-105", !item.isAvailable && "grayscale")}
                            />
                        ) : (
                             <div className="w-full h-32 bg-muted flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">No Image</span>
                            </div>
                        )}
                        {!item.isAvailable && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-white font-bold text-sm tracking-wider">UNAVAILABLE</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-2xl">{item.name}</DialogTitle>
                         <DialogDescription className="flex items-center gap-2 pt-1">
                             <span className="font-semibold">{item.category}</span>
                        </DialogDescription>
                    </DialogHeader>
                    {item.imageUrl && (
                         <div className="relative w-full aspect-video rounded-lg overflow-hidden mt-2">
                            <Image
                                src={item.imageUrl}
                                alt={item.name}
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}
                    <p className="text-muted-foreground text-base py-2">{item.description}</p>
                    <div className="flex justify-between items-center">
                        <p className="font-bold text-primary text-2xl">Rs.{item.price.toFixed(2)}</p>
                        <Button size="lg" disabled={!item.isAvailable} onClick={handleAddToCart}>
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Add to Cart
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <div className="p-3 flex-grow flex flex-col">
                 <h3 className="font-semibold text-sm leading-tight flex-grow">{item.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 h-8">{item.description}</p>
            </div>
             <div className="flex justify-between items-center px-3 pb-3 mt-auto">
                <p className="font-bold text-primary text-base">Rs.{item.price.toFixed(2)} / {item.unit}</p>
                <Button size="sm" className="h-8 text-xs" disabled={!item.isAvailable} onClick={handleAddToCart}>
                    <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                    Add
                </Button>
            </div>
        </div>
    );
}
