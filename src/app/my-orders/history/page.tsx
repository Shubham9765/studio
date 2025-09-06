
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Order } from '@/lib/types';
import { rateRestaurant } from '@/services/restaurantService';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, History, Copy, PartyPopper, Star } from 'lucide-react';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { getOrdersByCustomerId as getOrdersByCustomerIdClient } from '@/services/restaurantClientService';


function RatingDialog({ order, onRatingSuccess }: { order: Order, onRatingSuccess: (orderId: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState(5);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmitRating = async () => {
        setIsSubmitting(true);
        try {
            await rateRestaurant(order.id, order.restaurantId, rating);
            toast({ title: 'Rating Submitted!', description: `You rated ${order.restaurantName} ${rating} stars.` });
            onRatingSuccess(order.id);
            setIsOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Rating failed', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" disabled={!!order.ratingGiven}>
                    <Star className="mr-2 h-4 w-4" />
                    {order.ratingGiven ? `Rated` : 'Rate Restaurant'}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rate your experience at {order.restaurantName}</DialogTitle>
                    <DialogDescription>Your feedback helps other customers.</DialogDescription>
                </DialogHeader>
                <div className="py-8">
                    <div className="flex justify-center items-center gap-4 mb-4">
                        <span className="text-4xl font-bold">{rating.toFixed(1)}</span>
                        <Star className="h-8 w-8 text-amber-400 fill-amber-400" />
                    </div>
                    <Slider
                        defaultValue={[5]}
                        value={[rating]}
                        max={5}
                        min={1}
                        step={0.5}
                        onValueChange={(value) => setRating(value[0])}
                    />
                </div>
                 <DialogFooter>
                    <Button onClick={handleSubmitRating} disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                    </Button>
                 </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function OrderHistoryPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

     const fetchOrders = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const userOrders = await getOrdersByCustomerIdClient(user.uid);
            const historicalOrders = userOrders.filter(o => ['delivered', 'cancelled'].includes(o.status));
            setOrders(historicalOrders);
        } catch (e: any) {
            setError('Failed to fetch your order history.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/');
            return;
        }
        fetchOrders();
    }, [user, authLoading, router]);
    
    const handleRatingSuccess = (orderId: string) => {
        setOrders(prevOrders => prevOrders.map(o => 
            o.id === orderId ? { ...o, ratingGiven: true } : o
        ));
    }

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
                        <CardContent><Skeleton className="h-40 w-full" /></CardContent>
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
                                    <div className="flex items-center p-6">
                                        <AccordionTrigger className="flex-grow">
                                            <div className="flex justify-between w-full items-center">
                                                <div className="flex flex-col text-left">
                                                    <span className="font-bold">Order #{order.id.substring(0, 6)}...</span>
                                                    <span className="text-sm text-muted-foreground">{order.restaurantName}</span>
                                                </div>
                                                <div className="hidden sm:block text-sm">{format(order.createdAt.toDate(), 'PP')}</div>
                                                <div><Badge variant={order.status === 'delivered' ? 'default' : 'destructive'} className="capitalize">{order.status.replace('-', ' ')}</Badge></div>
                                                <div className="font-bold text-lg">Rs.{order.total.toFixed(2)}</div>
                                            </div>
                                        </AccordionTrigger>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 ml-2 flex-shrink-0" onClick={(e) => { e.stopPropagation(); handleCopyId(order.id); }}>
                                            <Copy className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                    <AccordionContent className="px-6 pb-6">
                                         <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                             <div className="flex items-center gap-2 text-muted-foreground mb-4 sm:mb-0">
                                                {order.status === 'delivered' && <PartyPopper className="h-5 w-5 text-green-500" />}
                                                <p>This order was completed on {format(order.createdAt.toDate(), 'PPP')}.</p>
                                             </div>
                                             {order.status === 'delivered' && (
                                                <RatingDialog order={order} onRatingSuccess={handleRatingSuccess} />
                                             )}
                                         </div>
                                        <div className="mt-4">
                                            <h4 className="font-semibold mb-2 mt-4">Order Summary</h4>
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
                        <History className="mx-auto h-16 w-16 text-muted-foreground" />
                        <h3 className="mt-4 text-2xl font-bold">No past orders</h3>
                        <p className="mt-2 text-muted-foreground">Your completed and cancelled orders will appear here.</p>
                        <Button className="mt-6" onClick={() => router.push('/')}>Goto Order Food</Button>
                    </Card>
                )}
            </main>
        </div>
    );
}
