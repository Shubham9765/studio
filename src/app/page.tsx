
'use client';

import { useAuth } from '@/hooks/use-auth';
import { HomePage } from '@/components/home-page';
import AdminDashboard from '@/components/admin/admin-dashboard';
import OwnerDashboard from '@/components/owner/owner-dashboard';
import DeliveryDashboard from '@/components/delivery/delivery-dashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { user, loading } = useAuth();

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
  
  if (user?.role === 'delivery') {
    return <DeliveryDashboard />;
  }

  return <HomePage />;
}
