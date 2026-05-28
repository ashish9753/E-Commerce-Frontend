import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { cartApi } from '../api/cart';
import { getErrorMessage } from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  // pending[productId] = new qty (0 = remove) — never sent to server until syncCart()
  const pendingRef = useRef({});

  const fetchCart = useCallback(async () => {
    if (!user) { setCart(null); return; }
    setLoading(true);
    try {
      const { data } = await cartApi.get();
      setCart(data.data.cart);
      pendingRef.current = {}; // server is now the source of truth
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
      // server has canonical state for this item now
      delete pendingRef.current[productId];
      return { success: true };
    } catch (err) {
      return { success: false, error: getErrorMessage(err) };
    }
  };

  // Local-only — no API call. Pending is flushed when user clicks Proceed to Checkout.
  const updateQty = (productId, quantity) => {
    if (quantity < 1) return; // minimum is 1 — use Remove button to delete
    setCart(prev => {
      if (!prev) return prev;
      const items = prev.items.map(i => {
        const id = i.product?._id || i.product;
        return id?.toString() === productId?.toString() ? { ...i, quantity } : i;
      });
      return { ...prev, items };
    });
    pendingRef.current[productId] = quantity;
  };

  // Local-only remove — flushed on Proceed to Checkout.
  const removeFromCart = (productId) => {
    setCart(prev => {
      if (!prev) return prev;
      const items = prev.items.filter(i => {
        const id = i.product?._id || i.product;
        return id?.toString() !== productId?.toString();
      });
      return { ...prev, items };
    });
    pendingRef.current[productId] = 0;
  };

  // Immediate API remove — used for "Save for later" which must persist right away.
  const removeFromCartNow = async (productId) => {
    setCart(prev => {
      if (!prev) return prev;
      const items = prev.items.filter(i => {
        const id = i.product?._id || i.product;
        return id?.toString() !== productId?.toString();
      });
      return { ...prev, items };
    });
    delete pendingRef.current[productId];
    try {
      const { data } = await cartApi.removeItem(productId);
      setCart(data.data.cart);
      return { success: true };
    } catch (err) {
      fetchCart();
      return { success: false, error: getErrorMessage(err) };
    }
  };

  // Flush all pending local changes to the server, then return the fresh server cart items.
  // Called by CartPage when user clicks "Proceed to Checkout".
  const syncCart = async () => {
    const entries = Object.entries(pendingRef.current);
    if (entries.length > 0) {
      await Promise.all(
        entries.map(([pid, qty]) =>
          qty === 0
            ? cartApi.removeItem(pid).catch(() => {})
            : cartApi.updateItem(pid, qty).catch(() => {})
        )
      );
      pendingRef.current = {};
    }
    // Always fetch fresh so we get server-validated quantities and stock info
    try {
      const { data } = await cartApi.get();
      const freshCart = data.data.cart;
      setCart(freshCart);
      return freshCart?.items || [];
    } catch {
      return cart?.items || [];
    }
  };

  const clearCart = async () => {
    try {
      await cartApi.clear();
      setCart(null);
      pendingRef.current = {};
    } catch { /* ignore */ }
  };

  const applyCoupon = async (code) => {
    try {
      const { data } = await cartApi.applyCoupon(code);
      await fetchCart();
      return {
        success: true,
        discount:     data.data.discount,
        finalPrice:   data.data.finalPrice,
        freebie:      data.data.freebie || null,
        freeShipping: !!data.data.freeShipping,
        message:      data.message,
      };
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

  const items          = cart?.items || [];
  const count          = items.length;
  // Recompute subtotal live from items so +/- changes reflect instantly (no API call needed)
  const subtotal       = items.reduce((sum, i) => sum + (i.price ?? 0) * (i.quantity ?? 0), 0);
  const discountAmount = cart?.discountAmount || 0;
  const finalPrice     = Math.max(0, subtotal - discountAmount);
  // Derive the active freebie / free-shipping flag from the populated coupon
  // so they survive page reloads.
  const freebie = cart?.coupon?.discountType === 'FREEBIE' && cart?.coupon?.freebieProduct
    ? {
        _id:      cart.coupon.freebieProduct._id,
        title:    cart.coupon.freebieProduct.title,
        image:    cart.coupon.freebieProduct.images?.[0] || '',
        quantity: cart.coupon.freebieQuantity || 1,
      }
    : null;
  const freeShipping   = cart?.coupon?.discountType === 'FREE_SHIPPING';
  const baseDelivery   = subtotal >= 5000 ? 0 : 120;
  const deliveryCharge = freeShipping ? 0 : baseDelivery;
  const total          = finalPrice + deliveryCharge;

  return (
    <CartContext.Provider value={{
      cart, items, count, subtotal, discountAmount, finalPrice, deliveryCharge, total, loading, freebie, freeShipping,
      addToCart, removeFromCart, removeFromCartNow, updateQty, clearCart,
      applyCoupon, removeCoupon, fetchCart, syncCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
