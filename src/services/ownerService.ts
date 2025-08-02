
'use server';

import { db } from './firebase';
import { collection, getDocs, query, where, limit, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import type { Restaurant, MenuItem, Order, DeliveryBoy } from '@/lib/types';
import type { z } from 'zod';
import type { RestaurantSchema } from '@/components/owner/restaurant-registration-form';
import type { EditRestaurantSchema } from '@/components/owner/edit-restaurant-form';
import type { MenuItemSchema } from '@/components/owner/menu-item-form';


async function sendNotification(userId: string, title: string, body: string, url: string) {
    const { sendFcmNotification } = await import('@/ai/flows/send-fcm-notification');
    // This is a fire-and-forget operation. We don't want to block the UI
    // or show an error to the user if the notification fails to send.
    sendFcmNotification({ userId, title, body, url })
      .catch(error => {
        console.error("Failed to send notification:", error);
      });
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
        reviewCount: 0,
    };

    const docRef = await addDoc(collection(db, "restaurants"), {
      ...newRestaurant,
      createdAt: serverTimestamp()
    });

    return docRef.id;
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

// Order Functions
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
