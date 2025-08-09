
'use server';

import { db } from './firebase';
import { collection, doc, addDoc, serverTimestamp, runTransaction, updateDoc, getDoc } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import type { CartItem } from '@/hooks/use-cart';
import type { Restaurant } from '@/lib/types';


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
      deliveryAddress: orderDetails.deliveryAddress || 'N/A', // The text address for display
      customerPhone: orderDetails.customerPhone || 'N/A',
      customerAddress: orderDetails.customerAddress, // The full address object with coordinates
  };

  const docRef = await addDoc(ordersCollection, newOrder);
  
  if(restaurant.ownerId) {
    const title = 'New Order Received!';
    const body = `You have a new order from ${customerName} for a total of $${total.toFixed(2)}`;
    console.log(`(Notification Stub) To: ${restaurant.ownerId}, Title: ${title}, Body: ${body}`);
  }

  return docRef.id;
}


export async function rateRestaurant(orderId: string, restaurantId: string, newRating: number): Promise<void> {
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    const orderRef = doc(db, 'orders', orderId);

    try {
        await runTransaction(db, async (transaction) => {
            const restaurantDoc = await transaction.get(restaurantRef);
            if (!restaurantDoc.exists()) {
                throw "Restaurant not found!";
            }
             const orderDoc = await transaction.get(orderRef);
            if (!orderDoc.exists()) {
                throw "Order not found!";
            }
            if (orderDoc.data().ratingGiven) {
                throw "This order has already been rated.";
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

            transaction.update(orderRef, { ratingGiven: true });
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e;
    }
}
