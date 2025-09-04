

import type { Timestamp } from 'firebase/firestore';
import type { CartItem } from '@/hooks/use-cart';
import type { GroceryCartItem } from '@/hooks/use-grocery-cart';

export interface DeliveryBoy {
    id: string;
    name: string;
    email: string;
    phone: string;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string[];
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
  deliveryBoys?: DeliveryBoy[];
  reviewCount?: number;
  categoryImageUrl?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  fssaiLicense?: string;
  gstEnabled?: boolean;
  gstin?: string;
  isPromoted?: boolean;
  isPureVeg?: boolean;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name:string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  rating?: number;
  type: 'veg' | 'non-veg';
  restaurant?: Partial<Restaurant>;
}

export interface GroceryStore {
    id: string;
    name: string;
    image: string;
    ownerId?: string;
    status: 'pending' | 'approved' | 'rejected' | 'disabled';
    deliveryCharge: number;
    isOpen: boolean;
    address?: string;
    latitude?: number;
    longitude?: number;
    reviewCount?: number;
    rating?: number;
    deliveryTime?: string;
    deliveryBoys?: DeliveryBoy[];
    isPromoted?: boolean;
}

export interface GroceryItem {
    id: string;
    storeId: string;
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl?: string;
    isAvailable: boolean;
    unit?: string; // e.g., 'kg', 'litre', 'dozen'
    store?: Partial<GroceryStore>;
}

export interface Order {
    id: string;
    customerId: string;
    customerName: string;
    restaurantId: string; // Could be restaurant or store ID
    restaurantName: string; // Could be restaurant or store name
    orderType: 'food' | 'grocery';
    items: CartItem[] | GroceryCartItem[];
    total: number;
    status: 'pending' | 'accepted' | 'preparing' | 'out-for-delivery' | 'delivered' | 'cancelled';
    paymentMethod: 'cash' | 'upi';
    paymentStatus: 'pending' | 'completed';
    paymentDetails?: {
      transactionId?: string;
    };
    createdAt: Timestamp;
    deliveryAddress: string;
    customerPhone: string;
    deliveryBoy?: {
        id: string;
        name: string;
    };
    ratingGiven?: boolean;
    customerAddress?: {
        id: string;
        name: string;
        address: string;
        phone: string;
        latitude?: number;
        longitude?: number;
    };
    deliveryOtp?: string;
    notes?: string;
}

export interface BannerConfig {
    isEnabled: boolean;
    heading: string;
    isHeadingEnabled: boolean;
    description: string;
    isDescriptionEnabled: boolean;
    buttonText: string;
    isButtonEnabled: boolean;
    buttonLink: string;
    imageUrl: string;
}

export interface Cuisine {
    name: string;
    imageUrl?: string;
}

export interface GroceryCategory {
    name: string;
    imageUrl?: string;
}
