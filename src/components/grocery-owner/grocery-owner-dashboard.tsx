
'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Carrot, Truck, Star, ClipboardList, Edit, MenuSquare, BookOpen, ShieldAlert, BadgeCheck, Clock, ShieldX, Bike, History, BarChart2 } from 'lucide-react';
import { useGroceryOwnerDashboardData } from '@/hooks/use-grocery-owner-dashboard-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { GroceryStoreRegistrationForm } from './grocery-store-registration-form';
import { useState } from 'react';
import { EditGroceryStoreForm } from './edit-grocery-store-form';
import Link from 'next/link';

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

export default function GroceryOwnerDashboard() {
  const { data, loading, error, refreshData } = useGroceryOwnerDashboardData();
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);

  if (loading) {
      return (
        <div className="min-h-screen bg-background">
          <Header />
           <main className="container py-8">
                <Skeleton className="h-8 w-1/3 mb-8" />
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard loading title="Today's Orders" value="0" description="" icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />} />
                    <StatCard loading title="Pending Deliveries" value="0" description="" icon={<Truck className="h-4 w-4 text-muted-foreground" />} />
                    <StatCard loading title="Listed Items" value="0" description="" icon={<Carrot className="h-4 w-4 text-muted-foreground" />} />
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
  
  if (!data?.store) {
     return (
        <div className="min-h-screen bg-background">
          <Header />
           <main className="container py-8">
                <GroceryStoreRegistrationForm onStoreCreated={refreshData} />
           </main>
        </div>
     )
  }

  if (data.store.status === 'pending') {
      return (
          <div className="min-h-screen bg-background">
              <Header />
              <main className="container py-8 flex justify-center">
                  <Card className="w-full max-w-2xl">
                      <CardHeader className="items-center text-center">
                         <Clock className="h-12 w-12 text-accent mb-4"/>
                         <CardTitle className="text-2xl">Application Pending</CardTitle>
                         <CardDescription className="text-base">
                            Thank you for submitting your store details. Your application is currently under review.
                         </CardDescription>
                      </CardHeader>
                  </Card>
              </main>
          </div>
      )
  }

   if (data.store.status === 'rejected') {
      return (
          <div className="min-h-screen bg-background">
              <Header />
              <main className="container py-8 flex justify-center">
                  <Alert variant="destructive" className="w-full max-w-2xl">
                      <ShieldX className="h-5 w-5"/>
                      <AlertTitle>Application Rejected</AlertTitle>
                      <AlertDescription>
                        Unfortunately, your store application was not approved. Please contact support.
                      </AlertDescription>
                  </Alert>
              </main>
          </div>
      )
  }

  if (data.store.status === 'disabled') {
      return (
          <div className="min-h-screen bg-background">
              <Header />
              <main className="container py-8 flex justify-center">
                   <Alert variant="destructive" className="w-full max-w-2xl">
                      <ShieldAlert className="h-5 w-5"/>
                      <AlertTitle>Store Disabled</AlertTitle>
                      <AlertDescription>
                        Your store is currently disabled. Please contact support if you believe this is an error.
                      </AlertDescription>
                  </Alert>
              </main>
          </div>
      )
  }

  return (
    <>
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="flex justify-between items-start mb-8">
            <h1 className="text-3xl font-bold">{data.store.name} Dashboard</h1>
            <div className="flex items-center gap-2">
                <BadgeCheck className="text-green-500 h-6 w-6"/>
                <span className="text-lg font-semibold text-green-600">Approved</span>
            </div>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <StatCard loading={loading} title="Today's Orders" value={data.todaysOrders} description="" icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />} />
          <StatCard loading={loading} title="Pending Deliveries" value={data.pendingDeliveries} description="" icon={<Truck className="h-4 w-4 text-muted-foreground" />} />
          <StatCard loading={loading} title="Listed Items" value={data.itemsCount} description="" icon={<Carrot className="h-4 w-4 text-muted-foreground" />} />
          <StatCard loading={loading} title="Average Rating" value={data.store.rating?.toFixed(1) || 'N/A'} description={`Based on ${data.reviewCount} reviews`} icon={<Star className="h-4 w-4 text-muted-foreground" />} />
        </div>
         <div className="mt-12">
            <Card>
                <CardHeader>
                    <CardTitle>Manage Your Store</CardTitle>
                    <CardDescription>Quick links to manage your grocery store.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                    <Button asChild><Link href="/grocery-owner/items"><MenuSquare className="mr-2 h-4 w-4" />Manage Items</Link></Button>
                    <Button asChild><Link href="/grocery-owner/orders"><BookOpen className="mr-2 h-4 w-4" />View Active Orders</Link></Button>
                    <Button asChild><Link href="/grocery-owner/orders/history"><History className="mr-2 h-4 w-4" />View Order History</Link></Button>
                    <Button asChild><Link href="/grocery-owner/delivery"><Bike className="mr-2 h-4 w-4" />Manage Delivery</Link></Button>
                    <Button onClick={() => setIsEditFormOpen(true)}><Edit className="mr-2 h-4 w-4" />Edit Store Profile</Button>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
    {data.store && (
        <EditGroceryStoreForm
            isOpen={isEditFormOpen}
            onOpenChange={setIsEditFormOpen}
            store={data.store}
            onStoreUpdated={() => {
                setIsEditFormOpen(false);
                refreshData();
            }}
        />
    )}
    </>
  );
}
