
'use server';

import { db } from './firebase';
import { collection, getDocs, query, where, collectionGroup, doc, updateDoc, Timestamp, setDoc, arrayUnion, arrayRemove, getDoc as getFirestoreDoc } from 'firebase/firestore';
import type { Restaurant, Order, BannerConfig, Cuisine } from '@/lib/types';
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

// Cuisine Functions
const cuisinesConfigRef = doc(db, 'app_config', 'cuisines');

export async function getCuisineTypes(): Promise<Cuisine[]> {
    const restaurantSnapshot = await getDocs(query(collection(db, 'restaurants'), where('status', '==', 'approved')));
    const uniqueCuisines = new Set<string>();
    
    restaurantSnapshot.forEach(doc => {
        const data = doc.data() as Partial<Restaurant>;
        if (data.cuisine && typeof data.cuisine === 'string' && data.cuisine.trim() !== '') {
            uniqueCuisines.add(data.cuisine);
        }
    });

    if (uniqueCuisines.size === 0) {
        return [];
    }

    const cuisineConfigDoc = await getFirestoreDoc(cuisinesConfigRef);
    const cuisineConfigData = cuisineConfigDoc.exists() ? cuisineConfigDoc.data() : {};

    const cuisinesArray = Array.from(uniqueCuisines).map(name => {
        const imageUrl = cuisineConfigData[name]?.imageUrl || '';
        return {
            name,
            imageUrl,
        };
    });

    return cuisinesArray;
}


export async function updateCuisineImageUrl(cuisineName: string, imageUrl: string): Promise<void> {
    const docSnap = await getFirestoreDoc(cuisinesConfigRef);
    if (!docSnap.exists()) {
        // If the document doesn't exist, create it.
        await setDoc(cuisinesConfigRef, {});
    }
    
    const updateData = {
        [`${cuisineName}.imageUrl`]: imageUrl,
        [`${cuisineName}.name`]: cuisineName,
    };
    
    // Use updateDoc which works correctly with dot notation for nested fields.
    await updateDoc(cuisinesConfigRef, updateData);
}
