
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
import { AlertTriangle, CheckCircle, ShoppingCart, Banknote, Landmark } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createOrder } from '@/services/restaurantService';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Order, Restaurant } from '@/lib/types';

export default function CheckoutPage() {
    const { cart, restaurant, totalPrice, clearCart } = useCart();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi'>('cash');
    const [transactionId, setTransactionId] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState(user?.displayName || '');
    const [customerPhone, setCustomerPhone] = useState(user?.phone || '');

    const deliveryFee = restaurant?.deliveryCharge || 0;
    const finalTotal = totalPrice + deliveryFee;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user || !restaurant) return;

        if (paymentMethod === 'upi' && !transactionId) {
            toast({
                variant: 'destructive',
                title: 'Transaction ID Required',
                description: 'Please enter the UPI transaction ID to proceed.',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const orderDetails: Partial<Order> = {
                paymentMethod,
                paymentStatus: paymentMethod === 'cash' ? 'pending' : 'pending',
                ...(paymentMethod === 'upi' && { paymentDetails: { transactionId } }),
                deliveryAddress,
                customerPhone,
            };

            await createOrder(user.uid, user.username || 'N/A', restaurant as Restaurant, cart, finalTotal, orderDetails);
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
                        <CardFooter className="flex-col gap-2">
                            <Button className="w-full" onClick={() => router.push('/my-orders')}>Track Order</Button>
                            <Button className="w-full" variant="outline" onClick={() => router.push('/')}>Continue Shopping</Button>
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
                                        <Input id="address" placeholder="123 Main St, Anytown, USA" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input id="phone" placeholder="Your contact number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
                                    </div>
                                     <div className="space-y-4">
                                        <Label>Payment Method</Label>
                                         <RadioGroup value={paymentMethod} onValueChange={(val) => setPaymentMethod(val as 'cash' | 'upi')} className="grid grid-cols-2 gap-4">
                                            {restaurant?.paymentMethods?.cash && (
                                                <Label htmlFor="cash" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                                                    <RadioGroupItem value="cash" id="cash" className="sr-only" />
                                                    <Banknote className="mb-3 h-6 w-6" />
                                                    Cash on Delivery
                                                </Label>
                                            )}
                                             {restaurant?.paymentMethods?.upi && (
                                                <Label htmlFor="upi" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                                                    <RadioGroupItem value="upi" id="upi" className="sr-only" />
                                                    <Landmark className="mb-3 h-6 w-6" />
                                                    Pay with UPI
                                                </Label>
                                            )}
                                        </RadioGroup>
                                     </div>

                                    {paymentMethod === 'upi' && restaurant?.paymentMethods.upi && (
                                        <Card className="bg-muted/50 p-4">
                                            <CardTitle className="text-lg mb-2">UPI Payment</CardTitle>
                                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                                                {restaurant.paymentMethods.upiQrCodeUrl && (
                                                    <Image src={restaurant.paymentMethods.upiQrCodeUrl} alt="UPI QR Code" width={128} height={128} className="rounded-md" />
                                                )}
                                                <div className="flex-1 space-y-2">
                                                     <p className="text-sm">Scan the QR code or use the UPI ID below.</p>
                                                     <p className="font-semibold text-base">
                                                        <span className="font-normal text-muted-foreground">UPI ID: </span> 
                                                        {restaurant.paymentMethods.upiId}
                                                    </p>
                                                     <div className="space-y-2">
                                                        <Label htmlFor="transactionId">Transaction ID</Label>
                                                        <Input 
                                                            id="transactionId" 
                                                            placeholder="Enter UPI transaction ID" 
                                                            value={transactionId}
                                                            onChange={(e) => setTransactionId(e.target.value)}
                                                            required
                                                        />
                                                     </div>
                                                </div>
                                            </div>
                                             <p className="text-xs text-center mt-4 text-muted-foreground">After payment, enter the transaction ID and place your order. The restaurant will verify the payment.</p>
                                        </Card>
                                    )}

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
