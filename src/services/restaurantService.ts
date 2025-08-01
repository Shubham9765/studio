
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, query, where, getDoc, addDoc, serverTimestamp, orderBy, collectionGroup, writeBatch, runTransaction, updateDoc, limit } from 'firebase/firestore';
import type { Restaurant, MenuItem, Order } from '@/lib/types';
import { MOCK_RESTAURANTS } from '@/lib/seed';
import type { CartItem } from '@/hooks/use-cart';

async function sendNotification(userId: string, title: string, body: string, url: string) {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const fcmToken = userDoc.data()?.fcmToken;

    if (fcmToken) {
        // This would typically be a call to a server-side function (e.g., Firebase Cloud Function)
        // that sends the push notification. For this project, we will log it.
        console.log(`Sending notification to ${userId} with token ${fcmToken}`);
        console.log(`Title: ${title}, Body: ${body}, URL: ${url}`);
    }
}

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

export async function createOrder(
  customerId: string,
  customerName: string,
  restaurant: Restaurant, 
  items: CartItem[], 
  total: number,
  orderDetails: Partial<Order>
): Promise<string> {
  const ordersCollection = collection(db, 'orders');

  const newOrder: Omit<Order, 'id'> = {
      customerId,
      customerName,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      items,
      total,
      status: 'pending',
      createdAt: serverTimestamp() as any, // Let Firestore handle the timestamp
      paymentMethod: orderDetails.paymentMethod || 'cash',
      paymentStatus: orderDetails.paymentStatus || 'pending',
      paymentDetails: orderDetails.paymentDetails || {},
      deliveryAddress: orderDetails.deliveryAddress || 'N/A',
      customerPhone: orderDetails.customerPhone || 'N/A',
  };

  const docRef = await addDoc(ordersCollection, newOrder);
  
  // Send notification to restaurant owner
  if(restaurant.ownerId) {
    const title = 'New Order Received!';
    const body = `You have a new order from ${customerName} for a total of $${total.toFixed(2)}`;
    await sendNotification(restaurant.ownerId, title, body, '/owner/orders');
  }

  return docRef.id;
}


export async function getOrdersByCustomerId(customerId: string): Promise<Order[]> {
    const ordersRef = collection(db, 'orders');
    // Using a composite query with orderBy on a different field requires a composite index.
    // Removing orderBy to fix the issue without needing to create an index in Firestore.
    // Sorting can be done client-side if needed.
    const q = query(ordersRef, where('customerId', '==', customerId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }
    // Sort by date on the client-side
    const orders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
    return orders.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
}

export async function searchRestaurantsAndMenuItems(searchTerm: string): Promise<{ restaurants: Restaurant[], menuItems: MenuItem[] }> {
    const lowercasedTerm = searchTerm.toLowerCase();

    // Search for restaurants
    const allRestaurants = await getRestaurants();
    const matchingRestaurants = allRestaurants.filter(r => 
        r.name.toLowerCase().includes(lowercasedTerm) ||
        r.cuisine.toLowerCase().includes(lowercasedTerm)
    );
    
    // Search for menu items
    const menuItemsQuery = query(collectionGroup(db, 'menuItems'));
    const menuItemsSnapshot = await getDocs(menuItemsQuery);
    const allMenuItems = menuItemsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MenuItem));

    const matchingMenuItems = allMenuItems.filter(item =>
        item.name.toLowerCase().includes(lowercasedTerm) ||
        item.description.toLowerCase().includes(lowercasedTerm) ||
        item.category.toLowerCase().includes(lowercasedTerm)
    );

    // To avoid duplication, if a menu item's restaurant is already in the matching list, don't add it again.
    const restaurantIdsFromMenuItems = new Set(matchingMenuItems.map(item => item.restaurantId));
    const existingRestaurantIds = new Set(matchingRestaurants.map(r => r.id));

    const additionalRestaurantIds: string[] = [];
    restaurantIdsFromMenuItems.forEach(id => {
        if (!existingRestaurantIds.has(id)) {
            additionalRestaurantIds.push(id);
        }
    });

    if (additionalRestaurantIds.length > 0) {
        const additionalRestaurants = allRestaurants.filter(r => additionalRestaurantIds.includes(r.id));
        matchingRestaurants.push(...additionalRestaurants);
    }

    return { restaurants: matchingRestaurants, menuItems: matchingMenuItems };
}

export async function getTopRatedMenuItems(): Promise<MenuItem[]> {
    const menuItemsQuery = query(collectionGroup(db, 'menuItems'));
    const snapshot = await getDocs(menuItemsQuery);
    
    if (snapshot.empty) {
        return [];
    }

    const allItems = snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as MenuItem));
    
    // Sort by rating client-side and take the top 10
    return allItems
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 10);
}


export async function rateRestaurant(restaurantId: string, newRating: number): Promise<void> {
    const restaurantRef = doc(db, 'restaurants', restaurantId);

    try {
        await runTransaction(db, async (transaction) => {
            const restaurantDoc = await transaction.get(restaurantRef);
            if (!restaurantDoc.exists()) {
                throw "Restaurant not found!";
            }
            
            const data = restaurantDoc.data();
            const currentRating = data.rating || 0;
            const reviewCount = data.reviewCount || 0;

            const newReviewCount = reviewCount + 1;
            const updatedRating = ((currentRating * reviewCount) + newRating) / newReviewCount;

            transaction.update(restaurantRef, {
                rating: updatedRating,
                reviewCount: newReviewCount
            });
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e;
    }
}
