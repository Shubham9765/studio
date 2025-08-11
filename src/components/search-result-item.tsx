
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Restaurant, MenuItem } from '@/lib/types';
import { ChefHat, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { getRestaurantById } from '@/services/restaurantClientService';

type SearchResult = 
    | { type: 'restaurant'; data: Restaurant }
    | { type: 'menuItem'; data: MenuItem };

interface SearchResultItemProps {
    result: SearchResult;
}

export function SearchResultItem({ result }: SearchResultItemProps) {
    const { addItem } = useCart();
    const { toast } = useToast();

    const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>, item: MenuItem) => {
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
    };

    const isRestaurant = result.type === 'restaurant';
    const data = result.data;
    const link = isRestaurant ? `/restaurant/${data.id}` : `/restaurant/${(data as MenuItem).restaurantId}`;

    const imageUrl = isRestaurant ? (data as Restaurant).image : (data as MenuItem).imageUrl;
    const name = data.name;
    const description = isRestaurant ? (data as Restaurant).cuisine : (data as MenuItem).description;

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
                            {isRestaurant ? <ChefHat className="h-8 w-8 text-muted-foreground" /> : <Utensils className="h-8 w-8 text-muted-foreground" />}
                        </div>
                    )}
                </div>
                <div className="flex-grow">
                    <p className="font-semibold group-hover:text-primary">{name}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
                </div>
                {!isRestaurant && (
                    <div className="text-right">
                        <p className="font-bold text-sm">Rs.{ (data as MenuItem).price.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Dish</p>
                    </div>
                )}
            </div>
        </Link>
    );
}
