
'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Cart } from '@/components/customer/cart';

export function FloatingCartBar() {
    const { cartCount, totalPrice, restaurant } = useCart();
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    if (cartCount === 0) return null;

    return (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-background/95 backdrop-blur-sm p-4 border-t z-40">
                 <SheetTrigger asChild>
                    <Button className="w-full h-14 text-lg">
                        <div className="flex justify-between items-center w-full">
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-base">{cartCount}</Badge>
                                <span>View Your Cart</span>
                            </div>
                            <span>${totalPrice.toFixed(2)}</span>
                        </div>
                    </Button>
                 </SheetTrigger>
            </div>
            <SheetContent side="bottom" className="h-4/5 flex flex-col">
                <SheetHeader className="text-left">
                    <SheetTitle>Your Order</SheetTitle>
                </SheetHeader>
                <div className="flex-grow overflow-hidden">
                    {restaurant && <Cart restaurant={restaurant} isSheet={true} />}
                </div>
                 <Button className="w-full h-12 text-lg mt-4" onClick={() => setIsSheetOpen(false)}>
                    Continue Browsing
                </Button>
            </SheetContent>
        </Sheet>
    );
}
