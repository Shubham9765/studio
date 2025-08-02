
'use client';

import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingCart, X, Plus, Minus } from 'lucide-react';
import type { Restaurant } from '@/lib/types';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CartProps {
    restaurant: Partial<Restaurant>;
    isSheet?: boolean;
}

export function Cart({ restaurant, isSheet = false }: CartProps) {
  const { cart, restaurant: cartRestaurant, removeItem, updateItemQuantity } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = () => {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Not logged in',
            description: 'Please log in to place an order.',
        });
        return;
    }
    setIsCheckingOut(true);
    router.push('/checkout');
  }

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = restaurant.deliveryCharge || 0;
  const total = subtotal + deliveryFee;

  const cartContainerClass = cn(
      "text-card-foreground flex flex-col h-full", 
      !isSheet && "rounded-lg border bg-card shadow-sm"
  );
  
  // Render nothing if cart is not for this restaurant
  if (cart.length > 0 && cartRestaurant?.id !== restaurant.id) {
     return (
        <div className={cartContainerClass}>
            <div className="p-6">
                <div className="flex items-center justify-center gap-3 mb-6">
                    <ShoppingCart className="h-7 w-7"/>
                    <h2 className="text-2xl font-bold">Your Order</h2>
                </div>
                <div className="text-center text-muted-foreground py-12">
                    <p>Your cart has items from another restaurant.</p>
                </div>
            </div>
            <div className="p-6 mt-auto">
                <Button className="w-full" disabled>Checkout</Button>
            </div>
        </div>
    );
  }

  return (
    <div className={cartContainerClass}>
      <div className={cn("flex items-center justify-center gap-3", isSheet ? "p-0 pb-4" : "p-6")}>
        <ShoppingCart className="h-7 w-7" />
        <h2 className="text-2xl font-bold">Your Order</h2>
      </div>

      {cart.length === 0 ? (
        <div className="text-center text-muted-foreground py-12 px-6 flex-grow flex flex-col justify-center items-center">
          <p>Your cart is empty.</p>
          <p className="text-sm">Add items from the menu to get started.</p>
        </div>
      ) : (
        <>
            <ScrollArea className="flex-grow">
                 <div className="px-6 space-y-4">
                    {cart.map(item => (
                        <div key={item.id} className="flex items-start gap-4">
                            <Image
                                src={item.imageUrl || 'https://placehold.co/100x100.png'}
                                alt={item.name}
                                width={64}
                                height={64}
                                className="rounded-md object-cover h-16 w-16"
                            />
                            <div className="flex-1">
                                <p className="font-semibold">{item.name}</p>
                                <p className="text-primary font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateItemQuantity(item.id, item.quantity - 1)}>
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateItemQuantity(item.id, item.quantity + 1)}>
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(item.id)}>
                                <X className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </div>
                    ))}
                 </div>
            </ScrollArea>
             <div className="p-6 space-y-3 mt-auto">
                <Separator />
                <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span>Delivery Fee</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                </div>
            </div>
        </>
      )}

      <div className={cn("mt-auto", isSheet ? "p-0" : "p-6 pt-0")}>
         <Button 
            className="w-full h-12 text-lg" 
            disabled={cart.length === 0 || isCheckingOut}
            onClick={handleCheckout}
        >
             {isCheckingOut ? 'Proceeding...' : 'Go to Checkout'}
         </Button>
      </div>
    </div>
  );
}
