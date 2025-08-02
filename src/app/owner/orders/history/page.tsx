
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Order, Restaurant } from '@/lib/types';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getOrdersForRestaurant, getRestaurantByOwnerId } from '@/services/restaurantClientService';
import { Button } from '@/components/ui/button';
import { AlertTriangle, BookOpen, History } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function OrderHistoryPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRestaurantAndOrders = async () => {
            if (user?.uid) {
                try {
                    setLoading(true);
                    const rest = await getRestaurantByOwnerId(user.uid);
                    setRestaurant(rest);
                    if (rest) {
                        const allOrders = await getOrdersForRestaurant(rest.id);
                        const historicalOrders = allOrders.filter(o => o.status === 'delivered' || o.status === 'cancelled');
                        setOrders(historicalOrders);
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

        if (!authLoading) {
            if (user) {
                fetchRestaurantAndOrders();
            } else {
                router.push('/');
            }
        }
    }, [user, authLoading, toast, router]);

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
                        <AlertDescription>You must register a restaurant before you can view order history.</AlertDescription>
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
                    <h1 className="text-3xl font-bold">Order History</h1>
                     <Button asChild variant="outline">
                        <Link href="/owner/orders">
                            View Active Orders
                        </Link>
                    </Button>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Completed & Cancelled Orders</CardTitle>
                        <CardDescription>A historical record of all orders from {restaurant.name}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {orders.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {orders.map(order => (
                                <AccordionItem value={order.id} key={order.id} className="border rounded-lg">
                                    <AccordionTrigger className="p-4 hover:no-underline">
                                        <div className="flex justify-between w-full items-center">
                                            <div className="flex flex-col text-left">
                                                <span className="font-bold">Order #{order.id.substring(0,6)}...</span>
                                                <span className="text-sm text-muted-foreground">{order.customerName}</span>
                                            </div>
                                            <div className="hidden md:block text-sm text-muted-foreground">{format(order.createdAt.toDate(), 'PPpp')}</div>
                                            <div>
                                                <Badge variant={order.status === 'delivered' ? 'default' : 'destructive'} className="capitalize">
                                                    {order.status.replace('-', ' ')}
                                                </Badge>
                                            </div>
                                            <div className="font-bold text-lg">${order.total.toFixed(2)}</div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 pt-0">
                                        <div className="border-t pt-4">
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
                            ))}
                        </Accordion>
                        ) : (
                            <div className="text-center py-12">
                                <History className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-medium">No Historical Orders</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Completed or cancelled orders will appear here.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

    
