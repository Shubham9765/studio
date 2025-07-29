
'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Users, Utensils, ShieldCheck, UserCheck, UserX, CheckCircle, XCircle, FileDown, Calendar as CalendarIcon, Power, PowerOff } from 'lucide-react';
import { useAdminDashboardData } from '@/hooks/use-admin-dashboard-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AppUser } from '@/hooks/use-auth';
import type { Restaurant } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { updateUserStatus, updateRestaurantStatus } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';


function StatCard({ title, value, icon, description, loading }: { title: string, value: string | number, icon: React.ReactNode, description: string, loading: boolean }) {
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

function UserTable({ users, loading, onUpdate }: { users: AppUser[], loading: boolean, onUpdate: () => void }) {
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
    const { toast } = useToast();

    const handleUpdateStatus = async (userId: string, status: 'active' | 'inactive') => {
        setUpdatingUserId(userId);
        try {
            await updateUserStatus(userId, status);
            toast({ title: "User status updated", description: `User has been ${status === 'active' ? 'activated' : 'deactivated'}.` });
            onUpdate();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update failed', description: error.message });
        } finally {
            setUpdatingUserId(null);
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Users</CardTitle>
                <CardDescription>Activate or deactivate users.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? Array.from({ length: 3 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                            </TableRow>
                        )) : users.map(user => (
                            <TableRow key={user.uid}>
                                <TableCell className="font-medium">{user.username}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.phone}</TableCell>
                                <TableCell><Badge variant="secondary" className="capitalize">{user.role}</Badge></TableCell>
                                <TableCell><Badge variant={user.status === 'active' ? 'default' : 'destructive'} className="capitalize">{user.status}</Badge></TableCell>
                                <TableCell className="text-right">
                                    {user.status === 'active' ? (
                                        <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(user.uid, 'inactive')} disabled={updatingUserId === user.uid}>
                                            {updatingUserId === user.uid ? 'Deactivating...' : <><UserX className="mr-2 h-4 w-4" />Deactivate</>}
                                        </Button>
                                    ) : (
                                        <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(user.uid, 'active')} disabled={updatingUserId === user.uid}>
                                           {updatingUserId === user.uid ? 'Activating...' : <><UserCheck className="mr-2 h-4 w-4" />Activate</>}
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

function RestaurantTable({ restaurants, loading, onUpdate }: { restaurants: Restaurant[], loading: boolean, onUpdate: () => void }) {
    const [updatingRestaurantId, setUpdatingRestaurantId] = useState<string | null>(null);
    const { toast } = useToast();

     const getStatusVariant = (status: Restaurant['status']) => {
        switch (status) {
            case 'approved': return 'default';
            case 'pending': return 'secondary';
            case 'rejected': return 'destructive';
            case 'disabled': return 'outline';
            default: return 'secondary';
        }
    };

    const handleUpdateStatus = async (restaurantId: string, status: Restaurant['status']) => {
        setUpdatingRestaurantId(restaurantId);
        try {
            await updateRestaurantStatus(restaurantId, status);
            toast({ title: "Restaurant status updated", description: `Restaurant has been ${status}.` });
            onUpdate();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update failed', description: error.message });
        } finally {
            setUpdatingRestaurantId(null);
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Restaurants</CardTitle>
                <CardDescription>Approve, reject, or disable restaurants.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Cuisine</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? Array.from({ length: 3 }).map((_, i) => (
                             <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-8 w-40 ml-auto" /></TableCell>
                            </TableRow>
                        )) : restaurants.map(restaurant => (
                             <TableRow key={restaurant.id}>
                                <TableCell className="font-medium">{restaurant.name}</TableCell>
                                <TableCell>{restaurant.cuisine}</TableCell>
                                <TableCell><Badge variant={getStatusVariant(restaurant.status)} className="capitalize">{restaurant.status}</Badge></TableCell>
                                <TableCell className="text-right space-x-2">
                                    {restaurant.status === 'pending' && (
                                        <>
                                         <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(restaurant.id, 'approved')} disabled={updatingRestaurantId === restaurant.id}>
                                            {updatingRestaurantId === restaurant.id ? 'Approving...' : <><CheckCircle className="mr-2 h-4 w-4" />Approve</>}
                                         </Button>
                                         <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(restaurant.id, 'rejected')} disabled={updatingRestaurantId === restaurant.id}>
                                            {updatingRestaurantId === restaurant.id ? 'Rejecting...' : <><XCircle className="mr-2 h-4 w-4" />Reject</>}
                                         </Button>
                                        </>
                                    )}
                                     {restaurant.status === 'approved' && (
                                        <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(restaurant.id, 'disabled')} disabled={updatingRestaurantId === restaurant.id}>
                                           {updatingRestaurantId === restaurant.id ? 'Disabling...' : <><PowerOff className="mr-2 h-4 w-4" />Disable</>}
                                        </Button>
                                    )}
                                     {restaurant.status === 'disabled' && (
                                        <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(restaurant.id, 'approved')} disabled={updatingRestaurantId === restaurant.id}>
                                            {updatingRestaurantId === restaurant.id ? 'Activating...' : <><Power className="mr-2 h-4 w-4" />Activate</>}
                                        </Button>
                                    )}
                                     {restaurant.status === 'rejected' && (
                                        <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(restaurant.id, 'pending')} disabled={updatingRestaurantId === restaurant.id}>
                                            Re-review
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function Reports() {
    const [date, setDate] = useState<DateRange | undefined>();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Reports</CardTitle>
                <CardDescription>Generate and download reports for restaurants.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal",
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
                            <span>Pick a date range</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
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
                    <Button disabled={!date}>
                        Generate Report
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="w-full" disabled>
                        <FileDown className="mr-2 h-4 w-4" />
                        Download PDF
                    </Button>
                     <Button variant="outline" className="w-full" disabled>
                        <FileDown className="mr-2 h-4 w-4" />
                        Download Excel
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}


export default function AdminDashboard() {
  const { data, loading, refreshData } = useAdminDashboardData();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-12">
            <StatCard loading={loading} title="Total Revenue" value="$45,231" icon={<BarChart className="h-4 w-4 text-muted-foreground" />} description="+20.1% from last month" />
            <StatCard loading={loading} title="Total Customers" value={data.customerCount} icon={<Users className="h-4 w-4 text-muted-foreground" />} description="All-time customer count" />
            <StatCard loading={loading} title="Total Restaurants" value={data.restaurantCount} icon={<Utensils className="h-4 w-4 text-muted-foreground" />} description="All-time restaurant count" />
            <StatCard loading={loading} title="Pending Approvals" value={data.pendingApprovalCount} icon={<ShieldCheck className="h-4 w-4 text-muted-foreground" />} description="Restaurants needing review" />
        </div>

        <div className="grid gap-12 lg:grid-cols-3">
             <div className="lg:col-span-2">
                <RestaurantTable restaurants={data.restaurants} loading={loading} onUpdate={refreshData} />
             </div>
             <div className="space-y-12">
                <Reports />
                <UserTable users={data.users} loading={loading} onUpdate={refreshData} />
             </div>
        </div>
      </main>
    </div>
  );
}
