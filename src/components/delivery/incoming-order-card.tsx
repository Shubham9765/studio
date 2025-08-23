
'use client';

import type { Order } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { IndianRupee, MapPin, X, Check, Timer } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Progress } from '../ui/progress';

interface IncomingOrderCardProps {
    order: Order;
    onRespond: (orderId: string, response: 'accepted' | 'rejected') => void;
}

const RESPONSE_TIME_SECONDS = 20;

export function IncomingOrderCard({ order, onRespond }: IncomingOrderCardProps) {
    const [timeLeft, setTimeLeft] = useState(RESPONSE_TIME_SECONDS);

    useEffect(() => {
        if (timeLeft <= 0) {
            onRespond(order.id, 'rejected');
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, order.id, onRespond]);

    const progress = (timeLeft / RESPONSE_TIME_SECONDS) * 100;

    return (
        <Card className="border-2 border-primary shadow-lg animate-pulse">
            <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-ping" />
                        <p className="font-semibold text-lg">New Delivery Request</p>
                    </div>
                    <div className="flex items-center gap-2 font-bold text-lg">
                        <IndianRupee className="h-5 w-5" />
                        <span>{order.total.toFixed(2)}</span>
                    </div>
                </div>
                
                <Separator />

                <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-bold">Pickup</p>
                            <p className="text-muted-foreground">{order.restaurantName}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-bold">Drop</p>
                            <p className="text-muted-foreground">{order.deliveryAddress}</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <Button variant="destructive" className="w-full h-14 text-lg" onClick={() => onRespond(order.id, 'rejected')}>
                        <X className="mr-2 h-6 w-6" /> Decline
                    </Button>
                    <Button className="w-full h-14 text-lg bg-green-600 hover:bg-green-700" onClick={() => onRespond(order.id, 'accepted')}>
                        <Check className="mr-2 h-6 w-6" /> Accept
                    </Button>
                </div>
                <div className="relative pt-2">
                    <Progress value={progress} className="h-2"/>
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-bold text-primary-foreground">
                        <Timer className="h-3 w-3" />
                        <span>{timeLeft}s</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
