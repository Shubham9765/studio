
import { db } from './firebase';
import { collection, getDocs, query, where, limit, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import type { Restaurant, MenuItem, Order, DeliveryBoy } from '@/lib/types';
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

async function sendNotification(userId: string, title: string, body: string, url: string) {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const fcmToken = userDoc.data()?.fcmToken;

    if (fcmToken) {
        // This would typically be a call to a server-side function (e.g., Firebase Cloud Function)
        // that sends the push notification. For this project, we will log it.
        console.log(`Sending notification to ${userId} with token ${fcmToken}`);
        console.log(`Title: ${title}, Body: ${body}, URL: ${url}`);
        // Example server-side fetch:
        // await fetch('https://your-cloud-function-url/sendNotification', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ token: fcmToken, title, body, url })
        // });
    }
}


export async function createRestaurant(ownerId: string, data: z.infer<typeof RestaurantSchema>) {
    if (!ownerId) {
        throw new Error('An owner ID is required to create a restaurant.');
    }
    
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
        paymentMethods: {
            cash: true,
            upi: false,
        },
        deliveryBoys: [],
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
  const reviewCount = restaurant.reviewCount || 0;


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
    
    const { paymentMethodOption, upiId, upiQrCodeUrl, ...restData } = data;

    const paymentMethods = {
        cash: paymentMethodOption === 'cash' || paymentMethodOption === 'both',
        upi: paymentMethodOption === 'upi' || paymentMethodOption === 'both',
        upiId: paymentMethodOption === 'upi' || paymentMethodOption === 'both' ? upiId : '',
        upiQrCodeUrl: paymentMethodOption === 'upi' || paymentMethodOption === 'both' ? upiQrCodeUrl : '',
    };

    await updateDoc(restaurantRef, {
        ...restData,
        paymentMethods
    });
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
        isAvailable: data.isAvailable, 
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

export function listenToOrdersForRestaurant(restaurantId: string, callback: (orders: Order[]) => void): () => void {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('restaurantId', '==', restaurantId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
        const sortedOrders = orders.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
        callback(sortedOrders);
    });

    return unsubscribe;
}

export async function updateOrderPaymentStatus(orderId: string, paymentStatus: 'completed' | 'pending'): Promise<void> {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { paymentStatus });
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { status });

    // Send notification to customer
    const orderSnap = await getDoc(orderRef);
    const orderData = orderSnap.data() as Order;
    if (orderData?.customerId) {
        const title = `Order Status Updated`;
        const body = `Your order from ${orderData.restaurantName} is now: ${status.replace('-', ' ')}`;
        await sendNotification(orderData.customerId, title, body, '/my-orders');
    }
}

// Delivery Boy Functions
export async function addDeliveryBoyToRestaurant(restaurantId: string, email: string): Promise<void> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email), where('role', '==', 'delivery'), limit(1));
    const userSnapshot = await getDocs(q);

    if (userSnapshot.empty) {
        throw new Error('No delivery person found with this email.');
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    
    const newDeliveryBoy: DeliveryBoy = {
        id: userDoc.id,
        name: userData.displayName || userData.username,
        email: userData.email,
        phone: userData.phone,
    };

    const restaurantRef = doc(db, 'restaurants', restaurantId);
    await updateDoc(restaurantRef, {
        deliveryBoys: arrayUnion(newDeliveryBoy)
    });
}

export async function removeDeliveryBoyFromRestaurant(restaurantId: string, deliveryBoy: DeliveryBoy): Promise<void> {
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    await updateDoc(restaurantRef, {
        deliveryBoys: arrayRemove(deliveryBoy)
    });
}


export async function assignDeliveryBoy(orderId: string, deliveryBoy: {id: string, name: string}): Promise<void> {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { 
        deliveryBoy,
        status: 'out-for-delivery'
    });

    // Send notification to customer about delivery status
    const orderSnap = await getDoc(orderRef);
    const orderData = orderSnap.data() as Order;
    if (orderData?.customerId) {
        const title = 'Order Out for Delivery!';
        const body = `Your order from ${orderData.restaurantName} is on its way.`;
        await sendNotification(orderData.customerId, title, body, '/my-orders');
    }

    // Send notification to delivery boy
    const title = 'New Delivery Assignment';
    const body = `You have been assigned a new order to deliver. Order #${orderId.substring(0,6)}`;
    await sendNotification(deliveryBoy.id, title, body, '/delivery');
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
