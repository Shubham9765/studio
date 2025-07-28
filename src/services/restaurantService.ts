import { db } from './firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import type { Restaurant } from '@/lib/types';
import { MOCK_RESTAURANTS } from '@/lib/seed';

export async function getRestaurants(): Promise<Restaurant[]> {
  const querySnapshot = await getDocs(collection(db, 'restaurants'));
  if (querySnapshot.empty) {
    await seedRestaurants();
    const seededQuerySnapshot = await getDocs(collection(db, 'restaurants'));
    return seededQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant));
  }
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant));
}

export async function seedRestaurants() {
  const restaurantCollection = collection(db, 'restaurants');
  const promises = MOCK_RESTAURANTS.map(restaurant => {
    const docRef = doc(restaurantCollection, restaurant.id);
    // Remove id from the object since it's the document id.
    const { id, ...rest } = restaurant;
    return setDoc(docRef, rest);
  });
  await Promise.all(promises);
  console.log('Seeded restaurants');
}
