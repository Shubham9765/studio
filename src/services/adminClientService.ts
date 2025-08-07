
'use client';

import { db } from './firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import type { Restaurant } from '@/lib/types';
import type { AppUser } from '@/hooks/use-auth';

export interface AdminDashboardData {
  customerCount: number;
  restaurantCount: number;
  pendingApprovalCount: number;
  users: AppUser[];
  restaurants: Restaurant[];
  serviceableCities: string[];
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  // Fetch all users
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const allUsers = usersSnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as AppUser));

  // Fetch all restaurants
  const restaurantsSnapshot = await getDocs(collection(db, 'restaurants'));
  const allRestaurants = restaurantsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Restaurant));

  // Fetch serviceable cities
  const locationsDoc = await getDoc(doc(db, 'app_config', 'service_locations'));
  const serviceableCities = locationsDoc.exists() ? locationsDoc.data().cities : [];

  // Calculate stats
  const customerCount = allUsers.filter(u => u.role === 'customer').length;
  const restaurantCount = allRestaurants.length;
  const pendingApprovalCount = allRestaurants.filter(r => r.status === 'pending').length;

  return {
    customerCount,
    restaurantCount,
    pendingApprovalCount,
    users: allUsers,
    restaurants: allRestaurants,
    serviceableCities,
  };
}

    