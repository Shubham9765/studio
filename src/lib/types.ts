
import type { Timestamp } from 'firebase/firestore';

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  image: string;
  dataAiHint?: string;
  status: 'pending' | 'approved' | 'rejected' | 'disabled';
  ownerId?: string;
  deliveryCharge: number;
  isOpen: boolean;
  paymentMethods: {
    cash: boolean;
    upi: boolean;
    upiId?: string;
    upiQrCodeUrl?: string;
  };
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
}

export interface Order {
    id: string;
    customerId: string;
    customerName: string; // Add customer name for easier display
    restaurantId: string;
    items: (MenuItem & { quantity: number })[];
    total: number;
    status: 'pending' | 'accepted' | 'preparing' | 'out-for-delivery' | 'delivered' | 'cancelled';
    paymentMethod: 'cash' | 'upi';
    paymentStatus: 'pending' | 'completed';
    paymentDetails?: {
      transactionId?: string;
    };
    createdAt: Timestamp;
    deliveryBoy?: {
        id: string;
        name: string;
    };
}
