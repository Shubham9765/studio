
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/header';
import { useAdminDashboardData } from '@/hooks/use-admin-dashboard-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { DollarSign, Hash, Percent, FileText, AlertTriangle, BarChart } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from '@/components/ui/separator';

type RestaurantReport = {
  id: string;
  name: string;
  totalOrders: number;
  totalVolume: number;
  commission: number;
  orders: any[]; 
};

function CommissionReportsPage() {
  const { data, loading, error } = useAdminDashboardData();
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);

  const commissionRate = useMemo(() => data.commissionRate, [data.commissionRate]);

  const restaurantReports = useMemo((): RestaurantReport[] => {
    if (!data.restaurants.length || !data.allOrders.length) {
      return [];
    }

    const reports = data.restaurants.map(restaurant => {
      const restaurantOrders = data.allOrders.filter(order => order.restaurantId === restaurant.id && order.status === 'delivered');
      const totalVolume = restaurantOrders.reduce((sum, order) => sum + order.total, 0);
      
      return {
        id: restaurant.id,
        name: restaurant.name,
        totalOrders: restaurantOrders.length,
        totalVolume,
        commission: totalVolume * (commissionRate / 100),
        orders: restaurantOrders,
      };
    });

    return reports.sort((a, b) => b.totalVolume - a.totalVolume);
  }, [data.restaurants, data.allOrders, commissionRate]);
  
  const selectedRestaurantReport = useMemo(() => {
    if (!selectedRestaurantId) return restaurantReports[0] || null; // Default to first restaurant
    return restaurantReports.find(r => r.id === selectedRestaurantId);
  }, [selectedRestaurantId, restaurantReports]);
  
  const grandTotals = useMemo(() => {
    const totalVolume = restaurantReports.reduce((sum, r) => sum + r.totalVolume, 0);
    const totalCommission = restaurantReports.reduce((sum, r) => sum + r.commission, 0);
    return { totalVolume, totalCommission };
  }, [restaurantReports]);


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
            <Skeleton className="h-8 w-1/3 mb-8" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
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
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Commission Reports</h1>
            <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                <Percent className="h-5 w-5" />
                <span>Rate: {commissionRate}%</span>
            </div>
        </div>
        <p className="text-muted-foreground mb-8">View sales volume and calculated commission for each restaurant.</p>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sales Volume</CardTitle>
                    <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">Rs.{grandTotals.totalVolume.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Across all restaurants</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">Rs.{grandTotals.totalCommission.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Calculated at {commissionRate}%</p>
                </CardContent>
            </Card>
        </div>


        <div className="grid lg:grid-cols-3 gap-8 items-start">
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>Restaurants Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Restaurant</TableHead>
                                <TableHead className="text-right">Sales</TableHead>
                                <TableHead className="text-right">Commission</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {restaurantReports.map(report => (
                                <TableRow 
                                    key={report.id} 
                                    onClick={() => setSelectedRestaurantId(report.id)} 
                                    className="cursor-pointer"
                                    data-state={selectedRestaurantReport?.id === report.id ? 'selected' : ''}
                                >
                                    <TableCell>
                                        <div className="font-medium">{report.name}</div>
                                        <div className="text-xs text-muted-foreground">{report.totalOrders} orders</div>
                                    </TableCell>
                                     <TableCell className="text-right">Rs.{report.totalVolume.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-bold">Rs.{report.commission.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            
            <div className="lg:col-span-2">
                {selectedRestaurantReport ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>{selectedRestaurantReport.name} - Detailed Report</CardTitle>
                             <CardDescription>
                                Showing {selectedRestaurantReport.totalOrders} delivered orders.
                            </CardDescription>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 text-sm">
                                <div className="flex items-center gap-2"><Hash className="h-4 w-4 text-muted-foreground"/> <strong>Total Orders:</strong> {selectedRestaurantReport.totalOrders}</div>
                                <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-muted-foreground"/> <strong>Sales Volume:</strong> Rs.{selectedRestaurantReport.totalVolume.toFixed(2)}</div>
                                <div className="flex items-center gap-2"><Percent className="h-4 w-4 text-muted-foreground"/> <strong>Commission:</strong> Rs.{selectedRestaurantReport.commission.toFixed(2)}</div>
                            </div>
                        </CardHeader>
                        <CardContent>
                           <Separator className="mb-4" />
                            {selectedRestaurantReport.orders.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Order ID</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedRestaurantReport.orders.map(order => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-mono text-xs">#{order.id.substring(0, 8)}</TableCell>
                                                <TableCell>{format(order.createdAt.toDate(), 'PP')}</TableCell>
                                                <TableCell>{order.customerName}</TableCell>
                                                <TableCell className="text-right">Rs.{order.total.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-muted-foreground text-center py-8">No delivered orders found for this restaurant.</p>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                     <Card className="flex flex-col items-center justify-center text-center h-96">
                        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold">Select a Restaurant</h3>
                        <p className="text-muted-foreground">Choose a restaurant from the list to view its detailed report.</p>
                     </Card>
                )}
            </div>
        </div>
      </main>
    </div>
  );
}

export default CommissionReportsPage;

    