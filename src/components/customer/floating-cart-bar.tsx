
'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Cart } from '@/components/customer/cart';
import { ShoppingCart } from 'lucide-react';

export function FloatingCartBar() {
    const { cartCount, totalPrice, restaurant } = useCart();
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    if (cartCount === 0) return null;

    return (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-transparent p-4 z-40 flex justify-end">
                 <SheetTrigger asChild>
                    <Button className="h-16 w-16 rounded-full shadow-lg text-lg flex flex-col items-center justify-center gap-0.5">
                        <ShoppingCart className="h-6 w-6"/>
                        <span className="font-bold text-sm">Rs.{totalPrice.toFixed(2)}</span>
                         <Badge variant="secondary" className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center rounded-full text-sm">
                            {cartCount}
                        </Badge>
                    </Button>
                 </SheetTrigger>
            </div>
            <SheetContent side="bottom" className="h-4/5 flex flex-col rounded-t-2xl">
                <SheetHeader className="text-left">
                    <SheetTitle>Your Order</SheetTitle>
                </SheetHeader>
                <div className="flex-grow overflow-hidden py-4">
                    {restaurant && <Cart restaurant={restaurant} isSheet={true} />}
                </div>
            </SheetContent>
        </Sheet>
    );
}
