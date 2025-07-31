
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Order, Restaurant } from '@/lib/types';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getOrdersForRestaurant, getRestaurantByOwnerId, updateOrderPaymentStatus, updateOrderStatus } from '@/services/ownerService';
import { Button } from '@/components/ui/button';
import { AlertTriangle, BookOpen, Check, BadgeCent, CircleDollarSign } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const orderStatuses: Order['status'][] = ['pending', 'accepted', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'];


export default function ManageOrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

    const fetchOrdersData = async (restaurantId: string) => {
        try {
            const items = await getOrdersForRestaurant(restaurantId);
            setOrders(items);
        } catch (e: any) {
            setError('Failed to fetch orders.');
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };

    useEffect(() => {
        const fetchRestaurantAndOrders = async () => {
            if (user?.uid) {
                try {
                    setLoading(true);
                    const rest = await getRestaurantByOwnerId(user.uid);
                    setRestaurant(rest);
                    if (rest) {
                        await fetchOrdersData(rest.id);
                    } else {
                         setError('No restaurant found for this owner.');
                    }
                } catch (e: any) {
                    setError('Failed to fetch restaurant data.');
                    toast({ variant: 'destructive', title: 'Error', description: e.message });
                } finally {
                    setLoading(false);
                }
            }
        };

        if (!authLoading && user) {
            fetchRestaurantAndOrders();
        } else if (!authLoading && !user) {
            setLoading(false);
        }
    }, [user, authLoading, toast]);
    
    const handleMarkAsPaid = async (orderId: string) => {
        setUpdatingOrderId(orderId);
        
        const originalOrders = [...orders];
        const optimisticUpdate = orders.map(o => o.id === orderId ? { ...o, paymentStatus: 'completed' as const } : o);
        setOrders(optimisticUpdate);

        try {
            await updateOrderPaymentStatus(orderId, 'completed');
            toast({ title: 'Payment Confirmed', description: 'Order marked as paid.'});
        } catch(e: any) {
            setOrders(originalOrders);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setUpdatingOrderId(null);
        }
    }
    
    const handleStatusChange = async (orderId: string, status: Order['status']) => {
        setUpdatingOrderId(orderId);

        const originalOrders = [...orders];
        const optimisticUpdate = orders.map(o => o.id === orderId ? { ...o, status } : o);
        setOrders(optimisticUpdate);

        try {
            await updateOrderStatus(orderId, status);
            toast({ title: 'Order Status Updated', description: 'Customer will be notified.'});
        } catch (e: any) {
             setOrders(originalOrders);
             toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setUpdatingOrderId(null);
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


    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Restaurant Orders</h1>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Order History</CardTitle>
                        <CardDescription>View all orders placed at {restaurant.name}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {orders.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                            {orders.map(order => (
                                <AccordionItem value={order.id} key={order.id}>
                                    <AccordionTrigger>
                                        <div className="flex justify-between w-full pr-4 items-center">
                                            <div className="flex flex-col text-left">
                                                <span className="font-bold">Order #{order.id.substring(0,6)}...</span>
                                                <span className="text-sm text-muted-foreground">{order.customerName}</span>
                                            </div>
                                            <div className="text-sm">{format(order.createdAt.toDate(), 'PPpp')}</div>
                                            <div><Badge variant={order.status === 'delivered' ? 'default' : 'secondary'} className="capitalize">{order.status.replace('-', ' ')}</Badge></div>
                                            <div className="font-bold text-lg">${order.total.toFixed(2)}</div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="p-4 bg-muted/50 rounded-md">
                                            <div className="grid md:grid-cols-3 gap-6">
                                                <div className="md:col-span-1">
                                                    <h4 className="font-semibold mb-2">Order Details</h4>
                                                    <p className="font-semibold">Items Ordered:</p>
                                                    <ul className="list-disc pl-5">
                                                        {order.items.map(item => (
                                                            <li key={item.id} className="text-sm">{item.name} x {item.quantity}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div className="md:col-span-1">
                                                     <h4 className="font-semibold mb-2">Payment Information</h4>
                                                    <div className="flex items-center gap-2 capitalize">
                                                        {order.paymentMethod === 'cash' ? <CircleDollarSign className="h-4 w-4"/> : <BadgeCent className="h-4 w-4"/>}
                                                        <span>{order.paymentMethod}</span>
                                                        <Badge variant={order.paymentStatus === 'completed' ? 'default' : 'secondary'}>{order.paymentStatus}</Badge>
                                                    </div>
                                                    {order.paymentMethod === 'upi' && (
                                                        <>
                                                        <p className="text-sm mt-1">
                                                            <span className="font-medium">Transaction ID:</span> {order.paymentDetails?.transactionId || 'N/A'}
                                                        </p>
                                                        {order.paymentStatus === 'pending' && (
                                                            <Button 
                                                                size="sm" 
                                                                className="mt-2"
                                                                onClick={() => handleMarkAsPaid(order.id)}
                                                                disabled={updatingOrderId === order.id}
                                                            >
                                                                {updatingOrderId === order.id ? 'Confirming...' : <><Check className="mr-2 h-4 w-4"/> Mark as Paid</>}
                                                            </Button>
                                                        )}
                                                        </>
                                                    )}
                                                </div>
                                                 <div className="md:col-span-1">
                                                     <h4 className="font-semibold mb-2">Update Status</h4>
                                                      <Select
                                                        value={order.status}
                                                        onValueChange={(value) => handleStatusChange(order.id, value as Order['status'])}
                                                        disabled={updatingOrderId === order.id}
                                                      >
                                                        <SelectTrigger>
                                                          <SelectValue placeholder="Update order status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                          {orderStatuses.map(status => (
                                                            <SelectItem key={status} value={status} className="capitalize">
                                                              {status.replace('-', ' ')}
                                                            </SelectItem>
                                                          ))}
                                                        </SelectContent>
                                                      </Select>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                        ) : (
                            <div className="text-center py-12">
                                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-medium">No Orders Yet</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    When customers place orders, they will appear here.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
