import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/home/HeroSection';
import { productsApi } from '../api/products';
import { couponsApi } from '../api/coupons';
import { normalizeProducts } from '../utils/normalizers';
import { useCatalog } from '../context/CatalogContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { validators } from '../utils/validators';

/* ── palette ── */
const BG    = '#f4f4f4';
const WHITE = '#ffffff';
const BDR   = '#e0e0e0';
const BLUE  = '#0166b2';
const ORG   = '#f26522';
const RED   = '#e53935';
const TXT   = '#1a1a1a';
const TXT2  = '#444444';
const MUT   = '#757575';
const DARK  = '#1c2b3a';
const DARK2 = '#11192a';

const fmtRs = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const z2    = n => String(n).padStart(2, '0');

const SUB_EMO = {
  'Mobiles': '📱', 'Smartphones': '📱', 'Laptops': '💻', 'Televisions': '📺',
  'Headphones': '🎧', 'Cameras': '📷', 'Speakers': '🔊', 'Wearables': '⌚',
  'Accessories': '🔌', 'Refrigerators': '🧊', 'Washing Machines': '🫧',
  'Air Conditioners': '❄️', 'Microwaves': '📡', 'Vacuum Cleaners': '🧹',
  'Water Purifiers': '💧', 'Kitchen Appliances': '🍳', 'Fans & Coolers': '💨',
  'Monitors': '🖥️', 'Printers': '🖨️', 'Gaming': '🎮', 'Tablets': '📲',
  'Dishwashers': '🍽️', 'Chimneys': '🏭', 'Ovens': '🥘', 'Mixers': '🥄',
};
const emo = n => SUB_EMO[n] || '🛒';

const VCOLS = [
  { bg: '#b54208', lt: '#fb923c' },
  { bg: '#166534', lt: '#4ade80' },
  { bg: '#1e40af', lt: '#60a5fa' },
  { bg: '#6d28d9', lt: '#c084fc' },
  { bg: '#9f1239', lt: '#fb7185' },
  { bg: '#78350f', lt: '#fbbf24' },
];

/* ════════════════════════════════════════════════════════════════
   1. VOUCHERS STRIP
════════════════════════════════════════════════════════════════ */
function VouchersStrip({ coupons }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(null);
  const scrollRef = useRef(null);
  if (!coupons.length) return null;

  const copy = (code, id) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };
  const scroll = d => scrollRef.current?.scrollBy({ left: d * 260, behavior: 'smooth' });

  return (
    <div style={{ background: '#111', padding: '14px 0', borderBottom: '2px solid #1e1e1e' }}>
      <div style={{ maxWidth: 1520, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 15 }}>🏷️</span>
            <span style={{ fontWeight: 800, fontSize: 14, color: '#fff' }}>Exclusive Vouchers</span>
          </div>
          <button onClick={() => navigate('/products')}
            style={{ fontSize: 12, color: ORG, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
            View All Vouchers →
          </button>
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => scroll(-1)}
            style={{ position: 'absolute', left: -14, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
              width: 24, height: 24, borderRadius: '50%', background: '#333', border: '1px solid #555',
              color: '#fff', fontSize: 13, cursor: 'pointer', lineHeight: 1 }}>‹</button>
          <div ref={scrollRef} style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {coupons.map((c, i) => {
              const col = VCOLS[i % VCOLS.length];
              const isCopied = copied === c._id;
              const discLabel = c.discountType === 'PERCENTAGE' ? `Flat ${c.discountValue}% OFF` : `Rs. ${c.discountValue} OFF`;
              const minLabel  = c.minimumAmount > 0 ? `Min. Order Rs. ${Number(c.minimumAmount).toLocaleString('en-IN')}` : 'No minimum order';
              return (
                <div key={c._id} style={{ flexShrink: 0, width: 235, borderRadius: 8, overflow: 'hidden', background: col.bg }}>
                  <div style={{ padding: '10px 12px', borderBottom: `1px dashed rgba(255,255,255,.2)` }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: col.lt, letterSpacing: 1.5, marginBottom: 2, textTransform: 'uppercase' }}>
                      {c.code}
                    </div>
                    <div style={{ fontWeight: 900, fontSize: 17, color: '#fff' }}>{discLabel}</div>
                  </div>
                  <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,.6)' }}>{minLabel}</div>
                      {c.expiryDate && (
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>
                          Expires {new Date(c.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                      )}
                    </div>
                    <button onClick={() => copy(c.code, c._id)}
                      style={{ background: isCopied ? '#16a34a' : '#fff', color: isCopied ? '#fff' : col.bg,
                        border: 'none', borderRadius: 4, padding: '5px 10px', fontSize: 10, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>
                      {isCopied ? '✓ Copied!' : 'Copy Code'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => scroll(1)}
            style={{ position: 'absolute', right: -14, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
              width: 24, height: 24, borderRadius: '50%', background: '#333', border: '1px solid #555',
              color: '#fff', fontSize: 13, cursor: 'pointer', lineHeight: 1 }}>›</button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   2. TWO PROMOTIONAL BANNERS (events or top categories)
════════════════════════════════════════════════════════════════ */
function TwoPromoBanners({ events, topCategories }) {
  const navigate = useNavigate();
  const BG_FALLBACK = ['#dbeafe', '#fef9c3'];

  const banners = events.filter(e => e.image).slice(0, 2);
  const panels = banners.length >= 2
    ? banners.map(e => ({
        key:   e._id,
        tag:   e.badge || e.name.split(' ').slice(0, 2).join(' ').toUpperCase(),
        title: e.name,
        sub:   e.description || '',
        cta:   e.discountPercent > 0 ? `Shop – Up to ${e.discountPercent}% off` : 'Shop Now',
        img:   e.image,
        path:  `/products`,
        hasImg: true,
      }))
    : topCategories.slice(0, 2).map((c, i) => ({
        key:   c._id,
        tag:   c.name.toUpperCase(),
        title: c.description || `Best ${c.name} Deals`,
        sub:   `Shop the best ${c.name} at unbeatable prices`,
        cta:   `Shop ${c.name}`,
        img:   c.image,
        path:  `/products?category=${encodeURIComponent(c.name)}`,
        bg:    BG_FALLBACK[i],
        hasImg: !!c.image,
      }));

  if (!panels.length) return null;

  return (
    <div className="hp-2col" style={{ marginBottom: 2, gap: 2 }}>
      {panels.map((p, i) => (
        <div key={p.key}
          onClick={() => navigate(p.path)}
          style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', minHeight: 210,
            background: p.bg || (i === 0 ? '#e8f4ff' : '#fffde7') }}>
          {p.img && (
            <img src={p.img} alt={p.tag}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          <div style={{
            position: 'relative', zIndex: 1, padding: '28px 36px', height: '100%',
            background: p.hasImg ? 'linear-gradient(90deg,rgba(0,0,0,.55) 40%,transparent)' : 'transparent',
            color: p.hasImg ? '#fff' : TXT,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, marginBottom: 7, opacity: .85 }}>{p.tag}</div>
            <div style={{ fontWeight: 900, fontSize: 22, lineHeight: 1.2, marginBottom: 8, maxWidth: 300 }}>{p.title}</div>
            {p.sub && <div style={{ fontSize: 12, opacity: .75, marginBottom: 18, maxWidth: 260 }}>{p.sub}</div>}
            <button style={{
              background: p.hasImg ? '#fff' : TXT, color: p.hasImg ? TXT : '#fff',
              border: 'none', borderRadius: 4, padding: '9px 22px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}>
              {p.cta}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   3. SHOP BY CATEGORY (dynamic top categories + subcategories)
════════════════════════════════════════════════════════════════ */
function ShopByCategorySection({ topCategories, getSubcats }) {
  const navigate = useNavigate();
  if (!topCategories.length) return null;

  return (
    <section style={{ marginBottom: 8 }}>
      <div className="hp-cat-grid">
        {topCategories.slice(0, 4).map(cat => {
          const subs = getSubcats(cat._id);
          const items = subs.length > 0 ? subs : [];
          return (
            <div key={cat._id} style={{ background: WHITE, border: `1px solid ${BDR}` }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BDR}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: TXT }}>{cat.name}</span>
                <button onClick={() => navigate(`/products?category=${encodeURIComponent(cat.name)}`)}
                  style={{ fontSize: 11, color: BLUE, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                  See all
                </button>
              </div>
              <div style={{ padding: '8px 6px', display: 'flex', flexWrap: 'wrap' }}>
                {items.slice(0, 8).map(s => (
                  <div key={s._id || s.name}
                    onClick={() => navigate(`/products?category=${encodeURIComponent(s.name)}`)}
                    style={{ width: '12.5%', minWidth: 70, textAlign: 'center', padding: '8px 4px', cursor: 'pointer', borderRadius: 4 }}
                    onMouseEnter={e => e.currentTarget.style.background = BG}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {s.image
                      ? <img src={s.image} alt={s.name} style={{ width: 44, height: 44, objectFit: 'contain', marginBottom: 4 }} />
                      : <div style={{ fontSize: 32, marginBottom: 4 }}>{emo(s.name)}</div>}
                    <div style={{ fontSize: 10, color: TXT2, lineHeight: 1.3, fontWeight: 500 }}>{s.name}</div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div style={{ padding: '12px 16px', color: MUT, fontSize: 12, width: '100%', textAlign: 'center' }}>
                    <button onClick={() => navigate(`/products?category=${encodeURIComponent(cat.name)}`)}
                      style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 4, padding: '8px 20px', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                      Browse {cat.name}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   4. DEAL OF THE DAY
════════════════════════════════════════════════════════════════ */
function DealOfTheDaySection({ products, events }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const dealEvent = events.find(e => e.discountPercent > 0);

  const [endTime] = useState(() =>
    dealEvent?.endDate
      ? new Date(dealEvent.endDate).getTime()
      : Date.now() + 7 * 3600000 + 45 * 60000
  );
  const [time, setTime] = useState({ h: '07', m: '45', s: '00' });
  const [idx, setIdx] = useState(0);
  const [vis, setVis] = useState(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    return w < 640 ? 2 : w < 1024 ? 3 : w < 1280 ? 4 : 6;
  });

  useEffect(() => {
    const tick = () => {
      const left = Math.max(0, endTime - Date.now());
      setTime({ h: z2(Math.floor(left % 86400000 / 3600000)), m: z2(Math.floor(left % 3600000 / 60000)), s: z2(Math.floor(left % 60000 / 1000)) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  useEffect(() => {
    const upd = () => {
      const w = window.innerWidth;
      setVis(w < 640 ? 2 : w < 1024 ? 3 : w < 1280 ? 4 : 6);
      setIdx(0);
    };
    window.addEventListener('resize', upd);
    return () => window.removeEventListener('resize', upd);
  }, []);

  const prods = products.filter(p => p.off > 0);
  if (!prods.length) return null;

  const maxDisc = dealEvent?.discountPercent
    || Math.max(...prods.slice(0, 6).map(p => p.off), 0);
  const maxIdx = Math.max(0, prods.length - vis);

  return (
    <section style={{ background: DARK, marginBottom: 8, padding: '18px 20px 20px' }}>
      <div style={{ maxWidth: 1520, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 17 }}>{dealEvent?.name || 'Deal of the Day'}</div>
            <div style={{ color: '#9ca3af', fontSize: 11 }}>Limited time offer</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: ORG }}>Up to</span>
            <span style={{ fontSize: 40, fontWeight: 900, color: ORG, lineHeight: 1 }}>{maxDisc}%</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: ORG }}>off</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>Ends in</span>
            {[time.h, time.m, time.s].map((v, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ background: DARK2, color: '#fff', fontWeight: 800, fontSize: 14, padding: '3px 8px', borderRadius: 4, fontFamily: 'monospace' }}>{v}</span>
                {i < 2 && <span style={{ color: ORG, fontWeight: 900 }}>:</span>}
              </span>
            ))}
          </div>
          <button onClick={() => navigate('/products?sort=discount')}
            style={{ marginLeft: 'auto', background: ORG, color: '#fff', border: 'none', borderRadius: 4, padding: '8px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Shop now
          </button>
        </div>

        {/* Cards */}
        <div style={{ position: 'relative' }}>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', transform: `translateX(-${idx * (100 / vis)}%)`, transition: 'transform .35s ease' }}>
              {prods.map(p => (
                <div key={p._id}
                  style={{ flexShrink: 0, width: `calc(${100 / vis}% - 10px)`, marginRight: 10, background: WHITE, borderRadius: 6, overflow: 'hidden', cursor: 'pointer' }}
                  onClick={() => navigate(`/product/${p._id}`)}>
                  <div style={{ height: 155, background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt={p.name} style={{ height: '100%', width: '100%', objectFit: 'contain' }} />
                      : <span style={{ fontSize: 48 }}>🛍️</span>}
                    {p.off > 0 && <span style={{ position: 'absolute', top: 8, left: 8, background: RED, color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 3 }}>-{p.off}%</span>}
                  </div>
                  <div style={{ padding: '8px 10px 10px' }}>
                    <div style={{ fontSize: 11, color: TXT2, height: 30, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: 4 }}>{p.name}</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'baseline', marginBottom: 6 }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: TXT }}>{fmtRs(p.price)}</span>
                      {p.was > p.price && <span style={{ fontSize: 10, color: MUT, textDecoration: 'line-through' }}>{fmtRs(p.was)}</span>}
                    </div>
                    <button onClick={e => { e.stopPropagation(); addToCart?.(p._id); }}
                      style={{ width: '100%', background: ORG, color: '#fff', border: 'none', borderRadius: 3, padding: '5px 0', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {idx > 0 && (
            <button onClick={() => setIdx(i => Math.max(0, i - 1))}
              style={{ position: 'absolute', left: -4, top: '42%', transform: 'translateY(-50%)', width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,.7)', border: '1px solid #444', color: '#fff', fontSize: 17, cursor: 'pointer', zIndex: 2 }}>‹</button>
          )}
          {idx < maxIdx && (
            <button onClick={() => setIdx(i => Math.min(maxIdx, i + 1))}
              style={{ position: 'absolute', right: -4, top: '42%', transform: 'translateY(-50%)', width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,.7)', border: '1px solid #444', color: '#fff', fontSize: 17, cursor: 'pointer', zIndex: 2 }}>›</button>
          )}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   5. BEST SELLERS (two panels side by side)
════════════════════════════════════════════════════════════════ */
function BestSellersPanel({ title, category }) {
  const navigate = useNavigate();
  const [prods, setProds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    productsApi.getAll({ category, sort: 'popular', limit: 4 })
      .then(({ data }) => setProds(normalizeProducts(data.data?.products || data.data?.data || [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category]);

  if (!loading && !prods.length) return null;

  return (
    <div style={{ background: WHITE, border: `1px solid ${BDR}`, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BDR}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: TXT }}>{title}</span>
        <button onClick={() => navigate(`/products?category=${encodeURIComponent(category)}&sort=popular`)}
          style={{ fontSize: 11, color: BLUE, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
          See more
        </button>
      </div>
      <div style={{ padding: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {(loading ? Array(4).fill(null) : prods.slice(0, 4)).map((p, i) => (
          <div key={p?._id || i}
            onClick={() => p && navigate(`/product/${p._id}`)}
            style={{ cursor: p ? 'pointer' : 'default', padding: 8, borderRadius: 4, background: BG }}
            onMouseEnter={e => e.currentTarget.style.background = '#e0efff'}
            onMouseLeave={e => e.currentTarget.style.background = BG}>
            <div style={{ height: 105, display: 'flex', alignItems: 'center', justifyContent: 'center', background: WHITE, borderRadius: 4, marginBottom: 6, overflow: 'hidden' }}>
              {loading
                ? <div style={{ width: '100%', height: '100%', background: '#eee', animation: 'pulse 1.5s infinite' }} />
                : p?.images?.[0]
                  ? <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  : <span style={{ fontSize: 32 }}>🛍️</span>}
            </div>
            {p && (
              <>
                <div style={{ fontSize: 10, color: TXT2, lineHeight: 1.3, height: 26, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: 3 }}>{p.name}</div>
                {p.rating > 0 && (
                  <div style={{ fontSize: 9, color: '#f59e0b', marginBottom: 2 }}>
                    {'★'.repeat(Math.round(p.rating))}
                    <span style={{ color: MUT, marginLeft: 2 }}>({p.reviews})</span>
                  </div>
                )}
                <div style={{ fontWeight: 700, fontSize: 12, color: TXT }}>{fmtRs(p.price)}</div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BestSellersSection({ topCategories }) {
  const cats = topCategories.slice(0, 2);
  if (!cats.length) return null;
  return (
    <section style={{ marginBottom: 8 }}>
      <div className="hp-2col" style={{ gap: 2 }}>
        {cats.map(c => <BestSellersPanel key={c._id} title={`Best Sellers in ${c.name}`} category={c.name} />)}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   6. ACTIVE SCHEMES / EVENTS
════════════════════════════════════════════════════════════════ */
function ActiveSchemesSection({ events }) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  if (!events.length) return null;

  const ACCO = [[ORG, '#fff3e0'], ['#22c55e', '#f0fdf4'], [BLUE, '#eff6ff'], ['#a855f7', '#faf5ff'], [RED, '#fff1f2']];
  const scroll = d => scrollRef.current?.scrollBy({ left: d * 240, behavior: 'smooth' });

  return (
    <section style={{ background: WHITE, border: `1px solid ${BDR}`, marginBottom: 8, padding: '16px 20px' }}>
      <div style={{ maxWidth: 1520, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: TXT }}>Active Offers & Schemes</span>
          <button onClick={() => navigate('/products')}
            style={{ fontSize: 11, color: BLUE, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
            View All →
          </button>
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => scroll(-1)}
            style={{ position: 'absolute', left: -14, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
              width: 26, height: 26, borderRadius: '50%', background: '#ddd', border: `1px solid ${BDR}`,
              color: TXT, fontSize: 13, cursor: 'pointer', lineHeight: 1 }}>‹</button>
          <div ref={scrollRef} style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {events.map((e, i) => {
              const [acc, bg] = ACCO[i % ACCO.length];
              return (
                <div key={e._id}
                  onClick={() => navigate('/products')}
                  style={{ flexShrink: 0, width: 210, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                    background: bg, border: `1px solid ${acc}33` }}>
                  {e.image
                    ? <img src={e.image} alt={e.name} style={{ width: '100%', height: 110, objectFit: 'cover' }} />
                    : <div style={{ height: 70, background: `${acc}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 36 }}>🎯</span>
                      </div>}
                  <div style={{ padding: '10px 12px 12px' }}>
                    {e.badge && <div style={{ fontSize: 9, fontWeight: 700, color: acc, letterSpacing: 1.5, marginBottom: 3 }}>{e.badge}</div>}
                    <div style={{ fontWeight: 700, fontSize: 12, color: TXT, marginBottom: 3 }}>{e.name}</div>
                    {e.discountPercent > 0 && (
                      <div style={{ fontSize: 17, fontWeight: 900, color: acc, lineHeight: 1 }}>Up to {e.discountPercent}% off</div>
                    )}
                    {e.description && <div style={{ fontSize: 10, color: MUT, marginTop: 3 }}>{e.description}</div>}
                    <div style={{ fontSize: 10, color: acc, fontWeight: 700, marginTop: 8 }}>Shop Now →</div>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => scroll(1)}
            style={{ position: 'absolute', right: -14, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
              width: 26, height: 26, borderRadius: '50%', background: '#ddd', border: `1px solid ${BDR}`,
              color: TXT, fontSize: 13, cursor: 'pointer', lineHeight: 1 }}>›</button>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   7. TOP BRANDS
════════════════════════════════════════════════════════════════ */
const FB_BRANDS = ['Samsung', 'LG', 'Sony', 'Xiaomi', 'Philips', 'Bosch', 'Panasonic', 'IFB'];

function BrandsSection({ brands }) {
  const navigate = useNavigate();
  const activeBrands = brands.filter(b => b.isActive !== false);
  const list = activeBrands.length > 0 ? activeBrands : FB_BRANDS.map(n => ({ name: n }));

  return (
    <section style={{ background: WHITE, border: `1px solid ${BDR}`, marginBottom: 8, padding: '16px 20px' }}>
      <div style={{ maxWidth: 1520, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: TXT }}>Top Brands</span>
          <button onClick={() => navigate('/products')}
            style={{ fontSize: 11, color: BLUE, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
            See all brands
          </button>
        </div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {list.slice(0, 12).map((b, i) => (
            <div key={b._id || i}
              onClick={() => navigate(`/products?brand=${encodeURIComponent(b.name)}`)}
              style={{ flexShrink: 0, minWidth: 96, padding: '12px 8px', textAlign: 'center',
                border: `1px solid ${BDR}`, borderRadius: 4, cursor: 'pointer', background: WHITE, transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.background = '#f0f7ff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BDR; e.currentTarget.style.background = WHITE; }}>
              {b.logo
                ? <img src={b.logo} alt={b.name} style={{ height: 32, maxWidth: 78, objectFit: 'contain' }} />
                : <div style={{ fontWeight: 900, fontSize: 13, color: TXT, letterSpacing: -.2 }}>{b.name.toUpperCase()}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   8. FEATURE CARDS (Exchange / EMI / Warranty)
════════════════════════════════════════════════════════════════ */
const FEATURES = [
  { icon: '📱', title: 'Exchange Offer', hl: 'Up to ₹15,000 off', desc: 'Exchange your old device and get the best value', cta: 'Exchange now' },
  { icon: '💳', title: 'No Cost EMI', hl: 'Easy EMIs on your favourite products', desc: 'Available on select products & banks', cta: 'Check eligibility' },
  { icon: '🛡️', title: 'Extended Warranty', hl: 'Complete protection for your products', desc: 'Covers all major breakdowns & issues', cta: 'Learn more' },
];

function FeaturesSection() {
  return (
    <section style={{ marginBottom: 8 }}>
      <div className="hp-3col">
        {FEATURES.map(f => (
          <div key={f.title}
            style={{ background: WHITE, border: `1px solid ${BDR}`, padding: '18px 20px', display: 'flex', gap: 14, cursor: 'pointer', transition: 'border-color .15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = BLUE}
            onMouseLeave={e => e.currentTarget.style.borderColor = BDR}>
            <span style={{ fontSize: 34, flexShrink: 0 }}>{f.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: TXT, marginBottom: 2 }}>{f.title}</div>
              <div style={{ fontWeight: 600, fontSize: 12, color: BLUE, marginBottom: 4 }}>{f.hl}</div>
              {f.desc && <div style={{ fontSize: 11, color: MUT, marginBottom: 6 }}>{f.desc}</div>}
              <span style={{ fontSize: 11, color: BLUE, fontWeight: 600, textDecoration: 'underline' }}>{f.cta}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   9. TRUST BAR
════════════════════════════════════════════════════════════════ */
const TRUST = [
  { ic: '💰', name: 'Great Prices', sub: 'Best prices on top products' },
  { ic: '🔒', name: 'Secure Payments', sub: '100% safe & secure' },
  { ic: '🚚', name: 'Fast Delivery', sub: 'On orders over ₹499' },
  { ic: '🔄', name: 'Easy Returns', sub: 'Hassle-free returns' },
  { ic: '💬', name: 'Customer Support', sub: "We're here to help" },
];

function TrustBar() {
  return (
    <div style={{ background: WHITE, borderTop: `1px solid ${BDR}`, marginBottom: 8 }}>
      <div style={{ maxWidth: 1520, margin: '0 auto', padding: '14px 20px' }}>
        <div className="hp-trust">
          {TRUST.map(t => (
            <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{t.ic}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: TXT }}>{t.name}</div>
                <div style={{ fontSize: 10, color: MUT }}>{t.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   10. NEWSLETTER
════════════════════════════════════════════════════════════════ */
function NewsletterSection() {
  const [email, setEmail] = useState('');
  const toast = useToast();

  const submit = e => {
    e.preventDefault();
    const err = validators.email(email);
    if (err) { toast(err, 'error'); return; }
    toast('Subscribed! Check your inbox for exclusive deals.');
    setEmail('');
  };

  return (
    <div style={{ background: DARK, marginBottom: 0 }}>
      <div style={{ maxWidth: 1520, margin: '0 auto', padding: '28px 20px' }}>
        <div className="hp-2col" style={{ gap: 40 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#fff', marginBottom: 4 }}>Subscribe to Our Newsletter</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>Get exclusive deals, new arrivals &amp; special offers.</div>
            <form onSubmit={submit} style={{ display: 'flex' }}>
              <input type="email" placeholder="Enter your email address" value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ flex: 1, height: 40, padding: '0 12px', background: '#243040', border: `1px solid #374151`,
                  borderRight: 'none', borderRadius: '4px 0 0 4px', color: '#fff', fontSize: 12, outline: 'none' }} />
              <button type="submit"
                style={{ height: 40, padding: '0 18px', background: ORG, color: '#fff', border: 'none',
                  borderRadius: '0 4px 4px 0', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                Subscribe
              </button>
            </form>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#fff', marginBottom: 4 }}>Download Our App</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>Shop on the go. Get exclusive app offers.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[{ l: 'GET IT ON', s: 'Google Play', i: '▶' }, { l: 'Download on the', s: 'App Store', i: '🍎' }].map(a => (
                <div key={a.s} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#243040',
                  border: `1px solid #374151`, borderRadius: 6, padding: '7px 14px', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = ORG}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#374151'}>
                  <span style={{ fontSize: 20 }}>{a.i}</span>
                  <div>
                    <div style={{ fontSize: 8, color: '#9ca3af' }}>{a.l}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{a.s}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
  const [dealProds, setDealProds] = useState([]);
  const [coupons, setCoupons]     = useState([]);

  useEffect(() => {
    productsApi.getAll({ sort: 'popular', limit: 18 })
      .then(({ data }) => {
        const ps = normalizeProducts(data.data?.products || data.data?.data || []);
        setDealProds(ps);
      })
      .catch(() => {});

    couponsApi.getAll({ isActive: true })
      .then(({ data }) => {
        const all = data.data?.coupons || data.data?.data || [];
        const now = new Date();
        setCoupons(all.filter(c => c.isActive !== false && new Date(c.expiryDate) > now));
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ background: BG, minHeight: '100vh' }}>
      {/* Vouchers strip — always above hero */}
      <VouchersStrip coupons={coupons} />

      {/* Hero slider */}
      <HeroSection />

      {/* Event / category promo banners */}
      <TwoPromoBanners events={events} topCategories={topCategories} />

      <div style={{ maxWidth: 1520, margin: '0 auto', padding: '8px 8px 0' }}>
        {/* Shop by Category (admin categories + subcategories) */}
        <ShopByCategorySection topCategories={topCategories} getSubcats={getSubcats} />

        {/* Deal of the Day */}
        <DealOfTheDaySection products={dealProds} events={events} />

        {/* Best Sellers by top 2 categories */}
        <BestSellersSection topCategories={topCategories} />

        {/* Active Schemes (events from admin) */}
        <ActiveSchemesSection events={events} />

        {/* Top Brands (admin brands) */}
        <BrandsSection brands={brands} />

        {/* Feature cards */}
        <FeaturesSection />

        {/* Trust bar */}
        <TrustBar />

        {/* Newsletter */}
        <NewsletterSection />
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.7} }
        ::-webkit-scrollbar { display: none }

        .hp-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2px;
        }
        .hp-3col {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 2px;
        }
        .hp-cat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2px;
          margin-bottom: 8px;
        }
        .hp-trust {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
        }

        @media (max-width: 1024px) {
          .hp-cat-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 768px) {
          .hp-2col { grid-template-columns: 1fr; }
          .hp-3col { grid-template-columns: 1fr; }
          .hp-cat-grid { grid-template-columns: 1fr; }
          .hp-trust { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .hp-trust { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
}
