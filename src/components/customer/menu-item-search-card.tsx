
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { MenuItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

interface MenuItemSearchCardProps {
    item: MenuItem;
}

export function MenuItemSearchCard({ item }: MenuItemSearchCardProps) {

    return (
         <Link href={`/restaurant/${item.restaurantId}`} className="block">
            <div className={cn(
                "rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex items-center gap-4 p-4 transition-all duration-300 hover:shadow-lg",
                !item.isAvailable && "bg-muted/50 text-muted-foreground"
            )}>
                {item.imageUrl && (
                    <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={80}
                        height={80}
                        className={cn("rounded-lg object-cover h-20 w-20", !item.isAvailable && "grayscale")}
                    />
                )}
                <div className="flex-1">
                    <h3 className="font-bold text-lg">{item.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                     <div className="flex justify-between items-center mt-2">
                        <p className="font-semibold text-primary text-md">${item.price.toFixed(2)}</p>
                    </div>
                </div>
                {!item.isAvailable && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-bold text-lg tracking-wider">UNAVAILABLE</span>
                    </div>
                )}
            </div>
        </Link>
    );
}
