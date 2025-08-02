
'use client';

import { db } from './firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { Order } from '@/lib/types';

export function listenToOrdersForRestaurant(restaurantId: string, callback: (orders: Order[]) => void): () => void {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('restaurantId', '==', restaurantId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
        const sortedOrders = orders.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
        callback(sortedOrders);
    });

    return unsubscribe;
}
