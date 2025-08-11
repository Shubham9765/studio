
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getRestaurantByOwnerId, getAllOrdersForRestaurant } from '@/services/ownerClientService';
import type { Restaurant, Order } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, BarChart, Users, Utensils, DollarSign, Package, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Bar,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Pie,
  PieChart,
  Cell,
  LabelList
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import type { DateRange } from "react-day-picker"
import { cn } from '@/lib/utils';

function StatCard({ title, value, icon, loading }: { title: string; value: string | number; icon: React.ReactNode; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-1/2" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

export function InsightsDashboard() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const rest = await getRestaurantByOwnerId(user.uid);
        if (rest) {
          setRestaurant(rest);
          const orders = await getAllOrdersForRestaurant(rest.id);
          setAllOrders(orders.filter(o => o.status === 'delivered')); // Only analyze completed orders
        } else {
          setError('No restaurant found. Please register one first.');
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const filteredOrders = useMemo(() => {
    if (!date?.from) return allOrders;
    
    const startDate = startOfDay(date.from);
    const endDate = date.to ? endOfDay(date.to) : endOfDay(date.from);

    return allOrders.filter(order => {
        const orderDate = order.createdAt.toDate();
        return orderDate >= startDate && orderDate <= endDate;
    });

  }, [allOrders, date])

  const {
    totalRevenue,
    totalOrders,
    uniqueCustomers,
    salesByDay,
    topSellingItems,
    topCategories,
  } = useMemo(() => {
    if (filteredOrders.length === 0) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        uniqueCustomers: 0,
        salesByDay: [],
        topSellingItems: [],
        topCategories: [],
      };
    }

    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = filteredOrders.length;
    const uniqueCustomers = new Set(filteredOrders.map(o => o.customerId)).size;

    // Sales by day for the selected range
    const salesByDayMap = new Map<string, number>();
    
    if (date?.from && date?.to) {
        for (let d = startOfDay(date.from); d <= endOfDay(date.to); d.setDate(d.getDate() + 1)) {
            salesByDayMap.set(format(d, 'MMM dd'), 0);
        }
    } else if (date?.from) {
        salesByDayMap.set(format(date.from, 'MMM dd'), 0);
    }

    filteredOrders.forEach(order => {
        const dateKey = format(order.createdAt.toDate(), 'MMM dd');
        if (salesByDayMap.has(dateKey)) {
            salesByDayMap.set(dateKey, (salesByDayMap.get(dateKey) || 0) + order.total);
        }
    });
    const salesByDay = Array.from(salesByDayMap.entries()).map(([name, sales]) => ({ name, sales }));
    
    // Top selling items
    const itemSales = new Map<string, number>();
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        itemSales.set(item.name, (itemSales.get(item.name) || 0) + item.quantity);
      });
    });
    const topSellingItems = Array.from(itemSales.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
      
    // Top categories
    const categorySales = new Map<string, number>();
    filteredOrders.forEach(order => {
        order.items.forEach(item => {
            categorySales.set(item.category, (categorySales.get(item.category) || 0) + 1);
        });
    });
    const topCategories = Array.from(categorySales.entries())
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);


    return { totalRevenue, totalOrders, uniqueCustomers, salesByDay, topSellingItems, topCategories };
  }, [filteredOrders, date]);

  if (loading) {
     return (
        <div className="space-y-8">
            <Skeleton className="h-10 w-1/3" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-80 lg:col-span-3" />
                <Skeleton className="h-80" />
                 <Skeleton className="h-80 lg:col-span-2" />
            </div>
        </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Insights for {restaurant?.name}</h1>
         <div className="grid gap-2">
            <Popover>
                <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                    "w-[300px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                    date.to ? (
                        <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                        </>
                    ) : (
                        format(date.from, "LLL dd, y")
                    )
                    ) : (
                    <span>Pick a date</span>
                    )}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                />
                </PopoverContent>
            </Popover>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} icon={<DollarSign className="text-muted-foreground h-4 w-4" />} loading={loading} />
        <StatCard title="Total Orders" value={totalOrders} icon={<Package className="text-muted-foreground h-4 w-4" />} loading={loading} />
        <StatCard title="Unique Customers" value={uniqueCustomers} icon={<Users className="text-muted-foreground h-4 w-4" />} loading={loading} />
        <StatCard title="Top Item" value={topSellingItems[0]?.name || 'N/A'} icon={<Utensils className="text-muted-foreground h-4 w-4" />} loading={loading} />
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Sales Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <RechartsBarChart data={salesByDay}>
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
              <Tooltip
                contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                }}
              />
              <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1">
             <CardHeader>
                <CardTitle>Top Categories</CardTitle>
            </CardHeader>
            <CardContent>
                 <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={topCategories}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                      >
                        {topCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                         <LabelList dataKey="name" position="outside" offset={15} stroke="hsl(var(--foreground))" fontSize={12} />
                      </Pie>
                      <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius)',
                        }}
                      />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>
           <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Top 5 Selling Items</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={topSellingItems} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={150} stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius)',
                        }}
                    />
                    <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} >
                         <LabelList dataKey="quantity" position="right" offset={10} style={{ fill: 'hsl(var(--foreground))' }} />
                    </Bar>
                    </RechartsBarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
