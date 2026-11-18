'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

export interface CartItem {
  id: string; // Composite: `${productId}_${variantId}`
  productId: string;
  variantId: string;
  name: string;
  size: string | null;
  sku: string;
  pricePaise: number;
  compareAtPricePaise?: number | null;
  imageUrl: string | null;
  quantity: number;
  maxStock: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotalPaise: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  formatPrice: (paise: number) => string;
  validateCartWithServer: () => Promise<string[]>;
  isValidating: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'nava_storefront_cart_v1';

/**
 * Stable, normalized comparison between two cart item arrays.
 * Prevents unnecessary state updates and effect re-trigger cycles.
 */
function areCartItemsEqual(a: CartItem[], b: CartItem[]): boolean {
  if (a.length !== b.length) return false;
  const mapA = new Map(a.map((i) => [i.id, i]));
  for (const itemB of b) {
    const itemA = mapA.get(itemB.id);
    if (!itemA) return false;
    if (
      itemA.quantity !== itemB.quantity ||
      itemA.pricePaise !== itemB.pricePaise ||
      itemA.maxStock !== itemB.maxStock ||
      itemA.variantId !== itemB.variantId ||
      itemA.productId !== itemB.productId ||
      itemA.size !== itemB.size ||
      itemA.name !== itemB.name
    ) {
      return false;
    }
  }
  return true;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Load cart from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (_e) {
      // Ignore localStorage errors
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch (_e) {
        // Ignore quota errors
      }
    }
  }, [items, isLoaded]);

  const addItem = (newItem: Omit<CartItem, 'id'>) => {
    const id = `${newItem.productId}_${newItem.variantId}`;
    setItems((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing) {
        const updatedQty = Math.min(existing.quantity + newItem.quantity, newItem.maxStock);
        return prev.map((i) => (i.id === id ? { ...i, quantity: updatedQty } : i));
      }
      return [...prev, { ...newItem, id }];
    });
    setIsDrawerOpen(true);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          const clamped = Math.min(quantity, i.maxStock);
          return { ...i, quantity: clamped };
        }
        return i;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Request versioning to discard stale in-flight responses
  const activeRequestIdRef = useRef(0);
  const pendingPromiseRef = useRef<Promise<string[]> | null>(null);

  const validateCartWithServer = useCallback(async (): Promise<string[]> => {
    const currentItems = itemsRef.current;
    if (currentItems.length === 0) return [];

    // Deduplicate in-flight validation requests
    if (pendingPromiseRef.current) {
      return pendingPromiseRef.current;
    }

    const currentRequestId = ++activeRequestIdRef.current;
    setIsValidating(true);

    const validationPromise = (async () => {
      try {
        const res = await fetch('/api/cart/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: currentItems.map((i) => ({
              productId: i.productId,
              variantId: i.variantId,
              quantity: i.quantity,
              pricePaise: i.pricePaise,
            })),
          }),
        });

        if (!res.ok) return [];
        const data = await res.json();

        // Discard stale responses if user performed a newer cart action in the interim
        if (currentRequestId !== activeRequestIdRef.current) {
          return [];
        }

        if (Array.isArray(data.items)) {
          // Stable comparison: only replace cart state if server data actually differs
          if (!areCartItemsEqual(itemsRef.current, data.items)) {
            setItems(data.items);
          }
        }

        return data.warnings || [];
      } catch (_e) {
        return [];
      } finally {
        if (currentRequestId === activeRequestIdRef.current) {
          setIsValidating(false);
          pendingPromiseRef.current = null;
        }
      }
    })();

    pendingPromiseRef.current = validationPromise;
    return validationPromise;
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalPaise = items.reduce((sum, item) => sum + item.pricePaise * item.quantity, 0);

  const formatPrice = (paise: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotalPaise,
        isDrawerOpen,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
        formatPrice,
        validateCartWithServer,
        isValidating,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
