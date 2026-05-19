import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi } from '../api/cart';
import { getErrorMessage } from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(null); // raw backend cart object
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) { setCart(null); return; }
    setLoading(true);
    try {
      const { data } = await cartApi.get();
      setCart(data.data.cart);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      const { data } = await cartApi.addItem(productId, quantity);
      setCart(data.data.cart);
      return { success: true };
    } catch (err) {
      return { success: false, error: getErrorMessage(err) };
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const { data } = await cartApi.removeItem(productId);
      setCart(data.data.cart);
      return { success: true };
    } catch (err) {
      return { success: false, error: getErrorMessage(err) };
    }
  };

  const updateQty = async (productId, quantity) => {
    if (quantity < 1) return removeFromCart(productId);
    try {
      const { data } = await cartApi.updateItem(productId, quantity);
      setCart(data.data.cart);
      return { success: true };
    } catch (err) {
      return { success: false, error: getErrorMessage(err) };
    }
  };

  const clearCart = async () => {
    try {
      await cartApi.clear();
      setCart(null);
    } catch { /* ignore */ }
  };

  const applyCoupon = async (code) => {
    try {
      const { data } = await cartApi.applyCoupon(code);
      await fetchCart();
      return { success: true, discount: data.data.discount, finalPrice: data.data.finalPrice, message: data.message };
    } catch (err) {
      return { success: false, error: getErrorMessage(err) };
    }
  };

  const removeCoupon = async () => {
    try {
      await cartApi.removeCoupon();
      await fetchCart();
      return { success: true };
    } catch (err) {
      return { success: false, error: getErrorMessage(err) };
    }
  };

  // Derived values from backend cart
  const items = cart?.items || [];
  const count = cart?.totalItems || 0;
  const subtotal = cart?.totalPrice || 0;
  const discountAmount = cart?.discountAmount || 0;
  const finalPrice = cart?.finalPrice || subtotal;
  const deliveryCharge = subtotal >= 5000 ? 0 : 120;
  const total = finalPrice + deliveryCharge;

  return (
    <CartContext.Provider value={{
      cart, items, count, subtotal, discountAmount, finalPrice, deliveryCharge, total, loading,
      addToCart, removeFromCart, updateQty, clearCart, applyCoupon, removeCoupon, fetchCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
