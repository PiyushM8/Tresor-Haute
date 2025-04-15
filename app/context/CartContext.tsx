'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  showNotification: boolean;
  setShowNotification: (show: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { data: session } = useSession();

  // Load cart from localStorage on mount
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          // Validate the cart items structure
          if (Array.isArray(parsedCart) && parsedCart.every(item => 
            item.id && item.name && typeof item.price === 'number' && typeof item.quantity === 'number'
          )) {
            setItems(parsedCart);
          } else {
            // If cart is invalid, clear it
            localStorage.removeItem('cart');
          }
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem('cart');
      } finally {
        setIsInitialized(true);
      }
    };

    loadCart();
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isInitialized) return;
    
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [items, isInitialized]);

  // Sync cart with server when user logs in
  useEffect(() => {
    if (!isInitialized || !session || items.length === 0) return;

    const syncCart = async () => {
      try {
        await Promise.all(items.map(item => 
          fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              productId: item.id, 
              quantity: item.quantity 
            }),
          })
        ));
      } catch (error) {
        console.error('Error syncing cart with server:', error);
      }
    };
    syncCart();
  }, [session, items, isInitialized]);

  const addItem = async (productId: string, quantity: number) => {
    if (!isInitialized) return;

    try {
      // Fetch product details
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }
      const product = await response.json();

      setItems(currentItems => {
        const existingItem = currentItems.find(item => item.id === productId);
        if (existingItem) {
          return currentItems.map(item =>
            item.id === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [...currentItems, {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity,
          image: product.images?.[0]
        }];
      });

      // Show notification
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);

      // If user is logged in, sync with server
      if (session) {
        await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, quantity }),
        });
      }
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      setItems(currentItems =>
        currentItems.map(item =>
          item.id === productId
            ? { ...item, quantity: Math.max(0, quantity) }
            : item
        ).filter(item => item.quantity > 0)
      );

      // If user is logged in, sync with server
      if (session) {
        await fetch(`/api/cart/${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity }),
        });
      }
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      throw error;
    }
  };

  const removeItem = async (productId: string) => {
    try {
      setItems(currentItems => currentItems.filter(item => item.id !== productId));

      // If user is logged in, sync with server
      if (session) {
        await fetch(`/api/cart/${productId}`, {
          method: 'DELETE',
        });
      }
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      setItems([]);

      // If user is logged in, sync with server
      if (session) {
        await fetch('/api/cart', {
          method: 'DELETE',
        });
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  };

  return (
    <CartContext.Provider value={{ 
      items, 
      addItem, 
      updateQuantity, 
      removeItem, 
      clearCart,
      showNotification,
      setShowNotification
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 