
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Order, Restaurant } from '@/lib/types';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { assignDeliveryBoy, updateOrderPaymentStatus, updateOrderStatus } from '@/services/ownerService';
import { getRestaurantByOwnerId, listenToOrdersForRestaurant } from '@/services/ownerClientService';
import { Button } from '@/components/ui/button';
import { AlertTriangle, BookOpen, History } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { usePrint } from '@/hooks/use-print';
import { OrderCard } from '@/components/owner/order-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';

type OrderStatusTab = 'pending' | 'preparing' | 'out-for-delivery';

export default function ManageOrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const { print } = usePrint();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
    
    useEffect(() => {
        if (!user || authLoading) return;

        let audio: HTMLAudioElement | null = null;
        if (typeof window !== 'undefined') {
            audio = new Audio('https://cdn.pixabay.com/audio/2021/08/04/audio_942323b2f9.mp3');
        }

        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const rest = await getRestaurantByOwnerId(user.uid);
                setRestaurant(rest);
                if (rest) {
                    const unsubscribe = listenToOrdersForRestaurant(rest.id, (fetchedOrders) => {
                        
                        setOrders(prevOrders => {
                            if (audio && fetchedOrders.length > prevOrders.length && prevOrders.length > 0) {
                                audio.play().catch(e => console.error("Error playing sound:", e));
                            }
                            return fetchedOrders;
                        });

                        setLoading(false);
                    });
                    return unsubscribe;
                } else {
                    setError('No restaurant found for this owner.');
                    setLoading(false);
                }
            } catch (e: any) {
                setError('Failed to fetch restaurant data.');
                toast({ variant: 'destructive', title: 'Error', description: e.message });
                setLoading(false);
            }
        };

        const unsubscribePromise = fetchInitialData();

        return () => {
            unsubscribePromise.then(unsub => unsub && unsub());
        };
    }, [user, authLoading, toast]);


    const handlePrintKOT = (order: Order) => {
        if (!restaurant) return;
        print(order, restaurant);
    };

    const handleAction = async (orderId: string, action: Promise<any>, successToast: { title: string, description: string }) => {
        setUpdatingOrderId(orderId);
        try {
            await action;
            toast(successToast);
        } catch(e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setUpdatingOrderId(null);
        }
    }

    const handleStatusChange = (orderId: string, status: Order['status']) => {
        handleAction(orderId, updateOrderStatus(orderId, status), {
            title: 'Order Status Updated',
            description: 'Customer will be notified.',
        });
    }

    const handleCancelOrder = (orderId: string) => {
        handleAction(orderId, updateOrderStatus(orderId, 'cancelled'), {
            title: 'Order Cancelled',
            description: 'The order has been successfully cancelled.',
        });
    };

    const handleAssignDelivery = (orderId: string, deliveryBoyId: string) => {
        const deliveryBoy = restaurant?.deliveryBoys?.find(db => db.id === deliveryBoyId);
        if (!deliveryBoy) return;
        handleAction(orderId, assignDeliveryBoy(orderId, deliveryBoy), {
            title: 'Delivery Assigned',
            description: `Order assigned to ${deliveryBoy.name}.`,
        });
    }

    const handleMarkAsPaid = (orderId: string) => {
        handleAction(orderId, updateOrderPaymentStatus(orderId, 'completed'), {
            title: 'Payment Confirmed',
            description: 'Order marked as paid.',
        });
    }

    const getOrdersByStatus = (statuses: Order['status'][]) => {
        return orders.filter(o => statuses.includes(o.status));
    }
    
    const pendingOrders = getOrdersByStatus(['pending']);
    const preparingOrders = getOrdersByStatus(['accepted', 'preparing']);
    const deliveryOrders = getOrdersByStatus(['out-for-delivery']);


    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container py-8">
                    <div className="flex justify-between items-center mb-8">
                        <Skeleton className="h-8 w-1/3" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                     <div className="flex gap-4 p-4">
                        <Skeleton className="h-[60vh] w-full" />
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
        )
    }

     if (!restaurant) {
        return (
             <div className="min-h-screen bg-background">
                <Header />
                <main className="container py-8 flex items-center justify-center">
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>No Restaurant Found</AlertTitle>
                        <AlertDescription>You must register a restaurant before you can view orders.</AlertDescription>
                    </Alert>
                </main>
            </div>
        )
    }
    
    const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');

    const renderOrderList = (list: Order[]) => {
        if (list.length === 0) {
            return (
                <div className="text-center py-20">
                    <BookOpen className="mx-auto h-16 w-16 text-muted-foreground" />
                    <h3 className="mt-4 text-xl font-bold">No orders in this stage</h3>
                    <p className="mt-2 text-muted-foreground">
                        Orders will appear here as they move through the workflow.
                    </p>
                </div>
            )
        }
        return (
            <div className="space-y-4">
                {list.map(order => (
                     <OrderCard
                        key={order.id}
                        order={order}
                        restaurant={restaurant}
                        isUpdating={updatingOrderId === order.id}
                        onStatusChange={handleStatusChange}
                        onCancelOrder={handleCancelOrder}
                        onAssignDelivery={handleAssignDelivery}
                        onMarkAsPaid={handleMarkAsPaid}
                        onPrintKOT={handlePrintKOT}
                    />
                ))}
            </div>
        )
    }


    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="container py-8 flex-grow flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Order Management</h1>
                    <Button asChild variant="outline">
                        <Link href="/owner/orders/history">
                            <History className="mr-2 h-4 w-4" />
                            View Order History
                        </Link>
                    </Button>
                </div>
                
                <Tabs defaultValue="pending" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="pending">
                            Pending <Badge variant={pendingOrders.length > 0 ? "default" : "secondary"} className="ml-2">{pendingOrders.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="preparing">
                            Preparing <Badge variant={preparingOrders.length > 0 ? "default" : "secondary"} className="ml-2">{preparingOrders.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="delivery">
                            Out for Delivery <Badge variant={deliveryOrders.length > 0 ? "default" : "secondary"} className="ml-2">{deliveryOrders.length}</Badge>
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="pending" className="mt-6">
                        {renderOrderList(pendingOrders)}
                    </TabsContent>
                    <TabsContent value="preparing" className="mt-6">
                        {renderOrderList(preparingOrders)}
                    </TabsContent>
                    <TabsContent value="delivery" className="mt-6">
                         {renderOrderList(deliveryOrders)}
                    </TabsContent>
                </Tabs>

            </main>
        </div>
    );
}
