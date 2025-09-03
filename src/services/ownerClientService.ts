
'use client';

import { db } from './firebase';
import { collection, query, where, onSnapshot, getDocs, limit, doc, orderBy } from 'firebase/firestore';
import type { Order, Restaurant, MenuItem, GroceryStore, GroceryItem } from '@/lib/types';


export interface OwnerDashboardData {
    restaurant: Restaurant | null;
    todaysOrders: number;
    pendingDeliveries: number;
    menuItemsCount: number;
    reviewCount: number;
}

export interface GroceryOwnerDashboardData {
    store: GroceryStore | null;
    todaysOrders: number;
    pendingDeliveries: number;
    itemsCount: number;
    reviewCount: number;
}


export async function getOwnerDashboardData(ownerId: string): Promise<OwnerDashboardData> {
  if (!ownerId) {
    throw new Error('Owner ID is required to fetch dashboard data.');
  }

  const q = query(collection(db, 'restaurants'), where('ownerId', '==', ownerId), limit(1));
  const restaurantSnapshot = await getDocs(q);

  if (restaurantSnapshot.empty) {
    return {
        restaurant: null,
        todaysOrders: 0,
        pendingDeliveries: 0,
        menuItemsCount: 0,
        reviewCount: 0,
    };
  }

  const restaurantDoc = restaurantSnapshot.docs[0];
  const restaurant = { ...restaurantDoc.data(), id: restaurantDoc.id } as Restaurant;
  
  const menuItemsQuery = query(collection(db, 'restaurants', restaurant.id, 'menuItems'));
  const menuItemsSnapshot = await getDocs(menuItemsQuery);
  const menuItemsCount = menuItemsSnapshot.size;

  const todaysOrders = Math.floor(Math.random() * 20) + 5; 
  const pendingDeliveries = Math.floor(Math.random() * 5);
  const reviewCount = restaurant.reviewCount || 0;


  return {
    restaurant,
    todaysOrders,
    pendingDeliveries,
    menuItemsCount,
    reviewCount
  };
}


export function listenToOrdersForRestaurant(restaurantId: string, callback: (orders: Order[]) => void, onError: (error: Error) => void): () => void {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('restaurantId', '==', restaurantId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
        const sortedOrders = orders.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
        callback(sortedOrders);
    }, (error) => {
        console.error("Error listening to orders:", error);
        onError(error);
    });

    return unsubscribe;
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

export async function getAllOrdersForRestaurant(restaurantId: string): Promise<Order[]> {
    const ordersCollection = collection(db, 'orders');
    const q = query(ordersCollection, where('restaurantId', '==', restaurantId));
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
    return orders.sort((a,b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
}


// GROCERY-OWNER-CLIENT-SERVICE

export async function getGroceryStoreByOwnerId(ownerId: string): Promise<GroceryStore | null> {
    const q = query(collection(db, 'grocery_stores'), where('ownerId', '==', ownerId), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return null;
    }

    const storeDoc = snapshot.docs[0];
    return { ...storeDoc.data(), id: storeDoc.id } as GroceryStore;
}

export async function getGroceryItems(storeId: string): Promise<GroceryItem[]> {
    const itemsRef = collection(db, 'grocery_stores', storeId, 'items');
    const snapshot = await getDocs(itemsRef);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as GroceryItem));
}

export async function getGroceryOwnerDashboardData(ownerId: string): Promise<GroceryOwnerDashboardData> {
  if (!ownerId) {
    throw new Error('Owner ID is required to fetch dashboard data.');
  }

  const store = await getGroceryStoreByOwnerId(ownerId);
  
  if (!store) {
    return {
      store: null,
      todaysOrders: 0,
      pendingDeliveries: 0,
      itemsCount: 0,
      reviewCount: 0,
    };
  }

  const itemsSnapshot = await getDocs(collection(db, 'grocery_stores', store.id, 'items'));
  const itemsCount = itemsSnapshot.size;

  const todaysOrders = Math.floor(Math.random() * 30) + 10;
  const pendingDeliveries = Math.floor(Math.random() * 8);
  const reviewCount = store.reviewCount || 0;

  return {
    store,
    todaysOrders,
    pendingDeliveries,
    itemsCount,
    reviewCount,
  };
}

export function listenToOrdersForStore(storeId: string, callback: (orders: Order[]) => void, onError: (error: Error) => void): () => void {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('restaurantId', '==', storeId), where('orderType', '==', 'grocery'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
        const sortedOrders = orders.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
        callback(sortedOrders);
    }, (error) => {
        console.error("Error listening to store orders:", error);
        onError(error);
    });

    return unsubscribe;
}
