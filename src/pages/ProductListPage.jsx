import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import FilterBar from '../components/product/FilterBar';
import CompareBar from '../components/product/CompareBar';
import { products } from '../data/products';

const SORT_OPTIONS = [
  { label: 'Popularity', value: 'popular' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Rating', value: 'rating' },
  { label: 'Discount', value: 'discount' },
];

export default function ProductListPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ brands: [], prices: [], ratings: [] });
  const [sort, setSort] = useState('popular');

  const category = searchParams.get('category') || '';
  const query = searchParams.get('q') || '';

  let filtered = [...products];
  if (category) filtered = filtered.filter(p => p.category === category);
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }
  if (filters.brands.length > 0) filtered = filtered.filter(p => filters.brands.includes(p.brand));
  if (filters.prices.length > 0) {
    filtered = filtered.filter(p => filters.prices.some(range => {
      const [min, max] = range.split('-').map(Number);
      return p.price >= min && p.price <= (max === Infinity || isNaN(max) ? Infinity : max);
    }));
  }
  if (filters.ratings.length > 0) {
    const minRating = Math.min(...filters.ratings.map(Number));
    filtered = filtered.filter(p => p.rating >= minRating);
  }
  if (sort === 'price_asc') filtered.sort((a, b) => a.price - b.price);
  else if (sort === 'price_desc') filtered.sort((a, b) => b.price - a.price);
  else if (sort === 'rating') filtered.sort((a, b) => b.rating - a.rating);
  else if (sort === 'discount') filtered.sort((a, b) => b.off - a.off);

  const title = query ? `Search: "${query}"` : category || 'All Products';

  return (
    <div className="wrap">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-soft py-6">
        <a className="text-mute font-medium cursor-pointer hover:text-ink" onClick={() => navigate('/')}>Home</a>
        <span>›</span>
        <span className="text-ink font-semibold">{title}</span>
      </div>

      <div className="grid grid-cols-[240px_1fr] gap-9 pb-20 max-md:grid-cols-1">
        <FilterBar filters={filters} onChange={setFilters} />
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="text-[13px] text-mute">Showing <b className="text-ink">{filtered.length}</b> products{category && ` in ${category}`}</div>
            <select className="select w-50" value={sort} onChange={e => setSort(e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-[80px]">🔍</div>
              <h3 className="text-2xl font-bold mt-4 mb-2">No products found</h3>
              <p className="text-mute mb-6">Try adjusting your search or filters.</p>
              <button className="btn btn-primary" onClick={() => { setFilters({ brands: [], prices: [], ratings: [] }); navigate('/products'); }}>Clear filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-5 max-md:grid-cols-2">
              {filtered.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
      <CompareBar />
    </div>
  );
}
