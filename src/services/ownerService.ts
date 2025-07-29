
import { db } from './firebase';
import { collection, getDocs, query, where, limit, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import type { Restaurant, MenuItem } from '@/lib/types';
import type { z } from 'zod';
import type { RestaurantSchema } from '@/components/owner/restaurant-registration-form';
import type { EditRestaurantSchema } from '@/components/owner/edit-restaurant-form';
import type { MenuItemSchema } from '@/components/owner/menu-item-form';


export interface OwnerDashboardData {
  restaurant: Restaurant | null;
  todaysOrders: number;
  pendingDeliveries: number;
  menuItemsCount: number;
  reviewCount: number;
}

export async function createRestaurant(ownerId: string, data: z.infer<typeof RestaurantSchema>) {
    if (!ownerId) {
        throw new Error('An owner ID is required to create a restaurant.');
    }
    
    // Check if owner already has a restaurant
    const existingRestaurantQuery = query(collection(db, 'restaurants'), where('ownerId', '==', ownerId), limit(1));
    const existingRestaurantSnapshot = await getDocs(existingRestaurantQuery);
    if (!existingRestaurantSnapshot.empty) {
        throw new Error('This owner already has a restaurant and cannot create another.');
    }

    const newRestaurant: Omit<Restaurant, 'id'> = {
        ...data,
        ownerId,
        status: 'pending' as const,
        rating: 0,
        image: 'https://placehold.co/600x400.png',
        dataAiHint: data.cuisine.toLowerCase().split(' ')[0] || 'food',
        deliveryCharge: 0,
        isOpen: true,
    };

    const docRef = await addDoc(collection(db, "restaurants"), {
      ...newRestaurant,
      createdAt: serverTimestamp()
    });

    return docRef.id;
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
  const reviewCount = Math.floor(Math.random() * 200) + 50;


  return {
    restaurant,
    todaysOrders,
    pendingDeliveries,
    menuItemsCount,
    reviewCount
  };
}

export async function updateRestaurant(restaurantId: string, data: z.infer<typeof EditRestaurantSchema>) {
    if (!restaurantId) {
        throw new Error('A restaurant ID is required to update a restaurant.');
    }
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    await updateDoc(restaurantRef, data);
}

// Menu Item Functions

export async function getMenuItems(restaurantId: string): Promise<MenuItem[]> {
    const menuItemsRef = collection(db, 'restaurants', restaurantId, 'menuItems');
    const snapshot = await getDocs(menuItemsRef);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MenuItem));
}

export async function addMenuItem(restaurantId: string, data: z.infer<typeof MenuItemSchema>) {
    const menuItemsRef = collection(db, 'restaurants', restaurantId, 'menuItems');
    const docRef = await addDoc(menuItemsRef, {
        ...data,
        restaurantId,
        isAvailable: data.isAvailable, // Ensure this is passed
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function updateMenuItem(restaurantId: string, itemId: string, data: z.infer<typeof MenuItemSchema>) {
    const itemRef = doc(db, 'restaurants', restaurantId, 'menuItems', itemId);
    await updateDoc(itemRef, data);
}

export async function deleteMenuItem(restaurantId: string, itemId: string) {
    const itemRef = doc(db, 'restaurants', restaurantId, 'menuItems', itemId);
    await deleteDoc(itemRef);
}

export async function updateMenuItemAvailability(restaurantId: string, itemId: string, isAvailable: boolean) {
    const itemRef = doc(db, 'restaurants', restaurantId, 'menuItems', itemId);
    await updateDoc(itemRef, { isAvailable });
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
