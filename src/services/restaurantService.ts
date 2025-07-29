import { db } from './firebase';
import { collection, getDocs, doc, setDoc, query, where, getDoc } from 'firebase/firestore';
import type { Restaurant, MenuItem } from '@/lib/types';
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
    const menuItemsRef = collection(db, 'restaurants', restaurantId, 'menuItems');
    const snapshot = await getDocs(menuItemsRef);
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
