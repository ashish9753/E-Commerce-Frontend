import { createContext, useContext, useState, useEffect } from 'react';
import { brandsApi, categoriesApi, eventsApi } from '../api/catalog';

const CAT_EMOJI = {
  'Air Conditioners': '❄️', 'Refrigerators': '🧊', 'Televisions': '📺',
  'Washing Machines': '🧺', 'Kitchen Appliances': '🍳', 'Laptops': '💻',
  'Smartphones': '📱', 'Gaming': '🎮', 'Audio': '🔊', 'Fans & Coolers': '💨',
  'Microwaves': '📡', 'Cameras': '📷', 'Printers': '🖨️', 'Tablets': '📲',
};
export const getCatEmoji = (name) => CAT_EMOJI[name] || '🛒';

const CatalogContext = createContext(null);

export function CatalogProvider({ children }) {
  const [brands, setBrands]         = useState([]);
  const [categories, setCategories] = useState([]);
  const [events, setEvents]         = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      brandsApi.getAll().then(r => setBrands(r.data?.data?.brands || [])).catch(() => {}),
      categoriesApi.getAll().then(r => setCategories(r.data?.data?.categories || [])).catch(() => {}),
      eventsApi.getAll().then(r => setEvents((r.data?.data?.events || []).filter(e => e.isActive))).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const topCategories = categories.filter(c => !c.parent);
  const subCategories = categories.filter(c => c.parent);
  const getSubcats    = (parentId) => subCategories.filter(c =>
    (c.parent?._id || c.parent) === parentId
  );

  const refresh = () => {
    brandsApi.getAll().then(r => setBrands(r.data?.data?.brands || [])).catch(() => {});
    categoriesApi.getAll().then(r => setCategories(r.data?.data?.categories || [])).catch(() => {});
    eventsApi.getAll().then(r => setEvents((r.data?.data?.events || []).filter(e => e.isActive))).catch(() => {});
  };

  return (
    <CatalogContext.Provider value={{ brands, categories, topCategories, subCategories, getSubcats, events, loading, refresh }}>
      {children}
    </CatalogContext.Provider>
  );
}

export const useCatalog = () => useContext(CatalogContext);
