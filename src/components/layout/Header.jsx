import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, Search, GitCompare } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useCompare } from '../../context/CompareContext';
import { searchProducts } from '../../data/products';
import { formatPriceShort } from '../../utils/formatters';
import { categories } from '../../data/categories';

const navBtn = 'px-3 py-2 rounded-[10px] flex items-center gap-1.75 text-[13px] font-semibold text-mute transition-all relative bg-transparent border-0 cursor-pointer hover:bg-surface hover:text-ink';
const catBtn = (active) => `flex items-center gap-2 h-8 px-3.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all cursor-pointer border-0 ${active ? 'bg-ink text-white' : 'text-mute bg-transparent hover:bg-surface hover:text-ink'}`;

export default function Header() {
  const navigate = useNavigate();
  const { count: cartCount } = useCart();
  const { count: wishCount } = useWishlist();
  const { count: compareCount } = useCompare();
  const { user } = useAuth();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const searchRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (!searchRef.current?.contains(e.target)) setShowResults(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    const q = e.target.value;
    setQuery(q);
    if (q.trim().length > 1) {
      setResults(searchProducts(q).slice(0, 6));
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setShowResults(false);
      navigate(`/products?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const selectResult = (product) => {
    setShowResults(false);
    setQuery('');
    navigate(`/product/${product.id}`);
  };

  return (
    <>
      <div className="bg-ink text-white text-xs font-medium py-2.25 text-center tracking-[0.02em]">
        Free delivery in Kathmandu Valley over Rs. 5,000
        <span className="text-[#444] mx-3.5">·</span>
        <strong className="text-[#FFB89B] font-bold">DASHAIN50</strong> for flat 50% off select appliances
        <span className="text-[#444] mx-3.5">·</span>
        Authorized dealer warranty on every product
      </div>

      <nav className="sticky top-0 z-50 bg-white/92 backdrop-saturate-180 backdrop-blur-sm border-b border-line">
        <div className="wrap grid grid-cols-[auto_1fr_auto] gap-7 items-center h-18">
          <div className="flex items-center gap-2.5 font-extrabold tracking-[-0.02em] text-[19px] cursor-pointer" onClick={() => navigate('/')}>
            <div className="logo-mark" />
            Trade<span className="text-accent">Engine</span>
          </div>

          <div className="relative max-w-140 mx-auto w-full" ref={searchRef}>
            <form onSubmit={handleSearchSubmit}>
              <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-mute pointer-events-none" size={16} />
              <input
                className="w-full h-11.5 border border-line-2 bg-surface-2 rounded-xl pl-11 pr-27.5 text-sm outline-none transition-all focus:border-ink focus:bg-white"
                placeholder="Search products, brands & categories…"
                value={query}
                onChange={handleSearch}
                onFocus={() => query.trim().length > 1 && setShowResults(true)}
                autoComplete="off"
              />
              <button type="submit" className="absolute right-1.5 top-1.5 h-8.5 px-3 rounded-lg bg-ink text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer border-0">
                Search
              </button>
            </form>

            {showResults && (
              <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-line rounded-[14px] shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto">
                {results.length > 0 ? results.map(p => (
                  <div key={p.id} className="flex items-center gap-3.5 px-4 py-3 cursor-pointer hover:bg-surface transition-colors" onClick={() => selectResult(p)}>
                    <div className="text-2xl w-10 h-10 bg-surface rounded-lg flex items-center justify-center shrink-0">{p.emo}</div>
                    <div>
                      <div className="text-sm font-semibold">{p.name}</div>
                      <div className="text-[11px] text-mute">{p.brand}</div>
                    </div>
                    <div className="text-sm font-bold ml-auto whitespace-nowrap">{formatPriceShort(p.price)}</div>
                  </div>
                )) : (
                  <div className="px-8 py-8 text-center text-mute">No products found for "{query}"</div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {compareCount > 0 && (
              <button className={navBtn} onClick={() => navigate('/compare')}>
                <GitCompare size={18} />
                <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">{compareCount}</span>
              </button>
            )}
            <button className={navBtn} onClick={() => navigate('/wishlist')}>
              <Heart size={18} />
              {wishCount > 0 && <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">{wishCount}</span>}
            </button>
            <button className={navBtn} onClick={() => navigate('/cart')}>
              <ShoppingCart size={18} />
              {cartCount > 0 && <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">{cartCount}</span>}
            </button>
            {user ? (
              <button className={navBtn} onClick={() => navigate('/profile')}>
                <User size={18} />
                <span>{user.name.split(' ')[0]}</span>
              </button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')}>Sign In</button>
            )}
          </div>
        </div>

        <div className="border-b border-line bg-white">
          <div className="flex items-center gap-1 h-12 overflow-x-auto scrollbar-none px-8 max-w-330 mx-auto">
            <button className={catBtn(activeCategory === 'All')} onClick={() => { setActiveCategory('All'); navigate('/products'); }}>
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              All Products
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                className={catBtn(activeCategory === c.name)}
                onClick={() => { setActiveCategory(c.name); navigate(`/products?category=${encodeURIComponent(c.name)}`); }}
              >
                {c.emo} {c.name}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}
