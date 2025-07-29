import { db } from './firebase';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import type { Restaurant } from '@/lib/types';

export interface OwnerDashboardData {
  restaurant: Restaurant | null;
  todaysOrders: number;
  pendingDeliveries: number;
  menuItemsCount: number;
  reviewCount: number;
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
