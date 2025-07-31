
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Order } from '@/lib/types';
import { getOrdersByCustomerId } from '@/services/restaurantService';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, PackageSearch, Package, ChefHat, Bike, PartyPopper } from 'lucide-react';
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

export default function MyOrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/');
            return;
        }

        const fetchOrders = async () => {
            try {
                setLoading(true);
                const userOrders = await getOrdersByCustomerId(user.uid);
                setOrders(userOrders);
            } catch (e: any) {
                setError('Failed to fetch your orders.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user, authLoading, router]);

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
                <h1 className="text-3xl font-bold mb-8">My Orders</h1>
                {orders.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {orders.map(order => (
                             <Card key={order.id}>
                                <AccordionItem value={order.id} className="border-b-0">
                                    <AccordionTrigger className="p-6">
                                        <div className="flex justify-between w-full items-center">
                                            <div className="flex flex-col text-left">
                                                <span className="font-bold">Order #{order.id.substring(0, 6)}...</span>
                                                <span className="text-sm text-muted-foreground">{order.restaurantName || 'Restaurant'}</span>
                                            </div>
                                            <div className="hidden sm:block text-sm">{format(order.createdAt.toDate(), 'PP')}</div>
                                            <div><Badge variant={order.status === 'delivered' ? 'default' : 'secondary'} className="capitalize">{order.status.replace('-', ' ')}</Badge></div>
                                            <div className="font-bold text-lg">${order.total.toFixed(2)}</div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-6 pt-0">
                                        <OrderStatusTracker status={order.status} />
                                        <div className="mt-6">
                                            <h4 className="font-semibold mb-2">Order Summary</h4>
                                             <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                                {order.items.map(item => (
                                                    <li key={item.id} className="flex justify-between">
                                                        <span>{item.name} x {item.quantity}</span>
                                                        <span>${(item.price * item.quantity).toFixed(2)}</span>
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
                        <h3 className="mt-4 text-2xl font-bold">No orders yet</h3>
                        <p className="mt-2 text-muted-foreground">You haven't placed any orders. Let's find something delicious!</p>
                        <Button className="mt-6" onClick={() => router.push('/')}>Start Shopping</Button>
                    </Card>
                )}
            </main>
        </div>
    );
}
