import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, Search, GitCompare, Bell } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useCompare } from '../../context/CompareContext';
import { useNotifications } from '../../context/NotificationContext';
import { productsApi } from '../../api/products';
import { normalizeProducts } from '../../utils/normalizers';
import { formatPriceShort } from '../../utils/formatters';
import { categories } from '../../data/categories';

const TYPE_ICON = { ORDER:'📦', PAYMENT:'💳', OFFER:'🎁', REFUND:'↩️', SYSTEM:'🔔' };

function CopyButton({ code }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:6,
      background:'#f0fdf4', border:'1px solid #86efac', borderRadius:8, padding:'5px 10px', width:'fit-content' }}>
      <span style={{ fontFamily:'monospace', fontWeight:800, fontSize:13, color:'#16a34a', letterSpacing:'.08em' }}>{code}</span>
      <button onClick={handleCopy}
        style={{ background: copied ? '#16a34a' : 'white', color: copied ? 'white' : '#16a34a',
          border:'1px solid #86efac', borderRadius:5, padding:'2px 8px', fontSize:11, fontWeight:700,
          cursor:'pointer', transition:'all .2s', whiteSpace:'nowrap' }}>
        {copied ? '✓ Copied!' : 'Copy'}
      </button>
    </div>
  );
}

function NotificationDropdown({ onClose }) {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const recent = notifications.slice(0, 8);

  return (
    <div style={{
      position:'absolute', top:'calc(100% + 10px)', right:0,
      width:380, background:'white', borderRadius:14,
      boxShadow:'0 8px 32px #0000001a, 0 0 0 1px #e5e7eb',
      zIndex:200, overflow:'hidden',
    }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:'1px solid #f0f0f0' }}>
        <div style={{ fontWeight:800, fontSize:15 }}>
          Notifications
          {unreadCount > 0 && <span style={{ fontSize:12, fontWeight:700, color:'#FF5A1F', background:'#FF5A1F15', padding:'1px 7px', borderRadius:99, marginLeft:6 }}>{unreadCount} new</span>}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{ fontSize:12, fontWeight:700, color:'#007185', background:'none', border:'none', cursor:'pointer' }}>Mark all read</button>
        )}
      </div>

      {/* List */}
      <div style={{ maxHeight:400, overflowY:'auto' }}>
        {recent.length === 0 ? (
          <div style={{ padding:'40px 20px', textAlign:'center', color:'#9ca3af', fontSize:13 }}>
            <div style={{ fontSize:36, marginBottom:10 }}>🔔</div>
            No notifications yet
          </div>
        ) : recent.map(n => {
          const handleOpen = () => {
            if (!n.isRead) markRead(n._id);
            if (n.link) navigate(n.link);
            onClose();
          };
          return (
            <div key={n._id}
              style={{
                display:'flex', gap:12, padding:'12px 18px',
                background: n.isRead ? 'white' : '#FFF8F5',
                borderBottom:'1px solid #f5f5f5',
              }}
            >
              <div style={{ width:36, height:36, borderRadius:'50%', background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0, marginTop:2 }}>
                {TYPE_ICON[n.type] || '🔔'}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight: n.isRead ? 600 : 800, fontSize:13, marginBottom:2 }}>{n.title}</div>
                <div style={{ fontSize:12, color:'#6b7280', lineHeight:1.5, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{n.message}</div>

                {/* Coupon code copy button */}
                {n.couponCode && <CopyButton code={n.couponCode} />}

                {/* Link button */}
                {n.link && (
                  <a
                    href={n.link.startsWith('http') ? n.link : `${window.location.origin}${n.link}`}
                    target="_blank" rel="noopener noreferrer"
                    onClick={() => { if (!n.isRead) markRead(n._id); onClose(); }}
                    style={{ display:'inline-flex', alignItems:'center', gap:5, marginTop:7, padding:'5px 10px',
                      borderRadius:6, background:'#eff6ff', border:'1px solid #bfdbfe',
                      fontSize:12, fontWeight:700, color:'#1d4ed8', cursor:'pointer', textDecoration:'none' }}>
                    🔗 Click here ↗
                  </a>
                )}

                <div style={{ fontSize:11, color:'#9ca3af', marginTop:6 }}>
                  {new Date(n.createdAt).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                </div>
              </div>
              {!n.isRead && (
                <button onClick={() => markRead(n._id)}
                  style={{ width:8, height:8, borderRadius:'50%', background:'#FF5A1F', flexShrink:0,
                    marginTop:4, border:'none', cursor:'pointer', padding:0 }} title="Mark read" />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding:'12px 18px', borderTop:'1px solid #f0f0f0', textAlign:'center' }}>
        <button onClick={() => { navigate('/notifications'); onClose(); }}
          style={{ fontSize:13, fontWeight:700, color:'#007185', background:'none', border:'none', cursor:'pointer' }}>
          View all notifications →
        </button>
      </div>
    </div>
  );
}

const navBtn = 'px-3 py-2 rounded-[10px] flex items-center gap-1.75 text-[13px] font-semibold text-mute transition-all relative bg-transparent border-0 cursor-pointer hover:bg-surface hover:text-ink';
const catBtn = (active) => `flex items-center gap-2 h-8 px-3.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all cursor-pointer border-0 ${active ? 'bg-ink text-white' : 'text-mute bg-transparent hover:bg-surface hover:text-ink'}`;

export default function Header() {
  const navigate = useNavigate();
  const { count: cartCount } = useCart();
  const { count: wishCount } = useWishlist();
  const { count: compareCount } = useCompare();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showNotifs, setShowNotifs] = useState(false);
  const searchRef = useRef(null);
  const bellRef   = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (!searchRef.current?.contains(e.target)) setShowResults(false);
      if (!bellRef.current?.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    const q = e.target.value;
    setQuery(q);
    if (q.trim().length > 1) {
      productsApi.getAll({ search: q.trim(), limit: 6 })
        .then(({ data }) => {
          const prods = normalizeProducts(data.data?.products || data.data?.data || []);
          setResults(prods);
          setShowResults(prods.length > 0);
        })
        .catch(() => setResults([]));
    } else {
      setShowResults(false);
      setResults([]);
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
    navigate(`/product/${product._id || product.id}`);
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
                  <div key={p._id || p.id} className="flex items-center gap-3.5 px-4 py-3 cursor-pointer hover:bg-surface transition-colors" onClick={() => selectResult(p)}>
                    <div className="text-2xl w-10 h-10 bg-surface rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                      {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-contain" /> : '🛍️'}
                    </div>
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
            {user && (
              <div style={{ position:'relative' }} ref={bellRef}>
                <button className={navBtn} onClick={() => setShowNotifs(v => !v)}>
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifs && <NotificationDropdown onClose={() => setShowNotifs(false)} />}
              </div>
            )}
            <button className={navBtn} onClick={() => navigate('/cart')}>
              <ShoppingCart size={18} />
              {cartCount > 0 && <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">{cartCount}</span>}
            </button>
            {user ? (
              <>
                {user.role === 'admin' && (
                  <button className={navBtn} onClick={() => navigate('/admin')} title="Admin Dashboard">
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 6, background: '#7c3aed22', color: '#7c3aed' }}>ADMIN</span>
                  </button>
                )}
                {user.role === 'seller' && (
                  <button className={navBtn} onClick={() => navigate('/seller')} title="Seller Dashboard">
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 6, background: '#f59e0b22', color: '#f59e0b' }}>SELLER</span>
                  </button>
                )}
                <button className={navBtn} onClick={() => navigate('/support')} title="Support">
                  <span style={{ fontSize:13 }}>🎫</span>
                </button>
                <button className={navBtn} onClick={() => navigate('/profile')}>
                  <User size={18} />
                  <span>{user.name.split(' ')[0]}</span>
                </button>
              </>
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
