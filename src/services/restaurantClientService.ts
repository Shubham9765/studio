

'use client';

import { db } from './firebase';
import { collection, getDocs, doc, setDoc, query, where, getDoc, collectionGroup, limit, onSnapshot, orderBy, updateDoc, setDoc as setFirestoreDoc } from 'firebase/firestore';
import type { Restaurant, MenuItem, Order, BannerConfig, Cuisine } from '@/lib/types';
import { MOCK_RESTAURANTS } from '@/lib/seed';

// Helper function to calculate distance between two lat/lng points in kilometers
export function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2-lat1);
  const dLon = deg2rad(lon2-lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180)
}

export async function getCoordinatesForAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
        const data = await response.json();
        if (data && data.length > 0) {
            return {
                latitude: parseFloat(data[0].lat),
                longitude: parseFloat(data[0].lon),
            };
        }
        return null;
    } catch (error) {
        console.error("Geocoding failed:", error);
        return null;
    }
}


export async function getRestaurants(): Promise<Restaurant[]> {
  const q = query(collection(db, 'restaurants'), where('status', '==', 'approved'));
  
  const cuisinesConfigDoc = await getDoc(doc(db, 'app_config', 'cuisines'));
  const cuisinesConfig = cuisinesConfigDoc.exists() ? cuisinesConfigDoc.data() : {};
  
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
      return MOCK_RESTAURANTS.filter(r => r.status === 'approved');
  }

  const restaurants = querySnapshot.docs.map((doc: any) => {
      const restaurantData = doc.data() as Restaurant;
      const cuisineImage = cuisinesConfig[restaurantData.cuisine]?.imageUrl || undefined;
      return { 
          ...restaurantData, 
          id: doc.id,
          categoryImageUrl: cuisineImage,
      } as Restaurant
  });

  // Separate promoted from non-promoted and sort them
  const promoted = restaurants.filter(r => r.isPromoted === true).sort((a,b) => (b.rating ?? 0) - (a.rating ?? 0));
  const notPromoted = restaurants.filter(r => r.isPromoted !== true);

  return [...promoted, ...notPromoted];
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

export async function searchRestaurantsAndMenuItems(
    searchTerm: string, 
    userLocation?: { latitude: number; longitude: number }
): Promise<{ restaurants: Restaurant[], menuItems: MenuItem[] }> {
    if (!searchTerm) {
        return { restaurants: [], menuItems: [] };
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    const searchRadiusKm = 15; // 15km search radius

    // Fetch all approved restaurants
    let allRestaurants = await getRestaurants();

    // Filter restaurants by distance if user location is available
    if (userLocation) {
        allRestaurants = allRestaurants.filter(restaurant => {
            if (restaurant.latitude && restaurant.longitude) {
                const distance = getDistanceFromLatLonInKm(
                    userLocation.latitude,
                    userLocation.longitude,
                    restaurant.latitude,
                    restaurant.longitude
                );
                return distance <= searchRadiusKm;
            }
            return false; // Exclude restaurants without location data if user location is provided
        });
    }

    const matchingRestaurants = allRestaurants.filter(restaurant =>
        restaurant.name.toLowerCase().includes(lowercasedTerm) ||
        restaurant.cuisine.toLowerCase().includes(lowercasedTerm)
    );
    
    // Fetch all menu items from the now location-filtered restaurants
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

export function listenToOrdersForDeliveryBoy(
    deliveryBoyId: string, 
    callback: (orders: Order[]) => void,
    onError: (error: Error) => void
): () => void {
    const ordersRef = collection(db, 'orders');
    const q = query(
        ordersRef, 
        where('deliveryBoy.id', '==', deliveryBoyId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
        const sortedOrders = orders.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
        callback(sortedOrders);
    }, (error) => {
        console.error("Error listening to delivery orders:", error);
        onError(error);
    });

    return unsubscribe;
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

// Cuisine Functions
const cuisinesConfigRef = doc(db, 'app_config', 'cuisines');

export async function getCuisineTypes(): Promise<Cuisine[]> {
    const restaurantSnapshot = await getDocs(query(collection(db, 'restaurants'), where('status', '==', 'approved')));
    const uniqueCuisines = new Set<string>();
    
    restaurantSnapshot.forEach(doc => {
        const data = doc.data() as Partial<Restaurant>;
        if (data.cuisine && typeof data.cuisine === 'string' && data.cuisine.trim() !== '') {
            uniqueCuisines.add(data.cuisine);
        }
    });

    if (uniqueCuisines.size === 0) {
        return [];
    }

    const cuisineConfigDoc = await getDoc(cuisinesConfigRef);
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
    const docSnap = await getDoc(cuisinesConfigRef);
    if (!docSnap.exists()) {
        // If the document doesn't exist, create it.
        await setFirestoreDoc(cuisinesConfigRef, {});
    }
    
    const updateData = {
        [`${cuisineName}.imageUrl`]: imageUrl,
        [`${cuisineName}.name`]: cuisineName,
    };
    
    // Use updateDoc which works correctly with dot notation for nested fields.
    await updateDoc(cuisinesConfigRef, updateData);
}

    
