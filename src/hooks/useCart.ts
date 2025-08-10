import { useState } from 'react';
import { CartItem, Product, SelectedExtra } from '@/types/product';

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (product: Product, quantity: number = 1, observations?: string, selectedExtras?: SelectedExtra[]) => {
    setCartItems(prevItems => {
      // Sempre criar uma nova linha, pois extras/observações podem diferir
      const cartLineId = `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      return [
        ...prevItems,
        { ...product, quantity, observations, selectedExtras, cartLineId },
      ];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId && item.cartLineId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        (item.id === productId || item.cartLineId === productId) ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const extrasPerUnit = (item.selectedExtras ?? []).reduce((sum, ex) => sum + (ex.price * ex.quantity), 0);
      return total + ((item.price + extrasPerUnit) * item.quantity);
    }, 0);
  };

  return {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
  };
};