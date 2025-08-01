
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getRestaurantByOwnerId, addDeliveryBoyToRestaurant, removeDeliveryBoyFromRestaurant } from '@/services/ownerService';
import type { Restaurant, DeliveryBoy } from '@/lib/types';
import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash, User, Bike, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ManageDeliveryPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchRestaurant = async () => {
        if (user?.uid) {
            try {
                const rest = await getRestaurantByOwnerId(user.uid);
                setRestaurant(rest);
            } catch (e: any) {
                setError('Failed to fetch restaurant data.');
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        if (!authLoading) {
            fetchRestaurant();
        }
    }, [user, authLoading]);

    const handleAddDeliveryBoy = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurant || !email) return;

        setIsSubmitting(true);
        try {
            await addDeliveryBoyToRestaurant(restaurant.id, email);
            toast({ title: 'Success', description: 'Delivery person added.' });
            setEmail('');
            await fetchRestaurant();
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Error', description: err.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveDeliveryBoy = async (deliveryBoy: DeliveryBoy) => {
        if (!restaurant || !confirm(`Are you sure you want to remove ${deliveryBoy.name}?`)) return;

        try {
            await removeDeliveryBoyFromRestaurant(restaurant.id, deliveryBoy);
            toast({ title: 'Success', description: 'Delivery person removed.' });
            await fetchRestaurant();
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Error', description: err.message });
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container py-8">
                    <Skeleton className="h-8 w-1/3 mb-8" />
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
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </main>
            </div>
        )
    }

     if (!restaurant) {
        return (
             <div className="min-h-screen bg-background">
                <Header />
                <main className="container py-8 flex items-center justify-center">
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>No Restaurant Found</AlertTitle>
                        <AlertDescription>You must register a restaurant before you can manage delivery staff.</AlertDescription>
                    </Alert>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-8">
                <h1 className="text-3xl font-bold mb-8">Manage Delivery Staff</h1>
                <div className="grid md:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add Delivery Person</CardTitle>
                            <CardDescription>Enter the email of a registered delivery person to add them to your team.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddDeliveryBoy} className="flex gap-2">
                                <Input
                                    type="email"
                                    placeholder="delivery.person@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Adding...' : <><PlusCircle className="mr-2 h-4 w-4"/> Add</>}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Delivery Team</CardTitle>
                             <CardDescription>
                                {restaurant.deliveryBoys?.length || 0} people on your team.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             {restaurant.deliveryBoys && restaurant.deliveryBoys.length > 0 ? (
                                <ul className="space-y-4">
                                    {restaurant.deliveryBoys.map(boy => (
                                        <li key={boy.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <Bike className="h-6 w-6 text-muted-foreground" />
                                                <div>
                                                    <p className="font-semibold">{boy.name}</p>
                                                    <p className="text-sm text-muted-foreground">{boy.email}</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveDeliveryBoy(boy)}>
                                                <Trash className="h-4 w-4 text-destructive"/>
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-10">
                                    <User className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-4 text-lg font-medium">No Delivery Staff</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">Add delivery people using the form.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
