
'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Save, Palette } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { getGroceryCategoryTypes, updateGroceryCategoryImageUrl } from '@/services/restaurantClientService';

interface GroceryCategoryType {
    name: string;
    imageUrl?: string;
}

export default function ManageGroceryCategoriesPage() {
    const { toast } = useToast();
    const [categories, setCategories] = useState<GroceryCategoryType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState<string | null>(null);

    const fetchCategories = async () => {
        setLoading(true);
        setError(null);
        try {
            const categoryData = await getGroceryCategoryTypes();
            setCategories(categoryData);
        } catch (e: any) {
            console.error(e);
            setError('Failed to fetch grocery category data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleImageUrlChange = (index: number, value: string) => {
        const newCategories = [...categories];
        newCategories[index].imageUrl = value;
        setCategories(newCategories);
    };

    const handleSaveChanges = async (category: GroceryCategoryType) => {
        setIsSaving(category.name);
        try {
            await updateGroceryCategoryImageUrl(category.name, category.imageUrl || '');
            toast({
                title: 'Category Updated',
                description: `Image for ${category.name} has been saved.`
            });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setIsSaving(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container py-8">
                    <h1 className="text-3xl font-bold mb-8">Manage Grocery Category Images</h1>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-1/4 mb-2" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-20 w-20 rounded-full" />
                                <div className="space-y-2 flex-grow">
                                     <Skeleton className="h-5 w-1/4" />
                                     <Skeleton className="h-10 w-full" />
                                </div>
                                <Skeleton className="h-10 w-24" />
                            </div>
                             <div className="flex items-center gap-4">
                                <Skeleton className="h-20 w-20 rounded-full" />
                                <div className="space-y-2 flex-grow">
                                     <Skeleton className="h-5 w-1/4" />
                                     <Skeleton className="h-10 w-full" />
                                </div>
                                <Skeleton className="h-10 w-24" />
                            </div>
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

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-8">
                <h1 className="text-3xl font-bold mb-8">Manage Grocery Category Images</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Grocery Categories</CardTitle>
                        <CardDescription>Set the image that appears for each category type on the grocery page. Categories are automatically detected from items added by store owners.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {categories.length > 0 ? (
                            <div className="space-y-6">
                                {categories.map((category, index) => (
                                    <div key={category.name} className="flex flex-col sm:flex-row items-center gap-4 border p-4 rounded-lg">
                                        <div className="flex-shrink-0">
                                            <Image 
                                                src={category.imageUrl || 'https://placehold.co/100x100.png'} 
                                                alt={category.name}
                                                width={80}
                                                height={80}
                                                className="rounded-full object-cover h-20 w-20 border"
                                            />
                                        </div>
                                        <div className="flex-grow w-full">
                                            <Label htmlFor={`category-${index}`} className="text-lg font-semibold">{category.name}</Label>
                                            <Input
                                                id={`category-${index}`}
                                                value={category.imageUrl || ''}
                                                onChange={(e) => handleImageUrlChange(index, e.target.value)}
                                                placeholder="https://example.com/image.png"
                                                className="mt-2"
                                            />
                                        </div>
                                        <div className="flex-shrink-0">
                                            <Button onClick={() => handleSaveChanges(category)} disabled={isSaving === category.name}>
                                                {isSaving === category.name ? 'Saving...' : <><Save className="mr-2 h-4 w-4" /> Save</>}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <Palette className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-xl font-medium">No Categories Found</h3>
                                <p className="mt-1 text-muted-foreground">
                                    This can happen if no grocery store owners have added items with categories yet.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
