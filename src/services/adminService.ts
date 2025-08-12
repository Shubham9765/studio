
'use server';

import { db } from './firebase';
import { collection, getDocs, query, where, collectionGroup, doc, updateDoc, Timestamp, setDoc, arrayUnion, arrayRemove, getDoc as getFirestoreDoc } from 'firebase/firestore';
import type { Restaurant, Order, BannerConfig, Cuisine } from '@/lib/types';
import type { AppUser } from '@/hooks/use-auth';

export async function updateRestaurantStatus(restaurantId: string, status: Restaurant['status']): Promise<void> {
  const restaurantRef = doc(db, 'restaurants', restaurantId);
  await updateDoc(restaurantRef, { status });
}

export async function updateRestaurantPromotionStatus(restaurantId: string, isPromoted: boolean): Promise<void> {
  const restaurantRef = doc(db, 'restaurants', restaurantId);
  await updateDoc(restaurantRef, { isPromoted });
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

// Service Locations Functions
const locationsRef = doc(db, 'app_config', 'service_locations');

export async function getServiceableCities(): Promise<string[]> {
    const docSnap = await getFirestoreDoc(locationsRef);
    if (docSnap.exists()) {
        return docSnap.data().cities || [];
    }
    return [];
}

export async function addServiceableCity(city: string): Promise<void> {
    await setDoc(locationsRef, { cities: arrayUnion(city) }, { merge: true });
}

export async function removeServiceableCity(city: string): Promise<void> {
    await updateDoc(locationsRef, { cities: arrayRemove(city) });
}

// Banner Config Functions
const bannerConfigRef = doc(db, 'app_config', 'banner');

export async function updateBannerConfig(config: BannerConfig): Promise<void> {
    await setDoc(bannerConfigRef, config, { merge: true });
}

// Commission Rate Functions
const commissionConfigRef = doc(db, 'app_config', 'commission');

export async function updateCommissionRate(rate: number): Promise<void> {
    if (rate < 0 || rate > 100) {
        throw new Error('Commission rate must be between 0 and 100.');
    }
    await setDoc(commissionConfigRef, { rate });
}
