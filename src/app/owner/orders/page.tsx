
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Order, Restaurant } from '@/lib/types';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { assignDeliveryBoy, updateOrderPaymentStatus, updateOrderStatus } from '@/services/ownerService';
import { listenToOrdersForRestaurant, getRestaurantByOwnerId } from '@/services/ownerClientService';
import { Button } from '@/components/ui/button';
import { AlertTriangle, BookOpen, History, Loader2, Workflow } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { usePrint } from '@/hooks/use-print';
import { KOT } from '@/components/owner/kot';
import { OrderCard } from '@/components/owner/order-card';

const orderStatusColumns: Order['status'][] = ['pending', 'accepted', 'preparing', 'out-for-delivery'];

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

        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const rest = await getRestaurantByOwnerId(user.uid);
                setRestaurant(rest);
                if (rest) {
                    const unsubscribe = listenToOrdersForRestaurant(rest.id, (fetchedOrders) => {
                        setOrders(fetchedOrders);
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

        const unsubscribe = fetchInitialData();

        return () => {
            unsubscribe.then(unsub => unsub && unsub());
        };
    }, [user, authLoading, toast]);


    const handlePrintKOT = (order: Order) => {
        if (!restaurant) return;
        print(<KOT order={order} restaurant={restaurant} />);
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

    const getColumnTitle = (status: Order['status']) => {
        switch(status) {
            case 'pending': return 'New';
            case 'accepted': return 'Confirmed';
            case 'preparing': return 'Preparing';
            case 'out-for-delivery': return 'Out for Delivery';
            default: return 'Order';
        }
    }


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
                        <Skeleton className="h-[60vh] w-1/3" />
                        <Skeleton className="h-[60vh] w-1/3" />
                        <Skeleton className="h-[60vh] w-1/3" />
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

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="container py-8 flex-grow flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Order Workflow</h1>
                    <Button asChild variant="outline">
                        <Link href="/owner/orders/history">
                            <History className="mr-2 h-4 w-4" />
                            View Order History
                        </Link>
                    </Button>
                </div>

                {activeOrders.length > 0 ? (
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                        {orderStatusColumns.map(status => {
                            const columnOrders = activeOrders.filter(o => {
                                // Group "accepted" and "preparing" into the "Preparing" column visually
                                if (status === 'accepted' && o.status === 'preparing') return false;
                                if (status === 'preparing' && o.status === 'accepted') return true;
                                return o.status === status;
                            });

                            if (status === 'accepted') return null; // Hide the separate 'accepted' column

                            const title = getColumnTitle(status);

                            return (
                                <div key={status} className="h-full bg-muted/50 rounded-lg p-4 flex flex-col">
                                    <h2 className="text-lg font-semibold mb-4 text-center">{title} ({columnOrders.length})</h2>
                                    <div className="space-y-4 overflow-y-auto flex-grow pr-2">
                                        {columnOrders.map(order => (
                                            <OrderCard
                                                key={order.id}
                                                order={order}
                                                restaurant={restaurant}
                                                isUpdating={updatingOrderId === order.id}
                                                onStatusChange={handleStatusChange}
                                                onAssignDelivery={handleAssignDelivery}
                                                onMarkAsPaid={handleMarkAsPaid}
                                                onPrintKOT={handlePrintKOT}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <Card className="flex flex-col items-center justify-center py-20 text-center flex-grow">
                        <BookOpen className="mx-auto h-16 w-16 text-muted-foreground" />
                        <h3 className="mt-4 text-2xl font-bold">No Active Orders</h3>
                        <p className="mt-2 text-muted-foreground">
                            When customers place new orders, they will appear here.
                        </p>
                    </Card>
                )}
            </main>
        </div>
    );
}
