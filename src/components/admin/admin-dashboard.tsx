
'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Users, Utensils, ShieldCheck, UserCheck, UserX, CheckCircle, XCircle } from 'lucide-react';
import { useAdminDashboardData } from '@/hooks/use-admin-dashboard-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AppUser } from '@/hooks/use-auth';
import type { Restaurant } from '@/lib/types';

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

function UserTable({ users, loading }: { users: AppUser[], loading: boolean }) {
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
                                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                            </TableRow>
                        )) : users.map(user => (
                            <TableRow key={user.uid}>
                                <TableCell className="font-medium">{user.username}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell><Badge variant="secondary" className="capitalize">{user.role}</Badge></TableCell>
                                <TableCell><Badge variant={user.status === 'active' ? 'default' : 'destructive'} className="capitalize">{user.status}</Badge></TableCell>
                                <TableCell className="text-right">
                                    {user.status === 'active' ? (
                                        <Button variant="outline" size="sm"><UserX className="mr-2 h-4 w-4" />Deactivate</Button>
                                    ) : (
                                        <Button variant="outline" size="sm"><UserCheck className="mr-2 h-4 w-4" />Activate</Button>
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

function RestaurantTable({ restaurants, loading }: { restaurants: Restaurant[], loading: boolean }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Restaurants</CardTitle>
                <CardDescription>Approve or reject new restaurant registrations.</CardDescription>
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
                                <TableCell className="text-right"><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
                            </TableRow>
                        )) : restaurants.map(restaurant => (
                             <TableRow key={restaurant.id}>
                                <TableCell className="font-medium">{restaurant.name}</TableCell>
                                <TableCell>{restaurant.cuisine}</TableCell>
                                <TableCell><Badge variant={restaurant.status === 'approved' ? 'default' : restaurant.status === 'pending' ? 'secondary' : 'destructive'} className="capitalize">{restaurant.status}</Badge></TableCell>
                                <TableCell className="text-right space-x-2">
                                    {restaurant.status === 'pending' && (
                                        <>
                                         <Button variant="outline" size="sm"><CheckCircle className="mr-2 h-4 w-4" />Approve</Button>
                                         <Button variant="destructive" size="sm"><XCircle className="mr-2 h-4 w-4" />Reject</Button>
                                        </>
                                    )}
                                     {restaurant.status === 'approved' && (
                                        <Button variant="destructive" size="sm"><XCircle className="mr-2 h-4 w-4" />Disable</Button>
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


export default function AdminDashboard() {
  const { data, loading } = useAdminDashboardData();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <StatCard loading={loading} title="Total Revenue" value="$45,231" icon={<BarChart className="h-4 w-4 text-muted-foreground" />} description="+20.1% from last month" />
            <StatCard loading={loading} title="Total Customers" value={data.customerCount} icon={<Users className="h-4 w-4 text-muted-foreground" />} description="All-time customer count" />
            <StatCard loading={loading} title="Total Restaurants" value={data.restaurantCount} icon={<Utensils className="h-4 w-4 text-muted-foreground" />} description="All-time restaurant count" />
            <StatCard loading={loading} title="Pending Approvals" value={data.pendingApprovalCount} icon={<ShieldCheck className="h-4 w-4 text-muted-foreground" />} description="Restaurants needing review" />
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-2">
            <RestaurantTable restaurants={data.restaurants} loading={loading} />
            <UserTable users={data.users} loading={loading} />
        </div>
      </main>
    </div>
  );
}
