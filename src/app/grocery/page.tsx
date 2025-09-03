'use client';

import { Header } from '@/components/header';

export default function GroceryPage() {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-8">
                <h1 className="text-3xl font-bold mb-8">Groceries</h1>
                <div className="flex items-center justify-center h-96">
                    <p className="text-muted-foreground">Grocery feature coming soon!</p>
                </div>
            </main>
        </div>
    )
}
