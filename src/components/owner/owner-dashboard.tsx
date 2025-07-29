'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Utensils, Truck, Star, ClipboardList, Edit, MenuSquare, BookOpen } from 'lucide-react';
import { useOwnerDashboardData } from '@/hooks/use-owner-dashboard-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

function StatCard({ title, value, description, icon, loading }: { title: string, value: string | number, description: string, icon: React.ReactNode, loading: boolean }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                {loading ? (
                    <>
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-4 w-3/4 mt-1" />
                    </>
                ) : (
                    <>
                        <div className="text-2xl font-bold">{value}</div>
                        <p className="text-xs text-muted-foreground">{description}</p>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

export default function OwnerDashboard() {
  const { data, loading, error } = useOwnerDashboardData();

  if (loading) {
      return (
        <div className="min-h-screen bg-background">
          <Header />
           <main className="container py-8">
                <Skeleton className="h-8 w-1/3 mb-8" />
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard loading title="Today's Orders" value="0" description="" icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />} />
                    <StatCard loading title="Pending Deliveries" value="0" description="" icon={<Truck className="h-4 w-4 text-muted-foreground" />} />
                    <StatCard loading title="Menu Items" value="0" description="" icon={<Utensils className="h-4 w-4 text-muted-foreground" />} />
                    <StatCard loading title="Average Rating" value="0" description="" icon={<Star className="h-4 w-4 text-muted-foreground" />} />
                </div>
                 <div className="mt-12">
                    <Card>
                        <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
                        <CardContent><Skeleton className="h-20 w-full" /></CardContent>
                    </Card>
                </div>
           </main>
        </div>
      )
  }

  if (error) {
     return (
        <div className="min-h-screen bg-background">
          <Header />
           <main className="container py-8 flex items-center justify-center">
                <Alert variant="destructive" className="w-1/2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>An Error Occurred</AlertTitle>
                    <AlertDescription>{error.message}</AlertDescription>
                </Alert>
           </main>
        </div>
     )
  }
  
  if (!data?.restaurant) {
     return (
        <div className="min-h-screen bg-background">
          <Header />
           <main className="container py-8">
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>No Restaurant Found</AlertTitle>
                    <AlertDescription>We couldn't find a restaurant associated with your account. Please complete your restaurant profile.</AlertDescription>
                </Alert>
           </main>
        </div>
     )
  }


  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <h1 className="text-3xl font-bold mb-8">{data.restaurant.name} Dashboard</h1>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <StatCard loading={loading} title="Today's Orders" value={data.todaysOrders} description="+5 since yesterday" icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />} />
          <StatCard loading={loading} title="Pending Deliveries" value={data.pendingDeliveries} description="To be picked up" icon={<Truck className="h-4 w-4 text-muted-foreground" />} />
          <StatCard loading={loading} title="Menu Items" value={data.menuItemsCount} description="Total items listed" icon={<Utensils className="h-4 w-4 text-muted-foreground" />} />
          <StatCard loading={loading} title="Average Rating" value={data.restaurant.rating} description={`Based on ${data.reviewCount} reviews`} icon={<Star className="h-4 w-4 text-muted-foreground" />} />
        </div>
         <div className="mt-12">
            <Card>
                <CardHeader>
                    <CardTitle>Manage Your Restaurant</CardTitle>
                    <CardDescription>Quick links to manage your restaurant's presence on Village Eats.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <Button disabled><MenuSquare />Manage Menu</Button>
                    <Button disabled><BookOpen />View Orders</Button>
                    <Button disabled><Edit />Edit Restaurant Profile</Button>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
