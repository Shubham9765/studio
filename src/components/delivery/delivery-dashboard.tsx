
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { updateOrderStatus } from '@/services/ownerService';
import { updateDeliveryBoyLocation } from '@/services/userService';
import { listenToOrdersForDeliveryBoy } from '@/services/restaurantClientService';
import type { Order } from '@/lib/types';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Bike, Check, PackageCheck, User, Phone, MapPin, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DeliveryDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    let locationWatcher: number | null = null;
    if (user?.uid && navigator.geolocation) {
        locationWatcher = window.navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                updateDeliveryBoyLocation(user.uid, { latitude, longitude });
            },
            (err) => {
                console.warn(`ERROR(${err.code}): ${err.message}`);
                toast({
                    variant: 'destructive',
                    title: 'Location Error',
                    description: 'Could not get location. Please ensure location services are enabled.'
                })
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0,
            }
        );
    }
    return () => {
        if (locationWatcher) {
            window.navigator.geolocation.clearWatch(locationWatcher);
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

  const handleMarkAsDelivered = async (orderId: string) => {
    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatus(orderId, 'delivered');
      toast({ title: 'Order Delivered!', description: 'The order has been marked as complete.' });
      // The real-time listener will automatically remove the order from the active list.
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: e.message });
    } finally {
      setUpdatingOrderId(null);
    }
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
            {orders.map(order => (
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
                   <div>
                        <h4 className="font-semibold mb-2">Delivery Details</h4>
                        <div className="space-y-1 text-sm">
                            <p className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> {order.customerName}</p>
                            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {order.customerPhone}</p>
                            <p className="flex items-start gap-2"><MapPin className="h-4 w-4 text-muted-foreground mt-1" /> {order.deliveryAddress}</p>
                            {order.customerAddress?.latitude && order.customerAddress?.longitude && (
                                <a 
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${order.customerAddress.latitude},${order.customerAddress.longitude}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline text-sm"
                                >
                                    View on Map
                                </a>
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
                         <Button 
                            className="w-full"
                            onClick={() => handleMarkAsDelivered(order.id)}
                            disabled={updatingOrderId === order.id}
                        >
                            {updatingOrderId === order.id ? 'Updating...' : <><Check className="mr-2 h-4 w-4"/> Mark as Delivered</>}
                        </Button>
                    )}
                </div>
              </Card>
            ))}
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
