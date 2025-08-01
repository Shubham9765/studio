
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Order, Restaurant, DeliveryBoy } from '@/lib/types';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { assignDeliveryBoy, getOrdersForRestaurant, getRestaurantByOwnerId, updateOrderPaymentStatus, updateOrderStatus } from '@/services/ownerService';
import { Button } from '@/components/ui/button';
import { AlertTriangle, BookOpen, Check, BadgeCent, CircleDollarSign, Printer, User, Phone, MapPin, Package, ChefHat, Bike, PartyPopper, History } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { KOT } from '@/components/owner/kot';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';


const statusSteps: { status: Order['status'], icon: React.ElementType, label: string }[] = [
    { status: 'accepted', icon: Package, label: 'Accept Order' },
    { status: 'preparing', icon: ChefHat, label: 'Mark as Preparing' },
    { status: 'out-for-delivery', icon: Bike, label: 'Out for Delivery' },
    { status: 'delivered', icon: PartyPopper, label: 'Delivered' },
];

function OrderStatusUpdater({ order, onUpdate, isUpdating }: { order: Order, onUpdate: (status: Order['status']) => void, isUpdating: boolean }) {
    const currentStepIndex = statusSteps.findIndex(step => step.status === order.status);

    if (order.status === 'cancelled' || order.status === 'delivered') {
        return <p className="font-semibold text-center py-2 px-4 rounded-md bg-muted text-muted-foreground capitalize">{order.status}</p>;
    }
    
    if (order.status === 'pending') {
        return (
            <div className="flex gap-2">
                 <Button onClick={() => onUpdate('accepted')} disabled={isUpdating} className="flex-1">
                    {isUpdating ? 'Accepting...' : 'Accept Order'}
                 </Button>
                 <Button variant="destructive" onClick={() => onUpdate('cancelled')} disabled={isUpdating} className="flex-1">
                    {isUpdating ? '...' : 'Cancel Order'}
                 </Button>
            </div>
        )
    }

    const nextStep = statusSteps[currentStepIndex + 1];
    
    const hideNextStepButton = nextStep?.status === 'out-for-delivery' || !nextStep;

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
                {statusSteps.map((step, index) => (
                    <div key={step.status} className={cn("flex-1 text-center transition-all", index <= currentStepIndex ? "text-primary" : "text-muted-foreground opacity-50")}>
                        <step.icon className="mx-auto h-6 w-6 mb-1"/>
                        <p className="text-xs font-semibold">{step.label.split(' ').slice(2).join(' ')}</p>
                    </div>
                ))}
            </div>
             <div className="w-full bg-muted rounded-full h-2.5">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${((currentStepIndex + 1) / (statusSteps.length)) * 100}%` }}></div>
            </div>
            {nextStep && !hideNextStepButton && (
                <Button onClick={() => onUpdate(nextStep.status)} disabled={isUpdating}>
                    {isUpdating ? 'Updating...' : <><nextStep.icon className="mr-2 h-4 w-4" /> {nextStep.label}</>}
                </Button>
            )}
             {order.status === 'delivered' && (
                <p className="font-semibold text-center py-2 px-4 rounded-md bg-green-100 text-green-700 capitalize">{order.status}</p>
            )}
        </div>
    )
}


function DeliveryAssigner({ order, deliveryBoys, onAssign, isAssigning }: { order: Order, deliveryBoys: DeliveryBoy[], onAssign: (deliveryBoyId: string) => void, isAssigning: boolean }) {
    if (order.deliveryBoy) {
        return (
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
                <Bike className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm">
                    <p className="font-semibold">{order.deliveryBoy.name}</p>
                    <p className="text-muted-foreground">Assigned for delivery</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <h4 className="font-semibold">Assign Delivery</h4>
            <Select onValueChange={onAssign} disabled={isAssigning}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a delivery person" />
                </SelectTrigger>
                <SelectContent>
                    {deliveryBoys.map(boy => (
                        <SelectItem key={boy.id} value={boy.id}>{boy.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {isAssigning && <p className="text-sm text-muted-foreground">Assigning...</p>}
        </div>
    )
}

export default function ManageOrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
    const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);

    const fetchOrdersData = async (restaurantId: string) => {
        try {
            const items = await getOrdersForRestaurant(restaurantId);
            setOrders(items);
        } catch (e: any) {
            setError('Failed to fetch orders.');
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };
    
    const fetchRestaurantData = async (ownerId: string) => {
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

    useEffect(() => {
        if (orderToPrint) {
            const handleAfterPrint = () => {
                setOrderToPrint(null);
                document.body.classList.remove('print:bg-white');
            };

            document.body.classList.add('print:bg-white');
            window.addEventListener('afterprint', handleAfterPrint, { once: true });
            
            window.print();
        }
    }, [orderToPrint]);

    const handlePrintKOT = (order: Order) => {
        setOrderToPrint(order);
    };


    useEffect(() => {
        if (!authLoading && user) {
            fetchRestaurantData(user.uid);
        } else if (!authLoading && !user) {
            setLoading(false);
        }
    }, [user, authLoading, toast]);
    
    const handleMarkAsPaid = async (orderId: string) => {
        setUpdatingOrderId(orderId);
        try {
            await updateOrderPaymentStatus(orderId, 'completed');
            toast({ title: 'Payment Confirmed', description: 'Order marked as paid.'});
            if (restaurant) await fetchOrdersData(restaurant.id);
        } catch(e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setUpdatingOrderId(null);
        }
    }
    
    const handleStatusChange = async (orderId: string, status: Order['status']) => {
        setUpdatingOrderId(orderId);
        try {
            await updateOrderStatus(orderId, status);
            toast({ title: 'Order Status Updated', description: 'Customer will be notified.'});
            if (restaurant) await fetchOrdersData(restaurant.id);
        } catch (e: any) {
             toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setUpdatingOrderId(null);
        }
    }

    const handleAssignDelivery = async (orderId: string, deliveryBoyId: string) => {
        if (!restaurant?.deliveryBoys) return;

        setUpdatingOrderId(orderId);
        const deliveryBoy = restaurant.deliveryBoys.find(db => db.id === deliveryBoyId);
        if (!deliveryBoy) {
            toast({ variant: 'destructive', title: 'Error', description: 'Selected delivery person not found.' });
            setUpdatingOrderId(null);
            return;
        }

        try {
            await assignDeliveryBoy(orderId, { id: deliveryBoy.id, name: deliveryBoy.name });
            toast({ title: 'Delivery Assigned', description: `Order assigned to ${deliveryBoy.name} and is now out for delivery.` });
            if (restaurant) await fetchOrdersData(restaurant.id);
        } catch (e: any) {
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
    
    const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');


    return (
        <>
        <div className="min-h-screen bg-background print:hidden">
            <Header />
            <main className="container py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Active Orders</h1>
                    <Button asChild variant="outline">
                        <Link href="/owner/orders/history">
                            <History className="mr-2 h-4 w-4" />
                            View Order History
                        </Link>
                    </Button>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Incoming & In-Progress Orders</CardTitle>
                        <CardDescription>View and manage all active orders placed at {restaurant.name}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {activeOrders.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {activeOrders.map(order => (
                                <AccordionItem value={order.id} key={order.id} className="border rounded-lg">
                                    <AccordionTrigger className="p-4 hover:no-underline">
                                        <div className="flex justify-between w-full items-center">
                                            <div className="flex flex-col text-left">
                                                <span className="font-bold">Order #{order.id.substring(0,6)}...</span>
                                                <span className="text-sm text-muted-foreground">{order.customerName}</span>
                                            </div>
                                            <div className="hidden md:block text-sm text-muted-foreground">{format(order.createdAt.toDate(), 'PPpp')}</div>
                                            <div><Badge variant={order.status === 'out-for-delivery' ? 'default' : 'secondary'} className="capitalize">{order.status.replace('-', ' ')}</Badge></div>
                                            <div className="font-bold text-lg">${order.total.toFixed(2)}</div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 pt-0">
                                        <div className="border-t pt-4">
                                            <div className="grid md:grid-cols-3 gap-6">
                                                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                     <div>
                                                        <h4 className="font-semibold mb-2">Customer Details</h4>
                                                        <div className="space-y-1 text-sm">
                                                            <p className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> {order.customerName}</p>
                                                            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {order.customerPhone}</p>
                                                            <p className="flex items-start gap-2"><MapPin className="h-4 w-4 text-muted-foreground mt-1" /> {order.deliveryAddress}</p>
                                                        </div>
                                                     </div>
                                                      <div>
                                                        <h4 className="font-semibold mb-2">Order Summary</h4>
                                                        <ul className="list-disc pl-5 text-sm">
                                                            {order.items.map(item => (
                                                                <li key={item.id}>{item.name} x {item.quantity}</li>
                                                            ))}
                                                        </ul>
                                                         <div className="mt-4">
                                                            <Button size="sm" variant="outline" onClick={() => handlePrintKOT(order)}>
                                                                <Printer className="mr-2 h-4 w-4" />
                                                                Print KOT & Slip
                                                            </Button>
                                                        </div>
                                                     </div>
                                                     <div className="col-span-full sm:col-span-1">
                                                        <h4 className="font-semibold mb-2">Payment</h4>
                                                        <div className="flex items-center gap-2 capitalize">
                                                            {order.paymentMethod === 'cash' ? <CircleDollarSign className="h-4 w-4"/> : <BadgeCent className="h-4 w-4"/>}
                                                            <span>{order.paymentMethod}</span>
                                                            <Badge variant={order.paymentStatus === 'completed' ? 'default' : 'secondary'}>{order.paymentStatus}</Badge>
                                                        </div>
                                                        {order.paymentMethod === 'upi' && (
                                                            <>
                                                            <p className="text-sm mt-1 text-muted-foreground break-all">
                                                                <span className="font-medium text-foreground">Transaction ID:</span> {order.paymentDetails?.transactionId || 'N/A'}
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
                                                     <div className="col-span-full sm:col-span-1">
                                                        {(restaurant.deliveryBoys?.length || 0) > 0 && ['accepted', 'preparing'].includes(order.status) && (
                                                          <DeliveryAssigner 
                                                            order={order}
                                                            deliveryBoys={restaurant.deliveryBoys || []}
                                                            onAssign={(deliveryBoyId) => handleAssignDelivery(order.id, deliveryBoyId)}
                                                            isAssigning={updatingOrderId === order.id}
                                                          />
                                                        )}
                                                         {order.deliveryBoy && (
                                                             <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
                                                                <Bike className="h-5 w-5 text-muted-foreground" />
                                                                <div className="text-sm">
                                                                    <p className="font-semibold">{order.deliveryBoy.name}</p>
                                                                    <p className="text-muted-foreground">Assigned for delivery</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                 <div className="md:col-span-1 flex flex-col justify-between">
                                                     <h4 className="font-semibold mb-2">Order Status</h4>
                                                      <OrderStatusUpdater 
                                                        order={order} 
                                                        onUpdate={(status) => handleStatusChange(order.id, status)}
                                                        isUpdating={updatingOrderId === order.id}
                                                      />
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
                                <h3 className="mt-4 text-lg font-medium">No Active Orders</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    When customers place new orders, they will appear here.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
        {orderToPrint && restaurant && (
            <div className="hidden print:block">
                <KOT order={orderToPrint} restaurant={restaurant} />
            </div>
        )}
        </>
    );
}
