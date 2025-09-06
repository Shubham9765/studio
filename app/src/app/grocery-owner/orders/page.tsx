
'use client';


import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Order, GroceryStore } from '@/lib/types';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { assignDeliveryBoy, updateOrderPaymentStatus, updateOrderStatus } from '@/services/ownerService';
import { getGroceryStoreByOwnerId, listenToOrdersForStore } from '@/services/ownerClientService';
import { Button } from '@/components/ui/button';
import { AlertTriangle, BookOpen, History } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { usePrint } from '@/hooks/use-print';
import { OrderCard } from '@/components/owner/order-card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function ManageGroceryOrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const { print } = usePrint();
    const [store, setStore] = useState<GroceryStore | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
    const [isNewOrderPending, setIsNewOrderPending] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const manageAudioPlayback = (hasPending: boolean) => {
             if (typeof window !== 'undefined') {
                if (!audioRef.current) {
                    audioRef.current = new Audio('https://cdn.pixabay.com/audio/2021/08/04/audio_942323b2f9.mp3');
                    audioRef.current.loop = true;
                    audioRef.current.volume = 1.0;
                }
                const audio = audioRef.current;
                if (hasPending) {
                    audio.play().catch(e => console.error("Error playing sound:", e));
                } else {
                    audio.pause();
                }
            }
        }

        if (authLoading) return;

        let unsubscribe: (() => void) | undefined;
        
        const fetchInitialData = async () => {
            if (!user) {
                 setLoading(false);
                 return;
            }
            setLoading(true);
            try {
                const storeData = await getGroceryStoreByOwnerId(user.uid);
                setStore(storeData);
                if (storeData) {
                    unsubscribe = listenToOrdersForStore(storeData.id, (fetchedOrders) => {
                        const groceryOrders = fetchedOrders.filter(o => o.orderType === 'grocery');
                        setOrders(groceryOrders);
                        
                        const hasPendingOrders = groceryOrders.some(o => o.status === 'pending');
                        setIsNewOrderPending(hasPendingOrders);
                        manageAudioPlayback(hasPendingOrders);
                        
                        setLoading(false);
                    }, (err) => {
                        console.error(err);
                        setError('Failed to set up order listener.');
                        setLoading(false);
                    });
                } else {
                    setError('No store found for this owner.');
                    setLoading(false);
                }
            } catch (e: any) {
                setError('Failed to fetch store data.');
                toast({ variant: 'destructive', title: 'Error', description: e.message });
                setLoading(false);
            }
        };

        fetchInitialData();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, [user, authLoading, toast]);


    const handlePrintKOT = (order: Order) => {
        if (!store) return;
        // The KOT component expects a restaurant, but we can adapt it or create a new one.
        // For now, we'll pass the store data cast as a restaurant.
        print(order, store as any);
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
        const order = orders.find(o => o.id === orderId);
        if (order?.status === 'pending' && status === 'accepted') {
             const pendingOrders = orders.filter(o => o.status === 'pending');
             if (pendingOrders.length === 1) {
                 setIsNewOrderPending(false);
             }
        }

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
        const deliveryBoy = store?.deliveryBoys?.find(db => db.id === deliveryBoyId);
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
    
    const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
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

     if (!store) {
        return (
             <div className="min-h-screen bg-background">
                <Header />
                <main className="container py-8 flex items-center justify-center">
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>No Store Found</AlertTitle>
                        <AlertDescription>You must register a store before you can view orders.</AlertDescription>
                    </Alert>
                </main>
            </div>
        )
    }

    const renderOrderList = (list: Order[], title: string) => {
        if (list.length === 0) {
            return null;
        }
        return (
            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4">{title} <Badge variant="secondary">{list.length}</Badge></h2>
                <div className="space-y-4">
                    {list.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            restaurant={store as any}
                            isUpdating={updatingOrderId === order.id}
                            onStatusChange={handleStatusChange}
                            onCancelOrder={handleCancelOrder}
                            onAssignDelivery={handleAssignDelivery}
                            onMarkAsPaid={handleMarkAsPaid}
                            onPrintKOT={handlePrintKOT}
                        />
                    ))}
                </div>
            </section>
        )
    }


    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="container py-8 flex-grow flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold">Order Management</h1>
                        {isNewOrderPending && (
                            <Badge className="bg-green-500 text-lg animate-pulse">New Order!</Badge>
                        )}
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/grocery-owner/orders/history">
                            <History className="mr-2 h-4 w-4" />
                            View Order History
                        </Link>
                    </Button>
                </div>
                
                {activeOrders.length > 0 ? (
                    <div>
                        {renderOrderList(pendingOrders, 'New Orders')}
                        {renderOrderList(preparingOrders, 'Preparing')}
                        {renderOrderList(deliveryOrders, 'Out for Delivery')}
                    </div>
                ) : (
                    <div className="flex-grow flex items-center justify-center">
                        <Card className="w-full max-w-lg text-center">
                            <CardHeader>
                                <CardTitle>All Caught Up!</CardTitle>
                                <CardDescription>There are no active orders right now.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <BookOpen className="mx-auto h-16 w-16 text-muted-foreground" />
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>
        </div>
    );
}
