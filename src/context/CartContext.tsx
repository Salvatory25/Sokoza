import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Product, ProductVariant, Shop } from '../types/database';
import { CartItem, SellerCartGroup } from '../types/cart';
import { useToast } from './ToastContext';

interface CartContextType {
  items: CartItem[];
  sellerGroups: SellerCartGroup[];
  totalItemCount: number;
  totalAmountTzs: number;
  addItem: (product: Product, shop: Shop, variant?: ProductVariant, quantity?: number) => boolean;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, newQuantity: number) => void;
  clearCart: (shopId?: string) => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'sokoza_shopping_cart';

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore parse errors
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage error handling
    }
  }, [items]);

  const addItem = (
    product: Product,
    shop: Shop,
    variant?: ProductVariant,
    quantity = 1
  ): boolean => {
    if (quantity <= 0) return false;

    // Determine unit price (base product price + variant adjustment)
    const unitPriceTzs = product.price_tzs + (variant?.price_adjustment_tzs || 0);
    const availableStock = variant ? variant.stock_quantity : product.stock_quantity;

    if (availableStock <= 0) {
      showToast('This product is currently out of stock.', 'error');
      return false;
    }

    const itemId = variant ? `${product.id}_${variant.id}` : product.id;

    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === itemId);

      if (existingIndex > -1) {
        const existing = prev[existingIndex];
        const updatedQty = existing.quantity + quantity;

        if (updatedQty > availableStock) {
          showToast(`Only ${availableStock} units available in stock.`, 'warning');
          const updated = [...prev];
          updated[existingIndex] = {
            ...existing,
            quantity: availableStock,
            unitPriceTzs,
          };
          return updated;
        }

        const updated = [...prev];
        updated[existingIndex] = {
          ...existing,
          quantity: updatedQty,
          unitPriceTzs,
        };
        showToast(`Updated quantity in cart`, 'success');
        return updated;
      }

      const initialQty = Math.min(quantity, availableStock);
      const newItem: CartItem = {
        id: itemId,
        productId: product.id,
        product,
        shop,
        selectedVariant: variant,
        quantity: initialQty,
        unitPriceTzs,
        addedAt: Date.now(),
      };

      showToast(`Added "${product.name}" to cart`, 'success');
      return [...prev, newItem];
    });

    return true;
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    showToast('Item removed from cart', 'info');
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const maxStock = item.selectedVariant
            ? item.selectedVariant.stock_quantity
            : item.product.stock_quantity;

          const clampedQty = Math.min(newQuantity, maxStock);
          if (newQuantity > maxStock) {
            showToast(`Maximum available stock reached (${maxStock})`, 'warning');
          }
          return {
            ...item,
            quantity: clampedQty,
          };
        }
        return item;
      })
    );
  };

  const clearCart = (shopId?: string) => {
    if (shopId) {
      setItems((prev) => prev.filter((item) => item.shop.id !== shopId));
    } else {
      setItems([]);
    }
  };

  // Group items by shop for multi-seller checkout isolation
  const sellerGroups = useMemo<SellerCartGroup[]>(() => {
    const groupMap = new Map<string, SellerCartGroup>();

    items.forEach((item) => {
      const sId = item.shop.id;
      if (!groupMap.has(sId)) {
        groupMap.set(sId, {
          shopId: sId,
          shop: item.shop,
          items: [],
          subtotalTzs: 0,
          itemCount: 0,
        });
      }

      const group = groupMap.get(sId)!;
      group.items.push(item);
      group.subtotalTzs += item.unitPriceTzs * item.quantity;
      group.itemCount += item.quantity;
    });

    return Array.from(groupMap.values());
  }, [items]);

  const totalItemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const totalAmountTzs = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPriceTzs * item.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        sellerGroups,
        totalItemCount,
        totalAmountTzs,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
