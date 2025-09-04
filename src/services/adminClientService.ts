
'use client';

import { db } from './firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import type { Restaurant, BannerConfig, Order, GroceryStore } from '@/lib/types';
import type { AppUser } from '@/hooks/use-auth';

export interface AdminDashboardData {
  customerCount: number;
  restaurantCount: number;
  pendingRestaurantApprovalCount: number;
  pendingGroceryApprovalCount: number;
  users: AppUser[];
  restaurants: Restaurant[];
  groceryStores: GroceryStore[];
  serviceableCities: string[];
  bannerConfig: BannerConfig | null;
  commissionRate: number;
  allOrders: Order[];
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  // Fetch all users
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const allUsers = usersSnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as AppUser));

  // Fetch all restaurants
  const restaurantsSnapshot = await getDocs(collection(db, 'restaurants'));
  const allRestaurants = restaurantsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Restaurant));
  
  // Fetch all grocery stores
  const groceryStoresSnapshot = await getDocs(collection(db, 'grocery_stores'));
  const allGroceryStores = groceryStoresSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as GroceryStore));

  // Fetch all orders
  const ordersSnapshot = await getDocs(collection(db, 'orders'));
  const allOrders = ordersSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));

  // Fetch app_config
  const locationsDoc = await getDoc(doc(db, 'app_config', 'service_locations'));
  const serviceableCities = locationsDoc.exists() ? locationsDoc.data().cities : [];
  
  const bannerConfigDoc = await getDoc(doc(db, 'app_config', 'banner'));
  const bannerConfig = bannerConfigDoc.exists() ? bannerConfigDoc.data() as BannerConfig : null;

  const commissionConfigDoc = await getDoc(doc(db, 'app_config', 'commission'));
  const commissionRate = commissionConfigDoc.exists() ? commissionConfigDoc.data().rate : 0;

  // Calculate stats
  const customerCount = allUsers.filter(u => u.role === 'customer').length;
  const restaurantCount = allRestaurants.length + allGroceryStores.length;
  const pendingRestaurantApprovalCount = allRestaurants.filter(r => r.status === 'pending').length;
  const pendingGroceryApprovalCount = allGroceryStores.filter(s => s.status === 'pending').length;

  return {
    customerCount,
    restaurantCount,
    pendingRestaurantApprovalCount,
    pendingGroceryApprovalCount,
    users: allUsers,
    restaurants: allRestaurants,
    groceryStores: allGroceryStores,
    serviceableCities,
    bannerConfig,
    commissionRate,
    allOrders,
  };
}
