

'use client';

import { Suspense } from 'react';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { InsightsDashboard } from '@/components/owner/insights-dashboard';

export default function InsightsPage() {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-8">
                <Suspense fallback={
                    <div className="space-y-8">
                        <Skeleton className="h-10 w-1/3" />
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Skeleton className="h-28" />
                            <Skeleton className="h-28" />
                            <Skeleton className="h-28" />
                             <Skeleton className="h-28" />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <Skeleton className="h-80" />
                            <Skeleton className="h-80 lg:col-span-2" />
                        </div>
                    </div>
                }>
                    <InsightsDashboard />
                </Suspense>
            </main>
        </div>
    );
}
