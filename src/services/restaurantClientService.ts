
'use client';

import { db } from './firebase';
import { collection, getDocs, doc, setDoc, query, where, getDoc, collectionGroup, limit, onSnapshot, orderBy } from 'firebase/firestore';
import type { Restaurant, MenuItem, Order, BannerConfig } from '@/lib/types';
import { MOCK_RESTAURANTS } from '@/lib/seed';

export async function getRestaurants(): Promise<Restaurant[]> {
  const q = query(collection(db, 'restaurants'), where('status', '==', 'approved'));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    // Check if there are any restaurants at all, to avoid reseeding
    const allRestaurantsSnapshot = await getDocs(collection(db, 'restaurants'));
    if (allRestaurantsSnapshot.empty) {
        await seedRestaurants();
        const seededQuerySnapshot = await getDocs(q);
        return seededQuerySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Restaurant));
    }
    return [];
  }
  return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Restaurant));
}

export async function getRestaurantById(id: string): Promise<Restaurant | null> {
    const docRef = doc(db, 'restaurants', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { ...docSnap.data(), id: docSnap.id } as Restaurant;
    } else {
        return null;
    }
}

export async function getMenuItemsForRestaurant(restaurantId: string): Promise<MenuItem[]> {
    const q = query(collection(db, 'restaurants', restaurantId, 'menuItems'), where('isAvailable', '==', true));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MenuItem));
}


export async function seedRestaurants() {
  const restaurantCollection = collection(db, 'restaurants');
  const promises = MOCK_RESTAURANTS.map(restaurant => {
    const docRef = doc(restaurantCollection, restaurant.id);
    const { id, ...rest } = restaurant;
    return setDoc(docRef, { ...rest, status: 'approved' }); // Seed as approved
  });
  await Promise.all(promises);
  console.log('Seeded restaurants');
}

export function listenToOrdersForCustomer(
    customerId: string, 
    callback: (orders: Order[]) => void,
    onError: (error: Error) => void
): () => void {
    const ordersRef = collection(db, 'orders');
    // Removed the orderBy clause to prevent the composite index error.
    // Sorting will now be handled on the client.
    const q = query(
        ordersRef, 
        where('customerId', '==', customerId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
        // Sort the orders by date here in the client-side code
        const sortedOrders = orders.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
        callback(sortedOrders);
    }, (error) => {
        console.error("Error listening to orders:", error);
        onError(error);
    });

    return unsubscribe;
}

export async function getOrdersByCustomerId(customerId: string): Promise<Order[]> {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('customerId', '==', customerId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }
    const orders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
    return orders.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
}

export async function searchRestaurantsAndMenuItems(searchTerm: string): Promise<{ restaurants: Restaurant[], menuItems: MenuItem[] }> {
    if (!searchTerm) {
        return { restaurants: [], menuItems: [] };
    }
    const lowercasedTerm = searchTerm.toLowerCase();

    // Fetch all approved restaurants
    const allRestaurants = await getRestaurants();

    const matchingRestaurants = allRestaurants.filter(restaurant =>
        restaurant.name.toLowerCase().includes(lowercasedTerm) ||
        restaurant.cuisine.toLowerCase().includes(lowercasedTerm)
    );
    
    // Fetch all menu items from all restaurants
    const allMenuItems = (await Promise.all(
        allRestaurants.map(r => getMenuItemsForRestaurant(r.id))
    )).flat();

    const matchingMenuItems = allMenuItems.filter(item => 
        item.name.toLowerCase().includes(lowercasedTerm) ||
        item.description.toLowerCase().includes(lowercasedTerm) ||
        item.category.toLowerCase().includes(lowercasedTerm)
    );

    return { restaurants: matchingRestaurants, menuItems: matchingMenuItems };
}

export async function getTopRatedMenuItems(): Promise<MenuItem[]> {
    const menuItemsQuery = query(collectionGroup(db, 'menuItems'));
    const snapshot = await getDocs(menuItemsQuery);
    
    if (snapshot.empty) {
        return [];
    }

    const allItems = snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as MenuItem));
    
    return allItems
        .filter(item => item.isAvailable)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 10);
}


export async function getRestaurantByOwnerId(ownerId: string): Promise<Restaurant | null> {
    const q = query(collection(db, 'restaurants'), where('ownerId', '==', ownerId), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return null;
    }

    const restaurantDoc = snapshot.docs[0];
    return { ...restaurantDoc.data(), id: restaurantDoc.id } as Restaurant;
}

export async function getMenuItems(restaurantId: string): Promise<MenuItem[]> {
    const menuItemsRef = collection(db, 'restaurants', restaurantId, 'menuItems');
    const snapshot = await getDocs(menuItemsRef);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MenuItem));
}

// Order Functions
export async function getOrdersForRestaurant(restaurantId: string): Promise<Order[]> {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('restaurantId', '==', restaurantId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }
    const orders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
    return orders.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
}


export async function getOrdersForDeliveryBoy(deliveryBoyId: string): Promise<Order[]> {
    const ordersRef = collection(db, 'orders');
    const q = query(
        ordersRef, 
        where('deliveryBoy.id', '==', deliveryBoyId)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }
    const orders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
    
    return orders.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
}

export async function getServiceableCities(): Promise<string[]> {
    const docRef = doc(db, 'app_config', 'service_locations');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data().cities || [];
    }
    return [];
}

export async function getBannerConfig(): Promise<BannerConfig | null> {
    const docRef = doc(db, 'app_config', 'banner');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as BannerConfig;
    }
    return null;
}
