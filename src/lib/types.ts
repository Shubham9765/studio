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
    restaurantId: string;
    items: (MenuItem & { quantity: number })[];
    total: number;
    status: 'pending' | 'accepted' | 'preparing' | 'out-for-delivery' | 'delivered' | 'cancelled';
    createdAt: Timestamp;
    deliveryBoy?: {
        id: string;
        name: string;
    };
}
