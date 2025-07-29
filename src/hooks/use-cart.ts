
'use client';

import { createContext, useContext, ReactNode } from 'react';
import useLocalStorageState from 'use-local-storage-state';
import type { MenuItem, Restaurant } from '@/lib/types';

// Define the shape of a cart item
export interface CartItem extends MenuItem {
  quantity: number;
}

// Define the shape of the cart context
interface CartContextType {
  cart: CartItem[];
  restaurant: Partial<Restaurant> | null;
  addItem: (item: CartItem, restaurant: Partial<Restaurant>) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  totalPrice: number;
}

// Create the context with a default undefined value
const CartContext = createContext<CartContextType | undefined>(undefined);

// Define the props for the provider component
interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useLocalStorageState<CartItem[]>('cart', {
    defaultValue: [],
  });
  const [restaurant, setRestaurant] = useLocalStorageState<Partial<Restaurant> | null>('cartRestaurant', {
    defaultValue: null,
  });

  const addItem = (item: CartItem, restaurantData: Partial<Restaurant>) => {
    // If the cart is from a different restaurant, clear it first.
    if (restaurant && restaurant.id !== restaurantData.id) {
        setCart([item]);
        setRestaurant(restaurantData);
        return;
    }

    setCart(prevCart => {
        const existingItemIndex = prevCart.findIndex(i => i.id === item.id);
        if (existingItemIndex > -1) {
            const newCart = [...prevCart];
            newCart[existingItemIndex].quantity += 1;
            return newCart;
        } else {
            return [...prevCart, { ...item, quantity: 1 }];
        }
    });
    
    if (!restaurant) {
        setRestaurant(restaurantData);
    }
  };

  const removeItem = (itemId: string) => {
    setCart(prevCart => {
        const newCart = prevCart.filter(item => item.id !== itemId);
         if (newCart.length === 0) {
            setRestaurant(null); // Clear restaurant if cart is empty
        }
        return newCart;
    });
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
    } else {
      setCart(prevCart => {
        return prevCart.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        );
      });
    }
  };

  const clearCart = () => {
    setCart([]);
    setRestaurant(null);
  };
  
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);


  return (
    <CartContext.Provider value={{
        cart,
        restaurant,
        addItem,
        removeItem,
        updateItemQuantity,
        clearCart,
        cartCount,
        totalPrice,
      }}>
      {children}
    </CartContext.Provider>
  );
}

// Custom hook to use the cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
