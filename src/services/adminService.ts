
'use server';

import { db } from './firebase';
import { collection, getDocs, query, where, collectionGroup, doc, updateDoc, Timestamp } from 'firebase/firestore';
import type { Restaurant, Order } from '@/lib/types';
import type { AppUser } from '@/hooks/use-auth';

export async function updateRestaurantStatus(restaurantId: string, status: Restaurant['status']): Promise<void> {
  const restaurantRef = doc(db, 'restaurants', restaurantId);
  await updateDoc(restaurantRef, { status });
}

export async function updateUserStatus(userId: string, status: AppUser['status']): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { status });
}

export async function getOrdersByDateRange(startDate: Date, endDate: Date): Promise<Order[]> {
    const ordersRef = collection(db, 'orders');
    const q = query(
        ordersRef, 
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate))
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
}

    
