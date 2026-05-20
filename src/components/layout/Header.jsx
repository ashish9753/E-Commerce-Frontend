import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, Search, GitCompare, Bell, Package } from 'lucide-react';
import SupportIcon from '../icons/SupportIcon';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useCompare } from '../../context/CompareContext';
import { useNotifications } from '../../context/NotificationContext';
import { productsApi } from '../../api/products';
import { normalizeProducts } from '../../utils/normalizers';
import { formatPriceShort } from '../../utils/formatters';
import { useCatalog, getCatEmoji } from '../../context/CatalogContext';
import { categories as FALLBACK_CATS } from '../../data/categories';

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

function CategoryBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '4px 12px', height: 36, background: 'transparent', border: `1px solid ${active ? 'white' : 'transparent'}`,
      borderRadius: 3, color: 'white', fontSize: 13, fontWeight: active ? 700 : 400, cursor: 'pointer',
      whiteSpace: 'nowrap', flexShrink: 0,
    }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = 'white'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = 'transparent'; }}>
      {label}
    </button>
  );
}

export default function Header() {
  const navigate = useNavigate();
  const { count: cartCount } = useCart();
  const { count: wishCount } = useWishlist();
  const { count: compareCount } = useCompare();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { topCategories } = useCatalog();
  const navCats = topCategories.length > 0
    ? topCategories.map(c => ({ id: c._id, name: c.name, emo: getCatEmoji(c.name) }))
    : FALLBACK_CATS;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showNotifs, setShowNotifs] = useState(false);
  const [hidden, setHidden] = useState(false);
  const searchRef = useRef(null);
  const bellRef   = useRef(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handler = (e) => {
      if (!searchRef.current?.contains(e.target)) setShowResults(false);
      if (!bellRef.current?.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 80) { setHidden(false); }
      else if (y > lastScrollY.current + 5) { setHidden(true); }
      else if (y < lastScrollY.current - 5) { setHidden(false); }
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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

  const iconBtn = (onClick, children) => (
    <button onClick={onClick} style={{
      position: 'relative', display: 'flex', alignItems: 'center', gap: 5,
      padding: '6px 10px', borderRadius: 4, background: 'transparent', border: '1px solid transparent',
      color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'white'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
      {children}
    </button>
  );

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
      transition: 'transform 0.25s ease',
    }}>
      {/* Main dark bar */}
      <div style={{ background: '#131921', borderBottom: '1px solid #2a2a2a' }}>
        <div style={{ maxWidth: 1500, margin: '0 auto', padding: '0 16px',
          display: 'grid', gridTemplateColumns: 'auto auto 1fr auto', gap: 16, alignItems: 'center', height: 76 }}>

          {/* Logo */}
          <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8,
            fontWeight: 800, fontSize: 22, letterSpacing: '-.02em', cursor: 'pointer', color: 'white',
            padding: '6px 10px', borderRadius: 4, border: '1px solid transparent', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'white'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
            Trade<span style={{ color: '#FF5A1F' }}>Engine</span>
          </div>

          {/* Deliver to widget */}
          {(() => {
            const addr = user?.addresses?.[0];
            return (
              <div onClick={() => navigate('/profile?tab=addresses')}
                style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer',
                  padding: '5px 10px', borderRadius: 4, border: '1px solid transparent', flexShrink: 0 }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'white'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                  <span style={{ fontSize: 11, color: '#ccc' }}>
                    {addr ? `Delivering to ${addr.city || addr.state || ''}` : 'Deliver to'}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
                    {addr ? addr.pincode : 'Update location'}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 700, width: '100%', margin: '0 auto' }} ref={searchRef}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex' }}>
              <input
                style={{ flex: 1, height: 46, padding: '0 12px 0 16px', border: 'none', borderRadius: '4px 0 0 4px',
                  fontSize: 14, outline: 'none', background: 'white', color: '#0f172a' }}
                placeholder="Search products, brands & categories…"
                value={query}
                onChange={handleSearch}
                onFocus={() => query.trim().length > 1 && setShowResults(true)}
                autoComplete="off"
              />
              <button type="submit" style={{ height: 46, padding: '0 18px', background: '#FF5A1F',
                border: 'none', borderRadius: '0 4px 4px 0', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Search size={20} color="white" />
              </button>
            </form>

            {showResults && (
              <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'white',
                border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 8px 24px #00000022', zIndex: 200,
                overflow: 'hidden', maxHeight: 320, overflowY: 'auto' }}>
                {results.length > 0 ? results.map(p => (
                  <div key={p._id || p.id} onClick={() => selectResult(p)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    <div style={{ width: 40, height: 40, background: '#f4f6f8', borderRadius: 6, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                      {p.images?.[0] ? <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : '🛍️'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{p.brand}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{formatPriceShort(p.price)}</div>
                  </div>
                )) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No products found for "{query}"</div>
                )}
              </div>
            )}
          </div>

          {/* Right icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {compareCount > 0 && iconBtn(() => navigate('/compare'), (
              <>
                <GitCompare size={22} />
                <span style={{ position: 'absolute', top: 2, right: 2, width: 17, height: 17, borderRadius: '50%',
                  background: '#FF5A1F', color: 'white', fontSize: 10, fontWeight: 800, display: 'flex',
                  alignItems: 'center', justifyContent: 'center' }}>{compareCount}</span>
              </>
            ))}

            {iconBtn(() => navigate('/wishlist'), (
              <>
                <Heart size={22} />
                {wishCount > 0 && <span style={{ position: 'absolute', top: 2, right: 2, width: 17, height: 17,
                  borderRadius: '50%', background: '#FF5A1F', color: 'white', fontSize: 10, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{wishCount}</span>}
              </>
            ))}

            {user && (
              <div style={{ position: 'relative' }} ref={bellRef}>
                {iconBtn(() => setShowNotifs(v => !v), (
                  <>
                    <Bell size={22} />
                    {unreadCount > 0 && <span style={{ position: 'absolute', top: 2, right: 2, width: 17, height: 17,
                      borderRadius: '50%', background: '#FF5A1F', color: 'white', fontSize: 10, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>}
                  </>
                ))}
                {showNotifs && <NotificationDropdown onClose={() => setShowNotifs(false)} />}
              </div>
            )}

            {iconBtn(() => navigate('/cart'), (
              <>
                <ShoppingCart size={22} />
                {cartCount > 0 && <span style={{ position: 'absolute', top: 2, right: 2, width: 17, height: 17,
                  borderRadius: '50%', background: '#FF5A1F', color: 'white', fontSize: 10, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</span>}
              </>
            ))}

            {user ? (
              <>
                {iconBtn(() => navigate('/orders'), <Package size={22} />)}
                {user.role === 'admin' && iconBtn(() => navigate('/admin'), (
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 4,
                    background: '#7c3aed33', color: '#c4b5fd' }}>ADMIN</span>
                ))}
                {user.role === 'employee' && iconBtn(() => navigate('/employee'), (
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 4,
                    background: '#f59e0b22', color: '#fcd34d' }}>EMPLOYEE</span>
                ))}
                {iconBtn(() => navigate('/support'), <SupportIcon size={22} color="white" />)}
                {iconBtn(() => navigate('/profile'), (
                  <>
                    <User size={22} />
                    <span>{user.name.split(' ')[0]}</span>
                  </>
                ))}
              </>
            ) : (
              <button onClick={() => navigate('/login')} style={{ padding: '8px 18px', background: 'transparent',
                border: '1px solid white', borderRadius: 4, color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nav bar */}
      <div style={{ background: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}>
        <div style={{ maxWidth: 1500, margin: '0 auto', padding: '0 16px',
          display: 'flex', alignItems: 'center', gap: 0, height: 44 }}>
          {/* All Categories */}
          <button onClick={() => navigate('/products')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FF5A1F', color: 'white',
              border: 'none', borderRadius: 4, padding: '0 16px', height: 34, fontWeight: 700, fontSize: 13,
              cursor: 'pointer', flexShrink: 0, marginRight: 4 }}>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ display: 'block', width: 16, height: 2, background: 'white', borderRadius: 1 }} />
              <span style={{ display: 'block', width: 16, height: 2, background: 'white', borderRadius: 1 }} />
              <span style={{ display: 'block', width: 16, height: 2, background: 'white', borderRadius: 1 }} />
            </span>
            All Categories
          </button>
          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, overflowX: 'auto', scrollbarWidth: 'none', gap: 2 }}>
            {[
              { label: 'Brands', path: '/products?sort=brand' },
              { label: 'Events & Offers', path: '/products?sort=events' },
              { label: 'Flash Sale', path: '/products?sort=discount' },
              { label: 'New Arrivals', path: '/products?sort=newest' },
              { label: 'Top Selling', path: '/products?sort=popular' },
              ...navCats.slice(0, 4).map(c => ({ label: c.name, path: `/products?category=${encodeURIComponent(c.name)}` })),
            ].map(item => (
              <button key={item.label} onClick={() => navigate(item.path)}
                style={{ background: 'none', border: 'none', color: '#d1d5db', fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', padding: '0 14px', height: 44, whiteSpace: 'nowrap', flexShrink: 0,
                  borderBottom: '2px solid transparent', transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderBottomColor = '#FF5A1F'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#d1d5db'; e.currentTarget.style.borderBottomColor = 'transparent'; }}>
                {item.label}
              </button>
            ))}
          </div>
          {/* Get App */}
          <button onClick={() => {}}
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, background: 'none',
              border: '1px solid #3a3a3a', borderRadius: 4, color: '#d1d5db', fontSize: 12, fontWeight: 600,
              padding: '0 12px', height: 32, cursor: 'pointer', marginLeft: 8 }}>
            📱 Get App
          </button>
        </div>
      </div>
    </nav>
  );
}
