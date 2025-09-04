

'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Users, Utensils, ShieldCheck, UserCheck, UserX, CheckCircle, XCircle, FileDown, Calendar as CalendarIcon, Power, PowerOff, FileText, MapPin, PlusCircle, Trash2, Palette, Percent, Star, Carrot } from 'lucide-react';
import { useAdminDashboardData } from '@/hooks/use-admin-dashboard-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AppUser } from '@/hooks/use-auth';
import type { Restaurant, BannerConfig, GroceryStore } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { updateUserStatus, updateRestaurantStatus, addServiceableCity, removeServiceableCity, updateBannerConfig, updateCommissionRate, updateRestaurantPromotionStatus, updateGroceryStoreStatus, updateGroceryStorePromotionStatus } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';
import { generateSalesReport, type GenerateSalesReportOutput } from '@/ai/flows/generate-sales-report';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '../ui/input';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import Link from 'next/link';


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

    const handlePromotionToggle = async (restaurantId: string, isPromoted: boolean) => {
        setUpdatingRestaurantId(restaurantId);
        try {
            await updateRestaurantPromotionStatus(restaurantId, !isPromoted);
            toast({ title: "Promotion status updated", description: `Restaurant has been ${!isPromoted ? 'promoted' : 'demoted'}.` });
            onUpdate();
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Update failed', description: error.message });
        } finally {
            setUpdatingRestaurantId(null);
        }
    }
    
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
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={getStatusVariant(restaurant.status)} className="capitalize">{restaurant.status}</Badge>
                                        {restaurant.isPromoted && <Badge variant="secondary"><Star className="h-3 w-3 mr-1" />Promoted</Badge>}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                     {restaurant.status === 'approved' && (
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handlePromotionToggle(restaurant.id, !!restaurant.isPromoted)} disabled={updatingRestaurantId === restaurant.id}>
                                            <Star className={cn("h-4 w-4", restaurant.isPromoted && "fill-amber-400 text-amber-500")} />
                                        </Button>
                                    )}
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

function GroceryStoreTable({ stores, loading, onUpdate }: { stores: GroceryStore[], loading: boolean, onUpdate: () => void }) {
    const [updatingStoreId, setUpdatingStoreId] = useState<string | null>(null);
    const { toast } = useToast();

     const getStatusVariant = (status: GroceryStore['status']) => {
        switch (status) {
            case 'approved': return 'default';
            case 'pending': return 'secondary';
            case 'rejected': return 'destructive';
            case 'disabled': return 'outline';
            default: return 'secondary';
        }
    };

    const handleUpdateStatus = async (storeId: string, status: GroceryStore['status']) => {
        setUpdatingStoreId(storeId);
        try {
            await updateGroceryStoreStatus(storeId, status);
            toast({ title: "Grocery store status updated", description: `Store has been ${status}.` });
            onUpdate();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update failed', description: error.message });
        } finally {
            setUpdatingStoreId(null);
        }
    };

     const handlePromotionToggle = async (storeId: string, isPromoted: boolean) => {
        setUpdatingStoreId(storeId);
        try {
            await updateGroceryStorePromotionStatus(storeId, !isPromoted);
            toast({ title: "Promotion status updated", description: `Store has been ${!isPromoted ? 'promoted' : 'demoted'}.` });
            onUpdate();
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Update failed', description: error.message });
        } finally {
            setUpdatingStoreId(null);
        }
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Grocery Stores</CardTitle>
                <CardDescription>Approve, reject, or disable grocery stores.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? Array.from({ length: 2 }).map((_, i) => (
                             <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-8 w-40 ml-auto" /></TableCell>
                            </TableRow>
                        )) : stores.map(store => (
                             <TableRow key={store.id}>
                                <TableCell className="font-medium">{store.name}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={getStatusVariant(store.status)} className="capitalize">{store.status}</Badge>
                                        {store.isPromoted && <Badge variant="secondary"><Star className="h-3 w-3 mr-1" />Promoted</Badge>}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                     {store.status === 'approved' && (
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handlePromotionToggle(store.id, !!store.isPromoted)} disabled={updatingStoreId === store.id}>
                                            <Star className={cn("h-4 w-4", store.isPromoted && "fill-amber-400 text-amber-500")} />
                                        </Button>
                                    )}
                                    {store.status === 'pending' && (
                                        <>
                                         <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(store.id, 'approved')} disabled={updatingStoreId === store.id}>
                                            {updatingStoreId === store.id ? 'Approving...' : <><CheckCircle className="mr-2 h-4 w-4" />Approve</>}
                                         </Button>
                                         <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(store.id, 'rejected')} disabled={updatingStoreId === store.id}>
                                            {updatingStoreId === store.id ? 'Rejecting...' : <><XCircle className="mr-2 h-4 w-4" />Reject</>}
                                         </Button>
                                        </>
                                    )}
                                     {store.status === 'approved' && (
                                        <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(store.id, 'disabled')} disabled={updatingStoreId === store.id}>
                                           {updatingStoreId === store.id ? 'Disabling...' : <><PowerOff className="mr-2 h-4 w-4" />Disable</>}
                                        </Button>
                                    )}
                                     {store.status === 'disabled' && (
                                        <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(store.id, 'approved')} disabled={updatingStoreId === store.id}>
                                            {updatingStoreId === store.id ? 'Activating...' : <><Power className="mr-2 h-4 w-4" />Activate</>}
                                        </Button>
                                    )}
                                     {store.status === 'rejected' && (
                                        <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(store.id, 'pending')} disabled={updatingStoreId === store.id}>
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
    const [isGenerating, setIsGenerating] = useState(false);
    const [report, setReport] = useState<GenerateSalesReportOutput | null>(null);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const { toast } = useToast();

    const handleGenerateReport = async () => {
        if (!date || !date.from) {
            toast({
                variant: 'destructive',
                title: 'Date range required',
                description: 'Please select a date range to generate a report.',
            });
            return;
        }

        setIsGenerating(true);
        try {
            const reportData = await generateSalesReport({
                startDate: date.from.toISOString(),
                endDate: date.to ? date.to.toISOString() : date.from.toISOString(),
            });
            setReport(reportData);
            setIsReportOpen(true);
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Report Generation Failed',
                description: error.message || 'An unexpected error occurred.',
            });
        } finally {
            setIsGenerating(false);
        }
    };
    
    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>AI Sales Report</CardTitle>
                    <CardDescription>Generate an AI-powered sales summary.</CardDescription>
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
                        <Button onClick={handleGenerateReport} disabled={!date || isGenerating}>
                            {isGenerating ? 'Generating...' : <><FileText className="mr-2 h-4 w-4" /> Generate Report</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>
             <AlertDialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sales Report</AlertDialogTitle>
                        <AlertDialogDescription>
                            AI-generated summary for the selected period.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="max-h-80 overflow-y-auto pr-4 text-sm whitespace-pre-wrap">
                        {report?.report}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setIsReportOpen(false)}>Close</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

function ServiceableLocations({ locations, loading, onUpdate }: { locations: string[], loading: boolean, onUpdate: () => void }) {
    const [newCity, setNewCity] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleAddCity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCity.trim()) return;

        setIsSubmitting(true);
        try {
            await addServiceableCity(newCity.trim());
            toast({ title: 'City Added', description: `${newCity.trim()} is now a serviceable location.` });
            setNewCity('');
            onUpdate();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update failed', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveCity = async (city: string) => {
        try {
            await removeServiceableCity(city);
            toast({ title: 'City Removed', description: `${city} is no longer a serviceable location.` });
            onUpdate();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update failed', description: error.message });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Service Locations</CardTitle>
                <CardDescription>Add or remove cities where your service is available.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAddCity} className="flex gap-2 mb-4">
                    <Input
                        placeholder="Enter city name"
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        disabled={isSubmitting}
                    />
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Adding...' : <PlusCircle />}
                    </Button>
                </form>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {loading ? Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-10 w-full" />) 
                    : locations.length > 0 ? (
                        locations.map(city => (
                            <div key={city} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                <span className="font-medium">{city}</span>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently remove "{city}" from the list of serviceable locations.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleRemoveCity(city)}>Continue</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground text-sm py-4">No serviceable locations added yet.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

const bannerSchema = z.object({
  isEnabled: z.boolean(),
  heading: z.string().min(1, 'Heading is required.'),
  isHeadingEnabled: z.boolean(),
  description: z.string().min(1, 'Description is required.'),
  isDescriptionEnabled: z.boolean(),
  buttonText: z.string().min(1, 'Button text is required.'),
  isButtonEnabled: z.boolean(),
  buttonLink: z.string().min(1, 'Button link is required.'),
  imageUrl: z.string().url('Must be a valid URL.').or(z.literal('')),
});


function BannerManager({ initialConfig, onUpdate }: { initialConfig: BannerConfig | null, onUpdate: () => void }) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof bannerSchema>>({
        resolver: zodResolver(bannerSchema),
        defaultValues: {
            isEnabled: initialConfig?.isEnabled ?? false,
            heading: initialConfig?.heading ?? '',
            isHeadingEnabled: initialConfig?.isHeadingEnabled ?? true,
            description: initialConfig?.description ?? '',
            isDescriptionEnabled: initialConfig?.isDescriptionEnabled ?? true,
            buttonText: initialConfig?.buttonText ?? '',
            isButtonEnabled: initialConfig?.isButtonEnabled ?? true,
            buttonLink: initialConfig?.buttonLink ?? '',
            imageUrl: initialConfig?.imageUrl ?? '',
        }
    });

    useEffect(() => {
        form.reset({
            isEnabled: initialConfig?.isEnabled ?? false,
            heading: initialConfig?.heading ?? '',
            isHeadingEnabled: initialConfig?.isHeadingEnabled ?? true,
            description: initialConfig?.description ?? '',
            isDescriptionEnabled: initialConfig?.isDescriptionEnabled ?? true,
            buttonText: initialConfig?.buttonText ?? '',
            isButtonEnabled: initialConfig?.isButtonEnabled ?? true,
            buttonLink: initialConfig?.buttonLink ?? '',
            imageUrl: initialConfig?.imageUrl ?? '',
        })
    }, [initialConfig, form]);

    const onSubmit = async (data: z.infer<typeof bannerSchema>) => {
        setIsSubmitting(true);
        try {
            await updateBannerConfig(data);
            toast({ title: 'Success', description: 'Promotional banner updated successfully.' });
            onUpdate();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Promotional Banner</CardTitle>
                <CardDescription>Customize the banner on the customer homepage.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                     <div className="flex items-center space-x-2 p-3 rounded-md border bg-muted/50">
                        <Controller
                            control={form.control}
                            name="isEnabled"
                            render={({ field }) => (
                                <Switch
                                    id="isEnabled"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            )}
                        />
                         <Label htmlFor="isEnabled" className="text-base font-semibold">Enable Banner on Homepage</Label>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                             <Controller control={form.control} name="isHeadingEnabled" render={({ field }) => ( <Switch id="isHeadingEnabled" checked={field.value} onCheckedChange={field.onChange}/> )}/>
                             <Label htmlFor="isHeadingEnabled">Enable Heading</Label>
                        </div>
                        <Input id="heading" {...form.register('heading')} placeholder="e.g., Get 50% Off!"/>
                        {form.formState.errors.heading && <p className="text-sm text-destructive">{form.formState.errors.heading.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Controller control={form.control} name="isDescriptionEnabled" render={({ field }) => ( <Switch id="isDescriptionEnabled" checked={field.value} onCheckedChange={field.onChange}/> )}/>
                            <Label htmlFor="isDescriptionEnabled">Enable Description</Label>
                        </div>
                        <Textarea id="description" {...form.register('description')} placeholder="e.g., Use code FIRST50..."/>
                         {form.formState.errors.description && <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>}
                    </div>
                    
                     <div className="space-y-2">
                         <Label htmlFor="imageUrl">Background Image URL</Label>
                        <Input id="imageUrl" {...form.register('imageUrl')} placeholder="https://example.com/banner.png"/>
                        {form.formState.errors.imageUrl && <p className="text-sm text-destructive">{form.formState.errors.imageUrl.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Controller control={form.control} name="isButtonEnabled" render={({ field }) => ( <Switch id="isButtonEnabled" checked={field.value} onCheckedChange={field.onChange}/> )}/>
                                <Label htmlFor="isButtonEnabled">Enable Button</Label>
                            </div>
                            <Input id="buttonText" {...form.register('buttonText')} placeholder="Order Now"/>
                            {form.formState.errors.buttonText && <p className="text-sm text-destructive">{form.formState.errors.buttonText.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="buttonLink">Button Link Target</Label>
                            <Input id="buttonLink" {...form.register('buttonLink')} placeholder="#restaurants"/>
                            {form.formState.errors.buttonLink && <p className="text-sm text-destructive">{form.formState.errors.buttonLink.message}</p>}
                        </div>
                    </div>
                    
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Banner Settings'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

function CommissionManager({ initialRate, onUpdate }: { initialRate: number; onUpdate: () => void }) {
    const { toast } = useToast();
    const [rate, setRate] = useState(initialRate);
    const [isSaving, setIsSaving] = useState(false);
    
    useEffect(() => {
        setRate(initialRate);
    }, [initialRate]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateCommissionRate(rate);
            toast({ title: 'Success', description: 'Commission rate updated.' });
            onUpdate();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSaving(false);
        }
    }

    return (
         <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline"><Percent className="mr-2 h-4 w-4" /> Set Commission Rate</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Set Global Commission Rate</AlertDialogTitle>
                    <AlertDialogDescription>
                        This rate will be used to calculate commission from all restaurants. Enter a value between 0 and 100.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex items-center gap-2 py-4">
                    <Input 
                        type="number"
                        value={rate}
                        onChange={(e) => setRate(Number(e.target.value))}
                        min="0"
                        max="100"
                        className="w-24"
                    />
                    <Percent className="h-5 w-5 text-muted-foreground" />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Rate'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default function AdminDashboard() {
  const { data, loading, refreshData } = useAdminDashboardData();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-12">
            <StatCard loading={loading} title="Total Revenue" value="Rs.45,231" icon={<BarChart className="h-4 w-4 text-muted-foreground" />} description="+20.1% from last month" />
            <StatCard loading={loading} title="Total Customers" value={data.customerCount} icon={<Users className="h-4 w-4 text-muted-foreground" />} description="All-time customer count" />
            <StatCard loading={loading} title="Total Restaurants" value={data.restaurantCount} icon={<Utensils className="h-4 w-4 text-muted-foreground" />} description="Restaurants & grocery stores" />
            <StatCard loading={loading} title="Pending Approvals" value={(data.pendingRestaurantApprovalCount ?? 0) + (data.pendingGroceryApprovalCount ?? 0)} icon={<ShieldCheck className="h-4 w-4 text-muted-foreground" />} description="Vendors needing review" />
        </div>

        <div className="grid gap-12 lg:grid-cols-3">
             <div className="lg:col-span-2 space-y-12">
                <RestaurantTable restaurants={data.restaurants} loading={loading} onUpdate={refreshData} />
                <GroceryStoreTable stores={data.groceryStores} loading={loading} onUpdate={refreshData} />
                <UserTable users={data.users} loading={loading} onUpdate={refreshData} />
             </div>
             <div className="space-y-12">
                <Card>
                    <CardHeader>
                        <CardTitle>App Configuration</CardTitle>
                        <CardDescription>Global settings for the application.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <Button asChild variant="outline">
                            <Link href="/admin/cuisines"><Palette className="mr-2 h-4 w-4"/> Manage Cuisines</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/admin/grocery-categories"><Carrot className="mr-2 h-4 w-4"/> Manage Grocery Categories</Link>
                        </Button>
                         <Button asChild variant="outline">
                            <Link href="/admin/reports"><FileDown className="mr-2 h-4 w-4"/> Commission Reports</Link>
                        </Button>
                         <CommissionManager initialRate={data.commissionRate ?? 0} onUpdate={refreshData} />
                    </CardContent>
                </Card>
                <BannerManager initialConfig={data.bannerConfig} onUpdate={refreshData} />
                <Reports />
                <ServiceableLocations locations={data.serviceableCities} loading={loading} onUpdate={refreshData} />
             </div>
        </div>
      </main>
    </div>
  );
}
