import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { OrderItem } from "@workspace/api-client-react";

export interface CartItem extends OrderItem {
  storeId: number;
}

interface CartContextType {
  items: CartItem[];
  storeId: number | null;
  addItem: (item: Omit<CartItem, "price" | "productName"> & { price: number, productName: string, storeId: number }) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem("bb_cart");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const storeId = items.length > 0 ? items[0].storeId : null;

  useEffect(() => {
    localStorage.setItem("bb_cart", JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: Omit<CartItem, "price" | "productName"> & { price: number, productName: string, storeId: number }) => {
    setItems((prev) => {
      // If adding from a different store, clear cart first
      if (prev.length > 0 && prev[0].storeId !== newItem.storeId) {
        if (!window.confirm("Adding items from a different store will clear your current cart. Continue?")) {
          return prev;
        }
        return [{ ...newItem }];
      }

      const existing = prev.find((i) => i.productId === newItem.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === newItem.productId
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        );
      }
      return [...prev, newItem];
    });
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, storeId, addItem, removeItem, updateQuantity, clearCart, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
