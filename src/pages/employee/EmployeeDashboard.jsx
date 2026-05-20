import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { employeeApi } from '../../api/employee';
import { categoriesApi } from '../../api/categories';
import { returnsApi } from '../../api/returns';
import { getErrorMessage } from '../../api/client';
import { useCatalog } from '../../context/CatalogContext';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

/* â”€â”€ Palette â€” matches admin dashboard exactly â”€â”€ */
const C = {
  accent:  '#f97316',
  blue:    '#3b82f6',
  green:   '#22c55e',
  yellow:  '#eab308',
  purple:  '#8b5cf6',
  red:     '#ef4444',
  cyan:    '#06b6d4',
  mute:    '#6b7280',
  sub:     '#9ca3af',
  line:    '#252b3b',
  card:    '#161a22',
  card2:   '#1b2030',
  text:    '#e8eaf2',
  bg:      '#0d0f14',
  sidebar: '#111318',
  active:  '#1e2535',
};

const STATUS_COLORS = {
  PLACED: C.yellow, CONFIRMED: C.blue, PACKED: C.purple,
  SHIPPED: C.cyan, OUT_FOR_DELIVERY: C.accent,
  DELIVERED: C.green, CANCELLED: C.red, RETURNED: C.mute,
};

const fmt    = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtRs  = (n) => `Rs. ${Math.round(Number(n || 0)).toLocaleString('en-IN')}`;
const fmtShort = (n) => {
  const v = Math.round(Number(n || 0));
  if (v >= 10000000) return `Rs. ${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000)   return `Rs. ${(v / 100000).toFixed(1)}L`;
  if (v >= 10000)    return `Rs. ${(v / 1000).toFixed(1)}K`;
  return fmtRs(v);
};

/* â”€â”€ Responsive hook â”€â”€ */
function useResponsive() {
  const [w, setW] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1280));
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return { w, isMobile: w < 768, isTablet: w >= 768 && w < 1100, isDesktop: w >= 1100 };
}

/* â”€â”€ SVG Icons â”€â”€ */
const Icon = {
  grid:    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  bag:     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  orders:  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  refund:  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>,
  plus:    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  dollar:  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  truck:   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  tag:     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  star:    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  shield:  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  search:  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  menu:    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  chevD:   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>,
  extlink: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  pencil:  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  warn:    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  check:   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  x:       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  shop:    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  box:     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  arrow:   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
};

function SvgAt({ el, size = 17 }) {
  if (!el) return null;
  return (
    <svg xmlns={el.props.xmlns} fill={el.props.fill} viewBox={el.props.viewBox}
      stroke={el.props.stroke} strokeWidth={el.props.strokeWidth}
      style={{ width: size, height: size, display: 'block', flexShrink: 0 }}>
      {el.props.children}
    </svg>
  );
}

/* â”€â”€ Shared UI components â”€â”€ */
const ICON_COLOR_MAP = { blue: C.blue, purple: C.purple, yellow: C.yellow, green: C.green, orange: C.accent, red: C.red, cyan: C.cyan };
const ICON_BG_MAP   = { blue: 'rgba(59,130,246,.15)', purple: 'rgba(139,92,246,.15)', yellow: 'rgba(234,179,8,.15)', green: 'rgba(34,197,94,.15)', orange: 'rgba(249,115,22,.15)', red: 'rgba(239,68,68,.15)', cyan: 'rgba(6,182,212,.15)' };

function KpiCard({ label, value, sub, colorKey = 'blue', iconEl }) {
  const col = ICON_COLOR_MAP[colorKey] || C.blue;
  const bg  = ICON_BG_MAP[colorKey]   || 'rgba(59,130,246,.15)';
  const nowrap = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minWidth: 0 }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 11, color: C.mute, fontWeight: 500, marginBottom: 3, ...nowrap }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text, lineHeight: 1.2, margin: '3px 0 2px', ...nowrap }}>{value}</div>
        {sub && <div style={{ fontSize: 10.5, color: C.mute, ...nowrap }}>{sub}</div>}
      </div>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, color: col, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <SvgAt el={iconEl} size={18} />
      </div>
    </div>
  );
}

function Card({ title, children, action, style }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, overflow: 'hidden', ...style }}>
      {(title || action) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px 14px' }}>
          {title && <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: C.text }}>{title}</div>}
          {action}
        </div>
      )}
      <div style={{ padding: title || action ? '0 22px 22px' : '22px' }}>{children}</div>
    </div>
  );
}

function Th({ children }) {
  return <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11.5, fontWeight: 600, color: C.mute, letterSpacing: '.07em', textTransform: 'uppercase', borderBottom: `1px solid ${C.line}`, whiteSpace: 'nowrap' }}>{children}</th>;
}
function Td({ children, style }) {
  return <td style={{ padding: '13px 14px', fontSize: 13.5, borderBottom: `1px solid ${C.line}`, color: C.text, verticalAlign: 'middle', ...style }}>{children}</td>;
}
function Badge({ text, color }) {
  return <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, background: color+'22', color, border:`1px solid ${color}44` }}>{text}</span>;
}
function Input({ value, onChange, placeholder, type = 'text', style }) {
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    style={{ height: 36, border: `1px solid ${C.line}`, borderRadius: 8, padding: '0 12px', fontSize: 13, outline: 'none', background: C.bg, color: C.text, fontFamily: 'inherit', ...style }} />;
}
function Sel({ value, onChange, children, style }) {
  return <select value={value} onChange={onChange}
    style={{ height: 36, border: `1px solid ${C.line}`, borderRadius: 8, padding: '0 10px', fontSize: 13, background: C.bg, color: C.text, cursor: 'pointer', fontFamily: 'inherit', ...style }}>{children}</select>;
}
function Btn({ children, onClick, disabled, variant = 'ghost', style }) {
  const base = { fontSize: 13, fontWeight: 500, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', border: 'none', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6, ...style };
  const variants = {
    ghost:   { background: 'rgba(255,255,255,.06)', color: C.sub, border: `1px solid ${C.line}` },
    danger:  { background: 'rgba(239,68,68,.12)',   color: '#f87171', border: '1px solid rgba(239,68,68,.25)' },
    success: { background: 'rgba(34,197,94,.12)',   color: C.green,   border: '1px solid rgba(34,197,94,.25)' },
    primary: { background: C.accent, color: 'white' },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], opacity: disabled ? .5 : 1 }}>{children}</button>;
}
function Loader() {
  return <div style={{ padding: 60, textAlign: 'center', color: C.mute, fontFamily: "'DM Sans',sans-serif" }}>Loadingâ€¦</div>;
}
function Empty({ text }) {
  return <div style={{ padding: '40px 0', textAlign: 'center', color: C.mute, fontSize: 14 }}>{text}</div>;
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   OVERVIEW TAB
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function OverviewTab({ profile }) {
  const { isMobile, isTablet } = useResponsive();
  const [products, setProducts] = useState([]);
  const [ordersData, setOrdersData] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      employeeApi.getMyProducts({ limit: 200 }),
      employeeApi.getMyOrders({ limit: 200 }),
    ]).then(([pRes, oRes]) => {
      setProducts(pRes.data?.data?.data || []);
      setOrdersData(oRes.data?.data || {});
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const orders = ordersData?.data || [];
  const revenue = ordersData?.employeeRevenue || 0;
  const refunded = ordersData?.employeeRefunded || 0;
  const breakdown = ordersData?.statusBreakdown || [];

  const totalStock  = products.reduce((a, p) => a + (p.stock || 0), 0);
  const stockValue  = products.reduce((a, p) => a + ((p.discountPrice || p.price || 0) * (p.stock || 0)), 0);
  const publishedN  = products.filter(p => p.isPublished).length;
  const lowStock    = products.filter(p => p.stock > 0 && p.stock <= 5);
  const outOfStock  = products.filter(p => p.stock === 0);
  const delivered   = breakdown.find(b => b._id === 'DELIVERED')?.count || 0;
  const pending     = breakdown.filter(b => ['PLACED','CONFIRMED','PACKED','SHIPPED','OUT_FOR_DELIVERY'].includes(b._id)).reduce((a,b)=>a+b.count,0);
  const stockChart  = products.slice(0, 8).map(p => ({ name: p.title?.slice(0,14), stock: p.stock }));
  const payMethods  = {};
  orders.forEach(o => { payMethods[o.paymentMethod] = (payMethods[o.paymentMethod]||0) + 1; });
  const payChart = Object.entries(payMethods).map(([k,v]) => ({ name: k, value: v }));

  const cols3 = isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 1fr 1fr';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12 }}>
        <KpiCard label="Net Revenue"     value={fmtShort(revenue)}   sub="Paid minus refunded"   colorKey="green"  iconEl={Icon.dollar} />
        <KpiCard label="Refunded"        value={fmtShort(refunded)}  sub={`${breakdown.filter(b=>['RETURNED','CANCELLED'].includes(b._id)).reduce((a,b)=>a+b.count,0)} orders`} colorKey="red" iconEl={Icon.refund} />
        <KpiCard label="Active Products" value={publishedN}          sub={`${products.length} total`} colorKey="orange" iconEl={Icon.bag} />
        <KpiCard label="Pending Orders"  value={fmt(pending)}        sub="To be processed"       colorKey="yellow" iconEl={Icon.truck} />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: cols3, gap: 16 }}>
        <Card title="Inventory Value">
          <div style={{ fontSize: 24, fontWeight: 800, color: C.purple, marginBottom: 4 }}>{fmtShort(stockValue)}</div>
          <div style={{ fontSize: 12, color: C.mute, marginBottom: 16 }}>{fmt(totalStock)} units in stock</div>
          {outOfStock.length > 0 && (
            <div style={{ background: C.red+'14', border:`1px solid ${C.red}33`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: C.red, marginBottom: 8, display:'flex', alignItems:'center', gap:8 }}>
              <SvgAt el={Icon.warn} size={14} />
              <strong>{outOfStock.length} products</strong>&nbsp;out of stock
            </div>
          )}
          {lowStock.length > 0 && (
            <div style={{ background: C.yellow+'14', border:`1px solid ${C.yellow}33`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: C.yellow, display:'flex', alignItems:'center', gap:8 }}>
              <SvgAt el={Icon.warn} size={14} />
              <strong>{lowStock.length} products</strong>&nbsp;with â‰¤5 units left
            </div>
          )}
        </Card>

        <Card title="Order Status">
          {breakdown.length === 0 ? <Empty text="No orders yet" /> :
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={breakdown.map(b=>({name:b._id,value:b.count}))} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={3} dataKey="value">
                  {breakdown.map(b => <Cell key={b._id} fill={STATUS_COLORS[b._id]||C.mute} />)}
                </Pie>
                <Tooltip contentStyle={{ background: C.card, border:`1px solid ${C.line}`, borderRadius:8, color:C.text, fontSize:12 }} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, color: C.sub }} />
              </PieChart>
            </ResponsiveContainer>
          }
        </Card>

        <Card title="Payment Methods">
          {payChart.length === 0 ? <Empty text="No orders yet" /> :
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={payChart} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={3} dataKey="value">
                  <Cell fill={C.blue} />
                  <Cell fill={C.green} />
                </Pie>
                <Tooltip contentStyle={{ background: C.card, border:`1px solid ${C.line}`, borderRadius:8, color:C.text, fontSize:12 }} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, color: C.sub }} />
              </PieChart>
            </ResponsiveContainer>
          }
        </Card>
      </div>

      {/* Stock bar chart */}
      {stockChart.length > 0 && (
        <Card title="Stock Levels by Product">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stockChart} margin={{ top: 4, right: 8, left: -10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.mute }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fill: C.mute }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: C.card, border:`1px solid ${C.line}`, borderRadius:8, color:C.text, fontSize:12 }} />
              <Bar dataKey="stock" fill={C.blue} radius={[4,4,0,0]} name="Stock" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Shop profile */}
      <Card title="Shop Profile">
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3,1fr)', gap: 20 }}>
          {[
            ['Shop Name',       profile?.shopName],
            ['GST Number',      profile?.gstNumber || 'â€”'],
            ['Business Address',profile?.businessAddress || 'â€”'],
            ['Rating',          `${(profile?.rating||0).toFixed(1)} / 5`],
            ['Total Sales',     fmtRs(profile?.totalSales)],
            ['Status',          profile?.isVerified ? 'Verified' : 'Pending'],
          ].map(([l,v]) => (
            <div key={l}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.mute, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>{l}</div>
              <div style={{ fontWeight: 600, fontSize: 14, color: l === 'Status' ? (profile?.isVerified ? C.green : C.yellow) : C.text }}>{v}</div>
            </div>
          ))}
        </div>
        {!profile?.isVerified && (
          <div style={{ marginTop: 16, padding: '12px 16px', background: C.yellow+'14', border:`1px solid ${C.yellow}44`, borderRadius: 8, fontSize: 12, color: C.yellow, display:'flex', alignItems:'center', gap:10 }}>
            <SvgAt el={Icon.warn} size={14} />
            Your shop is pending admin verification. Products won't be publicly visible until approved.
          </div>
        )}
      </Card>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MY PRODUCTS TAB
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function ProductsTab({ onEdit }) {
  const { isMobile } = useResponsive();
  const [all, setAll]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]     = useState(null);
  const [search, setSearch] = useState('');
  const [stockF, setStockF] = useState('');
  const [pubF, setPubF]     = useState('');

  const load = useCallback(() => {
    setLoading(true);
    employeeApi.getMyProducts({ limit: 200 }).then(r => setAll(r.data?.data?.data || [])).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const products = all.filter(p => {
    const q = search.toLowerCase();
    const mQ = !q || p.title?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q);
    const mS = !stockF || (stockF === 'out' ? p.stock === 0 : stockF === 'low' ? p.stock > 0 && p.stock <= 5 : p.stock > 5);
    const mP = !pubF || (pubF === 'live' ? p.isPublished : !p.isPublished);
    return mQ && mS && mP;
  });

  const totalRevPotential = all.reduce((a,p) => a + (p.discountPrice||p.price||0)*(p.stock||0), 0);
  const totalSold = all.reduce((a,p) => a + (p.sold||0), 0);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    setBusy(id);
    await employeeApi.deleteProduct(id).catch(()=>{});
    setAll(prev => prev.filter(x => x._id !== id));
    setBusy(null);
  };

  const handleTogglePublish = async (p) => {
    setBusy(p._id);
    await employeeApi.updateProduct(p._id, { isPublished: !p.isPublished }).catch(()=>{});
    setAll(prev => prev.map(x => x._id === p._id ? {...x, isPublished: !p.isPublished} : x));
    setBusy(null);
  };

  if (loading) return <Loader />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12 }}>
        <KpiCard label="Total Products"  value={all.length}                                    sub={`${all.filter(p=>p.isPublished).length} live`} colorKey="blue"   iconEl={Icon.bag} />
        <KpiCard label="Units in Stock"  value={fmt(all.reduce((a,p)=>a+(p.stock||0),0))}     sub="Across all products"                           colorKey="green"  iconEl={Icon.box} />
        <KpiCard label="Total Sold"      value={fmt(totalSold)}                               sub="Units sold ever"                               colorKey="orange" iconEl={Icon.check} />
        <KpiCard label="Stock Value"     value={fmtShort(totalRevPotential)}                  sub="At current prices"                             colorKey="purple" iconEl={Icon.dollar} />
      </div>

      <Card>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, background:C.bg, border:`1px solid ${C.line}`, borderRadius:8, padding:'0 12px', height:36, flex:1, minWidth:200 }}>
            <span style={{ color:C.mute, display:'flex' }}><SvgAt el={Icon.search} size={14} /></span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search productsâ€¦"
              style={{ flex:1, border:'none', outline:'none', background:'transparent', fontSize:13, color:C.text, fontFamily:'inherit' }} />
          </div>
          <Sel value={stockF} onChange={e=>setStockF(e.target.value)} style={{ width: 150 }}>
            <option value="">All Stock</option>
            <option value="ok">In Stock (&gt;5)</option>
            <option value="low">Low Stock (â‰¤5)</option>
            <option value="out">Out of Stock</option>
          </Sel>
          <Sel value={pubF} onChange={e=>setPubF(e.target.value)} style={{ width: 130 }}>
            <option value="">All Status</option>
            <option value="live">Published</option>
            <option value="hidden">Hidden</option>
          </Sel>
          {(search||stockF||pubF) && <Btn onClick={()=>{setSearch('');setStockF('');setPubF('');}}>Clear</Btn>}
          <span style={{ fontSize:13,color:C.mute,marginLeft:'auto' }}><strong style={{color:C.text}}>{products.length}</strong> of <strong style={{color:C.text}}>{all.length}</strong></span>
        </div>
      </Card>

      <Card title={`Products (${products.length})`}>
        {products.length === 0 ? <Empty text="No products match your filters" /> :
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>
                <Th>Product</Th><Th>Category</Th><Th>MRP</Th><Th>Sale Price</Th><Th>Discount</Th><Th>Stock</Th><Th>Sold</Th><Th>Status</Th><Th>Actions</Th>
              </tr></thead>
              <tbody>
                {products.map(p => {
                  const mrp  = p.price || 0;
                  const sale = p.discountPrice || p.price || 0;
                  const disc = mrp > sale ? Math.round(((mrp-sale)/mrp)*100) : 0;
                  const catName = typeof p.category === 'object' ? p.category?.name : p.category;
                  return (
                    <tr key={p._id} style={{ opacity: busy===p._id ? .5:1 }}>
                      <Td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:42, height:42, borderRadius:8, background:C.card2, overflow:'hidden', flexShrink:0, border:`1px solid ${C.line}` }}>
                            {p.images?.[0]
                              ? <img src={p.images[0]} alt="" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
                              : <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:C.mute }}><SvgAt el={Icon.bag} size={20} /></div>}
                          </div>
                          <div>
                            <div style={{ fontWeight:700, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:C.text }}>{p.title}</div>
                            <div style={{ fontSize:11, color:C.mute }}>{p.brand}</div>
                          </div>
                        </div>
                      </Td>
                      <Td style={{ color:C.mute }}>{catName || 'â€”'}</Td>
                      <Td style={{ color: disc > 0 ? C.mute : C.text, textDecoration: disc>0?'line-through':'none' }}>{fmtRs(mrp)}</Td>
                      <Td><span style={{ fontWeight:700, color:C.green }}>{fmtRs(sale)}</span></Td>
                      <Td>{disc > 0 ? <Badge text={`-${disc}%`} color={C.green} /> : <span style={{ color:C.mute }}>â€”</span>}</Td>
                      <Td>
                        <span style={{ fontWeight:700, color: p.stock===0?C.red:p.stock<=5?C.yellow:C.green }}>
                          {p.stock}
                        </span>
                      </Td>
                      <Td style={{ fontWeight:600 }}>{fmt(p.sold||0)}</Td>
                      <Td>
                        <button onClick={()=>handleTogglePublish(p)} disabled={busy===p._id}
                          style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:8, border:'none', cursor:'pointer',
                            background: p.isPublished ? C.green+'22' : C.red+'22',
                            color: p.isPublished ? C.green : C.red }}>
                          {p.isPublished ? 'Live' : 'Hidden'}
                        </button>
                      </Td>
                      <Td>
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={()=>onEdit(p)} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:8, border:`1px solid ${C.line}`, background:C.card2, color:C.sub, cursor:'pointer' }}>
                            <SvgAt el={Icon.pencil} size={12} /> Edit
                          </button>
                          <button onClick={()=>handleDelete(p._id,p.title)} disabled={busy===p._id} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:8, border:`1px solid ${C.red}44`, background:C.red+'18', color:C.red, cursor:'pointer' }}>
                            <SvgAt el={Icon.trash} size={12} /> Del
                          </button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        }
      </Card>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ORDERS TAB
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const EMPLOYEE_STATUSES = ['CONFIRMED','PACKED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED'];
const STATUS_NEXT = {
  PLACED: 'CONFIRMED', CONFIRMED: 'PACKED', PACKED: 'SHIPPED',
  SHIPPED: 'OUT_FOR_DELIVERY', OUT_FOR_DELIVERY: 'DELIVERED',
};

function OrderStatusCell({ order, onUpdated, onViewReturns }) {
  const [saving, setSaving] = useState(false);
  const [tracking, setTracking] = useState(order.trackingId || '');
  const [open, setOpen]     = useState(false);
  const current     = order.orderStatus;
  const isFinal     = ['RETURNED','CANCELLED','DELIVERED'].includes(current);
  const isReturned  = current === 'RETURNED';
  const isCancelled = current === 'CANCELLED';
  const isDelivered = current === 'DELIVERED';
  const nextStatus  = STATUS_NEXT[current];
  const sm = STATUS_COLORS[current] || C.mute;

  const doUpdate = async (status) => {
    setSaving(true);
    try {
      await employeeApi.updateOrderStatus(order._id, { status, trackingId: tracking || undefined });
      onUpdated(order._id, status, tracking);
      setOpen(false);
    } catch(e) {
      alert(e?.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position:'relative' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700,
          padding:'3px 9px', borderRadius:99, background: sm+'22', color: sm }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background: sm }} />
          {current.replace(/_/g,' ')}
        </span>
        {!isFinal && (
          <button onClick={() => setOpen(o=>!o)}
            style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6,
              background: open ? C.card2 : C.active,
              border:`1px solid ${C.line}`, cursor:'pointer', color:C.sub }}>
            {open ? 'âœ•' : 'Change'}
          </button>
        )}
      </div>

      {!isFinal && !open && nextStatus && (
        <button onClick={() => doUpdate(nextStatus)} disabled={saving}
          style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:6,
            background: STATUS_COLORS[nextStatus]+'22', color: STATUS_COLORS[nextStatus],
            border:`1px solid ${STATUS_COLORS[nextStatus]}44`, cursor:'pointer',
            opacity: saving ? 0.6 : 1, whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:5 }}>
          <SvgAt el={Icon.arrow} size={11} />
          {saving ? 'â€¦' : `Mark ${nextStatus.replace(/_/g,' ')}`}
        </button>
      )}

      {isReturned && (
        <button onClick={onViewReturns}
          style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:6,
            background: C.purple+'22', color: C.purple,
            border:`1px solid ${C.purple}44`, cursor:'pointer', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:5 }}>
          <SvgAt el={Icon.refund} size={11} /> Handle Return
        </button>
      )}
      {isDelivered && <span style={{ fontSize:11, color:C.green, fontWeight:600, display:'flex', alignItems:'center', gap:5 }}><SvgAt el={Icon.check} size={12} /> Delivered</span>}
      {isCancelled && <span style={{ fontSize:11, color:C.mute }}>Order cancelled</span>}

      {open && (
        <div style={{ position:'absolute', top:'100%', left:0, zIndex:50, background:C.card2,
          border:`1px solid ${C.line}`, borderRadius:10, padding:14, boxShadow:'0 8px 32px rgba(0,0,0,.4)', width:240, marginTop:4 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.mute, marginBottom:8, textTransform:'uppercase' }}>Set Status</div>
          <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:10 }}>
            {EMPLOYEE_STATUSES.map(s => (
              <button key={s} onClick={() => doUpdate(s)} disabled={saving || s === current}
                style={{ textAlign:'left', padding:'7px 10px', borderRadius:7,
                  background: s === current ? STATUS_COLORS[s]+'22' : C.bg,
                  border:`1px solid ${s === current ? STATUS_COLORS[s] : C.line}`,
                  color: s === current ? STATUS_COLORS[s] : C.sub,
                  fontWeight: s === current ? 700 : 500, fontSize:12,
                  cursor: s === current ? 'default' : 'pointer',
                  opacity: saving ? 0.6 : 1, fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 }}>
                {s === current && <SvgAt el={Icon.check} size={11} />}
                {s.replace(/_/g,' ')}
              </button>
            ))}
          </div>
          <div style={{ fontSize:11, fontWeight:700, color:C.mute, marginBottom:5, textTransform:'uppercase' }}>Tracking ID (optional)</div>
          <input value={tracking} onChange={e=>setTracking(e.target.value)} placeholder="e.g. FEDEX123456"
            style={{ width:'100%', height:32, border:`1px solid ${C.line}`, borderRadius:6, padding:'0 8px', fontSize:12, outline:'none', boxSizing:'border-box', background:C.bg, color:C.text, fontFamily:'inherit' }} />
          <button onClick={() => setOpen(false)}
            style={{ marginTop:8, width:'100%', padding:'6px', borderRadius:6, border:`1px solid ${C.line}`, background:C.bg, fontSize:12, cursor:'pointer', color:C.mute, fontFamily:'inherit' }}>
            Close
          </button>
        </div>
      )}
    </div>
  );
}

function OrdersTab({ onViewReturns }) {
  const { isMobile } = useResponsive();
  const [all, setAll]       = useState([]);
  const [revenue, setRev]   = useState(0);
  const [breakdown, setBD]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusF, setStatF] = useState('');
  const [payF, setPayF]     = useState('');

  useEffect(() => {
    employeeApi.getMyOrders({ limit: 200 }).then(r => {
      const d = r.data?.data || {};
      setAll(d.data || []);
      setRev(d.employeeRevenue || 0);
      setBD(d.statusBreakdown || []);
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const handleStatusUpdated = (orderId, newStatus, newTracking) => {
    setAll(prev => prev.map(o => o._id === orderId
      ? { ...o, orderStatus: newStatus, trackingId: newTracking || o.trackingId,
          paymentStatus: newStatus === 'DELIVERED' ? 'PAID' : o.paymentStatus }
      : o));
  };

  const orders = all.filter(o => {
    const q = search.toLowerCase();
    const mQ = !q || o.orderNumber?.toLowerCase().includes(q) || o.user?.name?.toLowerCase().includes(q) || o.user?.email?.toLowerCase().includes(q);
    const mS = !statusF || o.orderStatus === statusF;
    const mP = !payF || o.paymentStatus === payF;
    return mQ && mS && mP;
  });

  const delivered = all.filter(o=>o.orderStatus==='DELIVERED').length;
  const pending   = all.filter(o=>['PLACED','CONFIRMED','PACKED','SHIPPED','OUT_FOR_DELIVERY'].includes(o.orderStatus)).length;

  if (loading) return <Loader />;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:12 }}>
        <KpiCard label="Total Orders"   value={fmt(all.length)}  sub={`${delivered} delivered`}   colorKey="blue"   iconEl={Icon.orders} />
        <KpiCard label="Revenue Earned" value={fmtShort(revenue)} sub="From paid orders"           colorKey="green"  iconEl={Icon.dollar} />
        <KpiCard label="Pending"        value={fmt(pending)}     sub="Awaiting fulfilment"         colorKey="yellow" iconEl={Icon.truck} />
        <KpiCard label="Cancelled"      value={fmt(all.filter(o=>o.orderStatus==='CANCELLED').length)} colorKey="red" iconEl={Icon.x} />
      </div>

      {breakdown.length > 0 && (
        <Card title="Order Status Breakdown">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={breakdown.map(b=>({name:b._id,count:b.count}))} margin={{top:4,right:8,left:-10,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
              <XAxis dataKey="name" tick={{fontSize:10, fill:C.mute}} />
              <YAxis tick={{fontSize:10, fill:C.mute}} allowDecimals={false} />
              <Tooltip contentStyle={{ background: C.card, border:`1px solid ${C.line}`, borderRadius:8, color:C.text, fontSize:12 }} />
              <Bar dataKey="count" radius={[5,5,0,0]}>
                {breakdown.map(b=><Cell key={b._id} fill={STATUS_COLORS[b._id]||C.mute} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Card>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, background:C.bg, border:`1px solid ${C.line}`, borderRadius:8, padding:'0 12px', height:36, flex:1, minWidth:200 }}>
            <span style={{ color:C.mute, display:'flex' }}><SvgAt el={Icon.search} size={14} /></span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Order #, customer nameâ€¦"
              style={{ flex:1, border:'none', outline:'none', background:'transparent', fontSize:13, color:C.text, fontFamily:'inherit' }} />
          </div>
          <Sel value={statusF} onChange={e=>setStatF(e.target.value)} style={{ width:170 }}>
            <option value="">All Status</option>
            {['PLACED','CONFIRMED','PACKED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED','RETURNED'].map(s=><option key={s} value={s}>{s}</option>)}
          </Sel>
          <Sel value={payF} onChange={e=>setPayF(e.target.value)} style={{ width:140 }}>
            <option value="">All Payments</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
          </Sel>
          {(search||statusF||payF) && <Btn onClick={()=>{setSearch('');setStatF('');setPayF('');}}>Clear</Btn>}
          <span style={{ fontSize:13, color:C.mute, marginLeft:'auto' }}><strong style={{color:C.text}}>{orders.length}</strong> of <strong style={{color:C.text}}>{all.length}</strong></span>
        </div>
      </Card>

      <Card title={`Orders (${orders.length})`}>
        {orders.length === 0 ? <Empty text="No orders match your filters" /> :
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
              <colgroup>
                <col style={{ width:'22%' }} />
                <col style={{ width:'18%' }} />
                <col style={{ width:'22%' }} />
                <col style={{ width:'9%' }} />
                <col style={{ width:'9%' }} />
                <col style={{ width:'8%' }} />
                <col style={{ width:'12%' }} />
              </colgroup>
              <thead><tr>
                <Th>Order #</Th><Th>Customer</Th><Th>Products</Th><Th>Total</Th><Th>Method</Th><Th>Date</Th><Th>Status / Action</Th>
              </tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id}>
                    <Td>
                      <span style={{ fontFamily:'monospace', fontSize:11.5, fontWeight:700, color:C.accent, wordBreak:'break-all' }}>{o.orderNumber}</span>
                      {o.trackingId && <div style={{ fontSize:10, color:C.mute, marginTop:2 }}>Track: {o.trackingId}</div>}
                    </Td>
                    <Td>
                      <div style={{ fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.user?.name||'â€”'}</div>
                      <div style={{ fontSize:11, color:C.mute, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.user?.email}</div>
                      <div style={{ fontSize:11, color:C.mute }}>{o.user?.phone}</div>
                    </Td>
                    <Td>
                      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                        {o.orderItems?.slice(0,2).map(item=>(
                          <div key={item._id} style={{ display:'flex', alignItems:'center', gap:7 }}>
                            <div style={{ width:28, height:28, borderRadius:5, background:C.card2, overflow:'hidden', flexShrink:0, border:`1px solid ${C.line}` }}>
                              {item.image
                                ? <img src={item.image} style={{ width:'100%', height:'100%', objectFit:'contain' }} alt="" />
                                : <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:C.mute }}><SvgAt el={Icon.bag} size={13}/></div>}
                            </div>
                            <div style={{ minWidth:0 }}>
                              <div style={{ fontSize:12, color:C.sub, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.title}</div>
                              <div style={{ fontSize:11, color:C.mute }}>Qty: {item.quantity}</div>
                            </div>
                          </div>
                        ))}
                        {o.orderItems?.length > 2 && <span style={{ fontSize:11, color:C.mute }}>+{o.orderItems.length-2} more</span>}
                      </div>
                    </Td>
                    <Td>
                      <div style={{ fontWeight:700, color:C.text, fontSize:13 }}>{fmtRs(o.totalPrice)}</div>
                      <div style={{ marginTop:4 }}>
                        <Badge text={o.paymentStatus} color={o.paymentStatus==='PAID'?C.green:o.paymentStatus==='FAILED'?C.red:C.yellow} />
                      </div>
                    </Td>
                    <Td>
                      <Badge text={o.paymentMethod} color={o.paymentMethod==='COD'?C.yellow:C.blue} />
                    </Td>
                    <Td style={{ color:C.mute, fontSize:12 }}>
                      {new Date(o.createdAt).toLocaleDateString('en-IN',{ day:'numeric', month:'short' })}
                    </Td>
                    <Td><OrderStatusCell order={o} onUpdated={handleStatusUpdated} onViewReturns={onViewReturns} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </Card>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PRODUCT FORM (Add / Edit)
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function ProductForm({ initial, categories, onSave, onCancel }) {
  const { brands: catalogBrands } = useCatalog();
  const fileInputRef = useRef(null);

  const empty = { title:'',description:'',shortDescription:'',brand:'',price:'',discountPrice:'',stock:'',category:'',isFeatured:false,isPublished:true,returnable:true,returnWindow:7,taxLabel:'GST',taxRate:18 };
  const [form, setForm] = useState(initial ? {
    title: initial.title||'', description: initial.description||'',
    shortDescription: initial.shortDescription||'', brand: initial.brand||'',
    price: initial.price||'', discountPrice: initial.discountPrice||'',
    stock: initial.stock??'',
    category: (typeof initial.category==='object'?initial.category?._id:initial.category)||'',
    isFeatured: initial.isFeatured||false, isPublished: initial.isPublished!==false,
    returnable: initial.returnable !== false, returnWindow: initial.returnWindow || 7,
    taxLabel: initial.taxLabel || 'GST', taxRate: initial.taxRate ?? 18,
  } : empty);

  /* â”€â”€ image state â”€â”€ */
  const [existingImgs, setExistingImgs] = useState(initial?.images || []);
  const [newFiles,     setNewFiles]     = useState([]);      // File objects
  const [newPreviews,  setNewPreviews]  = useState([]);      // data-URL strings
  const [dragOver,     setDragOver]     = useState(false);

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const mrp    = Number(form.price)||0;
  const sale   = Number(form.discountPrice)||0;
  const disc   = mrp > sale && sale > 0 ? Math.round(((mrp-sale)/mrp)*100) : 0;
  const profit = sale > 0 ? sale : mrp;
  const totalImgs = existingImgs.length + newFiles.length;

  /* â”€â”€ file handling â”€â”€ */
  const addFiles = (fileList) => {
    const allowed = ['image/jpeg','image/jpg','image/png','image/webp'];
    const valid   = Array.from(fileList).filter(f => allowed.includes(f.type));
    const slots   = Math.max(0, 5 - totalImgs);
    const toAdd   = valid.slice(0, slots);
    if (!toAdd.length) return;
    setNewFiles(prev => [...prev, ...toAdd]);
    toAdd.forEach(f => {
      const reader = new FileReader();
      reader.onload = e => setNewPreviews(prev => [...prev, e.target.result]);
      reader.readAsDataURL(f);
    });
  };

  const removeExisting = (idx) => setExistingImgs(prev => prev.filter((_,i) => i !== idx));
  const removeNew = (idx) => {
    setNewFiles(prev    => prev.filter((_,i) => i !== idx));
    setNewPreviews(prev => prev.filter((_,i) => i !== idx));
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  /* â”€â”€ submit â”€â”€ */
  const handleSubmit = async () => {
    if (!form.title||!form.description||!form.price||form.stock===''||!form.category) {
      setError('Title, description, price, stock, and category are required.');
      return;
    }
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      // scalar fields
      const scalar = { ...form, price: Number(form.price), stock: Number(form.stock),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : '',
        returnWindow: form.returnable ? Number(form.returnWindow) : '' };
      Object.entries(scalar).forEach(([k,v]) => { if (v !== '' && v !== undefined) fd.append(k, v); });
      // images: tell backend which existing URLs to keep
      existingImgs.forEach(url => fd.append('keepImages', url));
      // new uploads
      newFiles.forEach(f => fd.append('images', f));
      await onSave(fd);
    } catch(err) { setError(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const LS = { display:'block', fontSize:11, fontWeight:700, color:C.mute, marginBottom:5, textTransform:'uppercase', letterSpacing:'.06em' };
  const inpStyle = { width:'100%', height:36, border:`1px solid ${C.line}`, borderRadius:8, padding:'0 12px', fontSize:13, outline:'none', background:C.bg, color:C.text, fontFamily:'inherit', boxSizing:'border-box' };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {(mrp > 0 || sale > 0) && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          <KpiCard label="MRP"         value={fmtRs(mrp)}                               sub="Original price"  colorKey="blue"   iconEl={Icon.tag} />
          <KpiCard label="Sale Price"  value={fmtRs(profit)}                            sub="Customer pays"   colorKey="green"  iconEl={Icon.dollar} />
          <KpiCard label="Discount"    value={disc>0?`${disc}%`:'â€”'}                    sub="Off MRP"         colorKey="orange" iconEl={Icon.tag} />
          <KpiCard label="Stock Value" value={fmtShort(profit*(Number(form.stock)||0))} sub="At sale price"   colorKey="purple" iconEl={Icon.box} />
        </div>
      )}

      <Card title={initial ? 'Edit Product' : 'Add New Product'}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div><label style={LS}>Title *</label><input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Product name" style={inpStyle} /></div>
          <div>
            <label style={LS}>Brand</label>
            <select value={form.brand} onChange={e=>set('brand',e.target.value)} style={{ ...inpStyle, cursor:'pointer' }}>
              <option value="">â€” Select Brand â€”</option>
              {catalogBrands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label style={LS}>Category *</label>
            <select value={form.category} onChange={e=>set('category',e.target.value)} style={{ ...inpStyle, cursor:'pointer' }}>
              <option value="">Select categoryâ€¦</option>
              {categories.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div><label style={LS}>Stock *</label><input type="number" value={form.stock} onChange={e=>set('stock',e.target.value)} placeholder="0" style={inpStyle} /></div>
          <div>
            <label style={LS}>MRP (Rs.) *</label>
            <input type="number" value={form.price} onChange={e=>set('price',e.target.value)} placeholder="0" style={inpStyle} />
          </div>
          <div>
            <label style={LS}>Sale Price (Rs.) <span style={{ color:C.green, textTransform:'none' }}>â€” Optional</span></label>
            <input type="number" value={form.discountPrice} onChange={e=>set('discountPrice',e.target.value)} placeholder="Leave blank = no discount" style={inpStyle} />
            {disc > 0 && <div style={{ fontSize:12, color:C.green, marginTop:4 }}>{disc}% off MRP</div>}
          </div>
        </div>

        <div style={{ marginTop:16 }}>
          <label style={LS}>Short Description</label>
          <input value={form.shortDescription} onChange={e=>set('shortDescription',e.target.value)} placeholder="Brief product tagline" style={inpStyle} />
        </div>
        <div style={{ marginTop:16 }}>
          <label style={LS}>Full Description *</label>
          <textarea rows={4} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Detailed product descriptionâ€¦"
            style={{ ...inpStyle, height:'auto', padding:'10px 12px', resize:'vertical' }} />
        </div>

        {/* â”€â”€ IMAGE UPLOAD â”€â”€ */}
        <div style={{ marginTop:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <label style={LS}>Product Images <span style={{ color:C.sub, textTransform:'none', fontWeight:500 }}>({totalImgs}/5)</span></label>
            <span style={{ fontSize:11, color:C.mute }}>JPEG Â· PNG Â· WebP Â· max 5 MB each</span>
          </div>

          {/* Existing + new previews */}
          {totalImgs > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:12 }}>
              {existingImgs.map((url, i) => (
                <div key={`ex-${i}`} style={{ position:'relative', width:90, height:90, borderRadius:8, overflow:'hidden', border:`1px solid ${C.line}` }}>
                  <img src={url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  <button onClick={() => removeExisting(i)} title="Remove"
                    style={{ position:'absolute', top:3, right:3, width:20, height:20, borderRadius:'50%',
                      background:'rgba(0,0,0,.75)', color:'white', border:'none', cursor:'pointer',
                      fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>
                    Ã—
                  </button>
                  {i === 0 && <span style={{ position:'absolute', bottom:0, left:0, right:0, background:'rgba(0,0,0,.6)', color:'white', fontSize:9, fontWeight:700, textAlign:'center', padding:'2px 0' }}>MAIN</span>}
                </div>
              ))}
              {newPreviews.map((src, i) => (
                <div key={`new-${i}`} style={{ position:'relative', width:90, height:90, borderRadius:8, overflow:'hidden', border:`2px solid ${C.accent}` }}>
                  <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  <button onClick={() => removeNew(i)} title="Remove"
                    style={{ position:'absolute', top:3, right:3, width:20, height:20, borderRadius:'50%',
                      background:'rgba(0,0,0,.75)', color:'white', border:'none', cursor:'pointer',
                      fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>
                    Ã—
                  </button>
                  <span style={{ position:'absolute', bottom:0, left:0, right:0, background:C.accent+'cc', color:'white', fontSize:9, fontWeight:700, textAlign:'center', padding:'2px 0' }}>NEW</span>
                </div>
              ))}
            </div>
          )}

          {/* Drop zone */}
          {totalImgs < 5 && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              style={{ border:`2px dashed ${dragOver ? C.accent : C.line}`, borderRadius:10, padding:'28px 20px',
                textAlign:'center', cursor:'pointer', background: dragOver ? C.accent+'0a' : C.card2,
                transition:'all .15s' }}>
              <div style={{ fontSize:30, marginBottom:8 }}>ðŸ–¼ï¸</div>
              <div style={{ fontWeight:700, fontSize:13, color:C.text, marginBottom:4 }}>
                Click to upload or drag &amp; drop
              </div>
              <div style={{ fontSize:12, color:C.mute }}>Up to {5-totalImgs} more image{5-totalImgs!==1?'s':''} Â· Max 5 MB each</div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                style={{ display:'none' }}
                onChange={e => { addFiles(e.target.files); e.target.value=''; }}
              />
            </div>
          )}
        </div>

        <div style={{ display:'flex', gap:24, marginTop:16, flexWrap:'wrap', alignItems:'center' }}>
          {[['isFeatured','Mark as Featured'],['isPublished','Publish immediately']].map(([k,l])=>(
            <label key={k} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontWeight:600, fontSize:13, color:C.sub }}>
              <input type="checkbox" checked={form[k]} onChange={e=>set(k,e.target.checked)} />
              {l}
            </label>
          ))}
        </div>

        {/* Return Policy */}
        <div style={{ marginTop:18, padding:'14px 16px', borderRadius:10, border:`1px solid ${C.line}`, background:C.card2 }}>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:10, color:C.text, display:'flex', alignItems:'center', gap:8 }}>
            <SvgAt el={Icon.refund} size={14} /> Return Policy
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontWeight:600, fontSize:13, color:C.sub }}>
              <input type="checkbox" checked={form.returnable} onChange={e=>set('returnable',e.target.checked)} />
              Allow Returns
            </label>
            {form.returnable && (
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:13, fontWeight:600, color:C.sub }}>Window:</span>
                {[7, 10].map(days => (
                  <button key={days} type="button" onClick={() => set('returnWindow', days)}
                    style={{ padding:'5px 16px', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer',
                      background: form.returnWindow === days ? C.accent : C.bg,
                      color:      form.returnWindow === days ? 'white'   : C.mute,
                      border: `1px solid ${form.returnWindow === days ? C.accent : C.line}` }}>
                    {days} days
                  </button>
                ))}
              </div>
            )}
            {!form.returnable && (
              <span style={{ fontSize:12, color:C.red, fontWeight:600, background:C.red+'14', padding:'4px 10px', borderRadius:6, border:`1px solid ${C.red}33` }}>
                Non-returnable
              </span>
            )}
          </div>
        </div>

        {/* Tax Settings */}
        <div style={{ marginTop:16, padding:'14px 16px', borderRadius:10, border:`1px solid ${C.line}`, background:C.card2 }}>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:10, color:C.text }}>Tax Settings</div>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap', alignItems:'flex-end' }}>
            <div style={{ flex:'1 1 160px' }}>
              <label style={LS}>Tax Type</label>
              <select value={form.taxLabel} onChange={e=>{ const v=e.target.value; setForm(f=>({...f,taxLabel:v,taxRate:v==='No Tax'?0:f.taxRate===0?18:f.taxRate})); }} style={{ ...inpStyle, cursor:'pointer' }}>
                {['GST','IGST','VAT','No Tax'].map(v=><option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div style={{ flex:'1 1 160px' }}>
              <label style={LS}>Tax Rate (%)</label>
              <select value={form.taxRate} onChange={e=>set('taxRate',Number(e.target.value))} style={{ ...inpStyle, cursor:'pointer' }} disabled={form.taxLabel==='No Tax'}>
                {[0,5,12,18,28].map(r=><option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
            <div style={{ fontSize:12, color:C.mute, alignSelf:'center', paddingBottom:2 }}>
              Invoice: <strong style={{color:C.text}}>{form.taxLabel==='No Tax'?'No Tax':`${form.taxLabel} (${form.taxRate}%)`}</strong>
            </div>
          </div>
        </div>

        {error && <div style={{ marginTop:14, color:C.red, fontSize:13, fontWeight:600, background:C.red+'14', padding:'10px 14px', borderRadius:8, border:`1px solid ${C.red}33` }}>{error}</div>}

        <div style={{ display:'flex', gap:10, marginTop:20 }}>
          <Btn variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Uploadingâ€¦' : initial ? 'Save Changes' : 'Add Product'}
          </Btn>
          {onCancel && <Btn onClick={onCancel}>Cancel</Btn>}
        </div>
      </Card>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   RETURNS TAB â€” employee
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const RETURN_STATUS_META = {
  REQUESTED:         { label:'Requested',        color: C.yellow },
  EMPLOYEE_APPROVED: { label:'You Approved',     color: C.green  },
  EMPLOYEE_REJECTED: { label:'You Rejected',     color: C.red    },
  APPROVED:          { label:'Admin Approved',   color: C.green  },
  REJECTED:          { label:'Admin Rejected',   color: C.red    },
  PICKUP_SCHEDULED:  { label:'Pickup Scheduled', color: C.purple },
  ITEM_RECEIVED:     { label:'Item Received',    color: C.cyan   },
  REFUND_INITIATED:  { label:'Refund Initiated', color: C.accent },
  REFUND_COMPLETED:  { label:'Refund Completed', color: C.green  },
  REPLACEMENT_SENT:  { label:'Replacement Sent', color: C.purple },
  COMPLETED:         { label:'Completed',        color: C.green  },
};

function ReturnBadge({ status }) {
  const m = RETURN_STATUS_META[status] || { label: status, color: C.mute };
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700,
      padding:'3px 9px', borderRadius:99, background: m.color+'22', color: m.color, border:`1px solid ${m.color}44` }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background: m.color }} />{m.label}
    </span>
  );
}

function EmployeeReturnsTab() {
  const { isMobile } = useResponsive();
  const [returns, setReturns]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('ALL');
  const [actionId, setActionId] = useState(null);
  const [note, setNote]         = useState('');
  const [saving, setSaving]     = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    returnsApi.getEmployeeReturns({ limit: 100 })
      .then(r => setReturns(r.data?.data?.data || r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const doAction = async (id, action) => {
    setSaving(true);
    try {
      await returnsApi.employeeAction(id, { action, note });
      setActionId(null); setNote('');
      load();
    } catch(e) { alert(e?.response?.data?.message || 'Action failed'); }
    finally { setSaving(false); }
  };

  const doAdvance = async (id) => {
    setSaving(true);
    try { await returnsApi.employeeAdvance(id, {}); load(); }
    catch(e) { alert(e?.response?.data?.message || 'Failed to update'); }
    finally { setSaving(false); }
  };

  const filtered = filter === 'ALL' ? returns : returns.filter(r => r.status === filter);
  const stats = {
    pending:   returns.filter(r => r.status === 'REQUESTED').length,
    approved:  returns.filter(r => ['APPROVED','PICKUP_SCHEDULED','ITEM_RECEIVED','REFUND_INITIATED'].includes(r.status)).length,
    completed: returns.filter(r => r.status === 'REFUND_COMPLETED').length,
    rejected:  returns.filter(r => r.status === 'EMPLOYEE_REJECTED').length,
    total:     returns.length,
  };

  const FILTERS = [
    { key:'ALL',               label:'All' },
    { key:'REQUESTED',         label:'Pending' },
    { key:'APPROVED',          label:'Admin OK' },
    { key:'PICKUP_SCHEDULED',  label:'Pickup' },
    { key:'ITEM_RECEIVED',     label:'Received' },
    { key:'REFUND_INITIATED',  label:'Refunding' },
    { key:'REFUND_COMPLETED',  label:'Done' },
    { key:'EMPLOYEE_REJECTED', label:'Rejected' },
  ];

  const ADVANCE_LABELS = {
    APPROVED:         { label:'Schedule Pickup',      next:'PICKUP_SCHEDULED', iconEl:Icon.truck },
    PICKUP_SCHEDULED: { label:'Mark Item Received',   next:'ITEM_RECEIVED',    iconEl:Icon.check },
    ITEM_RECEIVED:    { label:'Initiate Refund',       next:'REFUND_INITIATED', iconEl:Icon.dollar },
    REFUND_INITIATED: { label:'Mark Refund Completed', next:'REFUND_COMPLETED', iconEl:Icon.check },
  };

  const PIPELINE = ['PICKUP_SCHEDULED','ITEM_RECEIVED','REFUND_INITIATED','REFUND_COMPLETED'];
  const PIPELINE_LABELS = { PICKUP_SCHEDULED:'Pickup', ITEM_RECEIVED:'Received', REFUND_INITIATED:'Refund', REFUND_COMPLETED:'Done' };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(5,1fr)', gap:12 }}>
        <KpiCard label="Total Returns"  value={stats.total}     colorKey="blue"   iconEl={Icon.refund} />
        <KpiCard label="Pending Action" value={stats.pending}   colorKey="yellow" iconEl={Icon.warn} />
        <KpiCard label="In Progress"    value={stats.approved}  colorKey="green"  iconEl={Icon.truck} />
        <KpiCard label="Completed"      value={stats.completed} colorKey="purple" iconEl={Icon.check} />
        <KpiCard label="Rejected"       value={stats.rejected}  colorKey="red"    iconEl={Icon.x} />
      </div>

      <Card title="Return Requests">
        <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap' }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ padding:'5px 14px', borderRadius:99, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap',
                border: filter===f.key ? `1px solid ${C.accent}` : `1px solid ${C.line}`,
                background: filter===f.key ? C.accent : C.card2,
                color: filter===f.key ? 'white' : C.sub }}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? <Loader /> : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:40, color:C.mute }}>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:12, opacity:.4 }}><SvgAt el={Icon.box} size={40} /></div>
            <div style={{ fontWeight:700 }}>No return requests</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {filtered.map(req => {
              const isOpen     = actionId === req._id;
              const canAct     = req.status === 'REQUESTED';
              const canAdvance = ['APPROVED','PICKUP_SCHEDULED','ITEM_RECEIVED','REFUND_INITIATED'].includes(req.status);
              const adv        = ADVANCE_LABELS[req.status];
              const pipelineIdx = PIPELINE.indexOf(req.status);

              return (
                <div key={req._id} style={{ border:`1px solid ${C.line}`, borderRadius:12, overflow:'hidden' }}>
                  {/* Header */}
                  <div style={{ background:C.card2, padding:'12px 18px', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:13, color:C.text }}>Return #{req._id?.slice(-8).toUpperCase()}</div>
                      <div style={{ fontSize:11, color:C.mute, marginTop:2 }}>{req.user?.name} Â· {req.user?.email}</div>
                    </div>
                    <ReturnBadge status={req.status} />
                    <span style={{ fontSize:14, fontWeight:800, color:C.accent }}>{fmtRs(req.refundAmount || 0)}</span>
                    {canAct && (
                      <button onClick={() => setActionId(isOpen ? null : req._id)}
                        style={{ padding:'6px 14px', borderRadius:8, background:isOpen?C.card:C.accent, color:isOpen?C.sub:'white',
                          border:'none', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                        {isOpen ? 'Close' : 'Take Action'}
                      </button>
                    )}
                  </div>

                  {/* Item info */}
                  <div style={{ padding:'12px 18px', display:'flex', gap:12, alignItems:'center' }}>
                    {req.product?.images?.[0]
                      ? <img src={req.product.images[0]} alt="" style={{ width:52, height:52, objectFit:'contain', border:`1px solid ${C.line}`, borderRadius:6 }} />
                      : <div style={{ width:52, height:52, background:C.card2, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', color:C.mute }}><SvgAt el={Icon.box} size={24} /></div>
                    }
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:13, color:C.text }}>{req.product?.title || 'Product'}</div>
                      <div style={{ fontSize:12, color:C.mute, marginTop:2 }}>
                        Reason: <strong style={{color:C.sub}}>{req.reason?.replace(/_/g,' ')}</strong>
                        {' Â· '}Resolution: <strong style={{color:C.sub}}>{req.resolution || 'refund'}</strong>
                      </div>
                      {req.description && <div style={{ fontSize:12, color:C.mute, marginTop:2 }}>"{req.description}"</div>}
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0, fontSize:12, color:C.mute }}>
                      {req.order?.orderNumber || req.order?._id?.slice(-6)?.toUpperCase() || 'â€”'}
                    </div>
                  </div>

                  {/* Pipeline tracker */}
                  {pipelineIdx >= 0 && (
                    <div style={{ padding:'10px 18px', borderTop:`1px solid ${C.line}`, background:C.bg }}>
                      <div style={{ display:'flex', alignItems:'center' }}>
                        {PIPELINE.map((step, i) => {
                          const done   = i < pipelineIdx;
                          const active = i === pipelineIdx;
                          const col    = done ? C.green : active ? C.accent : C.line;
                          return (
                            <div key={step} style={{ display:'flex', alignItems:'center', flex: i < PIPELINE.length-1 ? 1 : 'none' }}>
                              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                                <div style={{ width:22, height:22, borderRadius:'50%', background: done?C.green:active?C.accent:C.card2, border:`2px solid ${col}`,
                                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color: done||active?'white':C.mute, fontWeight:800 }}>
                                  {done ? <SvgAt el={Icon.check} size={11} /> : i+1}
                                </div>
                                <div style={{ fontSize:9, fontWeight:700, color: active?C.accent:done?C.green:C.mute, whiteSpace:'nowrap' }}>
                                  {PIPELINE_LABELS[step]}
                                </div>
                              </div>
                              {i < PIPELINE.length-1 && (
                                <div style={{ flex:1, height:2, background: done?C.green:C.line, margin:'0 4px', marginBottom:14 }} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Approve/Reject panel */}
                  {isOpen && canAct && (
                    <div style={{ padding:'14px 18px', background:C.bg, borderTop:`1px solid ${C.line}` }}>
                      <div style={{ fontSize:13, fontWeight:700, marginBottom:10, color:C.text }}>Your response to customer:</div>
                      <textarea rows={2} value={note} onChange={e=>setNote(e.target.value)}
                        placeholder="Optional note to customerâ€¦"
                        style={{ width:'100%', border:`1px solid ${C.line}`, borderRadius:8, padding:'8px 12px', fontSize:13, resize:'none', outline:'none', fontFamily:'inherit', boxSizing:'border-box', marginBottom:10, background:C.card2, color:C.text }} />
                      <div style={{ display:'flex', gap:10 }}>
                        <button onClick={() => doAction(req._id, 'approve')} disabled={saving}
                          style={{ flex:1, padding:'9px', borderRadius:8, background:C.green, color:'white', border:'none', fontWeight:700, fontSize:13, cursor:'pointer', opacity:saving?0.6:1, fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                          <SvgAt el={Icon.check} size={14} /> Approve & Start Pickup
                        </button>
                        <button onClick={() => doAction(req._id, 'reject')} disabled={saving}
                          style={{ flex:1, padding:'9px', borderRadius:8, background:C.red, color:'white', border:'none', fontWeight:700, fontSize:13, cursor:'pointer', opacity:saving?0.6:1, fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                          <SvgAt el={Icon.x} size={14} /> Reject Return
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Advance button */}
                  {canAdvance && adv && (
                    <div style={{ padding:'12px 18px', borderTop:`1px solid ${C.line}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:C.bg }}>
                      <div style={{ fontSize:12, color:C.mute }}>
                        Next step: <strong style={{color:C.text}}>{adv.next.replace(/_/g,' ')}</strong>
                      </div>
                      <button onClick={() => doAdvance(req._id)} disabled={saving}
                        style={{ padding:'8px 20px', borderRadius:8, background:C.green, color:'white', border:'none',
                          fontWeight:700, fontSize:13, cursor:'pointer', opacity:saving?0.6:1, whiteSpace:'nowrap', fontFamily:'inherit', display:'flex', alignItems:'center', gap:7 }}>
                        <SvgAt el={adv.iconEl} size={14} />
                        {saving ? 'â€¦' : adv.label}
                      </button>
                    </div>
                  )}

                  {req.status === 'REFUND_COMPLETED' && (
                    <div style={{ padding:'10px 18px', background:C.green+'14', borderTop:`1px solid ${C.line}`, fontSize:12, color:C.green, fontWeight:700, display:'flex', alignItems:'center', gap:8 }}>
                      <SvgAt el={Icon.check} size={14} /> Refund completed â€” this return is closed
                    </div>
                  )}
                  {req.status === 'EMPLOYEE_REJECTED' && (
                    <div style={{ padding:'10px 18px', background:C.red+'14', borderTop:`1px solid ${C.line}`, fontSize:12, color:C.red }}>
                      Return rejected. Admin may review and override.
                    </div>
                  )}

                  {(req.employeeNote || req.adminNote) && (
                    <div style={{ padding:'10px 18px', background:C.card2, borderTop:`1px solid ${C.line}`, fontSize:12, color:C.mute }}>
                      {req.employeeNote && <div><strong style={{color:C.sub}}>Your note:</strong> {req.employeeNote}</div>}
                      {req.adminNote  && <div style={{ marginTop:4 }}><strong style={{color:C.sub}}>Admin note:</strong> {req.adminNote}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN EMPLOYEE DASHBOARD
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const NAV_TABS = [
  { id:'Overview',    iconEl: Icon.grid  },
  { id:'My Products', iconEl: Icon.bag   },
  { id:'Orders',      iconEl: Icon.orders },
  { id:'Returns',     iconEl: Icon.refund },
  { id:'Add Product', iconEl: Icon.plus  },
];

const TAB_SUBTITLES = {
  Overview:     'Your shop performance and key metrics',
  'My Products':'Manage your product listings',
  Orders:       'Track and fulfil orders containing your products',
  Returns:      'Review and respond to return requests from customers',
  'Add Product':'Create a new product listing',
};

export default function SellerDashboard() {
  const { isMobile } = useResponsive();
  const [tab, setTab]           = useState('Overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile]   = useState(null);
  const [categories, setCats]   = useState([]);
  const [editProduct, setEdit]  = useState(null);
  const [loading, setLoading]   = useState(true);
  const navigate                = useNavigate();
  const { user, logout }        = useAuth();

  const loadProfile = useCallback(() => {
    setLoading(true);
    employeeApi.getMyProfile()
      .then(r => setProfile(r.data?.data?.employee || null))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadProfile();
    categoriesApi.getAll().then(r => setCats(r.data?.data?.categories || [])).catch(()=>{});
  }, [loadProfile]);

  const handleTabClick = (id) => {
    setTab(id);
    setEdit(null);
    if (isMobile) setSidebarOpen(false);
  };

  const handleAddProduct = async (data) => {
    await employeeApi.createProduct(data);
    handleTabClick('My Products');
  };

  const handleEditSave = async (data) => {
    await employeeApi.updateProduct(editProduct._id, data);
    setEdit(null);
    handleTabClick('My Products');
  };

  const activeTab = editProduct ? 'My Products' : tab;
  const pageTitle = editProduct ? 'Edit Product' : tab;
  const pageSub   = editProduct ? `Editing: ${editProduct.title}` : TAB_SUBTITLES[tab];

  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', fontFamily:"'DM Sans', sans-serif" }}>

      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:99 }} />
      )}

      {/* â”€â”€ Sidebar â”€â”€ */}
      <div style={{
        position:'fixed', left:0, top:0, bottom:0, width:220,
        background:C.sidebar, display:'flex', flexDirection:'column',
        zIndex:100, borderRight:`1px solid ${C.line}`,
        transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
        transition:'transform .25s ease',
      }}>
        {/* Logo */}
        <div style={{ padding:'20px 18px 18px', borderBottom:`1px solid ${C.line}` }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:19, color:C.text, letterSpacing:'-.4px', lineHeight:1 }}>
            <span style={{ color:C.accent }}>Trade</span>Engine
          </div>
          <div style={{ fontSize:11, color:C.mute, marginTop:4, fontWeight:500, letterSpacing:'.02em' }}>Employee Panel</div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'8px 10px', overflowY:'auto' }}>
          {profile && NAV_TABS.map(t => {
            const active = activeTab === t.id && !editProduct || (editProduct && t.id === 'My Products');
            const isEdit = editProduct && t.id === 'My Products';
            return (
              <button key={t.id} onClick={() => handleTabClick(t.id)}
                style={{ width:'100%', textAlign:'left', padding:'9px 12px',
                  background: active ? C.active : 'transparent',
                  border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:10,
                  color: active ? C.text : C.sub,
                  fontWeight: active ? 600 : 400, fontSize:13.5, borderRadius:8,
                  transition:'all .12s', marginBottom:2, fontFamily:'inherit' }}>
                <span style={{ display:'flex', alignItems:'center', color: active ? C.accent : 'inherit', opacity: active ? 1 : 0.75, flexShrink:0 }}>
                  <SvgAt el={t.iconEl} size={17} />
                </span>
                <span style={{ flex:1 }}>{isEdit ? 'Edit Product' : t.id}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding:'12px 10px', borderTop:`1px solid ${C.line}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, marginBottom:6 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:C.accent, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif", fontWeight:800, color:'white', fontSize:14, flexShrink:0 }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600, color:C.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize:11, color:C.mute }}>{profile?.shopName || 'Employee'}</div>
            </div>
          </div>
          <button onClick={() => navigate('/')}
            style={{ width:'100%', padding:'8px 12px', background:'rgba(255,255,255,.04)', border:`1px solid ${C.line}`, borderRadius:8, color:C.sub, fontWeight:500, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:8, fontFamily:'inherit' }}>
            <span style={{ flex:1, textAlign:'left' }}>Back to Store</span>
            <span style={{ color:C.mute, display:'flex', alignItems:'center' }}><SvgAt el={Icon.extlink} size={14} /></span>
          </button>
        </div>
      </div>

      {/* â”€â”€ Main content â”€â”€ */}
      <div style={{ marginLeft: isMobile ? 0 : 220, flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>

        {/* Topbar */}
        <div style={{ position:'sticky', top:0, zIndex:90, background:C.sidebar, borderBottom:`1px solid ${C.line}`, padding: isMobile ? '0 14px' : '0 24px', height:58, display:'flex', alignItems:'center', gap: isMobile ? 10 : 14 }}>
          <div onClick={() => setSidebarOpen(s=>!s)}
            style={{ color:C.mute, cursor:'pointer', display:'flex', alignItems:'center' }}>
            <SvgAt el={Icon.menu} size={20} />
          </div>

          {isMobile ? (
            <div style={{ flex:1, fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, color:C.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {pageTitle}
            </div>
          ) : (
            <div style={{ flex:1, maxWidth:380, display:'flex', alignItems:'center', gap:8, background:C.bg, border:`1px solid ${C.line}`, borderRadius:8, padding:'0 12px', height:36 }}>
              <span style={{ color:C.mute, display:'flex' }}><SvgAt el={Icon.search} size={15} /></span>
              <input placeholder="Search orders, productsâ€¦" style={{ flex:1, border:'none', outline:'none', background:'transparent', fontSize:13, color:C.text, fontFamily:"'DM Sans',sans-serif" }} />
            </div>
          )}

          <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto', cursor:'pointer' }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:C.accent, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif", fontWeight:800, color:'white', fontSize:13, flexShrink:0 }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            {!isMobile && (
              <div style={{ lineHeight:1.25 }}>
                <div style={{ fontWeight:600, fontSize:13, color:C.text }}>{user?.name}</div>
                <div style={{ fontSize:11, color:C.mute }}>Employee</div>
              </div>
            )}
          </div>
          {/* Logout */}
          <button onClick={() => { logout(); navigate('/login'); }}
            style={{ display:'flex', alignItems:'center', gap:6, background:C.red+'18', border:`1px solid ${C.red}44`,
              borderRadius:8, padding:'6px 14px', color:C.red, fontSize:13, fontWeight:700, cursor:'pointer' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {!isMobile && 'Logout'}
          </button>
        </div>

        {/* Page content */}
        <div style={{ padding: isMobile ? '18px 14px' : '28px 30px', flex:1 }}>
          {!isMobile && (
            <div style={{ marginBottom:22 }}>
              <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:700, color:C.text, margin:0, lineHeight:1 }}>{pageTitle}</h1>
              <p style={{ color:C.mute, margin:'6px 0 0', fontSize:13 }}>{pageSub}</p>
            </div>
          )}

          {loading ? <Loader /> : !profile ? (
            /* Pending / not set up */
            <div style={{ maxWidth:480, margin:'0 auto', paddingTop:40 }}>
              <Card>
                <div style={{ textAlign:'center', padding:'20px 0 8px' }}>
                  <div style={{ width:64, height:64, borderRadius:'50%', background:C.yellow+'22', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', color:C.yellow }}>
                    <SvgAt el={Icon.shop} size={30} />
                  </div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:20, color:C.text, marginBottom:8 }}>
                    Account Not Set Up
                  </div>
                  <div style={{ color:C.mute, fontSize:13, lineHeight:1.6 }}>
                    Your employee account was created by admin but the shop profile isn't configured yet, or you are not registered as an employee. Contact your administrator.
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <>
              {tab==='Overview'    && !editProduct && <OverviewTab profile={profile} />}
              {tab==='My Products' && !editProduct && <ProductsTab onEdit={p=>setEdit(p)} />}
              {tab==='My Products' && editProduct  && <ProductForm initial={editProduct} categories={categories} onSave={handleEditSave} onCancel={()=>setEdit(null)} />}
              {tab==='Orders'      && !editProduct && <OrdersTab onViewReturns={() => handleTabClick('Returns')} />}
              {tab==='Returns'     && !editProduct && <EmployeeReturnsTab />}
              {tab==='Add Product' && !editProduct && <ProductForm categories={categories} onSave={handleAddProduct} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

