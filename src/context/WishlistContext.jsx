import { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';

const WishlistContext = createContext(null);
const WISHLIST_KEY = 'wishlist';

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(() => storage.get(WISHLIST_KEY) || []);

  useEffect(() => {
    storage.set(WISHLIST_KEY, items);
  }, [items]);

  const toggle = (product) => {
    setItems(prev => {
      const exists = prev.find(i => i.id === product.id);
      return exists ? prev.filter(i => i.id !== product.id) : [...prev, product];
    });
  };

  const isWished = (productId) => items.some(i => i.id === productId);
  const remove = (productId) => setItems(prev => prev.filter(i => i.id !== productId));

  return (
    <WishlistContext.Provider value={{ items, toggle, isWished, remove, count: items.length }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
