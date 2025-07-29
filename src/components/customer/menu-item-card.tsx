
'use client';

import Image from 'next/image';
import type { MenuItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

interface MenuItemCardProps {
    item: MenuItem;
}

export function MenuItemCard({ item }: MenuItemCardProps) {

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
                <Button size="sm" disabled={!item.isAvailable}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add
                </Button>
            </div>
        </div>
    );
}

