
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getOrdersForDeliveryBoy } from '@/services/restaurantClientService';
import type { Order } from '@/lib/types';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, History, CheckCircle, PackageCheck } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DeliveryHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignedOrders = async () => {
      if (user?.uid) {
        setLoading(true);
        try {
          const allOrders = await getOrdersForDeliveryBoy(user.uid);
          const deliveredOrders = allOrders.filter(o => o.status === 'delivered');
          setOrders(deliveredOrders);
        } catch (e: any) {
          setError('Failed to fetch order history.');
        } finally {
          setLoading(false);
        }
      }
    };

    if (!authLoading) {
      fetchAssignedOrders();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Skeleton className="h-8 w-1/3 mb-8" />
          <Card>
            <CardHeader><Skeleton className="h-6 w-3/4"/></CardHeader>
            <CardContent><Skeleton className="h-24 w-full"/></CardContent>
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
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Delivery History</h1>
            <Button asChild variant="outline">
                <Link href="/delivery">View Active Deliveries</Link>
            </Button>
        </div>
        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map(order => (
              <Card key={order.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center text-lg">
                    <span>Order #{order.id.substring(0, 6)}...</span>
                     <div className="flex items-center gap-2 text-green-600 font-semibold text-base">
                        <PackageCheck className="h-5 w-5"/>
                        <span>Delivered</span>
                     </div>
                  </CardTitle>
                  <CardDescription>
                    From: {order.restaurantName}<br/>
                    Delivered on: {format(order.createdAt.toDate(), 'PPp')}
                  </CardDescription>
                </CardHeader>
                 <CardContent>
                    <p className="text-sm text-muted-foreground">Delivered to {order.customerName} at {order.deliveryAddress}</p>
                 </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-center justify-center py-20 text-center">
            <History className="mx-auto h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-2xl font-bold">No Completed Deliveries</h3>
            <p className="mt-2 text-muted-foreground">Your completed deliveries will appear here.</p>
          </Card>
        )}
      </main>
    </div>
  );
}
