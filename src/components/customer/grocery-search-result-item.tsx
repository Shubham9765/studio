
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { GroceryStore, GroceryItem } from '@/lib/types';
import { Store, Carrot } from 'lucide-react';
import { useGroceryCart } from '@/hooks/use-grocery-cart';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import { PlusCircle } from 'lucide-react';
import { getGroceryStoreById } from '@/services/restaurantClientService';

type SearchResult = 
    | { type: 'store'; data: GroceryStore }
    | { type: 'item'; data: GroceryItem };

interface GrocerySearchResultItemProps {
    result: SearchResult;
}

export function GrocerySearchResultItem({ result }: GrocerySearchResultItemProps) {
    const { addItem } = useGroceryCart();
    const { toast } = useToast();

    const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>, item: GroceryItem) => {
        e.preventDefault();
        e.stopPropagation();

        if (!item.isAvailable) return;
        
        // This is a bit inefficient, but needed to get the full store object for the cart.
        // A better implementation might embed the full store object in the search result.
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
    };

    const isStore = result.type === 'store';
    const data = result.data;
    // The link will be to the store page, which we'll implement later.
    const link = isStore ? `/grocery/store/${data.id}` : `/grocery/store/${(data as GroceryItem).storeId}`;

    const imageUrl = data.image || (data as GroceryItem).imageUrl;
    const name = data.name;
    const description = isStore ? (data as GroceryStore).address : (data as GroceryItem).description;

    return (
        <Link href={link} className="block group">
            <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="relative flex-shrink-0">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={name}
                            width={64}
                            height={64}
                            className="rounded-md object-cover h-16 w-16"
                        />
                    ) : (
                        <div className="h-16 w-16 rounded-md bg-secondary flex items-center justify-center">
                            {isStore ? <Store className="h-8 w-8 text-muted-foreground" /> : <Carrot className="h-8 w-8 text-muted-foreground" />}
                        </div>
                    )}
                </div>
                <div className="flex-grow">
                    <p className="font-semibold group-hover:text-primary">{name}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{description || 'No description'}</p>
                     {!isStore && (
                        <p className="text-xs text-muted-foreground mt-1">
                            Sold by: {(data as GroceryItem).store?.name || '...'}
                        </p>
                    )}
                </div>
                {!isStore ? (
                    <div className="flex flex-col items-end gap-2">
                        <p className="font-bold text-sm">Rs.{ (data as GroceryItem).price.toFixed(2)}</p>
                        <Button size="sm" className="h-7 text-xs" disabled={!(data as GroceryItem).isAvailable} onClick={(e) => handleAddToCart(e, data as GroceryItem)}>
                            <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                            Add
                        </Button>
                    </div>
                ) : (
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Store</p>
                    </div>
                )}
            </div>
        </Link>
    );
}

