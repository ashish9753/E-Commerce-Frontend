import { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';

const CartContext = createContext(null);
const CART_KEY = 'cart';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => storage.get(CART_KEY) || []);
  const [voucher, setVoucher] = useState(null);

  useEffect(() => {
    storage.set(CART_KEY, items);
  }, [items]);

  const addToCart = (product, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, qty: Math.min(i.qty + qty, 10) } : i);
      }
      return [...prev, { ...product, qty }];
    });
  };

  const removeFromCart = (productId) => {
    setItems(prev => prev.filter(i => i.id !== productId));
  };

  const updateQty = (productId, qty) => {
    if (qty < 1) return removeFromCart(productId);
    setItems(prev => prev.map(i => i.id === productId ? { ...i, qty: Math.min(qty, 10) } : i));
  };

  const clearCart = () => {
    setItems([]);
    setVoucher(null);
  };

  const applyVoucher = (voucherData) => setVoucher(voucherData);
  const removeVoucher = () => setVoucher(null);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const savings = items.reduce((sum, i) => sum + (i.was - i.price) * i.qty, 0);
  const voucherDiscount = voucher ? voucher.discount : 0;
  const deliveryCharge = subtotal >= 5000 ? 0 : 120;
  const total = subtotal - voucherDiscount + deliveryCharge;
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider value={{
      items, count, subtotal, savings, voucherDiscount, deliveryCharge, total,
      voucher, addToCart, removeFromCart, updateQty, clearCart, applyVoucher, removeVoucher,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
