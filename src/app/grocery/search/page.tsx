
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Header } from '@/components/header';
import { searchGroceryStoresAndItems } from '@/services/restaurantClientService';
import type { GroceryStore, GroceryItem } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Search as SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';

// This needs a new component, so let's create a placeholder for now
// and then create the actual component.
// import { GrocerySearchResultItem } from '@/components/grocery-search-result-item';

function SearchResults() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    
    const [searchTerm, setSearchTerm] = useState(query);
    const [results, setResults] = useState<(GroceryStore | GroceryItem)[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setSearchTerm(query);
    }, [query]);

    useEffect(() => {
        const performSearch = async () => {
            if (!query) {
                setLoading(false);
                setResults([]);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const { stores, items } = await searchGroceryStoresAndItems(query);
                // For now, just combine them. We can differentiate in the result item component.
                setResults([...stores, ...items]);
            } catch (err: any) {
                setError('Failed to perform search. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        performSearch();
    }, [query]);
    
    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchTerm !== query) {
                const newParams = new URLSearchParams(searchParams.toString());
                if (searchTerm) {
                    newParams.set('q', searchTerm);
                } else {
                    newParams.delete('q');
                }
                router.replace(`${pathname}?${newParams.toString()}`);
            }
        }, 300);

        return () => clearTimeout(handler);
    }, [searchTerm, query, router, pathname, searchParams]);


    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Search Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Search for items or stores..." 
                    className="pl-12 text-base h-12 rounded-full w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                />
            </div>
            
             {loading ? (
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                            <Skeleton className="h-16 w-16 rounded-lg" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (!results.length && query) ? (
                 <div className="text-center py-16">
                    <h2 className="text-2xl font-bold">No results found for "{query}"</h2>
                    <p className="text-muted-foreground mt-2">Try searching for something else.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {/* Results will be displayed here */}
                    <p>{results.length} results found (rendering coming soon)</p>
                </div>
            )}
        </div>
    );
}


export default function GrocerySearchPage() {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-8 max-w-2xl mx-auto">
                 <Suspense fallback={<Skeleton className="h-screen w-full" />}>
                    <SearchResults />
                </Suspense>
            </main>
        </div>
    )
}
