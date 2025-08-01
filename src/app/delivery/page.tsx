
'use client';

import { Suspense } from 'react';
import DeliveryDashboard from '@/components/delivery/delivery-dashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default function DeliveryPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="w-full max-w-4xl p-8 space-y-8">
                    <Skeleton className="h-16 w-1/3" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </div>
        }>
            <DeliveryDashboard />
        </Suspense>
    )
}
