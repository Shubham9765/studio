
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { verifyDeliveryOtpAndDeliver } from '@/services/ownerService';
import { updateDeliveryBoyLocation } from '@/services/userService';
import { listenToOrdersForDeliveryBoy } from '@/services/restaurantClientService';
import type { Order } from '@/lib/types';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Bike, Check, User, Phone, MapPin, History, Expand, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '../ui/dialog';
import { Input } from '../ui/input';
import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('@/components/live-map').then(mod => mod.LiveMap), {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />
});

function MapDialog({ order, deliveryBoyLocation }: { order: Order; deliveryBoyLocation: { latitude: number; longitude: number } | null }) {
    const showMap = deliveryBoyLocation?.latitude && deliveryBoyLocation?.longitude && order.customerAddress?.latitude && order.customerAddress?.longitude;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                    <Expand className="mr-2 h-4 w-4" />
                    View Full Map
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-4">
                <DialogHeader>
                    <DialogTitle>Live Tracking for Order #{order.id.substring(0, 6)}</DialogTitle>
                </DialogHeader>
                <div className="flex-grow w-full rounded-md overflow-hidden">
                    {showMap ? (
                        <Suspense fallback={<Skeleton className="h-full w-full" />}>
                            <LiveMap
                                customerLat={order.customerAddress!.latitude!}
                                customerLng={order.customerAddress!.longitude!}
                                deliveryBoyLat={deliveryBoyLocation.latitude!}
                                deliveryBoyLng={deliveryBoyLocation.longitude!}
                            />
                        </Suspense>
                    ) : (
                        <div className="h-full w-full bg-muted flex items-center justify-center text-center p-4">
                            <p className="text-sm text-muted-foreground">Map will be displayed once customer and delivery locations are available.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function VerifyDeliveryDialog({ orderId, onVerified }: { orderId: string; onVerified: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [otp, setOtp] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const { toast } = useToast();

    const handleVerify = async () => {
        if (otp.length !== 4) {
            toast({ variant: 'destructive', title: 'Invalid OTP', description: 'Please enter a 4-digit OTP.' });
            return;
        }
        setIsVerifying(true);
        try {
            await verifyDeliveryOtpAndDeliver(orderId, otp);
            toast({ title: 'Order Delivered!', description: 'The order has been marked as complete.' });
            onVerified();
            setIsOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Verification Failed', description: error.message });
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="w-full">
                    <Check className="mr-2 h-4 w-4" /> Mark as Delivered
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Verify Delivery</DialogTitle>
                    <DialogDescription>
                        Please enter the 4-digit OTP from the customer to confirm delivery.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Input
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').substring(0, 4))}
                        maxLength={4}
                        placeholder="_ _ _ _"
                        className="text-center text-2xl font-bold tracking-[1em] h-14"
                    />
                </div>
                <DialogFooter>
                    <Button onClick={handleVerify} disabled={isVerifying}>
                        {isVerifying ? 'Verifying...' : 'Confirm Delivery'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function DeliveryDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    let locationWatcher: number | null = null;
    let locationInterval: NodeJS.Timeout | null = null;

    const handlePositionUpdate = (position: GeolocationPosition) => {
        const { latitude, longitude } = position.coords;
        const newLocation = { latitude, longitude };
        setDeliveryBoyLocation(newLocation);
        if (user?.uid) {
            updateDeliveryBoyLocation(user.uid, newLocation);
        }
    };

    const handlePositionError = (err: GeolocationPositionError) => {
        console.warn(`ERROR(${err.code}): ${err.message}`);
        toast({
            variant: 'destructive',
            title: 'Location Error',
            description: 'Could not get location. Please ensure location services are enabled.'
        });
    };
    
    const startLocationTracking = () => {
        if (user?.uid && navigator.geolocation) {
            // Watch for high-frequency updates when the app is active
            locationWatcher = navigator.geolocation.watchPosition(
                handlePositionUpdate,
                handlePositionError,
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );

            // Also set an interval to force updates every minute, for background reliability
            locationInterval = setInterval(() => {
                 navigator.geolocation.getCurrentPosition(handlePositionUpdate, handlePositionError, {
                     enableHighAccuracy: true,
                 });
            }, 60000); // 60 seconds
        }
    }

    startLocationTracking();

    return () => {
        if (locationWatcher) {
            navigator.geolocation.clearWatch(locationWatcher);
        }
        if (locationInterval) {
            clearInterval(locationInterval);
        }
    };
  }, [user?.uid, toast]);
  
  const fetchAssignedOrders = async () => {
      // This function will be called once to refresh data manually if needed,
      // but the real-time listener will handle most updates.
      if (user?.uid) {
          setLoading(true);
          const unsubscribe = listenToOrdersForDeliveryBoy(user.uid, (allOrders) => {
              const activeOrders = allOrders.filter(o => o.status === 'out-for-delivery');
              setOrders(activeOrders);
              setLoading(false);
          }, (err) => {
              setError('Failed to fetch assigned orders.');
              console.error(err);
              setLoading(false);
          });
          return unsubscribe;
      }
  };


  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        router.push('/');
        return;
    }
    
    let unsubscribe: (() => void) | undefined;
    const setupListener = async () => {
        unsubscribe = await fetchAssignedOrders();
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, authLoading, router]);

  const handleOrderDelivered = () => {
    // The real-time listener will automatically remove the order from the active list.
    // We could manually filter here for a faster UI update, but the listener is usually quick enough.
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Skeleton className="h-8 w-1/3 mb-8" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card><CardHeader><Skeleton className="h-6 w-3/4"/></CardHeader><CardContent><Skeleton className="h-24 w-full"/></CardContent></Card>
            <Card><CardHeader><Skeleton className="h-6 w-3/4"/></CardHeader><CardContent><Skeleton className="h-24 w-full"/></CardContent></Card>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 flex items-center justify-center">
          <Alert variant="destructive" className="w-1/2">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>An Error Occurred</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">My Active Deliveries</h1>
            <Button asChild variant="outline">
                <Link href="/delivery/history">
                    <History className="mr-2 h-4 w-4" />
                    View History
                </Link>
            </Button>
        </div>
        {orders.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map(order => {
                const showMap = deliveryBoyLocation?.latitude && deliveryBoyLocation?.longitude && order.customerAddress?.latitude && order.customerAddress?.longitude;
                return (
              <Card key={order.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Order #{order.id.substring(0, 6)}...</span>
                    <Badge variant="default" className="capitalize">{order.status.replace('-', ' ')}</Badge>
                  </CardTitle>
                  <CardDescription>
                    From: {order.restaurantName}<br/>
                    On: {format(order.createdAt.toDate(), 'PPp')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                    <div className="h-48 w-full rounded-md bg-muted flex items-center justify-center text-center p-4">
                         {showMap ? (
                            <div className='w-full h-full relative'>
                                <Suspense fallback={<Skeleton className="h-full w-full" />}>
                                    <div className="w-full h-full rounded-md overflow-hidden">
                                        <LiveMap
                                            isInteractive={false}
                                            customerLat={order.customerAddress!.latitude!}
                                            customerLng={order.customerAddress!.longitude!}
                                            deliveryBoyLat={deliveryBoyLocation.latitude!}
                                            deliveryBoyLng={deliveryBoyLocation.longitude!}
                                        />
                                    </div>
                                </Suspense>
                                 <div className='absolute bottom-2 left-1/2 -translate-x-1/2 w-full px-2'>
                                    <MapDialog order={order} deliveryBoyLocation={deliveryBoyLocation} />
                                </div>
                            </div>
                        ) : (
                           <p className="text-sm text-muted-foreground">Map will be displayed once locations are available.</p>
                        )}
                    </div>
                   <div>
                        <h4 className="font-semibold mb-2">Delivery Details</h4>
                        <div className="space-y-2 text-sm">
                            <p className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> {order.customerName}</p>
                            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {order.customerPhone}</p>
                            <p className="flex items-start gap-2"><MapPin className="h-4 w-4 text-muted-foreground mt-1" /> {order.deliveryAddress}</p>
                            {order.customerAddress?.latitude && order.customerAddress?.longitude && (
                                <Button asChild variant="outline" size="sm" className="w-full mt-2">
                                <a 
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${order.customerAddress.latitude},${order.customerAddress.longitude}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                >
                                    <MapPin className="mr-2 h-4 w-4" />
                                    Get Directions
                                </a>
                                </Button>
                            )}
                        </div>
                    </div>
                    <Separator/>
                     <div>
                        <h4 className="font-semibold mb-2">Order Items</h4>
                         <ul className="list-disc pl-5 text-sm text-muted-foreground">
                            {order.items.map(item => (
                                <li key={item.id}>{item.name} x {item.quantity}</li>
                            ))}
                        </ul>
                    </div>
                </CardContent>
                <div className="p-6 pt-0">
                    {order.status === 'out-for-delivery' && (
                         <VerifyDeliveryDialog orderId={order.id} onVerified={handleOrderDelivered} />
                    )}
                </div>
              </Card>
            )})}
          </div>
        ) : (
          <Card className="flex flex-col items-center justify-center py-20 text-center">
            <Bike className="mx-auto h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-2xl font-bold">No Active Deliveries</h3>
            <p className="mt-2 text-muted-foreground">You have no orders assigned to you at the moment.</p>
          </Card>
        )}
      </main>
    </div>
  );
}
