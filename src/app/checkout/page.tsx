
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createOrder } from '@/services/restaurantService';
import { Skeleton } from '@/components/ui/skeleton';

export default function CheckoutPage() {
    const { cart, restaurant, totalPrice, clearCart } = useCart();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);

    const deliveryFee = restaurant?.deliveryCharge || 0;
    const finalTotal = totalPrice + deliveryFee;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user || !restaurant) return;

        setIsSubmitting(true);
        try {
            await createOrder(user.uid, restaurant.id!, cart, finalTotal);
            setOrderPlaced(true);
            clearCart();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Order Failed',
                description: 'There was an issue placing your order. Please try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (authLoading) {
        return (
             <div className="min-h-screen bg-background">
                <Header />
                <main className="container py-8">
                     <Skeleton className="h-96 w-full" />
                </main>
            </div>
        )
    }

    if (!user) {
        // This should ideally be handled by a route guard or redirect in a larger app
        // For now, just show a message.
        router.push('/');
        return (
             <div className="min-h-screen bg-background">
                <Header />
                <main className="container py-8 flex items-center justify-center">
                    <Alert variant="destructive" className="w-1/2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Access Denied</AlertTitle>
                        <AlertDescription>You must be logged in to access the checkout page.</AlertDescription>
                    </Alert>
                </main>
            </div>
        )
    }

    if (cart.length === 0 && !orderPlaced) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container py-8 flex items-center justify-center text-center">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <h2 className="text-2xl font-bold">Your cart is empty</h2>
                            <p className="text-muted-foreground mt-2">Looks like you haven't added anything to your cart yet.</p>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" onClick={() => router.push('/')}>Start Shopping</Button>
                        </CardFooter>
                    </Card>
                </main>
            </div>
        );
    }
    
    if (orderPlaced) {
         return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container py-8 flex items-center justify-center text-center">
                    <Card className="w-full max-w-md">
                        <CardHeader className="items-center">
                           <CheckCircle className="h-16 w-16 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <h2 className="text-2xl font-bold">Order Placed Successfully!</h2>
                            <p className="text-muted-foreground mt-2">
                                Thank you for your order. You can track its status in your order history.
                            </p>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" onClick={() => router.push('/')}>Continue Shopping</Button>
                        </CardFooter>
                    </Card>
                </main>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-8">
                <h1 className="text-3xl font-bold mb-8">Checkout</h1>
                <div className="grid lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2">
                         <form onSubmit={handleSubmit}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Delivery & Payment</CardTitle>
                                    <CardDescription>Confirm your details and place the order.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="address">Delivery Address</Label>
                                        <Input id="address" placeholder="123 Main St, Anytown, USA" defaultValue={user.displayName || ''} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input id="phone" placeholder="Your contact number" defaultValue={user.phone || ''} required />
                                    </div>
                                     <div className="space-y-4">
                                        <Label>Payment Method</Label>
                                        <Card className="bg-muted/50 p-4">
                                            <div className="flex items-center gap-4">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                                                <div>
                                                    <p className="font-semibold">Paying with Card</p>
                                                    <p className="text-sm text-muted-foreground">Mastercard ending in 1234</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-center mt-4 text-muted-foreground">Payment section is for demonstration purposes.</p>
                                        </Card>
                                     </div>
                                </CardContent>
                                <CardFooter>
                                     <Button type="submit" className="w-full" disabled={isSubmitting}>
                                        {isSubmitting ? 'Placing Order...' : `Place Order - $${finalTotal.toFixed(2)}`}
                                     </Button>
                                </CardFooter>
                            </Card>
                         </form>
                    </div>
                    <aside>
                        <Card>
                            <CardHeader>
                                <CardTitle>Your Order</CardTitle>
                                <CardDescription>From: {restaurant?.name}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                                {cart.map(item => (
                                    <div key={item.id} className="flex items-center gap-4">
                                        <Image src={item.imageUrl || 'https://placehold.co/100x100'} alt={item.name} width={48} height={48} className="rounded-md h-12 w-12 object-cover" />
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="font-semibold text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                ))}
                                </div>
                                <Separator />
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>${totalPrice.toFixed(2)}</span>
                                    </div>
                                     <div className="flex justify-between">
                                        <span>Delivery Fee</span>
                                        <span>${deliveryFee.toFixed(2)}</span>
                                    </div>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>${finalTotal.toFixed(2)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </main>
        </div>
    );
}
