
'use server';

import { db } from './firebase';
import { collection, getDocs, query, where, limit, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import type { Restaurant, MenuItem, Order, DeliveryBoy } from '@/lib/types';
import type { z } from 'zod';
import type { RestaurantSchema } from '@/components/owner/restaurant-registration-form';
import type { EditRestaurantSchema } from '@/components/owner/edit-restaurant-form';
import type { MenuItemSchema } from '@/components/owner/menu-item-form';


async function getCoordinatesForAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
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
        return null; // Don't block the update if geocoding fails
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
        reviewCount: 0,
        gstEnabled: false,
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
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

    await updateDoc(orderRef, { 
        deliveryBoy,
        status: 'out-for-delivery',
        deliveryOtp
    });
    
    try {
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
            const orderData = orderSnap.data() as Order;
            const message = `Your order #${orderId.substring(0, 6)} is out for delivery with ${deliveryBoy.name}! Your OTP is ${deliveryOtp}.`;
            // This should be a proper notification service call, not console.log
            // For now, we'll keep the stub but comment it out to prevent server-side issues.
            // console.log(`(Notification Stub) To: ${orderData.customerId}, Message: ${message}`);
        }
    } catch (error) {
        console.error("Failed to send delivery notification:", error);
    }
}

export async function verifyDeliveryOtpAndDeliver(orderId: string, otp: string): Promise<void> {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
        throw new Error("Order not found.");
    }

    const order = orderSnap.data() as Order;

    if (order.deliveryOtp !== otp) {
        throw new Error("Invalid OTP. Please try again.");
    }

    // OTP is correct, mark as delivered
    await updateOrderStatus(orderId, 'delivered');
}


export async function updateDeliveryBoyLocation(deliveryBoyId: string, location: { latitude: number; longitude: number }): Promise<void> {
  if (!deliveryBoyId) return;
  const userRef = doc(db, 'users', deliveryBoyId);
  try {
    await updateDoc(userRef, {
      latitude: location.latitude,
      longitude: location.longitude,
    });
  } catch (error) {
    // It's often okay to silently fail here, as this can be called very frequently.
    // Logging is fine, but we don't want to show an error to the user for every failed update.
    console.error("Failed to update delivery boy location:", error);
  }
}
