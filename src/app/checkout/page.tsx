
'use client';

import { useState, useEffect } from 'react';
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
import { AlertTriangle, CheckCircle, ShoppingCart, Banknote, Landmark, Crosshair, Loader2, Home, Building, Map } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createOrder } from '@/services/restaurantService';
import { getCoordinatesForAddress } from '@/services/restaurantClientService';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Order, Restaurant } from '@/lib/types';
import type { Address } from '@/hooks/use-auth';
import { useLocation } from '@/hooks/use-location';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogTrigger, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LocationPickerMap } from '@/components/location-picker-map';


export default function CheckoutPage() {
    const { cart, restaurant, totalPrice, clearCart } = useCart();
    const { user, loading: authLoading } = useAuth();
    const { location, requestLocation, error: locationError } = useLocation();
    const router = useRouter();
    const { toast } = useToast();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi'>('cash');
    const [transactionId, setTransactionId] = useState('');
    const [orderNotes, setOrderNotes] = useState('');
    
    // This state now holds either a saved address ID, 'current', or 'map'
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [mapSelectedLocation, setMapSelectedLocation] = useState<Address | null>(null);

    const [isLocating, setIsLocating] = useState(false);
    const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
    
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
        if (!selectedAddressId) {
            if (user?.addresses && user.addresses.length > 0) {
                setSelectedAddressId(user.addresses[0].id);
            } else {
                setSelectedAddressId('current');
            }
        }
    }, [authLoading, user, selectedAddressId]);
    
    const handleAddressSelectionChange = (value: string) => {
        setSelectedAddressId(value);
        if (value === 'map') {
            setIsMapDialogOpen(true);
        } else if (value === 'current') {
            setIsLocating(true);
            requestLocation();
        }
    };


    useEffect(() => {
        if (selectedAddressId === 'current') {
            if (location) {
                toast({ title: "Location Set!", description: "Your current location will be used for delivery." });
            }
            if (locationError) {
                toast({ variant: 'destructive', title: "Location Error", description: locationError });
            }
             setIsLocating(false);
        }
    }, [location, locationError, selectedAddressId, toast]);

     const handleMapLocationSelect = (loc: { latitude: number; longitude: number; address: string }) => {
        setMapSelectedLocation({
            id: 'map-selected',
            name: 'Selected on Map',
            phone: user?.phone || '',
            ...loc
        });
        setIsMapDialogOpen(false);
        toast({ title: 'Location Pinned!', description: 'Your selected location will be used for delivery.' });
    };

    const deliveryFee = restaurant?.deliveryCharge || 0;
    const subtotal = totalPrice;
    
    const gstRate = 0.05; 
    const gstEnabled = restaurant?.gstEnabled || false;
    const gstAmount = gstEnabled ? subtotal * gstRate : 0;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;
    
    const finalTotal = subtotal + deliveryFee + gstAmount;

    const getFinalAddress = (): Address | null => {
        if (selectedAddressId === 'current') {
            if (location) {
                return {
                    id: 'current-location',
                    name: 'Current Location',
                    address: location.address,
                    phone: user?.phone || '',
                    ...location,
                };
            }
            return null;
        }
        if (selectedAddressId === 'map') {
            return mapSelectedLocation;
        }
        return user?.addresses?.find(a => a.id === selectedAddressId) || null;
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        let finalAddress = getFinalAddress();

        if (!user || !restaurant || !finalAddress) {
            toast({
                variant: 'destructive',
                title: 'Information Required',
                description: 'Please select a delivery address.',
            });
            return;
        }

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
            if (selectedAddressId !== 'current' && selectedAddressId !== 'map' && finalAddress && (!finalAddress.latitude || !finalAddress.longitude)) {
                const coords = await getCoordinatesForAddress(finalAddress.address);
                if (coords) {
                    finalAddress = { ...finalAddress, ...coords };
                } else {
                    console.warn(`Could not find coordinates for address: ${finalAddress.address}. Proceeding without them.`);
                }
            }

            const orderDetails: Partial<Order> = {
                paymentMethod,
                paymentStatus: paymentMethod === 'upi' ? 'pending' : 'pending',
                ...(paymentMethod === 'upi' && { paymentDetails: { transactionId } }),
                deliveryAddress: finalAddress.address,
                customerPhone: finalAddress.phone,
                customerAddress: finalAddress,
                notes: orderNotes,
            };

            await createOrder(user.uid, user.displayName || 'N/A', restaurant as Restaurant, cart, finalTotal, orderDetails);
            setOrderPlaced(true);
            clearCart();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Order Failed',
                description: (error.message || 'There was an issue placing your order. Please try again.'),
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
        return (
             <div className="min-h-screen bg-background">
                <Header />
                <main className="container py-8 flex items-center justify-center">
                     <p>Redirecting to login...</p>
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
                            <Button className="w-full" onClick={() => router.push('/')}>Goto Order Food</Button>
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
                                    <div className="space-y-4">
                                        <Label>Delivery Location</Label>
                                        
                                        <RadioGroup 
                                            value={selectedAddressId || ''}
                                            onValueChange={handleAddressSelectionChange} 
                                            className="space-y-2"
                                        >
                                            {user.addresses?.map(addr => (
                                                <Label key={addr.id} htmlFor={addr.id} className="flex items-start gap-4 rounded-lg border p-4 cursor-pointer hover:bg-accent has-[[data-state=checked]]:border-primary">
                                                    <RadioGroupItem value={addr.id} id={addr.id} className="mt-1" />
                                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center mt-1">
                                                        {addr.name.toLowerCase() === 'home' ? <Home className="h-5 w-5 text-muted-foreground" /> : <Building className="h-5 w-5 text-muted-foreground"/>}
                                                        </div>
                                                        <div className="text-sm flex-grow">
                                                        <p className="font-bold">{addr.name}</p>
                                                        <p className="text-muted-foreground">{addr.address}</p>
                                                        <p className="text-muted-foreground">{addr.phone}</p>
                                                        </div>
                                                </Label>
                                            ))}
                                            <Label htmlFor="current" className="flex items-start gap-4 rounded-lg border p-4 cursor-pointer hover:bg-accent has-[[data-state=checked]]:border-primary">
                                                <RadioGroupItem value="current" id="current" className="mt-1" />
                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center mt-1">
                                                    <Crosshair className="h-5 w-5 text-muted-foreground"/>
                                                </div>
                                                <div className="text-sm flex-grow">
                                                    <p className="font-bold">Use Current Location</p>
                                                    {selectedAddressId === 'current' && isLocating && <p className="text-muted-foreground">Getting your location...</p>}
                                                    {selectedAddressId === 'current' && locationError && <p className="text-destructive text-xs">{locationError}</p>}
                                                    {selectedAddressId === 'current' && location && <p className="text-muted-foreground text-xs">{location.address}</p>}
                                                </div>
                                            </Label>
                                            
                                            <Label htmlFor="map" className="flex items-start gap-4 rounded-lg border p-4 cursor-pointer hover:bg-accent has-[[data-state=checked]]:border-primary">
                                                <RadioGroupItem value="map" id="map" className="mt-1" />
                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center mt-1">
                                                    <Map className="h-5 w-5 text-muted-foreground"/>
                                                </div>
                                                <div className="text-sm flex-grow">
                                                    <p className="font-bold">Set Location on Map</p>
                                                    {selectedAddressId === 'map' && mapSelectedLocation && <p className="text-muted-foreground text-xs">{mapSelectedLocation.address}</p>}
                                                </div>
                                            </Label>
                                        </RadioGroup>

                                        <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
                                                <DialogContent className="sm:max-w-2xl h-4/5 flex flex-col">
                                                    <DialogHeader>
                                                        <DialogTitle>Pin Your Delivery Location</DialogTitle>
                                                        <DialogDescription>Drag the marker to your exact location and click confirm.</DialogDescription>
                                                    </DialogHeader>
                                                    <LocationPickerMap onLocationSelect={handleMapLocationSelect} />
                                                </DialogContent>
                                        </Dialog>
                                        
                                        {(user.addresses?.length || 0) === 0 && (
                                             <Alert>
                                                <AlertTriangle className="h-4 w-4" />
                                                <AlertTitle>No Saved Addresses</AlertTitle>
                                                <AlertDescription>
                                                    You don't have any saved addresses. You can add one in your profile for faster checkout next time.
                                                    <Button asChild variant="link" className="p-0 h-auto ml-1">
                                                        <Link href="/profile">Go to Profile</Link>
                                                    </Button>
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </div>
                                    
                                    <Separator />

                                    <div className="space-y-4">
                                        <Label htmlFor="orderNotes">Special Instructions (Optional)</Label>
                                        <Textarea 
                                            id="orderNotes"
                                            placeholder="e.g., make it extra spicy, no onions, etc."
                                            value={orderNotes}
                                            onChange={(e) => setOrderNotes(e.target.value)}
                                        />
                                    </div>
                                    
                                    <Separator />

                                     <div className="space-y-4">
                                        <Label>Payment Method</Label>
                                         <RadioGroup value={paymentMethod} onValueChange={(val) => setPaymentMethod(val as 'cash' | 'upi')} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {restaurant?.paymentMethods?.cash && (
                                                <Label htmlFor="cash" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer">
                                                    <RadioGroupItem value="cash" id="cash" className="sr-only" />
                                                    <Banknote className="mb-3 h-6 w-6" />
                                                    Cash on Delivery
                                                </Label>
                                            )}
                                             {restaurant?.paymentMethods?.upi && (
                                                <Label htmlFor="upi" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer">
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
                                     <Button type="submit" className="w-full" disabled={isSubmitting || !getFinalAddress()}>
                                        {isSubmitting ? (isLocating ? 'Getting Location...' : 'Placing Order...') : `Place Order - Rs.${finalTotal.toFixed(2)}`}
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
                                        <Image src={item.imageUrl || 'https://placehold.co/100x100.png'} alt={item.name} width={48} height={48} className="rounded-md h-12 w-12 object-cover" />
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="font-semibold text-sm">Rs.{(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                ))}
                                </div>
                                <Separator />
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>Rs.{subtotal.toFixed(2)}</span>
                                    </div>
                                     <div className="flex justify-between">
                                        <span>Delivery Fee</span>
                                        <span>Rs.{deliveryFee.toFixed(2)}</span>
                                    </div>
                                    {gstEnabled && (
                                        <>
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>CGST (2.5%)</span>
                                                <span>Rs.{cgst.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>SGST (2.5%)</span>
                                                <span>Rs.{sgst.toFixed(2)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>Rs.{finalTotal.toFixed(2)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </main>
        </div>
    );
}

    