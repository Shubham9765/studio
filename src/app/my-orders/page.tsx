
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Order, AppUser } from '@/lib/types';
import { listenToOrdersForCustomer } from '@/services/restaurantClientService';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, PackageSearch, Package, ChefHat, Bike, PartyPopper, Copy, History, KeyRound } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase';
import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('@/components/live-map').then(mod => mod.LiveMap), {
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full" />
});


const statusSteps = [
    { status: 'pending', icon: Package, label: 'Order Placed' },
    { status: 'accepted', icon: ChefHat, label: 'Preparing' },
    { status: 'out-for-delivery', icon: Bike, label: 'Out for Delivery' },
    { status: 'delivered', icon: PartyPopper, label: 'Delivered' },
];

function OrderStatusTracker({ status }: { status: Order['status'] }) {
    const currentStepIndex = statusSteps.findIndex(step => step.status === status);
    const progressPercentage = currentStepIndex >= 0 ? ((currentStepIndex + 1) / statusSteps.length) * 100 : 0;
    
    if (status === 'cancelled') {
        return (
            <div className="text-center p-4 rounded-md bg-destructive/10 text-destructive">
                <p className="font-bold">Order Cancelled</p>
            </div>
        )
    }

    return (
        <div className="w-full my-4">
             <Progress value={progressPercentage} className="h-2 mb-4" />
             <div className="flex justify-between">
                {statusSteps.map((step, index) => (
                    <div key={step.status} className="flex flex-col items-center w-1/4">
                        <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                            index <= currentStepIndex ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        )}>
                            <step.icon className="h-6 w-6" />
                        </div>
                        <p className={cn(
                            "text-xs mt-2 text-center",
                            index <= currentStepIndex ? 'font-semibold text-primary' : 'text-muted-foreground'
                        )}>{step.label}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

function DeliveryBoyTracker({ order }: { order: Order }) {
    const [deliveryBoyLocation, setDeliveryBoyLocation] = useState<{ latitude?: number; longitude?: number } | null>(null);

    useEffect(() => {
        if (order.deliveryBoy?.id) {
            const unsub = onSnapshot(doc(db, "users", order.deliveryBoy.id), (doc) => {
                const data = doc.data() as AppUser;
                if (data.latitude && data.longitude) {
                    setDeliveryBoyLocation({ latitude: data.latitude, longitude: data.longitude });
                }
            });
            return () => unsub();
        }
    }, [order.deliveryBoy?.id]);

    if (!order.deliveryBoy) return null;

    const showMap = deliveryBoyLocation?.latitude && deliveryBoyLocation?.longitude && order.customerAddress?.latitude && order.customerAddress?.longitude;

    return (
        <div className="mt-4 p-4 rounded-md bg-muted space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Bike className="h-8 w-8 text-primary flex-shrink-0" />
                <div className="flex-grow">
                    <p className="font-semibold">{order.deliveryBoy.name} is on the way with your order!</p>
                    <p className="text-sm text-muted-foreground">You can track their progress on the map below.</p>
                </div>
            </div>
            
            {showMap ? (
                 <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                     <div className="h-64 w-full rounded-md overflow-hidden">
                        <LiveMap 
                            customerLat={order.customerAddress!.latitude!}
                            customerLng={order.customerAddress!.longitude!}
                            deliveryBoyLat={deliveryBoyLocation.latitude!}
                            deliveryBoyLng={deliveryBoyLocation.longitude!}
                        />
                     </div>
                 </Suspense>
            ) : (
                <div className="h-64 w-full rounded-md bg-background flex items-center justify-center">
                    <p className="text-muted-foreground">Waiting for location data...</p>
                </div>
            )}
        </div>
    );
}

export default function MyOrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/');
            return;
        }

        setLoading(true);
        const unsubscribe = listenToOrdersForCustomer(user.uid, (userOrders) => {
            const activeOrders = userOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
            setOrders(activeOrders);
            setLoading(false);
        }, (err) => {
            setError('Failed to fetch your orders.');
            console.error(err);
            setLoading(false);
        });

        // Cleanup subscription on component unmount
        return () => unsubscribe();
    }, [user, authLoading, router]);

    const handleCopyId = (id: string) => {
        if (typeof window !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(id);
            toast({
                title: 'Copied!',
                description: 'Order ID copied to clipboard.',
            });
        }
    }

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container py-8">
                    <Skeleton className="h-8 w-1/3 mb-8" />
                    <Card>
                        <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
                        <CardContent>
                            <Skeleton className="h-40 w-full" />
                        </CardContent>
                    </Card>
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
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">My Active Orders</h1>
                    <Button asChild variant="outline">
                        <Link href="/my-orders/history">
                            <History className="mr-2 h-4 w-4" />
                            View Order History
                        </Link>
                    </Button>
                </div>
                {orders.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full space-y-4" defaultValue={orders[0]?.id}>
                        {orders.map(order => (
                             <Card key={order.id}>
                                <AccordionItem value={order.id} className="border-b-0">
                                    <div className="flex items-center p-6">
                                        <AccordionTrigger className="flex-grow">
                                            <div className="flex justify-between w-full items-center">
                                                <div className="flex flex-col text-left">
                                                    <span className="font-bold">Order #{order.id.substring(0, 6)}...</span>
                                                    <span className="text-sm text-muted-foreground">{order.restaurantName || 'Restaurant'}</span>
                                                </div>
                                                <div className="hidden sm:block text-sm">{format(order.createdAt.toDate(), 'PP')}</div>
                                                <div><Badge variant={order.status === 'out-for-delivery' ? 'default' : 'secondary'} className="capitalize">{order.status.replace('-', ' ')}</Badge></div>
                                                <div className="font-bold text-lg">Rs.{order.total.toFixed(2)}</div>
                                            </div>
                                        </AccordionTrigger>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 ml-2 flex-shrink-0" onClick={(e) => { e.stopPropagation(); handleCopyId(order.id); }}>
                                            <Copy className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                    <AccordionContent className="p-6 pt-0">
                                        <OrderStatusTracker status={order.status} />

                                        {order.status === 'out-for-delivery' && order.deliveryOtp && (
                                            <Card className="mt-4 bg-primary/10 border-primary/20">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="flex items-center gap-2 text-lg">
                                                        <KeyRound className="h-5 w-5" />
                                                        <span>Delivery OTP</span>
                                                    </CardTitle>
                                                     <CardDescription>Provide this code to your delivery person to confirm receipt of your order.</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-4xl font-extrabold tracking-widest text-center py-2 bg-background rounded-md">{order.deliveryOtp}</p>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {['out-for-delivery', 'delivered'].includes(order.status) && (
                                            <DeliveryBoyTracker order={order} />
                                        )}
                                        <div className="mt-6">
                                            <h4 className="font-semibold mb-2">Order Summary</h4>
                                             <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                                {order.items.map(item => (
                                                    <li key={item.id} className="flex justify-between">
                                                        <span>{item.name} x {item.quantity}</span>
                                                        <span>Rs.{(item.price * item.quantity).toFixed(2)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                             </Card>
                        ))}
                    </Accordion>
                ) : (
                    <Card className="flex flex-col items-center justify-center py-20 text-center">
                        <PackageSearch className="mx-auto h-16 w-16 text-muted-foreground" />
                        <h3 className="mt-4 text-2xl font-bold">No active orders</h3>
                        <p className="mt-2 text-muted-foreground">You haven't placed any orders that are currently in progress. Let's find something delicious!</p>
                        <Button className="mt-6" onClick={() => router.push('/')}>Goto Order Food</Button>
                    </Card>
                )}
            </main>
        </div>
    );
}

    

    