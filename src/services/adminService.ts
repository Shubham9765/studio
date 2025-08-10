
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
    const restaurantSnapshot = await getDocs(collection(db, 'restaurants'));
    const uniqueCuisines = new Set<string>();
    
    restaurantSnapshot.forEach(doc => {
        const data = doc.data() as Partial<Restaurant>;
        // Safely access cuisine and add to set only if it exists and is a non-empty string
        if (data.cuisine && typeof data.cuisine === 'string') {
            uniqueCuisines.add(data.cuisine);
        }
    });

    if (uniqueCuisines.size === 0) {
        return []; // Return early if no cuisines are found
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
    const updateData = {
        [`${cuisineName}.imageUrl`]: imageUrl
    };
    await setDoc(cuisinesConfigRef, updateData, { merge: true });
}
