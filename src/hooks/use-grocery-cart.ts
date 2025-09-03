
'use client';

import { createContext, useContext, ReactNode } from 'react';
import useLocalStorageState from 'use-local-storage-state';
import type { GroceryItem, GroceryStore } from '@/lib/types';

export interface GroceryCartItem extends GroceryItem {
  quantity: number;
}

interface GroceryCartContextType {
  cart: GroceryCartItem[];
  store: GroceryStore | null;
  addItem: (item: GroceryCartItem, store: GroceryStore) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  totalPrice: number;
}

const GroceryCartContext = createContext<GroceryCartContextType | undefined>(undefined);

interface GroceryCartProviderProps {
  children: ReactNode;
}

export function GroceryCartProvider({ children }: GroceryCartProviderProps) {
  const [cart, setCart] = useLocalStorageState<GroceryCartItem[]>('groceryCart', {
    defaultValue: [],
  });
  const [store, setStore] = useLocalStorageState<GroceryStore | null>('groceryCartStore', {
    defaultValue: null,
  });

  const addItem = (item: GroceryCartItem, storeData: GroceryStore) => {
    if (store && store.id !== storeData.id) {
        setCart([{ ...item, quantity: 1 }]);
        setStore(storeData);
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
    
    if (!store) {
        setStore(storeData);
    }
  };

  const removeItem = (itemId: string) => {
    setCart(prevCart => {
        const newCart = prevCart.filter(item => item.id !== itemId);
         if (newCart.length === 0) {
            setStore(null);
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
    setStore(null);
  };
  
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);
  const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  const value = {
    cart,
    store,
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart,
    cartCount,
    totalPrice,
  };

  return (
    <GroceryCartContext.Provider value={value}>
      {children}
    </GroceryCartContext.Provider>
  );
}

export function useGroceryCart() {
  const context = useContext(GroceryCartContext);
  if (context === undefined) {
    throw new Error('useGroceryCart must be used within a GroceryCartProvider');
  }
  return context;
}
