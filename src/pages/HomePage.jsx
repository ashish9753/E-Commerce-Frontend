import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/home/HeroSection';
import { productsApi } from '../api/products';
import { couponsApi } from '../api/coupons';
import { normalizeProducts } from '../utils/normalizers';
import { useCatalog, getCatEmoji } from '../context/CatalogContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { validators } from '../utils/validators';

/* ── theme ── */
const BG    = '#111111';
const CARD  = '#1a1a1a';
const CARD2 = '#222222';
const LINE  = '#2a2a2a';
const ACC   = '#FF5A1F';
const TXT   = '#ffffff';
const MUT   = '#9ca3af';
const MUT2  = '#6b7280';

const fmtRs = n => `Rs. ${Number(n || 0).toLocaleString('en-IN')}`;
const z2    = n => String(n).padStart(2, '0');
const pct   = (price, orig) => orig > price ? Math.round((1 - price / orig) * 100) : 0;

/* ════════════════════════════════════════════════════════════════
   1. FLASH SALE
════════════════════════════════════════════════════════════════ */
function FlashSaleSection({ products }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggle: toggleWish, isWished } = useWishlist();
  const [idx, setIdx] = useState(0);
  const [endTime] = useState(() => Date.now() + (2 * 24 + 7) * 3600000 + 45 * 60000);
  const [time, setTime] = useState({ h: '02', m: '07', s: '45' });

  useEffect(() => {
    const tick = () => {
      const left = Math.max(0, endTime - Date.now());
      setTime({ h: z2(Math.floor(left % 86400000 / 3600000)), m: z2(Math.floor(left % 3600000 / 60000)), s: z2(Math.floor(left % 60000 / 1000)) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  const visible = 6;
  const maxIdx = Math.max(0, products.length - visible);
  const prev = () => setIdx(i => Math.max(0, i - 1));
  const next = () => setIdx(i => Math.min(maxIdx, i + 1));

  if (!products.length) return null;

  return (
    <section style={{ background: CARD, marginBottom: 10 }}>
      {/* Header row */}
      <div style={{ maxWidth: 1520, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>⚡</span>
          <span style={{ fontWeight: 800, fontSize: 20, color: TXT }}>Flash Sale</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: MUT }}>Ends in</span>
          {[time.h, time.m, time.s].map((v, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ background: '#111', color: TXT, fontWeight: 800, fontSize: 14, padding: '3px 8px', borderRadius: 4, fontFamily: 'monospace' }}>{v}</span>
              {i < 2 && <span style={{ color: ACC, fontWeight: 800 }}>:</span>}
            </span>
          ))}
        </div>
        <button onClick={() => navigate('/products?sort=discount')}
          style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: ACC, background: 'none', border: 'none', cursor: 'pointer' }}>
          View All Deals →
        </button>
      </div>

      {/* Cards slider */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', transform: `translateX(-${idx * (100 / visible)}%)`, transition: 'transform .35s ease', padding: '0 20px 16px' }}>
          {products.map(p => {
            const disc = pct(p.price, p.originalPrice);
            const stock = p.countInStock ?? 12;
            const sold = p.soldCount ?? Math.floor(Math.random() * 80 + 50);
            const soldPct = Math.min(100, Math.round(sold / (sold + stock) * 100));
            const inWish = isWished?.(p._id || p.id);

            return (
              <div key={p._id || p.id}
                style={{ flexShrink: 0, width: `calc(${100 / visible}% - 10px)`, marginRight: 10, background: '#111',
                  borderRadius: 8, overflow: 'hidden', border: `1px solid ${LINE}`, cursor: 'pointer',
                  transition: 'border-color .15s' }}
                onClick={() => navigate(`/product/${p._id || p.id}`)}
                onMouseEnter={e => e.currentTarget.style.borderColor = ACC}
                onMouseLeave={e => e.currentTarget.style.borderColor = LINE}>

                {/* Image with badges */}
                <div style={{ position: 'relative', background: '#161616', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {p.images?.[0]
                    ? <img src={p.images[0]} alt={p.name} style={{ height: '100%', width: '100%', objectFit: 'contain' }} />
                    : <span style={{ fontSize: 60 }}>🛍️</span>}
                  {disc > 0 && (
                    <span style={{ position: 'absolute', top: 8, left: 8, background: '#dc2626', color: 'white',
                      fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 3 }}>
                      -{disc}%
                    </span>
                  )}
                  {stock > 0 && (
                    <span style={{ position: 'absolute', bottom: 8, right: 8, background: '#16a34a', color: 'white',
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 3 }}>
                      {stock} Left
                    </span>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: '10px 12px 12px' }}>
                  <div style={{ fontSize: 12, color: MUT, lineHeight: 1.45, marginBottom: 6, height: 36,
                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {p.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: 15, color: TXT }}>{fmtRs(p.price)}</span>
                    {p.originalPrice > p.price && (
                      <span style={{ fontSize: 11, color: MUT2, textDecoration: 'line-through' }}>{fmtRs(p.originalPrice)}</span>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ height: 5, background: '#2a2a2a', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${soldPct}%`, background: `linear-gradient(to right,${ACC},#ff8c42)`, borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 10, color: MUT2, marginTop: 3 }}>{soldPct}% Sold</div>
                  </div>
                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={e => { e.stopPropagation(); addToCart?.(p._id || p.id); }}
                      style={{ flex: 1, background: ACC, color: 'white', border: 'none', borderRadius: 4,
                        padding: '7px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      Add to Cart
                    </button>
                    <button onClick={e => { e.stopPropagation(); toggleWish?.(p._id || p.id); }}
                      style={{ width: 32, background: inWish ? '#ff1f4422' : CARD2, border: `1px solid ${LINE}`,
                        borderRadius: 4, color: inWish ? '#f43f5e' : MUT, fontSize: 15, cursor: 'pointer' }}>
                      ♥
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Nav arrows */}
        {idx > 0 && (
          <button onClick={prev} style={{ position: 'absolute', left: 4, top: '40%', transform: 'translateY(-50%)',
            width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,.75)', border: `1px solid ${LINE}`,
            color: 'white', fontSize: 18, cursor: 'pointer', zIndex: 2 }}>‹</button>
        )}
        {idx < maxIdx && (
          <button onClick={next} style={{ position: 'absolute', right: 4, top: '40%', transform: 'translateY(-50%)',
            width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,.75)', border: `1px solid ${LINE}`,
            color: 'white', fontSize: 18, cursor: 'pointer', zIndex: 2 }}>›</button>
        )}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   2. SHOP BY CATEGORY
════════════════════════════════════════════════════════════════ */
function CategorySection({ categories, getSubcats }) {
  const navigate = useNavigate();
  if (!categories.length) return null;

  return (
    <section style={{ background: CARD, marginBottom: 10, padding: '18px 20px' }}>
      <div style={{ maxWidth: 1520, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontWeight: 800, fontSize: 18, color: TXT }}>Shop by Category</span>
          <button onClick={() => navigate('/products')}
            style={{ fontSize: 13, color: ACC, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
            View All Categories →
          </button>
        </div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {categories.slice(0, 10).map(cat => {
            const subs = getSubcats(cat._id);
            const count = subs.length > 0 ? `${subs.length * 30}+ Items` : '120+ Items';
            return (
              <div key={cat._id} onClick={() => navigate(`/products?category=${encodeURIComponent(cat.name)}`)}
                style={{ flexShrink: 0, width: 140, background: CARD2, borderRadius: 8, padding: '14px 12px',
                  cursor: 'pointer', border: `1px solid ${LINE}`, textAlign: 'center', transition: 'border-color .15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = ACC}
                onMouseLeave={e => e.currentTarget.style.borderColor = LINE}>
                <div style={{ width: 56, height: 56, borderRadius: 8, background: '#2a2a2a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 28 }}>
                  {getCatEmoji(cat.name)}
                </div>
                <div style={{ fontWeight: 700, fontSize: 12, color: TXT, marginBottom: 4, lineHeight: 1.3 }}>{cat.name}</div>
                <div style={{ fontSize: 10, color: MUT }}>{count}</div>
              </div>
            );
          })}
          <div onClick={() => navigate('/products')}
            style={{ flexShrink: 0, width: 140, background: CARD2, borderRadius: 8, padding: '14px 12px',
              cursor: 'pointer', border: `1px solid ${LINE}`, textAlign: 'center', display: 'flex',
              flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            onMouseEnter={e => e.currentTarget.style.borderColor = ACC}
            onMouseLeave={e => e.currentTarget.style.borderColor = LINE}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: '#2a2a2a',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>→</div>
            <div style={{ fontWeight: 700, fontSize: 12, color: MUT }}>View All</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   3. PROMO BANNERS (events → 3 side by side)
════════════════════════════════════════════════════════════════ */
const PROMO_DEFAULTS = [
  { name: 'Dashain Mega Sale', description: 'Up to 70% OFF', bg: 'linear-gradient(135deg,#7c2d00,#c45500)', emoji: '🪔', badge: 'SALE' },
  { name: 'Summer Scheme', description: 'Cool Deals for Hot Days', bg: 'linear-gradient(135deg,#1e3a5f,#2563eb)', emoji: '☀️', badge: 'SCHEME' },
  { name: 'Bank Offer', description: 'Up to 20% Instant Discount', bg: 'linear-gradient(135deg,#3b0764,#7c3aed)', emoji: '💳', badge: 'OFFER' },
];

function PromoBanners({ events }) {
  const navigate = useNavigate();
  const promos = events.length >= 3
    ? events.slice(0, 3).map((ev, i) => ({ ...PROMO_DEFAULTS[i], name: ev.name, description: ev.description || PROMO_DEFAULTS[i].description, img: ev.bannerImage }))
    : PROMO_DEFAULTS;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 10 }}>
      {promos.map((p, i) => (
        <div key={i} onClick={() => navigate('/products')}
          style={{ background: p.img ? 'none' : p.bg, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
            position: 'relative', minHeight: 150, transition: 'transform .18s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
          {p.img && <img src={p.img} alt={p.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
          {p.img && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)' }} />}
          {!p.img && <span style={{ position: 'absolute', right: -10, bottom: -10, fontSize: 80, opacity: .25 }}>{p.emoji}</span>}
          <div style={{ position: 'relative', padding: '22px 20px' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', fontWeight: 600, marginBottom: 6 }}>{p.badge}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 6, lineHeight: 1.25 }}>
              {p.emoji && !p.img && <span style={{ marginRight: 6 }}>{p.emoji}</span>}{p.name}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginBottom: 14 }}>{p.description}</div>
            <button onClick={e => { e.stopPropagation(); navigate('/products'); }}
              style={{ background: 'none', border: '1.5px solid rgba(255,255,255,.6)', color: 'white',
                borderRadius: 4, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {i === 0 ? 'Shop Now →' : i === 1 ? 'Explore Offers →' : 'View Offers →'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   4. TOP PICKS (tabbed)
════════════════════════════════════════════════════════════════ */
const TOP_TABS = ['Trending', 'New Arrivals', 'Best Sellers', 'Top Rated'];

function TopPickProduct({ p }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggle: toggleWish, isWished } = useWishlist();
  const disc = pct(p.price, p.originalPrice);
  const inWish = isWished?.(p._id || p.id);

  return (
    <div style={{ flexShrink: 0, width: 200, background: CARD2, borderRadius: 8, overflow: 'hidden',
      border: `1px solid ${LINE}`, cursor: 'pointer', transition: 'border-color .15s' }}
      onClick={() => navigate(`/product/${p._id || p.id}`)}
      onMouseEnter={e => e.currentTarget.style.borderColor = ACC}
      onMouseLeave={e => e.currentTarget.style.borderColor = LINE}>
      {/* Image */}
      <div style={{ height: 180, background: '#161616', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {p.brand && <span style={{ position: 'absolute', top: 8, left: 10, fontSize: 10, fontWeight: 700, color: MUT, textTransform: 'uppercase', letterSpacing: '.06em' }}>{p.brand}</span>}
        {p.images?.[0]
          ? <img src={p.images[0]} alt={p.name} style={{ height: '100%', width: '100%', objectFit: 'contain' }} />
          : <span style={{ fontSize: 60 }}>🛍️</span>}
        {disc > 0 && (
          <span style={{ position: 'absolute', top: 8, right: 8, background: '#dc2626', color: 'white', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 3 }}>
            -{disc}%
          </span>
        )}
      </div>
      {/* Info */}
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ fontSize: 12, color: MUT, lineHeight: 1.4, height: 34, overflow: 'hidden',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: 6 }}>
          {p.name}
        </div>
        {p.rating > 0 && (
          <div style={{ fontSize: 11, color: '#f59e0b', marginBottom: 4 }}>
            {'★'.repeat(Math.round(p.rating))}
            <span style={{ color: MUT2, marginLeft: 4 }}>({p.numReviews || 0})</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: TXT }}>{fmtRs(p.price)}</div>
            {p.originalPrice > p.price && (
              <div style={{ fontSize: 10, color: MUT2, textDecoration: 'line-through' }}>{fmtRs(p.originalPrice)}</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            <button onClick={e => { e.stopPropagation(); addToCart?.(p._id || p.id); }}
              style={{ width: 32, height: 32, background: ACC, border: 'none', borderRadius: 4, color: 'white', fontSize: 16, cursor: 'pointer' }}>
              🛒
            </button>
            <button onClick={e => { e.stopPropagation(); toggleWish?.(p._id || p.id); }}
              style={{ width: 32, height: 32, background: inWish ? '#ff1f4422' : '#111', border: `1px solid ${LINE}`,
                borderRadius: 4, color: inWish ? '#f43f5e' : MUT, fontSize: 15, cursor: 'pointer' }}>
              ♥
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopPicksSection({ featured, newest, topRated, popular }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const sets = [featured, newest, topRated, popular];
  const links = ['/products', '/products?sort=newest', '/products?sort=popular', '/products?sort=rating'];
  const prods = sets[tab] || [];

  return (
    <section style={{ background: CARD, marginBottom: 10, padding: '18px 20px' }}>
      <div style={{ maxWidth: 1520, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontWeight: 800, fontSize: 18, color: TXT }}>Top Picks for You</span>
            <div style={{ display: 'flex', gap: 2 }}>
              {TOP_TABS.map((t, i) => (
                <button key={t} onClick={() => setTab(i)}
                  style={{ padding: '5px 14px', borderRadius: 20, border: 'none', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', transition: 'all .15s',
                    background: tab === i ? ACC : 'transparent',
                    color: tab === i ? 'white' : MUT }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => navigate(links[tab])}
            style={{ fontSize: 13, color: ACC, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
            View All Products →
          </button>
        </div>
        {/* Scrollable row */}
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
          {prods.length > 0
            ? prods.map(p => <TopPickProduct key={p._id || p.id} p={p} />)
            : Array(6).fill(0).map((_, i) => (
                <div key={i} style={{ flexShrink: 0, width: 200, height: 280, background: CARD2, borderRadius: 8, border: `1px solid ${LINE}`, animation: 'pulse 1.5s infinite' }} />
              ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   5. TOP BRANDS
════════════════════════════════════════════════════════════════ */
const FALLBACK_BRANDS = ['Samsung', 'LG', 'Sony', 'Xiaomi', 'Apple', 'HP', 'Dell', 'ASUS', 'Bosch', 'Philips'];

function BrandsSection({ brands }) {
  const navigate = useNavigate();
  const list = brands.length > 0 ? brands : FALLBACK_BRANDS.map(n => ({ name: n }));

  return (
    <section style={{ background: CARD, marginBottom: 10, padding: '18px 20px' }}>
      <div style={{ maxWidth: 1520, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontWeight: 800, fontSize: 18, color: TXT }}>Top Brands</span>
          <button onClick={() => navigate('/products')}
            style={{ fontSize: 13, color: ACC, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
            View All Brands →
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 10 }}>
          {list.slice(0, 10).map((b, i) => (
            <div key={b._id || i} onClick={() => navigate(`/products?brand=${encodeURIComponent(b.name)}`)}
              style={{ background: CARD2, borderRadius: 8, padding: '20px 12px', textAlign: 'center',
                border: `1px solid ${LINE}`, cursor: 'pointer', transition: 'border-color .15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = ACC}
              onMouseLeave={e => e.currentTarget.style.borderColor = LINE}>
              {b.logo
                ? <img src={b.logo} alt={b.name} style={{ height: 32, maxWidth: '80%', objectFit: 'contain', marginBottom: 8 }} />
                : <div style={{ fontWeight: 900, fontSize: 16, color: TXT, letterSpacing: '-.01em', marginBottom: 4 }}>{b.name.toUpperCase()}</div>}
              {!b.logo && <div style={{ fontSize: 10, color: MUT }}>Brand</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   6. EXCLUSIVE VOUCHERS
════════════════════════════════════════════════════════════════ */
const VOUCHER_THEMES = [
  { top: '#c45500', body: '#7c2d00', side: '#FF6B00' },
  { top: '#166534', body: '#14532d', side: '#22c55e' },
  { top: '#1e40af', body: '#1e3a8a', side: '#3b82f6' },
  { top: '#6d28d9', body: '#4c1d95', side: '#8b5cf6' },
  { top: '#be123c', body: '#881337', side: '#f43f5e' },
  { top: '#92400e', body: '#78350f', side: '#f59e0b' },
];

function VouchersSection({ coupons }) {
  const [copied, setCopied] = useState(null);
  if (!coupons.length) return null;

  const copy = (code, id) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <section style={{ background: CARD, marginBottom: 10, padding: '18px 20px' }}>
      <div style={{ maxWidth: 1520, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🏷️</span>
            <span style={{ fontWeight: 800, fontSize: 18, color: TXT }}>Exclusive Vouchers</span>
          </div>
          <button style={{ fontSize: 13, color: ACC, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
            View All Vouchers →
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
          {coupons.map((c, i) => {
            const theme = VOUCHER_THEMES[i % VOUCHER_THEMES.length];
            const isCopied = copied === c._id;
            const disc = c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `Rs. ${c.discountValue} OFF`;
            const min = c.minOrderValue ? `Min. Order Rs. ${Number(c.minOrderValue).toLocaleString('en-IN')}` : null;
            const exp = c.expiresAt ? `Expires ${new Date(c.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : null;

            return (
              <div key={c._id} style={{ borderRadius: 10, overflow: 'hidden', display: 'flex', border: `1px solid #333` }}>
                {/* Side stripe */}
                <div style={{ width: 8, background: theme.side, flexShrink: 0 }} />
                {/* Body */}
                <div style={{ flex: 1, background: theme.body }}>
                  {/* Top */}
                  <div style={{ background: theme.top, padding: '10px 14px' }}>
                    <div style={{ fontWeight: 900, fontSize: 20, color: 'white', letterSpacing: '.05em' }}>{disc}</div>
                    {c.description && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>{c.description}</div>}
                  </div>
                  {/* Bottom */}
                  <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: 'white', letterSpacing: '.08em', fontFamily: 'monospace' }}>{c.code}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                        {min && <span style={{ fontSize: 10, color: 'rgba(255,255,255,.55)' }}>{min}</span>}
                        {exp && <span style={{ fontSize: 10, color: 'rgba(255,255,255,.55)' }}>• {exp}</span>}
                      </div>
                    </div>
                    <button onClick={() => copy(c.code, c._id)}
                      style={{ background: isCopied ? '#16a34a' : 'white', color: isCopied ? 'white' : '#111',
                        border: 'none', borderRadius: 5, padding: '8px 14px', fontSize: 12, fontWeight: 800,
                        cursor: 'pointer', transition: 'all .2s', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {isCopied ? '✓ Copied!' : 'Copy Code'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   7. TRUST BAR
════════════════════════════════════════════════════════════════ */
const TRUST = [
  { ic: '🚚', name: 'Free Delivery', sub: 'On orders above Rs. 5,000' },
  { ic: '🛡️', name: 'Official Warranty', sub: '100% Genuine Products' },
  { ic: '🔄', name: 'Easy Returns', sub: '7 Days Return Policy' },
  { ic: '🔒', name: 'Secure Payments', sub: '100% Secure Checkout' },
  { ic: '📞', name: '24/7 Support', sub: 'Dedicated Support' },
];

function TrustBar() {
  return (
    <div style={{ background: CARD, borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}`, marginBottom: 10 }}>
      <div style={{ maxWidth: 1520, margin: '0 auto', padding: '16px 20px',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
        {TRUST.map(t => (
          <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 26, flexShrink: 0 }}>{t.ic}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: TXT }}>{t.name}</div>
              <div style={{ fontSize: 11, color: MUT }}>{t.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   8. NEWSLETTER + APP DOWNLOAD
════════════════════════════════════════════════════════════════ */
function FooterNewsletter() {
  const [email, setEmail] = useState('');
  const toast = useToast();

  const submit = (e) => {
    e.preventDefault();
    const err = validators.email(email);
    if (err) { toast(err, 'error'); return; }
    toast('Subscribed! Check your inbox for exclusive deals.');
    setEmail('');
  };

  return (
    <div style={{ background: CARD, marginBottom: 10 }}>
      <div style={{ maxWidth: 1520, margin: '0 auto', padding: '30px 20px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
        {/* Newsletter */}
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: TXT, marginBottom: 6 }}>Subscribe to Our Newsletter</div>
          <div style={{ fontSize: 13, color: MUT, marginBottom: 16 }}>Get exclusive deals, new arrivals &amp; special offers.</div>
          <form onSubmit={submit} style={{ display: 'flex', gap: 0 }}>
            <input type="email" placeholder="Enter your email address" value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ flex: 1, height: 42, padding: '0 14px', background: '#111', border: `1px solid ${LINE}`,
                borderRight: 'none', borderRadius: '4px 0 0 4px', color: TXT, fontSize: 13, outline: 'none' }} />
            <button type="submit"
              style={{ height: 42, padding: '0 20px', background: ACC, color: 'white', border: 'none',
                borderRadius: '0 4px 4px 0', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Subscribe
            </button>
          </form>
        </div>
        {/* Download App */}
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: TXT, marginBottom: 6 }}>Download Our App</div>
          <div style={{ fontSize: 13, color: MUT, marginBottom: 16 }}>Shop on the go. Get exclusive app offers.</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[{ label: 'GET IT ON', store: 'Google Play', icon: '▶' }, { label: 'Download on the', store: 'App Store', icon: '🍎' }].map(s => (
              <div key={s.store} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#111',
                border: `1px solid ${LINE}`, borderRadius: 6, padding: '8px 16px', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = ACC}
                onMouseLeave={e => e.currentTarget.style.borderColor = LINE}>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 9, color: MUT }}>{s.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: TXT }}>{s.store}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Bottom trust strip */}
      <div style={{ borderTop: `1px solid ${LINE}`, padding: '12px 20px' }}>
        <div style={{ maxWidth: 1520, margin: '0 auto', display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['100% Original Products', 'Best Price Guaranteed', 'Safe & Secure Shopping', 'Trusted by 50,000+ Customers'].map(t => (
            <span key={t} style={{ fontSize: 12, color: MUT, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ color: '#22c55e', fontSize: 14 }}>✓</span> {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const { brands, topCategories, getSubcats, events } = useCatalog();
  const [featured,   setFeatured]   = useState([]);
  const [newest,     setNewest]     = useState([]);
  const [topRated,   setTopRated]   = useState([]);
  const [popular,    setPopular]    = useState([]);
  const [flashProds, setFlashProds] = useState([]);
  const [coupons,    setCoupons]    = useState([]);

  useEffect(() => {
    productsApi.getFeatured()
      .then(({ data }) => setFeatured(normalizeProducts(data.data?.products || [])))
      .catch(() => {});

    productsApi.getAll({ sort: 'newest', limit: 12 })
      .then(({ data }) => setNewest(normalizeProducts(data.data?.products || data.data?.data || [])))
      .catch(() => {});

    productsApi.getAll({ sort: 'rating', limit: 12 })
      .then(({ data }) => setTopRated(normalizeProducts(data.data?.products || data.data?.data || [])))
      .catch(() => {});

    productsApi.getAll({ sort: 'popular', limit: 12 })
      .then(({ data }) => {
        const prods = normalizeProducts(data.data?.products || data.data?.data || []);
        setPopular(prods);
        setFlashProds(prods.filter(p => p.originalPrice > p.price).slice(0, 12));
      })
      .catch(() => {});

    couponsApi.getAll({ isActive: true })
      .then(({ data }) => {
        const all = data.data?.coupons || data.data?.data || [];
        setCoupons(all.filter(c => c.isActive !== false && (!c.applicableTo || c.applicableTo === 'all') && (!c.maxUses || c.usedCount < c.maxUses)));
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ background: BG, minHeight: '100vh' }}>
      {/* Hero: slider + mini-banners */}
      <HeroSection />

      <div style={{ maxWidth: 1520, margin: '0 auto', padding: '10px 10px 0' }}>
        {/* Flash Sale */}
        <FlashSaleSection products={flashProds.length > 0 ? flashProds : popular.slice(0, 12)} />

        {/* Shop by Category */}
        <CategorySection categories={topCategories} getSubcats={getSubcats} />

        {/* Top Picks */}
        <TopPicksSection featured={featured} newest={newest} topRated={topRated} popular={popular} />

        {/* Promo Banners */}
        <PromoBanners events={events} />

        {/* Brands */}
        <BrandsSection brands={brands} />

        {/* Vouchers */}
        {coupons.length > 0 && <VouchersSection coupons={coupons} />}

        {/* Trust bar */}
        <TrustBar />

        {/* Newsletter + App */}
        <FooterNewsletter />
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.7} }
        ::-webkit-scrollbar { display: none }
      `}</style>
    </div>
  );
}
