
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
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 lg:hidden bg-transparent p-4 z-40 flex justify-center">
                 <SheetTrigger asChild>
                    <Button className="h-16 w-auto px-6 rounded-full shadow-lg text-lg flex items-center justify-center gap-4 animate-bounce-slow">
                        <div className="relative">
                            <ShoppingCart className="h-7 w-7"/>
                            <Badge variant="secondary" className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center rounded-full text-sm font-bold text-primary bg-white border-2 border-primary">
                                {cartCount}
                            </Badge>
                        </div>
                        <span className="font-bold text-lg">Rs.{totalPrice.toFixed(2)}</span>
                    </Button>
                 </SheetTrigger>
            </div>
            <SheetContent side="bottom" className="h-4/5 flex flex-col rounded-t-2xl border-t-4 border-primary shadow-2xl">
                <SheetHeader className="text-left flex-row items-center gap-3">
                    <ShoppingCart className="h-6 w-6 text-primary"/>
                    <SheetTitle className="text-2xl font-bold">Your Order</SheetTitle>
                </SheetHeader>
                <div className="flex-grow overflow-hidden py-4">
                    {restaurant && <Cart restaurant={restaurant} isSheet={true} />}
                </div>
            </SheetContent>
        </Sheet>
    );
}
