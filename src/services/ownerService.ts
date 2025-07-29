
import { db } from './firebase';
import { collection, getDocs, query, where, limit, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import type { Restaurant } from '@/lib/types';
import type { z } from 'zod';
import type { RestaurantSchema } from '@/components/owner/restaurant-registration-form';
import type { EditRestaurantSchema } from '@/components/owner/edit-restaurant-form';


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

  // 1. Find the restaurant for the current owner
  const q = query(collection(db, 'restaurants'), where('ownerId', '==', ownerId), limit(1));
  const restaurantSnapshot = await getDocs(q);

  if (restaurantSnapshot.empty) {
    // This owner doesn't have a restaurant yet.
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

  // 2. Fetch related data (these are mock values for now)
  // In a real application, you would have 'orders', 'menuItems', and 'reviews' collections
  const todaysOrders = Math.floor(Math.random() * 20) + 5; // Mock: 5-24 orders
  const pendingDeliveries = Math.floor(Math.random() * 5); // Mock: 0-4 pending
  const menuItemsCount = Math.floor(Math.random() * 30) + 15; // Mock: 15-44 items
  const reviewCount = Math.floor(Math.random() * 200) + 50; // Mock: 50-249 reviews


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
