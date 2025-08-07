
import type { Timestamp } from 'firebase/firestore';

export interface DeliveryBoy {
    id: string;
    name: string;
    email: string;
    phone: string;
}

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
  deliveryBoys?: DeliveryBoy[];
  reviewCount?: number;
  categoryImageUrl?: string;
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
}

export interface Order {
    id: string;
    customerId: string;
    customerName: string;
    restaurantId: string;
    restaurantName: string;
    items: (MenuItem & { quantity: number })[];
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

    