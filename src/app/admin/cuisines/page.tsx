
'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Save } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { getCuisineTypes, updateCuisineImageUrl } from '@/services/adminService';

interface CuisineType {
    name: string;
    imageUrl?: string;
}

export default function ManageCuisinesPage() {
    const { toast } = useToast();
    const [cuisines, setCuisines] = useState<CuisineType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState<string | null>(null);

    const fetchCuisines = async () => {
        setLoading(true);
        try {
            const cuisineData = await getCuisineTypes();
            setCuisines(cuisineData);
        } catch (e: any) {
            setError('Failed to fetch cuisine data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCuisines();
    }, []);

    const handleImageUrlChange = (index: number, value: string) => {
        const newCuisines = [...cuisines];
        newCuisines[index].imageUrl = value;
        setCuisines(newCuisines);
    };

    const handleSaveChanges = async (cuisine: CuisineType) => {
        setIsSaving(cuisine.name);
        try {
            await updateCuisineImageUrl(cuisine.name, cuisine.imageUrl || '');
            toast({
                title: 'Cuisine Updated',
                description: `Image for ${cuisine.name} has been saved.`
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
                    <Skeleton className="h-8 w-1/3 mb-8" />
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-1/4" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
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
                <h1 className="text-3xl font-bold mb-8">Manage Cuisine Images</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Cuisine Categories</CardTitle>
                        <CardDescription>Set the image that appears for each cuisine type on the homepage.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {cuisines.length > 0 ? (
                            <div className="space-y-6">
                                {cuisines.map((cuisine, index) => (
                                    <div key={cuisine.name} className="flex flex-col sm:flex-row items-center gap-4 border p-4 rounded-lg">
                                        <div className="flex-shrink-0">
                                            <Image 
                                                src={cuisine.imageUrl || 'https://placehold.co/100x100.png'} 
                                                alt={cuisine.name}
                                                width={80}
                                                height={80}
                                                className="rounded-full object-cover h-20 w-20 border"
                                            />
                                        </div>
                                        <div className="flex-grow w-full">
                                            <Label htmlFor={`cuisine-${index}`} className="text-lg font-semibold">{cuisine.name}</Label>
                                            <Input
                                                id={`cuisine-${index}`}
                                                value={cuisine.imageUrl || ''}
                                                onChange={(e) => handleImageUrlChange(index, e.target.value)}
                                                placeholder="https://example.com/image.png"
                                                className="mt-2"
                                            />
                                        </div>
                                        <div className="flex-shrink-0">
                                            <Button onClick={() => handleSaveChanges(cuisine)} disabled={isSaving === cuisine.name}>
                                                {isSaving === cuisine.name ? 'Saving...' : <><Save className="mr-2 h-4 w-4" /> Save</>}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No cuisines found. Restaurants must be added first.</p>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
