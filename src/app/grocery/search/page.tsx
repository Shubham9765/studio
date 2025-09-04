
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Header } from '@/components/header';
import { searchGroceryStoresAndItems } from '@/services/restaurantClientService';
import type { GroceryStore, GroceryItem } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Search as SearchIcon, Carrot } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { GrocerySearchResultItem } from '@/components/customer/grocery-search-result-item';


type SearchResult = 
    | { type: 'store'; data: GroceryStore }
    | { type: 'item'; data: GroceryItem };

function SearchResults() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    
    const [searchTerm, setSearchTerm] = useState(query);
    const [results, setResults] = useState<SearchResult[]>([]);
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
                const storeResults: SearchResult[] = stores.map(s => ({ type: 'store', data: s }));
                const itemResults: SearchResult[] = items.map(i => ({ type: 'item', data: i }));

                setResults([...storeResults, ...itemResults]);
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
                    <Carrot className="mx-auto h-16 w-16 text-muted-foreground" />
                    <h2 className="text-2xl font-bold">No results found for "{query}"</h2>
                    <p className="text-muted-foreground mt-2">Try searching for something else.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {results.map((result, index) => (
                       <GrocerySearchResultItem key={`${result.type}-${result.data.id}-${index}`} result={result} />
                    ))}
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
