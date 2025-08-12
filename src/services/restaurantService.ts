

'use server';

import { db } from './firebase';
import { collection, doc, addDoc, serverTimestamp, runTransaction, updateDoc, getDoc } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import type { CartItem } from '@/hooks/use-cart';
import type { Restaurant } from '@/lib/types';
import { getServiceableCities } from './adminService';
import { getCoordinatesForAddress as getCoords } from './restaurantClientService';


// Helper function to calculate distance between two lat/lng points in kilometers
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
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


async function getCityFromCoordinates(latitude: number, longitude: number): Promise<string | null> {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`);
        const data = await response.json();
        return data.address.city || data.address.town || data.address.village || null;
    } catch (error) {
        console.error("Reverse geocoding failed:", error);
        return null;
    }
}


export async function createOrder(
  customerId: string,
  customerName: string,
  restaurant: Restaurant, 
  items: CartItem[], 
  total: number,
  orderDetails: Partial<Order>
): Promise<string> {
  // Serviceability Check (only if coordinates are present)
  if (orderDetails.customerAddress?.latitude && orderDetails.customerAddress?.longitude) {
      // 1. Check distance
      if (restaurant.latitude && restaurant.longitude) {
        const distance = getDistanceFromLatLonInKm(
          orderDetails.customerAddress.latitude,
          orderDetails.customerAddress.longitude,
          restaurant.latitude,
          restaurant.longitude
        );
        if (distance > 7) {
          throw new Error(`This restaurant is ${distance.toFixed(1)}km away and does not deliver to your location.`);
        }
      }

      // 2. Check city serviceability
      const deliveryCity = await getCityFromCoordinates(orderDetails.customerAddress.latitude, orderDetails.customerAddress.longitude);
      if (!deliveryCity) {
          console.warn(`Could not determine city for coordinates: ${orderDetails.customerAddress.latitude}, ${orderDetails.customerAddress.longitude}`);
      } else {
          const serviceableCities = await getServiceableCities();
          const isServiceable = serviceableCities.some(city => city.toLowerCase() === deliveryCity.toLowerCase());

          if (serviceableCities.length > 0 && !isServiceable) {
              throw new Error(`We're sorry, but we do not currently deliver to ${deliveryCity}.`);
          }
      }
  }
  // --- End Serviceability Check ---

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
      customerAddress: orderDetails.customerAddress, // This now correctly saves the full address object
      notes: orderDetails.notes || '',
  };

  const docRef = await addDoc(ordersCollection, newOrder);
  
  if(restaurant.ownerId) {
    const title = 'New Order Received!';
    const body = `You have a new order from ${customerName} for a total of Rs.${total.toFixed(2)}`;
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

export async function getCoordinatesForAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
    return getCoords(address);
}



