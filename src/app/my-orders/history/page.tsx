
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Order } from '@/lib/types';
import { getOrdersByCustomerId } from '@/services/restaurantService';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, History, Copy, PartyPopper } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function OrderHistoryPage() {
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

        const fetchOrders = async () => {
            try {
                setLoading(true);
                const userOrders = await getOrdersByCustomerId(user.uid);
                const historicalOrders = userOrders.filter(o => ['delivered', 'cancelled'].includes(o.status));
                setOrders(historicalOrders);
            } catch (e: any) {
                setError('Failed to fetch your order history.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user, authLoading, router]);

    const handleCopyId = (id: string) => {
        navigator.clipboard.writeText(id);
        toast({
            title: 'Copied!',
            description: 'Order ID copied to clipboard.',
        });
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
                <h1 className="text-3xl font-bold mb-8">Order History</h1>
                {orders.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {orders.map(order => (
                             <Card key={order.id}>
                                <AccordionItem value={order.id} className="border-b-0">
                                    <AccordionTrigger className="p-6">
                                        <div className="flex justify-between w-full items-center">
                                            <div className="flex flex-col text-left">
                                                 <div className="flex items-center gap-2">
                                                    <span className="font-bold">Order #{order.id.substring(0, 6)}...</span>
                                                     <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleCopyId(order.id); }}>
                                                        <Copy className="h-3 w-3"/>
                                                    </Button>
                                                </div>
                                                <span className="text-sm text-muted-foreground">{order.restaurantName || 'Restaurant'}</span>
                                            </div>
                                            <div className="hidden sm:block text-sm">{format(order.createdAt.toDate(), 'PP')}</div>
                                            <div><Badge variant={order.status === 'delivered' ? 'default' : 'destructive'} className="capitalize">{order.status.replace('-', ' ')}</Badge></div>
                                            <div className="font-bold text-lg">${order.total.toFixed(2)}</div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-6 pt-0">
                                         <div className="mt-6">
                                             <div className="flex items-center gap-2 text-muted-foreground">
                                                <PartyPopper className="h-5 w-5 text-green-500" />
                                                <p>This order was completed on {format(order.createdAt.toDate(), 'PPP')}.</p>
                                             </div>
                                            <h4 className="font-semibold mb-2 mt-4">Order Summary</h4>
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
                        <History className="mx-auto h-16 w-16 text-muted-foreground" />
                        <h3 className="mt-4 text-2xl font-bold">No past orders</h3>
                        <p className="mt-2 text-muted-foreground">Your completed and cancelled orders will appear here.</p>
                        <Button className="mt-6" onClick={() => router.push('/')}>Start Shopping</Button>
                    </Card>
                )}
            </main>
        </div>
    );
}
