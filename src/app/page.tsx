
'use client';

import { Suspense } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { HomePage } from '@/components/home-page';
import AdminDashboard from '@/components/admin/admin-dashboard';
import OwnerDashboard from '@/components/owner/owner-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Utensils, Carrot } from 'lucide-react';
import { useRouter } from 'next/navigation';
import GroceryOwnerDashboard from '@/components/grocery-owner/grocery-owner-dashboard';
import useLocalStorageState from 'use-local-storage-state';

const DeliveryDashboard = dynamic(() => import('@/components/delivery/delivery-dashboard'), {
    ssr: false,
    loading: () => (
         <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="w-full max-w-4xl p-8 space-y-8">
                <Skeleton className="h-16 w-1/3" />
                <Skeleton className="h-32 w-full" />
            </div>
        </div>
    )
});

const GroceryPage = dynamic(() => import('@/app/grocery/page'), {
    ssr: false,
    loading: () => (
         <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="w-full max-w-4xl p-8 space-y-8">
                <Skeleton className="h-16 w-1/3" />
                <Skeleton className="h-32 w-full" />
            </div>
        </div>
    )
});


export default function Home() {
  const { user, loading } = useAuth();
  const [service, setService] = useLocalStorageState<'food' | 'grocery'>('serviceSelection', { defaultValue: 'food' });
  const router = useRouter();


  const handleServiceToggle = (isGrocery: boolean) => {
    const newService = isGrocery ? 'grocery' : 'food';
    setService(newService);
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-4xl p-8 space-y-8">
            <Skeleton className="h-16 w-1/3" />
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
      </div>
    );
  }

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  if (user?.role === 'owner') {
    return <OwnerDashboard />;
  }
  
  if (user?.role === 'grocery-owner') {
    return <GroceryOwnerDashboard />;
  }

  if (user?.role === 'delivery') {
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

  return (
    <div>
        <div className="container py-4 flex justify-center items-center gap-4">
            <div className="flex items-center gap-2">
                <Utensils className={`h-6 w-6 transition-colors ${service === 'food' ? 'text-primary' : 'text-muted-foreground'}`} />
                <Label htmlFor="service-toggle" className={`font-semibold transition-colors ${service === 'food' ? 'text-primary' : 'text-muted-foreground'}`}>Food</Label>
            </div>
            <Switch
                id="service-toggle"
                checked={service === 'grocery'}
                onCheckedChange={handleServiceToggle}
            />
             <div className="flex items-center gap-2">
                <Carrot className={`h-6 w-6 transition-colors ${service === 'grocery' ? 'text-primary' : 'text-muted-foreground'}`} />
                <Label htmlFor="service-toggle" className={`font-semibold transition-colors ${service === 'grocery' ? 'text-primary' : 'text-muted-foreground'}`}>Groceries</Label>
            </div>
        </div>
        {service === 'food' ? <HomePage /> : <GroceryPage />}
    </div>
  )
}
