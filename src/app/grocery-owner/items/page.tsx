
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import type { GroceryItem, GroceryStore } from '@/lib/types';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { GroceryItemForm } from '@/components/grocery-owner/grocery-item-form';
import { deleteGroceryItem, updateGroceryItemAvailability } from '@/services/ownerService';
import { getGroceryItems, getGroceryStoreByOwnerId } from '@/services/ownerClientService';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, PlusCircle, Trash, Edit, Utensils, ImageIcon, Search } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


export default function ManageGroceryItemsPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [store, setStore] = useState<GroceryStore | null>(null);
    const [items, setItems] = useState<GroceryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredItems, setFilteredItems] = useState<GroceryItem[]>([]);


    const fetchItems = async (storeId: string) => {
        try {
            const fetchedItems = await getGroceryItems(storeId);
            setItems(fetchedItems);
        } catch (e: any) {
            setError('Failed to fetch items.');
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };

    useEffect(() => {
        const fetchStoreData = async () => {
            if (user?.uid) {
                try {
                    setLoading(true);
                    const storeData = await getGroceryStoreByOwnerId(user.uid);
                    setStore(storeData);
                    if (storeData) {
                        await fetchItems(storeData.id);
                    }
                } catch (e: any) {
                    setError('Failed to fetch store data.');
                    toast({ variant: 'destructive', title: 'Error', description: e.message });
                } finally {
                    setLoading(false);
                }
            }
        };

        if (!authLoading) {
            fetchStoreData();
        }
    }, [user, authLoading, toast]);
    
    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filtered = items.filter(item =>
            item.name.toLowerCase().includes(lowercasedFilter) ||
            item.category.toLowerCase().includes(lowercasedFilter)
        );
        setFilteredItems(filtered);
    }, [searchTerm, items]);
    
    const handleFormSubmit = () => {
        setIsFormOpen(false);
        setEditingItem(null);
        if (store) {
            fetchItems(store.id);
        }
    }

    const handleEdit = (item: GroceryItem) => {
        setEditingItem(item);
        setIsFormOpen(true);
    }
    
    const handleDelete = async (itemId: string) => {
        if (!store) return;
        
        try {
            await deleteGroceryItem(store.id, itemId);
            toast({ title: 'Success', description: 'Item deleted.'});
            fetchItems(store.id);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error deleting item', description: e.message });
        }
    }

    const handleAvailabilityToggle = async (item: GroceryItem, isAvailable: boolean) => {
        if (!store) return;
        
        const optimisticUpdate = (items: GroceryItem[]) => items.map(groceryItem => 
            groceryItem.id === item.id ? { ...groceryItem, isAvailable } : groceryItem
        );
        setItems(optimisticUpdate);
        
        try {
            await updateGroceryItemAvailability(store.id, item.id, isAvailable);
            toast({
                title: `Item ${isAvailable ? 'Available' : 'Unavailable'}`,
                description: `${item.name} is now ${isAvailable ? 'visible' : 'hidden'} to customers.`,
            });
        } catch (e: any) {
             const revertUpdate = (items: GroceryItem[]) => items.map(groceryItem => 
                groceryItem.id === item.id ? { ...groceryItem, isAvailable: !isAvailable } : groceryItem
            );
            setItems(revertUpdate);
            toast({ variant: 'destructive', title: 'Update Failed', description: e.message });
        }
    };


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

     if (!store) {
        return (
             <div className="min-h-screen bg-background">
                <Header />
                <main className="container py-8 flex items-center justify-center">
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>No Store Found</AlertTitle>
                        <AlertDescription>You must register a store before you can manage its items.</AlertDescription>
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
                        <h1 className="text-3xl font-bold">Manage Items</h1>
                        <Button onClick={() => { setEditingItem(null); setIsFormOpen(true); }}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Item
                        </Button>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>{store?.name} Items</CardTitle>
                            <CardDescription>View, add, edit, or delete your store items.</CardDescription>
                             <div className="relative pt-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input 
                                    placeholder="Search items..." 
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                             </div>
                        </CardHeader>
                        <CardContent>
                            {filteredItems.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-20">Image</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Availability</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredItems.map(item => (
                                        <TableRow key={item.id} className={cn(!item.isAvailable && "bg-muted/50 text-muted-foreground")}>
                                            <TableCell>
                                                {item.imageUrl ? (
                                                    <Image src={item.imageUrl} alt={item.name} width={48} height={48} className={cn("rounded-md object-cover h-12 w-12", !item.isAvailable && "grayscale")} />
                                                ) : (
                                                    <div className="w-12 h-12 flex items-center justify-center bg-muted rounded-md">
                                                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{item.name}</div>
                                                <div className="text-xs">{item.category}</div>
                                            </TableCell>
                                            <TableCell>Rs.{item.price.toFixed(2)} / {item.unit}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                     <Switch
                                                        id={`availability-${item.id}`}
                                                        checked={item.isAvailable}
                                                        onCheckedChange={(checked) => handleAvailabilityToggle(item, checked)}
                                                    />
                                                    <Badge variant={item.isAvailable ? 'default' : 'outline'}>{item.isAvailable ? 'Available' : 'Unavailable'}</Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <Trash className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the item "{item.name}".
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(item.id)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            ) : (
                                <div className="text-center py-12">
                                    <Utensils className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-4 text-lg font-medium">
                                        {searchTerm ? 'No items match your search' : 'Your store has no items'}
                                    </h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                         {searchTerm ? 'Try a different search term.' : 'Click "Add New Item" to start building your inventory.'}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>
            {store && <GroceryItemForm 
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                storeId={store.id}
                item={editingItem}
                onFormSubmit={handleFormSubmit}
            />}
        </>
    );
}
