
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import type { MenuItem, Restaurant } from '@/lib/types';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MenuItemForm } from '@/components/owner/menu-item-form';
import { deleteMenuItem, getMenuItems, getRestaurantByOwnerId } from '@/services/ownerService';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, PlusCircle, Trash, Edit, Utensils, ImageIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ManageMenuPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

    const fetchMenuData = async (restaurantId: string) => {
        try {
            const items = await getMenuItems(restaurantId);
            setMenuItems(items);
        } catch (e: any) {
            setError('Failed to fetch menu items.');
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };

    useEffect(() => {
        const fetchRestaurant = async () => {
            if (user?.uid) {
                try {
                    setLoading(true);
                    const rest = await getRestaurantByOwnerId(user.uid);
                    setRestaurant(rest);
                    if (rest) {
                        await fetchMenuData(rest.id);
                    }
                } catch (e: any) {
                    setError('Failed to fetch restaurant data.');
                    toast({ variant: 'destructive', title: 'Error', description: e.message });
                } finally {
                    setLoading(false);
                }
            }
        };

        if (!authLoading) {
            fetchRestaurant();
        }
    }, [user, authLoading, toast]);
    
    const handleFormSubmit = () => {
        setIsFormOpen(false);
        setEditingItem(null);
        if (restaurant) {
            fetchMenuData(restaurant.id);
        }
    }

    const handleEdit = (item: MenuItem) => {
        setEditingItem(item);
        setIsFormOpen(true);
    }
    
    const handleDelete = async (itemId: string) => {
        if (!restaurant) return;
        if (!confirm('Are you sure you want to delete this menu item?')) return;
        
        try {
            await deleteMenuItem(restaurant.id, itemId);
            toast({ title: 'Success', description: 'Menu item deleted.'});
            fetchMenuData(restaurant.id);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error deleting item', description: e.message });
        }
    }

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container py-8">
                    <div className="flex justify-between items-center mb-8">
                        <Skeleton className="h-8 w-1/3" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                    <Card>
                        <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
                        <CardContent>
                            <Skeleton className="h-40 w-full" />
                        </CardContent>
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
                        <AlertDescription>You must register a restaurant before you can manage its menu.</AlertDescription>
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
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold">Manage Menu</h1>
                        <Button onClick={() => { setEditingItem(null); setIsFormOpen(true); }}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Item
                        </Button>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>{restaurant?.name} Menu</CardTitle>
                            <CardDescription>View, add, edit, or delete your menu items.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {menuItems.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-20">Image</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {menuItems.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                {item.imageUrl ? (
                                                    <Image src={item.imageUrl} alt={item.name} width={48} height={48} className="rounded-md object-cover h-12 w-12" />
                                                ) : (
                                                    <div className="w-12 h-12 flex items-center justify-center bg-muted rounded-md">
                                                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell>{item.category}</TableCell>
                                            <TableCell>${item.price.toFixed(2)}</TableCell>
                                            <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                                                    <Trash className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            ) : (
                                <div className="text-center py-12">
                                    <Utensils className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-4 text-lg font-medium">Your menu is empty</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Click "Add New Item" to start building your menu.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>
            <MenuItemForm 
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                restaurantId={restaurant.id}
                menuItem={editingItem}
                onFormSubmit={handleFormSubmit}
            />
        </>
    );
}
