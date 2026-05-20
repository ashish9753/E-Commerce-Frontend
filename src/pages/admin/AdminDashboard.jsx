import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { adminApi } from '../../api/admin';
import { returnsApi } from '../../api/returns';
import { couponsApi } from '../../api/coupons';
import { notificationsApi } from '../../api/notifications';
import { supportApi } from '../../api/support';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, AreaChart, Area,
} from 'recharts';
import SupportIcon from '../../components/icons/SupportIcon';
import AdminCatalogTab from './AdminCatalogTab';
import { settingsApi } from '../../api/settings';
import { paymentsApi } from '../../api/payments';

/* ── Palette — matches HTML mockup exactly ── */
const C = {
  accent:  '#f97316',
  blue:    '#3b82f6',
  green:   '#22c55e',
  yellow:  '#eab308',
  purple:  '#8b5cf6',
  red:     '#ef4444',
  cyan:    '#06b6d4',
  pink:    '#ec4899',
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
/* legacy aliases so existing code keeps working */
const surf = C.bg;

const STATUS_COLORS = {
  PLACED: C.yellow, CONFIRMED: C.blue, PACKED: C.purple,
  SHIPPED: C.cyan, OUT_FOR_DELIVERY: C.accent, DELIVERED: C.green,
  CANCELLED: C.red, RETURNED: C.mute,
};

const ROLE_COLORS = { admin: C.purple, employee: C.yellow, user: C.blue };

/* ── Responsive hook ── */
function useResponsive() {
  const [w, setW] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1280));
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return { w, isMobile: w < 768, isTablet: w >= 768 && w < 1100, isDesktop: w >= 1100 };
}

/* ── shared helpers ── */
const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtRs = (n) => `Rs. ${Math.round(Number(n || 0)).toLocaleString('en-IN')}`;
const fmtShort = (n) => {
  const v = Math.round(Number(n || 0));
  if (v >= 10000000) return `Rs. ${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000)   return `Rs. ${(v / 100000).toFixed(1)}L`;
  if (v >= 10000)    return `Rs. ${(v / 1000).toFixed(1)}K`;
  return fmtRs(v);
};

/* ── SVG icon helpers (match HTML mockup) ── */
const Icon = {
  users:  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:20,height:20}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  shield: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:20,height:20}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  bag:    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:20,height:20}}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  person: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:20,height:20}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  dollar: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:20,height:20}}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  refund: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:20,height:20}}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>,
  truck:  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:20,height:20}}><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  orders: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:20,height:20}}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  bell:   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:20,height:20}}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  gear:   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:18,height:18}}><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.42 1.42M4.93 4.93l1.42 1.42M19.07 19.07l-1.42-1.42M4.93 19.07l1.42-1.42M20 12h2M2 12h2M12 20v2M12 2v2"/></svg>,
  tag:    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:18,height:18}}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  book:   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:18,height:18}}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  list:   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:18,height:18}}><path d="M4 6h16M4 12h16M4 18h7"/></svg>,
  coupon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:18,height:18}}><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  support:<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:18,height:18}}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  grid:   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:18,height:18}}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  extlink:<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  lock:   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  trash:  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:13,height:13}}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  dots:   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>,
  search: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:15,height:15}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  menu:   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:20,height:20}}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  chevD:  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><path d="M6 9l6 6 6-6"/></svg>,
};

/* Renders any Icon SVG at a fixed size */
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

function Badge({ text, color }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 12, fontWeight: 600, padding: '3px 11px', borderRadius: 20,
      background: color + '22', color, border: `1px solid ${color}44`,
    }}>{text}</span>
  );
}

const ICON_COLOR_MAP = { blue: C.blue, purple: C.purple, yellow: C.yellow, green: C.green, orange: C.accent, red: C.red };
const ICON_BG_MAP   = { blue: 'rgba(59,130,246,.15)', purple: 'rgba(139,92,246,.15)', yellow: 'rgba(234,179,8,.15)', green: 'rgba(34,197,94,.15)', orange: 'rgba(249,115,22,.15)', red: 'rgba(239,68,68,.15)' };

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
        {iconEl}
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
  return <td style={{ padding: '14px 14px', fontSize: 13.5, borderBottom: `1px solid ${C.line}`, color: C.text, verticalAlign: 'middle', ...style }}>{children}</td>;
}
function Input({ value, onChange, placeholder, style }) {
  return <input value={value} onChange={onChange} placeholder={placeholder}
    style={{ height: 36, border: `1px solid ${C.line}`, borderRadius: 8, padding: '0 12px', fontSize: 13, outline: 'none', background: C.bg, color: C.text, fontFamily: 'inherit', ...style }} />;
}
function Select({ value, onChange, children, style }) {
  return <select value={value} onChange={onChange}
    style={{ height: 36, border: `1px solid ${C.line}`, borderRadius: 8, padding: '0 10px', fontSize: 13, background: C.bg, color: C.text, cursor: 'pointer', fontFamily: 'inherit', ...style }}>{children}</select>;
}
function Btn({ children, onClick, disabled, variant = 'ghost', style }) {
  const base = { fontSize: 13, fontWeight: 500, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', border: 'none', transition: 'all .15s', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, ...style };
  const variants = {
    ghost:   { background: 'rgba(255,255,255,.06)', color: C.sub, border: `1px solid ${C.line}` },
    danger:  { background: 'rgba(239,68,68,.12)',   color: '#f87171', border: '1px solid rgba(239,68,68,.25)' },
    success: { background: 'rgba(34,197,94,.12)',   color: C.green,   border: '1px solid rgba(34,197,94,.25)' },
    warn:    { background: 'rgba(234,179,8,.12)',   color: C.yellow,  border: '1px solid rgba(234,179,8,.25)' },
    primary: { background: '#ea580c', color: 'white' },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], opacity: disabled ? .5 : 1 }}>{children}</button>;
}

/* ══════════════════════════════════════════════════════
   OVERVIEW TAB
══════════════════════════════════════════════════════ */
const NOTIF_ICONS = { ORDER: '🛒', SYSTEM: '⚠️', PROMO: '🎉', SUPPORT: '💬' };

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h>1?'s':''} ago`;
  return `${Math.floor(h/24)} day${Math.floor(h/24)>1?'s':''} ago`;
}

function OverviewTab() {
  const { isMobile, isTablet } = useResponsive();
  const [stats, setStats]       = useState(null);
  const [allOrders, setAllOrders] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [notifs, setNotifs]     = useState([]);
  const [userCount, setUC]      = useState(0);
  const [loading, setLoading]   = useState(true);
  const [chartPeriod, setChartPeriod] = useState('1Y');

  useEffect(() => {
    Promise.all([
      adminApi.getOrderStats(),
      adminApi.getOrders({ limit: 1000 }),
      notificationsApi.getMy({ limit: 6 }),
      adminApi.getUsers({ limit: 1 }),
    ]).then(([s, o, n, u]) => {
      setStats(s.data?.data || {});
      const allO = o.data?.data?.data || [];
      setAllOrders(allO);
      setRecentOrders(allO.slice(0, 5));
      setNotifs(n.data?.data?.data || []);
      setUC(u.data?.data?.pagination?.total || u.data?.data?.total || 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const breakdown    = stats?.statusBreakdown || [];
  const delivered    = breakdown.find(b => b._id === 'DELIVERED')?.count || 0;
  const inProgress   = breakdown.filter(b => ['PLACED','CONFIRMED','PACKED','SHIPPED','OUT_FOR_DELIVERY'].includes(b._id)).reduce((a,b) => a+b.count, 0);
  const returned     = breakdown.find(b => b._id === 'RETURNED')?.count || 0;
  const total        = stats?.totalOrders || 0;
  const netRevenue   = stats?.netRevenue   || 0;
  const refundedAmt  = stats?.refundedAmount || 0;

  const donutData = breakdown.map(b => ({ name: b._id, value: b.count }));
  const totalDonut = donutData.reduce((a, b) => a + b.value, 0);

  // Sales chart — build buckets for selected period
  const buildSalesChart = (period) => {
    const now   = new Date();
    const msDay = 86400000;
    const periodDays = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 }[period] || 365;
    const cutoff = new Date(now - periodDays * msDay);

    const inRange = allOrders.filter(o => new Date(o.createdAt) >= cutoff);

    if (period === '1W' || period === '1M') {
      // Daily buckets
      const map = {};
      for (let i = periodDays - 1; i >= 0; i--) {
        const d = new Date(now - i * msDay);
        const key = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        map[key] = 0;
      }
      inRange.forEach(o => {
        const d = new Date(o.createdAt);
        const key = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        if (key in map) map[key] += o.totalPrice || 0;
      });
      return Object.entries(map).map(([day, sales]) => ({ day, sales }));
    } else if (period === '3M' || period === '6M') {
      // Weekly buckets
      const weeks = Math.ceil(periodDays / 7);
      const map = {};
      for (let i = weeks - 1; i >= 0; i--) {
        const d = new Date(now - i * 7 * msDay);
        const key = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        map[key] = 0;
      }
      inRange.forEach(o => {
        const d   = new Date(o.createdAt);
        const diffDays = Math.floor((now - d) / msDay);
        const weekIdx  = weeks - 1 - Math.floor(diffDays / 7);
        if (weekIdx >= 0) {
          const wkDate = new Date(now - (weeks - 1 - weekIdx) * 7 * msDay);
          const key = wkDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          if (key in map) map[key] += o.totalPrice || 0;
        }
      });
      return Object.entries(map).map(([day, sales]) => ({ day, sales }));
    } else {
      // Monthly buckets for 1Y
      const map = {};
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
        map[key] = 0;
      }
      inRange.forEach(o => {
        const d   = new Date(o.createdAt);
        const key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
        if (key in map) map[key] += o.totalPrice || 0;
      });
      return Object.entries(map).map(([day, sales]) => ({ day, sales }));
    }
  };

  const salesChart  = buildSalesChart(chartPeriod);
  const chartTotal  = salesChart.reduce((a, b) => a + b.sales, 0);
  const totalSales  = netRevenue;
  const PERIODS     = ['1W','1M','3M','6M','1Y'];

  // Top payment/status breakdown for right panel
  const payBreakdown = (stats?.paymentBreakdown || []).map(b => ({
    label: b._id, count: b.count,
    color: b._id === 'ONLINE' ? C.blue : C.yellow,
  }));
  const topStatuses = breakdown.slice(0, 5).map(b => ({
    label: b._id, count: b.count,
    color: STATUS_COLORS[b._id] || C.mute,
    pct: totalDonut > 0 ? Math.round((b.count / totalDonut) * 100) : 0,
  })).sort((a,b) => b.count - a.count);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── KPI row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : isTablet ? 'repeat(3,1fr)' : 'repeat(5,1fr)', gap: 12 }}>
        <KpiCard label="Total Orders"  value={fmt(total)}         sub={`${delivered} delivered`}      colorKey="blue"   iconEl={Icon.orders} />
        <KpiCard label="Net Revenue"   value={fmtShort(netRevenue)}  sub="Paid minus refunded"           colorKey="green"  iconEl={Icon.dollar} />
        <KpiCard label="Refunded"      value={fmtShort(refundedAmt)} sub={`${returned} returned`}        colorKey="red"    iconEl={Icon.refund} />
        <KpiCard label="In Progress"   value={fmt(inProgress)}    sub="Active orders"                 colorKey="yellow" iconEl={Icon.truck} />
        <KpiCard label="Active Users"  value={fmt(userCount)}     sub="Registered accounts"           colorKey="purple" iconEl={Icon.users} />
      </div>

      {/* ── Row 2: Donut | Sales Chart | Top Categories ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 1.6fr 1fr', gap: 16 }}>

        {/* Order Status Donut */}
        <Card title="Order Status">
          {donutData.length === 0
            ? <Empty text="No order data yet" />
            : <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                      paddingAngle={3} dataKey="value" startAngle={90} endAngle={450}>
                      {donutData.map(d => <Cell key={d.name} fill={STATUS_COLORS[d.name] || C.mute} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, color: C.text, fontSize: 12 }}
                      formatter={(v, n) => [v, n]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Custom legend */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  {donutData.map(d => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[d.name] || C.mute, flexShrink: 0 }} />
                        <span style={{ color: C.mute }}>{d.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: C.text }}>{d.value}</span>
                        <span style={{ color: C.mute }}>({totalDonut > 0 ? Math.round(d.value/totalDonut*100) : 0}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
          }
        </Card>

        {/* Sales Overview */}
        <Card
          title="Sales Overview"
          action={
            <div style={{ display: 'flex', gap: 4 }}>
              {PERIODS.map(p => (
                <button key={p} onClick={() => setChartPeriod(p)}
                  style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 6, border: `1px solid ${chartPeriod === p ? C.accent : C.line}`, background: chartPeriod === p ? C.accent : 'transparent', color: chartPeriod === p ? 'white' : C.mute, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {p}
                </button>
              ))}
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={salesChart} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.blue} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: C.mute }} axisLine={false} tickLine={false}
                interval={chartPeriod === '1Y' ? 0 : chartPeriod === '6M' ? 1 : chartPeriod === '3M' ? 1 : 'preserveStartEnd'} />
              <YAxis tick={{ fontSize: 10, fill: C.mute }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 100000 ? `${(v/100000).toFixed(0)}L` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v > 0 ? v : '0'} />
              <Tooltip
                contentStyle={{ background: C.card2, border: `1px solid ${C.line}`, borderRadius: 8, color: C.text, fontSize: 12 }}
                formatter={(v) => [fmtRs(v), 'Revenue']}
                labelStyle={{ color: C.sub, marginBottom: 4 }}
              />
              <Area type="monotone" dataKey="sales" stroke={C.blue} strokeWidth={2.5} fill="url(#salesGrad)"
                dot={chartPeriod === '1Y' ? false : { fill: C.blue, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: C.blue, stroke: C.card, strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: 12, color: C.mute }}>Period Revenue</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{fmtRs(chartTotal)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: C.mute }}>All-time Net</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.green }}>{fmtShort(totalSales)}</div>
            </div>
          </div>
        </Card>

        {/* Top Statuses / Payment breakdown */}
        <Card title="Orders by Status" action={<span style={{ fontSize: 11, color: C.mute }}>All time</span>}>
          {topStatuses.length === 0
            ? <Empty text="No data" />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {topStatuses.map(s => (
                  <div key={s.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                      <span style={{ color: C.text, fontWeight: 600 }}>{s.label}</span>
                      <span style={{ color: C.mute, fontSize: 12 }}>{fmtRs(0)}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: C.line }}>
                      <div style={{ height: '100%', borderRadius: 99, background: s.color, width: `${s.pct}%`, minWidth: s.pct > 0 ? 6 : 0, transition: 'width .4s' }} />
                    </div>
                    <div style={{ fontSize: 11, color: C.mute, marginTop: 3 }}>{s.count} orders · {s.pct}%</div>
                  </div>
                ))}
              </div>
          }
        </Card>
      </div>

      {/* ── Row 3: Recent Orders | Latest Notifications ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr', gap: 16 }}>

        {/* Recent Orders */}
        <Card title="Recent Orders" action={
          <span onClick={() => { const ev = new CustomEvent('overview-nav', { detail: 'Orders' }); window.dispatchEvent(ev); }}
            style={{ fontSize: 12, color: C.accent, cursor: 'pointer', fontWeight: 600 }}>View all orders →</span>
        }>
          {recentOrders.length === 0
            ? <Empty text="No orders yet" />
            : <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <Th>Order #</Th><Th>Customer</Th><Th>Amount</Th><Th>Status</Th><Th>Date</Th><Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(o => (
                    <tr key={o._id}>
                      <Td><span style={{ fontWeight: 700, color: C.accent, fontFamily:'monospace', fontSize:12 }}>{o.orderNumber}</span></Td>
                      <Td>
                        <div style={{ fontWeight: 600, color: C.text }}>{o.user?.name || '—'}</div>
                        <div style={{ fontSize: 11, color: C.mute }}>{o.user?.email}</div>
                      </Td>
                      <Td><span style={{ fontWeight: 700, color: C.text }}>{fmtRs(o.totalPrice)}</span></Td>
                      <Td><Badge text={o.orderStatus} color={STATUS_COLORS[o.orderStatus] || C.mute} /></Td>
                      <Td style={{ color: C.mute, fontSize: 12 }}>{new Date(o.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</Td>
                      <Td>
                        <button
                          onClick={() => { const ev = new CustomEvent('overview-nav', { detail: 'Orders' }); window.dispatchEvent(ev); }}
                          title="View in Orders tab"
                          style={{ width: 30, height: 30, borderRadius: 8, background: C.bg, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.sub }}>
                          <SvgAt el={Icon.list} size={14} />
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </Card>

        {/* Latest Notifications */}
        <Card title="Latest Notifications" action={
          <span onClick={() => { const ev = new CustomEvent('overview-nav', { detail: 'Notifications' }); window.dispatchEvent(ev); }}
            style={{ fontSize: 12, color: C.accent, cursor: 'pointer', fontWeight: 600 }}>View all →</span>
        }>
          {notifs.length === 0
            ? <Empty text="No notifications yet" />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {notifs.map((n, i) => (
                  <div key={n._id || i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 0',
                    borderBottom: i < notifs.length - 1 ? `1px solid ${C.line}` : 'none',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: C.bg, border: `1px solid ${C.line}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                    }}>
                      {NOTIF_ICONS[n.type] || '🔔'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: C.mute, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.message}</div>
                    </div>
                    <div style={{ fontSize: 11, color: C.mute, flexShrink: 0 }}>{timeAgo(n.createdAt)}</div>
                  </div>
                ))}
              </div>
          }
        </Card>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   USERS TAB
══════════════════════════════════════════════════════ */
function UsersTab() {
  const [all, setAll]         = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState(null);
  const [search, setSearch]   = useState('');
  const [roleFilter, setRole] = useState('');
  const [statusFilter, setSt] = useState('');

  useEffect(() => {
    adminApi.getUsers({ limit: 200 })
      .then(r => setAll(r.data?.data?.data || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const users = all.filter(u => {
    const q = search.toLowerCase();
    const matchQ = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q);
    const matchR = !roleFilter || u.role === roleFilter;
    const matchS = !statusFilter || (statusFilter === 'blocked' ? u.isBlocked : !u.isBlocked);
    return matchQ && matchR && matchS;
  });

  const roleCounts = { admin: 0, employee: 0, user: 0 };
  all.forEach(u => { if (roleCounts[u.role] !== undefined) roleCounts[u.role]++; });

  const handleBlock = async (id, isBlocked) => {
    setBusy(id);
    await adminApi.blockUser(id).catch(() => {});
    setAll(prev => prev.map(x => x._id === id ? { ...x, isBlocked: !isBlocked } : x));
    setBusy(null);
  };
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setBusy(id);
    await adminApi.deleteUser(id).catch(() => {});
    setAll(prev => prev.filter(x => x._id !== id));
    setBusy(null);
  };

  if (loading) return <Loader />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Mini KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        <KpiCard label="Total Users"   value={fmt(all.length)}           sub="All accounts"        colorKey="blue"   iconEl={Icon.users} />
        <KpiCard label="Admins"        value={fmt(roleCounts.admin)}     sub="Admin accounts"      colorKey="purple" iconEl={Icon.shield} />
        <KpiCard label="Employees"     value={fmt(roleCounts.employee)}  sub="Employee accounts"   colorKey="yellow" iconEl={Icon.bag} />
        <KpiCard label="Customers"     value={fmt(roleCounts.user)}      sub="Regular users"       colorKey="green"  iconEl={Icon.person} />
      </div>

      {/* Role donut */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        <Card title="Role Breakdown">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={Object.entries(roleCounts).map(([k,v]) => ({ name: k, value: v }))}
                cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                {Object.keys(roleCounts).map(k => <Cell key={k} fill={ROLE_COLORS[k]} />)}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Filters */}
        <Card title="Filter & Search">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 0 }}>
            <Input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, phone…"
              style={{ flex: 1, minWidth: 220 }}
            />
            <Select value={roleFilter} onChange={e => setRole(e.target.value)}>
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </Select>
            <Select value={statusFilter} onChange={e => setSt(e.target.value)}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </Select>
            {(search || roleFilter || statusFilter) && (
              <Btn onClick={() => { setSearch(''); setRole(''); setSt(''); }}>Clear</Btn>
            )}
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: C.mute }}>
            Showing <strong>{users.length}</strong> of <strong>{all.length}</strong> users
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card title={`Users (${users.length})`}>
        {users.length === 0
          ? <Empty text="No users match your filters" />
          : <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <Th>User</Th><Th>Phone</Th><Th>Role</Th><Th>Joined</Th><Th>Last Login</Th><Th>Status</Th><Th>Actions</Th>
                </tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} style={{ opacity: u.isBlocked ? .6 : 1 }}>
                      <Td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: (ROLE_COLORS[u.role] || C.blue) + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: ROLE_COLORS[u.role] || C.blue, fontSize: 13 }}>
                            {u.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700 }}>{u.name}</div>
                            <div style={{ fontSize: 11, color: C.mute }}>{u.email}</div>
                          </div>
                        </div>
                      </Td>
                      <Td style={{ color: C.mute }}>{u.phone}</Td>
                      <Td><Badge text={u.role} color={ROLE_COLORS[u.role] || C.mute} /></Td>
                      <Td style={{ color: C.mute, fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString()}</Td>
                      <Td style={{ color: C.mute, fontSize: 12 }}>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : '—'}</Td>
                      <Td><Badge text={u.isBlocked ? 'Blocked' : 'Active'} color={u.isBlocked ? C.red : C.green} /></Td>
                      <Td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Btn variant={u.isBlocked ? 'success' : 'warn'} disabled={busy === u._id} onClick={() => handleBlock(u._id, u.isBlocked)}>
                            {u.isBlocked ? 'Unblock' : 'Block'}
                          </Btn>
                          <Btn variant="danger" disabled={busy === u._id} onClick={() => handleDelete(u._id, u.name)}>
                            Delete
                          </Btn>
                        </div>
                      </Td>
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

/* ══════════════════════════════════════════════════════
   SELLERS TAB
══════════════════════════════════════════════════════ */
const EMPTY_EMP_FORM = { name:'', email:'', phone:'', password:'', shopName:'', businessAddress:'', gstNumber:'', shopDescription:'' };

function EmployeesTab() {
  const [all, setAll]         = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState(null);
  const [search, setSearch]   = useState('');
  const [verFilter, setVer]   = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState(EMPTY_EMP_FORM);
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState('');

  useEffect(() => {
    adminApi.getEmployees({ limit: 200 })
      .then(r => setAll(r.data?.data?.data || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const employees = all.filter(s => {
    const q = search.toLowerCase();
    const matchQ = !q || s.shopName?.toLowerCase().includes(q) || s.user?.name?.toLowerCase().includes(q) || s.user?.email?.toLowerCase().includes(q);
    const matchV = !verFilter || (verFilter === 'verified' ? s.isVerified : !s.isVerified);
    return matchQ && matchV;
  });

  const verified = all.filter(s => s.isVerified).length;

  const handleVerify = async (id, isVerified) => {
    setBusy(id);
    await adminApi.verifyEmployee(id).catch(() => {});
    setAll(prev => prev.map(x => x._id === id ? { ...x, isVerified: !isVerified } : x));
    setBusy(null);
  };

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.phone || !form.password || !form.shopName) {
      setCreateErr('Name, email, phone, password and shop name are required.'); return;
    }
    setCreating(true); setCreateErr('');
    try {
      const res = await adminApi.createEmployee(form);
      const emp = res.data?.data?.employee;
      if (emp) setAll(prev => [emp, ...prev]);
      setShowAdd(false); setForm(EMPTY_EMP_FORM);
    } catch (e) {
      setCreateErr(e?.response?.data?.message || 'Failed to create employee.');
    } finally { setCreating(false); }
  };

  if (loading) return <Loader />;

  const donutData = [
    { name: 'Verified', value: verified },
    { name: 'Pending', value: all.length - verified },
  ];

  const F = (k) => ({ value: form[k], onChange: e => { setForm(p => ({...p, [k]: e.target.value})); setCreateErr(''); } });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Add Employee Modal ── */}
      {showAdd && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background: C.card, borderRadius:16, padding:28, width:'100%', maxWidth:500, boxShadow:'0 24px 64px rgba(0,0,0,.35)', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18, color:C.text }}>Add Employee</div>
              <button onClick={() => { setShowAdd(false); setForm(EMPTY_EMP_FORM); setCreateErr(''); }}
                style={{ background:'none', border:'none', color:C.mute, fontSize:20, cursor:'pointer', lineHeight:1 }}>✕</button>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { label:'Full Name *', key:'name', placeholder:'Employee full name' },
                { label:'Email *', key:'email', placeholder:'employee@example.com', type:'email' },
                { label:'Phone *', key:'phone', placeholder:'10-digit mobile number' },
                { label:'Password *', key:'password', placeholder:'Set a password', type:'password' },
                { label:'Shop Name *', key:'shopName', placeholder:'Shop / Business name' },
                { label:'Business Address', key:'businessAddress', placeholder:'Address (optional)' },
                { label:'GST Number', key:'gstNumber', placeholder:'GST (optional)' },
              ].map(({ label, key, placeholder, type='text' }) => (
                <div key={key}>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:C.mute, marginBottom:5, textTransform:'uppercase', letterSpacing:'.05em' }}>{label}</label>
                  <input type={type} placeholder={placeholder} {...F(key)}
                    style={{ width:'100%', height:38, border:`1px solid ${C.line}`, borderRadius:8, padding:'0 12px', fontSize:13, outline:'none', background:C.bg, color:C.text, fontFamily:'inherit', boxSizing:'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:C.mute, marginBottom:5, textTransform:'uppercase', letterSpacing:'.05em' }}>Shop Description</label>
                <textarea placeholder="Brief description (optional)" {...F('shopDescription')} rows={2}
                  style={{ width:'100%', border:`1px solid ${C.line}`, borderRadius:8, padding:'8px 12px', fontSize:13, outline:'none', background:C.bg, color:C.text, fontFamily:'inherit', boxSizing:'border-box', resize:'vertical' }} />
              </div>
            </div>

            {createErr && (
              <div style={{ marginTop:12, padding:'10px 14px', borderRadius:8, background: C.red+'18', border:`1px solid ${C.red}44`, color: '#f87171', fontSize:13 }}>{createErr}</div>
            )}

            <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
              <button onClick={() => { setShowAdd(false); setForm(EMPTY_EMP_FORM); setCreateErr(''); }}
                style={{ padding:'9px 18px', borderRadius:8, border:`1px solid ${C.line}`, background:C.card2, color:C.sub, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                Cancel
              </button>
              <button onClick={handleCreate} disabled={creating}
                style={{ padding:'9px 20px', borderRadius:8, border:'none', background:C.accent, color:'white', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', opacity: creating ? .6 : 1 }}>
                {creating ? 'Creating…' : 'Create Employee'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        <KpiCard label="Total Employees" value={fmt(all.length)}          sub="Registered employees" colorKey="yellow" iconEl={Icon.bag} />
        <KpiCard label="Verified"        value={fmt(verified)}            sub="Approved employees"   colorKey="green"  iconEl={Icon.shield} />
        <KpiCard label="Pending"         value={fmt(all.length-verified)} sub="Awaiting approval"    colorKey="red"    iconEl={Icon.bell} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
        <Card title="Verification">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                dataKey="value" paddingAngle={3}>
                <Cell fill={C.green} />
                <Cell fill={C.yellow} />
              </Pie>
              <Tooltip />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Filter">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search shop name, owner, email…" style={{ flex: 1, minWidth: 220 }} />
            <Select value={verFilter} onChange={e => setVer(e.target.value)}>
              <option value="">All</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
            </Select>
            {(search || verFilter) && <Btn onClick={() => { setSearch(''); setVer(''); }}>Clear</Btn>}
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: C.mute }}>
            Showing <strong>{employees.length}</strong> of <strong>{all.length}</strong> employees
          </div>
        </Card>
      </div>

      <Card title={`Employees (${employees.length})`}
        action={
          <button onClick={() => setShowAdd(true)}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:8, border:'none', background:C.accent, color:'white', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            <span style={{ fontSize:17, lineHeight:1 }}>+</span> Add Employee
          </button>
        }>
        {employees.length === 0
          ? <Empty text="No employees match your filters" />
          : <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <Th>Shop</Th><Th>Owner</Th><Th>Contact</Th><Th>Rating</Th><Th>Total Sales</Th><Th>Registered</Th><Th>Status</Th><Th>Action</Th>
                </tr></thead>
                <tbody>
                  {employees.map(s => (
                    <tr key={s._id}>
                      <Td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 10, background: C.yellow + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, overflow: 'hidden' }}>
                            {s.shopLogo ? <img src={s.shopLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏪'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700 }}>{s.shopName}</div>
                            <div style={{ fontSize: 11, color: C.mute }}>{s.businessAddress || '—'}</div>
                          </div>
                        </div>
                      </Td>
                      <Td><span style={{ fontWeight: 600 }}>{s.user?.name || '—'}</span></Td>
                      <Td style={{ color: C.mute, fontSize: 12 }}>{s.user?.email}<br />{s.user?.phone}</Td>
                      <Td>
                        <span style={{ fontWeight: 700, color: C.yellow }}>★ {(s.rating || 0).toFixed(1)}</span>
                      </Td>
                      <Td><span style={{ fontWeight: 700 }}>{fmtRs(s.totalSales)}</span></Td>
                      <Td style={{ color: C.mute, fontSize: 12 }}>{new Date(s.createdAt).toLocaleDateString()}</Td>
                      <Td>
                        <Badge text={s.isVerified ? 'Verified' : 'Pending'}
                          color={s.isVerified ? C.green : C.yellow} />
                      </Td>
                      <Td>
                        <Btn variant={s.isVerified ? 'danger' : 'success'} disabled={busy === s._id}
                          onClick={() => handleVerify(s._id, s.isVerified)}>
                          {s.isVerified ? 'Revoke' : 'Verify'}
                        </Btn>
                      </Td>
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

/* ══════════════════════════════════════════════════════
   ORDERS TAB
══════════════════════════════════════════════════════ */
const ORDER_STATUSES = ['PLACED','CONFIRMED','PACKED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED','RETURNED'];

function OrdersTab() {
  const [all, setAll]         = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpd]    = useState(null);
  const [search, setSearch]   = useState('');
  const [statusF, setStatusF] = useState('');
  const [paymentF, setPayF]   = useState('');
  const [refundModal, setRefundModal] = useState(null); // order object
  const [refundForm, setRefundForm]   = useState({ reason: '', adminNote: '', refundAmount: '' });
  const [refunding, setRefunding]     = useState(false);

  useEffect(() => {
    adminApi.getOrders({ limit: 200 })
      .then(r => setAll(r.data?.data?.data || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const orders = all.filter(o => {
    const q = search.toLowerCase();
    const matchQ = !q || o.orderNumber?.toLowerCase().includes(q) || o.user?.name?.toLowerCase().includes(q) || o.user?.email?.toLowerCase().includes(q);
    const matchS = !statusF || o.orderStatus === statusF;
    const matchP = !paymentF || o.paymentStatus === paymentF;
    return matchQ && matchS && matchP;
  });

  const handleStatusChange = async (orderId, status) => {
    setUpd(orderId);
    await adminApi.updateOrderStatus(orderId, { status }).catch(() => {});
    setAll(prev => prev.map(x => x._id === orderId ? { ...x, orderStatus: status } : x));
    setUpd(null);
  };

  const openRefund = (o) => {
    const nonRefundable = (o.codBookingStatus === 'PAID' && o.codBookingAmount > 0) ? o.codBookingAmount : 0;
    setRefundForm({ reason: 'Admin initiated refund', adminNote: '', refundAmount: o.totalPrice - nonRefundable });
    setRefundModal(o);
  };

  const submitForceRefund = async () => {
    if (!refundForm.reason) return;
    setRefunding(true);
    try {
      const refundAmount = Number(refundForm.refundAmount) || refundModal.totalPrice;

      // For Razorpay-paid orders, attempt gateway refund — warn on failure but don't block
      if (refundModal.paymentMethod === 'ONLINE' && refundModal.paymentStatus === 'PAID') {
        try {
          await paymentsApi.initiateRefund(refundModal._id, {
            refundAmount,
            reason: refundForm.reason,
          });
        } catch (rzpErr) {
          const msg = rzpErr?.response?.data?.message || 'Razorpay refund could not be initiated';
          // eslint-disable-next-line no-console
          console.warn('Razorpay refund skipped:', msg);
          // Inform admin but continue — manual refund may still be needed
          if (!window.confirm(`Razorpay refund failed: "${msg}"\n\nContinue marking the order as RETURNED anyway?`)) {
            setRefunding(false);
            return;
          }
        }
      }

      await adminApi.forceRefund(refundModal._id, {
        reason: refundForm.reason,
        adminNote: refundForm.adminNote,
        refundAmount,
      });
      setAll(prev => prev.map(x => x._id === refundModal._id ? { ...x, orderStatus: 'RETURNED', paymentStatus: 'REFUNDED' } : x));
      setRefundModal(null);
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to initiate refund');
    } finally { setRefunding(false); }
  };

  if (loading) return <Loader />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Force Refund Modal */}
      {refundModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background: C.card, borderRadius:14, padding:28, width:440, boxShadow:'0 20px 60px rgba(0,0,0,.25)' }}>
            <div style={{ fontWeight:800, fontSize:17, marginBottom:4 }}>↩ Force Refund</div>
            <div style={{ fontSize:12, color:C.mute, marginBottom:20 }}>
              Order <strong>{refundModal.orderNumber}</strong> · {refundModal.user?.name} · {fmtRs(refundModal.totalPrice)}
              {refundModal.codBookingStatus === 'PAID' && refundModal.codBookingAmount > 0 && (
                <span style={{ display:'block', marginTop:5, color: C.yellow, fontWeight:600, background: C.yellow+'15', border:`1px solid ${C.yellow}40`, borderRadius:6, padding:'4px 8px' }}>
                  ⚠ COD booking {fmtRs(refundModal.codBookingAmount)} is non-refundable — max refundable: {fmtRs(refundModal.totalPrice - refundModal.codBookingAmount)}
                </span>
              )}
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:C.mute, display:'block', marginBottom:5, textTransform:'uppercase' }}>Reason *</label>
                <input value={refundForm.reason} onChange={e => setRefundForm(f => ({...f, reason: e.target.value}))}
                  placeholder="Reason for refund"
                  style={{ width:'100%', height:36, border:`1px solid ${C.line}`, borderRadius:8, padding:'0 10px', fontSize:13, outline:'none', boxSizing:'border-box', background: C.bg, color: C.text }} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:C.mute, display:'block', marginBottom:5, textTransform:'uppercase' }}>Refund Amount (Rs.)</label>
                <input type="number" value={refundForm.refundAmount}
                  onChange={e => setRefundForm(f => ({...f, refundAmount: e.target.value === '' ? '' : Number(e.target.value)}))}
                  style={{ width:'100%', height:36, border:`1px solid ${C.line}`, borderRadius:8, padding:'0 10px', fontSize:13, fontWeight:700, outline:'none', boxSizing:'border-box', background: C.bg, color: C.text }} />
                <div style={{ fontSize:11, color:C.mute, marginTop:3 }}>Default: full order amount</div>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:C.mute, display:'block', marginBottom:5, textTransform:'uppercase' }}>Admin Note (optional)</label>
                <input value={refundForm.adminNote} onChange={e => setRefundForm(f => ({...f, adminNote: e.target.value}))}
                  placeholder="Internal note for records"
                  style={{ width:'100%', height:36, border:`1px solid ${C.line}`, borderRadius:8, padding:'0 10px', fontSize:13, outline:'none', boxSizing:'border-box', background: C.bg, color: C.text }} />
              </div>
            </div>

            <div style={{ background: C.yellow+'15', border:`1px solid ${C.yellow}40`, borderRadius:8, padding:'10px 14px', marginTop:16, fontSize:12, color: C.yellow }}>
              {refundModal?.paymentMethod === 'ONLINE' && refundModal?.paymentStatus === 'PAID'
                ? '⚠ This will issue a Razorpay gateway refund and mark the order as RETURNED.'
                : '⚠ This will mark the order as RETURNED and create an approved refund request. The customer will be notified.'}
            </div>

            <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
              <button onClick={() => setRefundModal(null)} disabled={refunding}
                style={{ padding:'8px 18px', borderRadius:8, border:`1px solid ${C.line}`, background: C.card, fontSize:13, cursor:'pointer' }}>
                Cancel
              </button>
              <button onClick={submitForceRefund} disabled={refunding || !refundForm.reason}
                style={{ padding:'8px 18px', borderRadius:8, border:'none', background:C.red, color:'white', fontSize:13, fontWeight:700, cursor:'pointer', opacity: !refundForm.reason ? .5 : 1 }}>
                {refunding ? 'Processing…' : 'Confirm Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <Card>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Order #, customer name or email…" style={{ flex: 1, minWidth: 240 }} />
          <Select value={statusF} onChange={e => setStatusF(e.target.value)}>
            <option value="">All Status</option>
            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={paymentF} onChange={e => setPayF(e.target.value)}>
            <option value="">All Payments</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
          </Select>
          {(search || statusF || paymentF) && <Btn onClick={() => { setSearch(''); setStatusF(''); setPayF(''); }}>Clear</Btn>}
          <span style={{ fontSize: 13, color: C.mute, marginLeft: 'auto' }}>
            <strong>{orders.length}</strong> of <strong>{all.length}</strong> orders
          </span>
        </div>
      </Card>

      <Card title={`Orders (${orders.length})`}>
        {orders.length === 0
          ? <Empty text="No orders match your filters" />
          : <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <Th>Order #</Th><Th>Customer</Th><Th>Items</Th><Th>Total</Th><Th>Method</Th><Th>Payment</Th><Th>Date</Th><Th>Status</Th><Th>Actions</Th>
                </tr></thead>
                <tbody>
                  {orders.map(o => {
                    const isFinal = ['DELIVERED','CANCELLED','RETURNED'].includes(o.orderStatus);
                    const canRefund = o.orderStatus === 'DELIVERED';
                    return (
                    <tr key={o._id} style={{ opacity: updating === o._id ? .5 : 1 }}>
                      <Td><span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 12, color: C.accent }}>{o.orderNumber}</span></Td>
                      <Td>
                        <div style={{ fontWeight: 600 }}>{o.user?.name || '—'}</div>
                        <div style={{ fontSize: 11, color: C.mute }}>{o.user?.email}</div>
                      </Td>
                      <Td style={{ fontWeight: 600 }}>{o.orderItems?.length}</Td>
                      <Td><span style={{ fontWeight: 700 }}>{fmtRs(o.totalPrice)}</span></Td>
                      <Td><Badge text={o.paymentMethod} color={C.blue} /></Td>
                      <Td><Badge text={o.paymentStatus} color={o.paymentStatus === 'PAID' ? C.green : o.paymentStatus === 'FAILED' ? C.red : C.yellow} /></Td>
                      <Td style={{ color: C.mute, fontSize: 12 }}>{new Date(o.createdAt).toLocaleDateString()}</Td>
                      <Td><Badge text={o.orderStatus} color={STATUS_COLORS[o.orderStatus] || C.mute} /></Td>
                      <Td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                          {/* Status update dropdown */}
                          <select value={o.orderStatus}
                            disabled={updating === o._id || isFinal}
                            onChange={e => handleStatusChange(o._id, e.target.value)}
                            style={{
                              fontSize: 12, padding: '5px 8px', borderRadius: 8,
                              border: `1px solid ${isFinal ? C.line : C.accent+'55'}`,
                              background: C.bg, color: isFinal ? C.mute : C.text,
                              cursor: isFinal ? 'not-allowed' : 'pointer',
                              opacity: isFinal ? 0.5 : 1, width: '100%',
                            }}>
                            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          {/* Action buttons row */}
                          <div style={{ display: 'flex', gap: 5 }}>
                            {canRefund && (
                              <button onClick={() => openRefund(o)}
                                style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
                                  border: `1px solid ${C.red}55`, background: C.red+'18', color: C.red,
                                  cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                                ↩ Refund
                              </button>
                            )}
                            {isFinal && !canRefund && (
                              <span style={{ fontSize: 11, color: C.mute, padding: '4px 0', fontStyle: 'italic' }}>
                                {o.orderStatus === 'CANCELLED' ? 'Cancelled' : o.orderStatus === 'RETURNED' ? 'Returned' : ''}
                              </span>
                            )}
                          </div>
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

/* ── Shared micro-components ─────────────────────── */
function Loader() {
  return (
    <div style={{ padding: 60, textAlign: 'center', color: C.mute }}>
      <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 12px', borderColor: C.line, borderTopColor: C.accent }} />
      Loading…
    </div>
  );
}
function Empty({ text }) {
  return <div style={{ padding: '40px 0', textAlign: 'center', color: C.mute, fontSize: 14 }}>{text}</div>;
}

/* ══════════════════════════════════════════════════════
   ADMIN RETURNS TAB
══════════════════════════════════════════════════════ */
const ADMIN_RETURN_STATUSES = [
  'REQUESTED','EMPLOYEE_APPROVED','EMPLOYEE_REJECTED',
  'APPROVED','REJECTED','PICKUP_SCHEDULED',
  'ITEM_RECEIVED','REFUND_INITIATED','REFUND_COMPLETED',
  'REPLACEMENT_SENT','COMPLETED',
];

const RETURN_STATUS_META = {
  REQUESTED:         { label:'Requested',          color:'#f59e0b' },
  EMPLOYEE_APPROVED: { label:'Employee Approved',  color:'#3b82f6' },
  EMPLOYEE_REJECTED: { label:'Employee Rejected',  color:'#ef4444' },
  APPROVED:         { label:'Approved',         color:'#22c55e' },
  REJECTED:         { label:'Rejected',         color:'#dc2626' },
  PICKUP_SCHEDULED: { label:'Pickup Scheduled', color:'#8b5cf6' },
  ITEM_RECEIVED:    { label:'Item Received',    color:'#06b6d4' },
  REFUND_INITIATED: { label:'Refund Initiated', color:'#FF5A1F' },
  REFUND_COMPLETED: { label:'Refund Completed', color:'#16a34a' },
  REPLACEMENT_SENT: { label:'Replacement Sent', color:'#8b5cf6' },
  COMPLETED:        { label:'Completed',        color:'#16a34a' },
};

function ReturnStatusBadge({ status }) {
  const m = RETURN_STATUS_META[status] || { label: status, color: '#888' };
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700,
      padding:'3px 9px', borderRadius:99, background: m.color + '20', color: m.color }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background: m.color }} />{m.label}
    </span>
  );
}

function AdminReturnsTab() {
  const { isMobile, isTablet } = useResponsive();
  const [returns, setReturns]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('ALL');
  const [actionId, setActionId]     = useState(null);
  const [actionForm, setActionForm] = useState({ status:'', adminNote:'', refundAmount:'' });
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState('');

  const load = useCallback(() => {
    setLoading(true);
    returnsApi.getAll({ limit: 100 })
      .then(r => setReturns(r.data?.data?.data || r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const doProcess = async (id) => {
    if (!actionForm.status) return;
    setSaving(true);
    try {
      // Auto-trigger Razorpay refund when admin sets REFUND_INITIATED on an ONLINE-paid order
      if (actionForm.status === 'REFUND_INITIATED') {
        const req = returns.find(r => r._id === id);
        if (req?.order?.paymentMethod === 'ONLINE' && req?.order?.paymentStatus === 'PAID') {
          try {
            await paymentsApi.initiateRefund(req.order._id, {
              refundAmount: Number(actionForm.refundAmount) || req.refundAmount,
              reason: actionForm.adminNote || 'Admin initiated refund',
            });
          } catch (rzpErr) {
            const msg = rzpErr?.response?.data?.message || 'Razorpay refund failed';
            if (!window.confirm(`${msg}\n\nContinue updating status to REFUND_INITIATED anyway?`)) {
              setSaving(false);
              return;
            }
          }
        }
      }

      await returnsApi.process(id, actionForm);
      setActionId(null); setActionForm({ status:'', adminNote:'', refundAmount:'' });
      load();
    } catch(e) {
      alert(e?.response?.data?.message || 'Action failed');
    } finally { setSaving(false); }
  };

  const q = search.trim().toLowerCase();
  const filtered = returns
    .filter(r => filter === 'ALL' || r.status === filter)
    .filter(r => {
      if (!q) return true;
      return (
        r._id?.toLowerCase().includes(q) ||
        r._id?.slice(-8).toLowerCase().includes(q) ||
        r.user?.name?.toLowerCase().includes(q) ||
        r.user?.email?.toLowerCase().includes(q) ||
        r.user?.phone?.toLowerCase().includes(q) ||
        r.order?.orderNumber?.toLowerCase().includes(q) ||
        r.order?._id?.slice(-8).toLowerCase().includes(q) ||
        r.product?.title?.toLowerCase().includes(q) ||
        r.reason?.toLowerCase().includes(q)
      );
    });

  const stats = {
    total:            returns.length,
    employeePending:  returns.filter(r => r.status === 'REQUESTED').length,
    employeeRejected: returns.filter(r => r.status === 'EMPLOYEE_REJECTED').length,
    adminPending:     returns.filter(r => r.status === 'EMPLOYEE_APPROVED').length,
    done:             returns.filter(r => ['COMPLETED','REJECTED','REFUND_COMPLETED','REPLACEMENT_SENT'].includes(r.status)).length,
    value:            returns.reduce((s, r) => s + (r.refundAmount || 0), 0),
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Flow explanation */}
      <div style={{ background: C.card, borderRadius:12, padding:'14px 20px', boxShadow:'0 1px 3px #0000000d', display:'flex', gap:0, alignItems:'center', flexWrap:'wrap' }}>
        {[
          { icon:'📤', label:'Customer Submits', color:C.blue },
          { icon:'→', label:'', color:'#aaa' },
          { icon:'🏪', label:'Employee Approves/Rejects', color:C.yellow },
          { icon:'→', label:'', color:'#aaa' },
          { icon:'🛡️', label:'Admin Confirms/Overrides', color:C.accent },
          { icon:'→', label:'', color:'#aaa' },
          { icon:'🚚', label:'Pickup & Refund', color:C.green },
        ].map((s, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px',
            ...(s.label ? { background: s.color+'15', borderRadius:8, border:`1px solid ${s.color}30` } : {}) }}>
            <span style={{ fontSize: s.label ? 16 : 14, color: s.label ? s.color : '#ccc' }}>{s.icon}</span>
            {s.label && <span style={{ fontSize:12, fontWeight:700, color:s.color }}>{s.label}</span>}
          </div>
        ))}
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : isTablet ? 'repeat(3,1fr)' : 'repeat(5,1fr)', gap:12 }}>
        <KpiCard label="Total Returns"     value={stats.total}            colorKey="blue"   iconEl={Icon.refund} />
        <KpiCard label="Awaiting Employee" value={stats.employeePending}  colorKey="yellow" iconEl={Icon.bag}    sub="Pending response" />
        <KpiCard label="Employee Rejected" value={stats.employeeRejected} colorKey="red"    iconEl={Icon.bell}   sub="Override needed" />
        <KpiCard label="Awaiting You"      value={stats.adminPending}     colorKey="orange" iconEl={Icon.shield} sub="Needs your approval" />
        <KpiCard label="Refund Value"      value={fmtShort(stats.value)}  colorKey="green"  iconEl={Icon.dollar} />
      </div>

      {/* Employee-rejected alert banner */}
      {stats.employeeRejected > 0 && (
        <div style={{ background:'rgba(239,68,68,.08)', border:`1px solid rgba(239,68,68,.25)`, borderRadius:12, padding:'14px 18px', display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:20 }}>⚠️</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:600, fontSize:13.5, color:'#f87171' }}>{stats.employeeRejected} return{stats.employeeRejected > 1 ? 's' : ''} rejected by employee — needs your review</div>
            <div style={{ fontSize:12, color:C.mute, marginTop:2 }}>You can override the employee's decision and approve these returns.</div>
          </div>
          <button onClick={() => setFilter('EMPLOYEE_REJECTED')}
            style={{ padding:'7px 16px', borderRadius:8, background:C.red, color:'white', border:'none', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>
            Review Now
          </button>
        </div>
      )}

      <Card title="Return Requests"
        action={
          <div style={{ display:'flex', alignItems:'center', gap:8, background:C.bg, border:`1px solid ${C.line}`, borderRadius:8, padding:'0 10px', height:34, minWidth:220 }}>
            <span style={{ color:C.mute, display:'flex', alignItems:'center', flexShrink:0 }}><SvgAt el={Icon.search} size={14} /></span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Name, email, phone, order #, return ID…"
              style={{ flex:1, border:'none', outline:'none', background:'transparent', fontSize:12.5, color:C.text, fontFamily:'inherit', minWidth:0 }} />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ background:'none', border:'none', color:C.mute, cursor:'pointer', padding:0, fontSize:14, lineHeight:1 }}>✕</button>
            )}
          </div>
        }>
        {/* Filter pills */}
        <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap' }}>
          <button key="ALL" onClick={() => setFilter('ALL')}
            style={{ padding:'5px 14px', borderRadius:99, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
              border: filter==='ALL' ? `1px solid ${C.accent}` : `1px solid ${C.line}`,
              background: filter==='ALL' ? C.accent : C.card2,
              color: filter==='ALL' ? 'white' : C.sub }}>
            All
          </button>
          {ADMIN_RETURN_STATUSES.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding:'5px 14px', borderRadius:99, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
                border: filter===f ? `1px solid ${RETURN_STATUS_META[f]?.color}` : `1px solid ${C.line}`,
                background: filter===f ? RETURN_STATUS_META[f]?.color + '22' : C.card2,
                color: filter===f ? RETURN_STATUS_META[f]?.color : C.sub }}>
              {RETURN_STATUS_META[f]?.label || f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:40, color:C.mute }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:40, color:C.mute }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📦</div>
            <div style={{ fontWeight:700 }}>{q ? 'No returns match your search' : 'No returns in this category'}</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {filtered.map(req => {
              const isOpen = actionId === req._id;
              return (
                <div key={req._id} style={{ border:`1px solid ${C.line}`, borderRadius:12, overflow:'hidden' }}>
                  {/* Header */}
                  <div style={{ background:C.surf, padding:'12px 18px', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:13, color:C.text }}>Return #{req._id?.slice(-8).toUpperCase()}</div>
                      <div style={{ fontSize:11, color:C.mute, marginTop:2 }}>
                        {req.user?.name} · {req.user?.email}
                      </div>
                    </div>
                    <ReturnStatusBadge status={req.status} />
                    <div style={{ fontSize:14, fontWeight:800, color:C.accent }}>
                      {fmtRs(req.refundAmount || 0)}
                    </div>
                    <button onClick={() => { setActionId(isOpen ? null : req._id); setActionForm({ status:'', adminNote:'', refundAmount: req.refundAmount || '' }); }}
                      style={{ padding:'6px 14px', borderRadius:8, background: isOpen ? C.card2 : C.accent, color: isOpen ? C.sub : 'white',
                        border:'none', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                      {isOpen ? 'Close' : 'Take Action'}
                    </button>
                  </div>

                  {/* Item + info */}
                  <div style={{ padding:'12px 18px', display:'flex', gap:12, alignItems:'center' }}>
                    {req.product?.images?.[0]
                      ? <img src={req.product.images[0]} alt="" style={{ width:52, height:52, objectFit:'contain', border:`1px solid ${C.line}`, borderRadius:6 }} />
                      : <div style={{ width:52, height:52, background:C.surf, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>📦</div>
                    }
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:13, color:C.text }}>{req.product?.title || 'Product'}</div>
                      <div style={{ fontSize:12, color:C.mute, marginTop:2 }}>
                        Reason: <strong>{req.reason?.replace(/_/g,' ')}</strong>
                        {' · '}Resolution: <strong>{req.resolution || 'refund'}</strong>
                      </div>
                      {req.description && <div style={{ fontSize:12, color:C.mute, marginTop:2 }}>"{req.description}"</div>}
                    </div>
                    <div style={{ textAlign:'right', fontSize:12, color:C.mute }}>
                      <div>Order: {req.order?.orderNumber || req.order?._id?.slice(-6)?.toUpperCase() || '—'}</div>
                      <div style={{ marginTop:4, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                        {req.order?.paymentMethod === 'COD' && (
                          <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:4, background:'#fef9c3', color:'#854d0e', border:'1px solid #fde047' }}>COD</span>
                        )}
                        {req.refundMethod === 'bank_transfer' && req.bankDetails?.accountNumber && (
                          <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:4, background: C.green+'25', color: C.green }}>Bank ✓</span>
                        )}
                        {req.refundMethod === 'upi' && req.bankDetails?.upiId && (
                          <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:4, background: C.green+'25', color: C.green }}>UPI ✓</span>
                        )}
                        {req.resolution === 'refund' && !req.bankDetails?.accountNumber && !req.bankDetails?.upiId && req.refundMethod !== 'original_payment' && (
                          <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:4, background:'#fee2e2', color:'#dc2626' }}>Bank details pending</span>
                        )}
                        {req.employeeNote && <span style={{ color:'#007185' }}>Employee replied</span>}
                      </div>
                    </div>
                  </div>

                  {/* Notes from employee */}
                  {(req.employeeNote || req.adminNote) && (
                    <div style={{ padding:'8px 18px', background: C.bg, borderTop:`1px solid ${C.line}`, fontSize:12, color:'#555', display:'flex', gap:16, flexWrap:'wrap' }}>
                      {req.employeeNote && <span><strong>Employee:</strong> {req.employeeNote}</span>}
                      {req.adminNote  && <span><strong>Admin:</strong> {req.adminNote}</span>}
                    </div>
                  )}

                  {/* Timeline preview */}
                  {req.timeline?.length > 0 && !isOpen && (
                    <div style={{ padding:'8px 18px', borderTop:`1px solid ${C.line}`, fontSize:11, color:C.mute, display:'flex', gap:16, flexWrap:'wrap' }}>
                      {[...req.timeline].slice(-3).map((ev, i) => (
                        <span key={i} style={{ display:'flex', alignItems:'center', gap:4 }}>
                          <span style={{ width:6, height:6, borderRadius:'50%', background:RETURN_STATUS_META[ev.status]?.color || '#888' }} />
                          {ev.status?.replace(/_/g,' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Admin action panel */}
                  {isOpen && (
                    <div style={{ padding:'16px 18px', background: C.bg, borderTop:`1px solid ${C.line}` }}>
                      <div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>Admin Action</div>

                      {/* Employee-rejection override notice */}
                      {req.status === 'EMPLOYEE_REJECTED' && (
                        <div style={{ background:'#fef9c3', border:'1px solid #fde047', borderRadius:8, padding:'10px 14px', marginBottom:12, fontSize:12, color:'#854d0e' }}>
                          ⚠️ <strong>Employee rejected this return.</strong> You can override and set status to <em>Approved</em> if the customer's claim is valid.
                        </div>
                      )}

                      {/* Refund details — show bank info if provided */}
                      {req.resolution === 'refund' && (
                        <div style={{ background:'#f0f9ff', border:`1px solid ${C.line}`, borderRadius:8, padding:'10px 14px', marginBottom:12, fontSize:12 }}>
                          <div style={{ fontWeight:700, color:'#0369a1', marginBottom:4 }}>💳 Refund Details</div>
                          <div style={{ color:'#555' }}>
                            Method: <strong>{req.order?.paymentMethod === 'COD' ? '🟡 COD (must pay via bank/UPI)' : req.order?.paymentMethod}</strong>
                            {' · '}Refund to: <strong>{req.refundMethod === 'bank_transfer' ? 'Bank Transfer' : req.refundMethod === 'upi' ? 'UPI' : 'Original Payment'}</strong>
                          </div>
                          {req.bankDetails?.accountNumber && (
                            <div style={{ color:'#555', marginTop:3 }}>
                              🏦 {req.bankDetails.bankName} — ···{req.bankDetails.accountNumber.slice(-4)} ({req.bankDetails.accountName}) · IFSC: {req.bankDetails.ifscCode}
                            </div>
                          )}
                          {req.bankDetails?.upiId && (
                            <div style={{ color:'#555', marginTop:3 }}>📱 UPI: {req.bankDetails.upiId}</div>
                          )}
                          {!req.bankDetails?.accountNumber && !req.bankDetails?.upiId && req.refundMethod !== 'original_payment' && (
                            <div style={{ color:C.red, marginTop:3, fontWeight:700 }}>⚠️ Customer has not provided bank/UPI details yet</div>
                          )}
                        </div>
                      )}
                      {/* Auto Razorpay refund notice */}
                      {actionForm.status === 'REFUND_INITIATED' && req.order?.paymentMethod === 'ONLINE' && req.order?.paymentStatus === 'PAID' && (
                        <div style={{ background: C.green+'18', border:`1px solid ${C.green}40`, borderRadius:8, padding:'10px 14px', marginBottom:12, fontSize:12, color: C.green, fontWeight:600 }}>
                          ⚡ Razorpay refund of {fmtRs(Number(actionForm.refundAmount) || req.refundAmount)} will be issued automatically when you update this status.
                        </div>
                      )}

                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                        <div>
                          <label style={{ fontSize:11, fontWeight:700, color:C.mute, display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.06em' }}>New Status *</label>
                          <select value={actionForm.status} onChange={e=>setActionForm(f=>({...f,status:e.target.value}))}
                            style={{ width:'100%', height:36, border:`1px solid ${C.line}`, borderRadius:8, padding:'0 10px', fontSize:13, outline:'none', background: C.bg, color: C.text }}>
                            <option value="">— Select Status —</option>
                            {ADMIN_RETURN_STATUSES.map(s => (
                              <option key={s} value={s}>{RETURN_STATUS_META[s]?.label || s}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize:11, fontWeight:700, color:C.mute, display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.06em' }}>Refund Amount (Rs.)</label>
                          <input type="number" value={actionForm.refundAmount} onChange={e=>setActionForm(f=>({...f,refundAmount:e.target.value}))}
                            style={{ width:'100%', height:36, border:`1px solid ${C.line}`, borderRadius:8, padding:'0 10px', fontSize:13, outline:'none', background: C.bg, color: C.text, boxSizing:'border-box' }} />
                        </div>
                      </div>
                      <div style={{ marginBottom:12 }}>
                        <label style={{ fontSize:11, fontWeight:700, color:C.mute, display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.06em' }}>Note to Customer</label>
                        <textarea rows={2} value={actionForm.adminNote} onChange={e=>setActionForm(f=>({...f,adminNote:e.target.value}))}
                          placeholder="Message to customer about this update…"
                          style={{ width:'100%', border:`1px solid ${C.line}`, borderRadius:8, padding:'8px 12px', fontSize:13, resize:'none', outline:'none', fontFamily:'inherit', boxSizing:'border-box', background: C.bg, color: C.text }} />
                      </div>
                      <div style={{ display:'flex', gap:10 }}>
                        <button onClick={() => doProcess(req._id)} disabled={saving || !actionForm.status}
                          style={{ padding:'9px 24px', borderRadius:8, background: !actionForm.status ? C.line : C.accent, color: !actionForm.status ? C.mute : 'white',
                            border:'none', fontWeight:700, fontSize:13, cursor: actionForm.status ? 'pointer' : 'not-allowed', opacity: saving ? 0.6 : 1 }}>
                          {saving ? 'Saving…' : 'Update Return Status'}
                        </button>
                        <button onClick={() => setActionId(null)}
                          style={{ padding:'9px 20px', borderRadius:8, background: C.card, border:`1px solid ${C.line}`, fontWeight:600, fontSize:13, cursor:'pointer', color:C.mute }}>
                          Cancel
                        </button>
                      </div>
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

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════
   COUPONS TAB
══════════════════════════════════════════════════════ */
const EMPTY_COUPON = { code:'', discountType:'PERCENTAGE', discountValue:'', minimumAmount:'', maximumDiscount:'', expiryDate:'', usageLimit:'', isActive:true };

function AdminCouponsTab() {
  const [coupons, setCoupons]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState(EMPTY_COUPON);
  const [editId, setEditId]     = useState(null);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    couponsApi.getAll({ limit: 100 })
      .then(r => setCoupons(r.data?.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openCreate = () => { setForm(EMPTY_COUPON); setEditId(null); setError(''); setShowForm(true); };
  const openEdit   = (c) => {
    setForm({
      code: c.code, discountType: c.discountType, discountValue: c.discountValue,
      minimumAmount: c.minimumAmount || '', maximumDiscount: c.maximumDiscount || '',
      expiryDate: c.expiryDate ? c.expiryDate.slice(0,10) : '',
      usageLimit: c.usageLimit || '', isActive: c.isActive,
    });
    setEditId(c._id); setError(''); setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.code || !form.discountValue || !form.expiryDate) {
      setError('Code, discount value and expiry date are required.'); return;
    }
    setSaving(true); setError('');
    try {
      const payload = {
        code: form.code.toUpperCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minimumAmount: form.minimumAmount ? Number(form.minimumAmount) : 0,
        maximumDiscount: form.maximumDiscount ? Number(form.maximumDiscount) : undefined,
        expiryDate: form.expiryDate,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        isActive: form.isActive,
      };
      if (editId) await couponsApi.update(editId, payload);
      else        await couponsApi.create(payload);
      setShowForm(false); load();
    } catch(e) {
      setError(e?.response?.data?.message || 'Failed to save coupon.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    setDeleting(id);
    try { await couponsApi.delete(id); load(); }
    catch(e) { alert(e?.response?.data?.message || 'Delete failed'); }
    finally { setDeleting(null); }
  };

  const handleToggle = async (c) => {
    try { await couponsApi.update(c._id, { isActive: !c.isActive }); load(); }
    catch(e) { alert('Update failed'); }
  };

  const now = new Date();
  const active  = coupons.filter(c => c.isActive && new Date(c.expiryDate) > now).length;
  const expired = coupons.filter(c => new Date(c.expiryDate) <= now).length;
  const inactive = coupons.filter(c => !c.isActive).length;

  const LabelStyle = { display:'block', fontSize:11, fontWeight:700, color:C.mute, marginBottom:5, textTransform:'uppercase', letterSpacing:'.06em' };
  const InpStyle   = { height:36, border:`1px solid ${C.line}`, borderRadius:8, padding:'0 12px', fontSize:13, outline:'none', background: C.bg, color: C.text, width:'100%', boxSizing:'border-box' };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
        <KpiCard label="Total Coupons" value={coupons.length} colorKey="blue"   iconEl={Icon.coupon} />
        <KpiCard label="Active"        value={active}         colorKey="green"  iconEl={Icon.shield} />
        <KpiCard label="Expired"       value={expired}        colorKey="red"    iconEl={Icon.bell} />
        <KpiCard label="Inactive"      value={inactive}       colorKey="yellow" iconEl={Icon.lock} />
      </div>

      {/* Create button */}
      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <button onClick={openCreate}
          style={{ padding:'10px 22px', borderRadius:10, background:C.accent, color:'white', border:'none', fontWeight:700, fontSize:13, cursor:'pointer' }}>
          + Create Coupon
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <Card title={editId ? '✏️ Edit Coupon' : '🎟️ New Coupon'}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <label style={LabelStyle}>Coupon Code *</label>
              <input value={form.code} onChange={e=>set('code',e.target.value.toUpperCase())} placeholder="e.g. SAVE20"
                style={{ ...InpStyle, fontFamily:'monospace', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' }} />
            </div>
            <div>
              <label style={LabelStyle}>Discount Type *</label>
              <select value={form.discountType} onChange={e=>set('discountType',e.target.value)}
                style={{ ...InpStyle, cursor:'pointer' }}>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (Rs.)</option>
              </select>
            </div>
            <div>
              <label style={LabelStyle}>Discount Value * {form.discountType==='PERCENTAGE'?'(%)':'(Rs.)'}</label>
              <input type="number" min="0" value={form.discountValue} onChange={e=>set('discountValue',e.target.value)}
                placeholder={form.discountType==='PERCENTAGE'?'e.g. 20':'e.g. 500'} style={InpStyle} />
            </div>
            <div>
              <label style={LabelStyle}>Expiry Date *</label>
              <input type="date" value={form.expiryDate} onChange={e=>set('expiryDate',e.target.value)}
                min={new Date().toISOString().slice(0,10)} style={InpStyle} />
            </div>
            <div>
              <label style={LabelStyle}>Minimum Order (Rs.)</label>
              <input type="number" min="0" value={form.minimumAmount} onChange={e=>set('minimumAmount',e.target.value)}
                placeholder="0 = no minimum" style={InpStyle} />
            </div>
            <div>
              <label style={LabelStyle}>Max Discount Cap (Rs.) <span style={{color:C.mute,fontWeight:400}}>— for % coupons</span></label>
              <input type="number" min="0" value={form.maximumDiscount} onChange={e=>set('maximumDiscount',e.target.value)}
                placeholder="Leave blank = no cap" style={InpStyle} />
            </div>
            <div>
              <label style={LabelStyle}>Usage Limit</label>
              <input type="number" min="1" value={form.usageLimit} onChange={e=>set('usageLimit',e.target.value)}
                placeholder="Leave blank = unlimited" style={InpStyle} />
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10, paddingTop:22 }}>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontWeight:600, fontSize:13 }}>
                <input type="checkbox" checked={form.isActive} onChange={e=>set('isActive',e.target.checked)} />
                Active (users can apply this coupon)
              </label>
            </div>
          </div>

          {error && <div style={{ marginTop:12, color:C.red, fontSize:13, fontWeight:600, background:C.red+'10', padding:'8px 12px', borderRadius:8 }}>{error}</div>}

          <div style={{ display:'flex', gap:10, marginTop:18 }}>
            <button onClick={handleSubmit} disabled={saving}
              style={{ padding:'10px 24px', borderRadius:8, background:C.green, color:'white', border:'none', fontWeight:700, fontSize:13, cursor:'pointer', opacity:saving?0.6:1 }}>
              {saving ? 'Saving…' : editId ? 'Save Changes' : 'Create Coupon'}
            </button>
            <button onClick={()=>setShowForm(false)}
              style={{ padding:'10px 18px', borderRadius:8, background: C.card, border:`1px solid ${C.line}`, fontWeight:600, fontSize:13, cursor:'pointer', color:C.mute }}>
              Cancel
            </button>
          </div>
        </Card>
      )}

      {/* Coupons table */}
      <Card title={`All Coupons (${coupons.length})`}>
        {loading ? <div style={{ padding:40, textAlign:'center', color:C.mute }}>Loading…</div> :
         coupons.length === 0 ? <div style={{ padding:40, textAlign:'center', color:C.mute }}>No coupons yet. Create one above.</div> : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>
                {['Code','Type','Value','Min Order','Cap','Usage','Expiry','Status','Actions'].map(h=>(
                  <th key={h} style={{ textAlign:'left', padding:'8px 12px', fontSize:11, fontWeight:700, color:C.mute, letterSpacing:'.06em', textTransform:'uppercase', borderBottom:`1px solid ${C.line}`, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {coupons.map(c => {
                  const isExpired  = new Date(c.expiryDate) <= now;
                  const daysLeft   = Math.ceil((new Date(c.expiryDate) - now) / 86400000);
                  const statusColor = isExpired ? C.red : !c.isActive ? C.mute : C.green;
                  const statusLabel = isExpired ? 'Expired' : !c.isActive ? 'Inactive' : 'Active';
                  return (
                    <tr key={c._id} style={{ background: isExpired ? C.red+'10' : C.card }}>
                      <td style={{ padding:'10px 12px', borderBottom:`1px solid ${C.line}` }}>
                        <span style={{ fontFamily:'monospace', fontWeight:800, fontSize:13, background: C.bg, padding:'3px 8px', borderRadius:6, letterSpacing:'.08em' }}>
                          {c.code}
                        </span>
                      </td>
                      <td style={{ padding:'10px 12px', borderBottom:`1px solid ${C.line}`, fontSize:12, color:C.mute }}>
                        {c.discountType === 'PERCENTAGE' ? 'Percentage' : 'Fixed'}
                      </td>
                      <td style={{ padding:'10px 12px', borderBottom:`1px solid ${C.line}`, fontWeight:700, fontSize:13, color:C.green }}>
                        {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `Rs. ${c.discountValue}`}
                      </td>
                      <td style={{ padding:'10px 12px', borderBottom:`1px solid ${C.line}`, fontSize:12, color:C.mute }}>
                        {c.minimumAmount > 0 ? `Rs. ${c.minimumAmount}` : '—'}
                      </td>
                      <td style={{ padding:'10px 12px', borderBottom:`1px solid ${C.line}`, fontSize:12, color:C.mute }}>
                        {c.maximumDiscount ? `Rs. ${c.maximumDiscount}` : '—'}
                      </td>
                      <td style={{ padding:'10px 12px', borderBottom:`1px solid ${C.line}`, fontSize:12 }}>
                        <span style={{ color: c.usageLimit && c.usedCount >= c.usageLimit ? C.red : C.mute }}>
                          {c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ' used'}
                        </span>
                      </td>
                      <td style={{ padding:'10px 12px', borderBottom:`1px solid ${C.line}`, fontSize:12, whiteSpace:'nowrap' }}>
                        <div style={{ color: isExpired ? C.red : daysLeft <= 3 ? C.yellow : '#333', fontWeight: isExpired||daysLeft<=3 ? 700 : 400 }}>
                          {new Date(c.expiryDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                        </div>
                        {!isExpired && <div style={{ fontSize:11, color: daysLeft<=3 ? C.red : C.mute }}>{daysLeft}d left</div>}
                      </td>
                      <td style={{ padding:'10px 12px', borderBottom:`1px solid ${C.line}` }}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:99, background:statusColor+'20', color:statusColor }}>
                          <span style={{ width:5, height:5, borderRadius:'50%', background:statusColor }} />{statusLabel}
                        </span>
                      </td>
                      <td style={{ padding:'10px 12px', borderBottom:`1px solid ${C.line}` }}>
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={()=>openEdit(c)}
                            style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:6, background: C.bg, border:`1px solid ${C.line}`, cursor:'pointer', color: C.text }}>
                            ✏️ Edit
                          </button>
                          <button onClick={()=>handleToggle(c)}
                            style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:6, background: c.isActive ? C.red+'18':'#22c55e18', border:`1px solid ${c.isActive?C.red:C.green}40`, cursor:'pointer', color:c.isActive?C.red:C.green }}>
                            {c.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button onClick={()=>handleDelete(c._id)} disabled={deleting===c._id}
                            style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:6, background:'#fef2f2', border:`1px solid ${C.red}`, cursor:'pointer', color:C.red, opacity:deleting===c._id?0.5:1 }}>
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ══════════════════ Admin Notifications Tab ══════════════════ */
const EMPTY_NOTIF = { sendMode:'broadcast', targetRole:'user', userEmail:'', title:'', message:'', type:'SYSTEM', link:'', couponCode:'' };

function AdminNotificationsTab() {
  const [form, setForm]         = useState(EMPTY_NOTIF);
  const [sending, setSending]   = useState(false);
  const [result, setResult]     = useState(null);
  const [history, setHistory]   = useState([]);
  const [copied, setCopied]     = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      setResult({ ok: false, text: 'Title and message are required.' }); return;
    }
    if (form.sendMode === 'personal' && !form.userEmail.trim()) {
      setResult({ ok: false, text: 'User email is required for personal notification.' }); return;
    }
    setSending(true); setResult(null);
    try {
      const payload = {
        title:      form.title,
        message:    form.message,
        type:       form.type,
        link:       form.link.trim() || undefined,
        couponCode: form.couponCode.trim().toUpperCase() || undefined,
      };
      if (form.sendMode === 'personal') {
        payload.userEmail = form.userEmail.trim();
      } else {
        payload.targetRole = form.targetRole;
      }
      const resp = await notificationsApi.broadcast(payload);
      const count = resp.data?.data?.count || 0;
      setResult({ ok: true, text: `✅ Sent to ${count} user${count !== 1 ? 's' : ''}!` });
      setHistory(prev => [{ ...form, sentAt: new Date().toISOString(), count }, ...prev.slice(0, 9)]);
      setForm(EMPTY_NOTIF);
    } catch(e) {
      setResult({ ok: false, text: e?.response?.data?.message || e.message || 'Failed to send.' });
    } finally { setSending(false); }
  };

  const LabelStyle = { display:'block', fontSize:11, fontWeight:700, color:C.mute, marginBottom:5, textTransform:'uppercase', letterSpacing:'.06em' };
  const InpStyle   = { height:36, border:`1px solid ${C.line}`, borderRadius:8, padding:'0 12px', fontSize:13, outline:'none', background: C.bg, color: C.text, width:'100%', boxSizing:'border-box' };

  const TARGET_OPTIONS = [
    { value:'user',     label:'All Customers', desc:'Every registered buyer',      iconEl: Icon.users,  color: C.blue },
    { value:'employee', label:'All Employees', desc:'Every registered employee',   iconEl: Icon.person, color: C.yellow },
    { value:'all',      label:'Everyone',      desc:'All users on the platform',   iconEl: Icon.bell,   color: C.pink },
  ];
  const TYPE_OPTIONS = ['SYSTEM','ORDER','OFFER','PAYMENT','REFUND'];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Compose card */}
      <Card title="📢 Send Notification">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

          {/* Send mode toggle */}
          <div style={{ gridColumn:'1/-1' }}>
            <label style={LabelStyle}>Send to</label>
            <div style={{ display:'flex', gap:0, border:`1px solid ${C.line}`, borderRadius:10, overflow:'hidden', width:'fit-content' }}>
              {[
                { mode:'broadcast', label:'Broadcast (group)',  iconEl: Icon.bell },
                { mode:'personal',  label:'Personal (one user)', iconEl: Icon.person },
              ].map(opt => (
                <button key={opt.mode} onClick={() => set('sendMode', opt.mode)}
                  style={{ padding:'9px 20px', border:'none', cursor:'pointer', fontWeight:600, fontSize:13, transition:'all .15s',
                    background: form.sendMode===opt.mode ? C.accent : C.card2,
                    color:      form.sendMode===opt.mode ? 'white' : C.sub,
                    display:'flex', alignItems:'center', gap:8, fontFamily:'inherit' }}>
                  <SvgAt el={opt.iconEl} size={15} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Broadcast: pick role */}
          {form.sendMode === 'broadcast' && (
            <div style={{ gridColumn:'1/-1', display:'flex', gap:10, flexWrap:'wrap' }}>
              {TARGET_OPTIONS.map(opt => {
                const active = form.targetRole === opt.value;
                return (
                <div key={opt.value} onClick={() => set('targetRole', opt.value)}
                  style={{ flex:'1 1 150px', padding:'14px 16px', borderRadius:10,
                    border:`1.5px solid ${active ? opt.color : C.line}`,
                    background: active ? opt.color + '18' : C.card2, cursor:'pointer', transition:'all .15s',
                    display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:9, background: opt.color+'20', color: opt.color,
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <SvgAt el={opt.iconEl} size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13, color: active ? C.text : C.sub }}>{opt.label}</div>
                    <div style={{ fontSize:11, color:C.mute, marginTop:2 }}>{opt.desc}</div>
                  </div>
                </div>
                );
              })}
            </div>
          )}

          {/* Personal: user email */}
          {form.sendMode === 'personal' && (
            <div style={{ gridColumn:'1/-1' }}>
              <label style={LabelStyle}>User Email *</label>
              <input value={form.userEmail} onChange={e=>set('userEmail',e.target.value)}
                placeholder="user@example.com" type="email" style={InpStyle} />
              <div style={{ fontSize:11, color:C.mute, marginTop:4 }}>The notification will be sent only to this user.</div>
            </div>
          )}

          {/* Type */}
          <div>
            <label style={LabelStyle}>Notification Type</label>
            <select value={form.type} onChange={e=>set('type',e.target.value)} style={{ ...InpStyle, cursor:'pointer' }}>
              {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Link */}
          <div>
            <label style={LabelStyle}>Clickable Link <span style={{ fontWeight:400, textTransform:'none', color:C.mute }}>— optional, e.g. /products</span></label>
            <input value={form.link} onChange={e=>set('link',e.target.value)} placeholder="/products?category=Electronics" style={InpStyle} />
          </div>

          {/* Coupon code */}
          <div style={{ gridColumn:'1/-1' }}>
            <label style={LabelStyle}>Coupon Code <span style={{ fontWeight:400, textTransform:'none', color:C.mute }}>— optional, user gets a Copy button in the notification</span></label>
            <div style={{ display:'flex', gap:8 }}>
              <input value={form.couponCode} onChange={e=>set('couponCode',e.target.value.toUpperCase())}
                placeholder="e.g. SAVE20" style={{ ...InpStyle, fontFamily:'monospace', fontWeight:700, letterSpacing:'.1em', flex:1 }} />
              {form.couponCode && (
                <div style={{ display:'flex', alignItems:'center', gap:6, padding:'0 14px', borderRadius:8,
                  background: C.green+'18', border:`1px solid ${C.green}40`, fontSize:13, fontWeight:700, color:C.green, whiteSpace:'nowrap' }}>
                  🎟️ {form.couponCode}
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div style={{ gridColumn:'1/-1' }}>
            <label style={LabelStyle}>Title *</label>
            <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. Your exclusive coupon is here! 🎉" style={InpStyle} />
          </div>

          {/* Message */}
          <div style={{ gridColumn:'1/-1' }}>
            <label style={LabelStyle}>Message *</label>
            <textarea value={form.message} onChange={e=>set('message',e.target.value)} rows={3}
              placeholder="Write your notification message here..."
              style={{ ...InpStyle, height:'auto', padding:'10px 12px', resize:'vertical', lineHeight:1.6 }} />
          </div>
        </div>

        {result && (
          <div style={{ marginTop:14, padding:'10px 14px', borderRadius:8, fontSize:13, fontWeight:700,
            background: result.ok ? C.green+'15' : C.red+'15', color: result.ok ? C.green : C.red }}>
            {result.text}
          </div>
        )}

        <div style={{ marginTop:18, display:'flex', gap:10 }}>
          <button onClick={handleSend} disabled={sending}
            style={{ padding:'11px 28px', borderRadius:8, background:C.accent, color:'white', border:'none', fontWeight:700, fontSize:14, cursor:'pointer', opacity:sending?0.6:1 }}>
            {sending ? 'Sending…' : '📤 Send Notification'}
          </button>
          <button onClick={() => { setForm(EMPTY_NOTIF); setResult(null); }}
            style={{ padding:'11px 18px', borderRadius:8, background: C.card, border:`1px solid ${C.line}`, fontWeight:600, fontSize:13, cursor:'pointer', color:C.mute }}>
            Clear
          </button>
        </div>
      </Card>

      {/* Send history */}
      {history.length > 0 && (
        <Card title="Recent Sends">
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {history.map((h, i) => (
              <div key={i} style={{ display:'flex', gap:12, alignItems:'center', padding:'10px 14px', background: C.bg, borderRadius:8, fontSize:13 }}>
                <span style={{ fontSize:20 }}>{ {SYSTEM:'🔔',ORDER:'📦',OFFER:'🎁',PAYMENT:'💳',REFUND:'↩️'}[h.type] }</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700 }}>{h.title}</div>
                  <div style={{ color:C.mute, fontSize:12 }}>{h.message.slice(0,80)}{h.message.length>80?'…':''}</div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontWeight:700, color:C.green }}>{h.count} sent</div>
                  <div style={{ fontSize:11, color:C.mute }}>{new Date(h.sentAt).toLocaleString('en-IN',{hour:'2-digit',minute:'2-digit',day:'numeric',month:'short'})}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ADMIN SUPPORT TAB
══════════════════════════════════════════════════════ */
const TICKET_STATUS_META = {
  OPEN:        { label: 'Open',        color: '#3b82f6', bg: '#3b82f625' },
  IN_PROGRESS: { label: 'In Progress', color: '#f59e0b', bg: '#f59e0b25' },
  RESOLVED:    { label: 'Resolved',    color: '#22c55e', bg: '#22c55e25' },
  CLOSED:      { label: 'Closed',      color: '#94a3b8', bg: '#94a3b825' },
};

function TicketStatusBadge({ status }) {
  const m = TICKET_STATUS_META[status] || TICKET_STATUS_META.OPEN;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700,
      padding:'3px 9px', borderRadius:99, background:m.bg, color:m.color }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:m.color }} />
      {m.label}
    </span>
  );
}

function AdminSupportTab() {
  const { user }            = useAuth();
  const { lastSupportMsg }  = useNotifications();
  const [tickets, setTickets]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filterStatus, setFilterSt] = useState('');
  const [activeTicket, setActive]   = useState(null);
  const [reply, setReply]           = useState('');
  const [sending, setSend]          = useState(false);
  const [updatingStatus, setUpdSt]  = useState(false);
  const [search, setSearch]         = useState('');
  const bottomRef = useRef(null);

  useEffect(() => { fetchAll(); }, [filterStatus]);

  // Append incoming message directly from SSE payload — zero extra API calls
  useEffect(() => {
    if (!lastSupportMsg || !activeTicket) return;
    if (lastSupportMsg.ticketId !== activeTicket._id) return;
    setActive(prev => ({
      ...prev,
      status:   lastSupportMsg.status,
      messages: [...(prev.messages || []), lastSupportMsg.message],
    }));
  }, [lastSupportMsg]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTicket?.messages]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await supportApi.getAllTickets({ status: filterStatus || undefined, limit: 100 });
      setTickets(res.data?.data?.data || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const openTicket = async (id) => {
    try {
      const res = await supportApi.getTicket(id);
      setActive(res.data?.data?.ticket);
    } catch { /* ignore */ }
  };

  const sendReply = async () => {
    if (!reply.trim() || !activeTicket) return;
    setSend(true);
    try {
      const res = await supportApi.replyToTicket(activeTicket._id, { message: reply.trim() });
      setReply('');
      const updated = res.data?.data?.ticket;
      setActive(updated);
      setTickets(prev => prev.map(t => t._id === updated._id ? { ...t, status: updated.status, updatedAt: updated.updatedAt } : t));
    } catch { /* ignore */ } finally { setSend(false); }
  };

  const changeStatus = async (status) => {
    if (!activeTicket) return;
    setUpdSt(true);
    try {
      const res = await supportApi.updateStatus(activeTicket._id, { status });
      const updated = res.data?.data?.ticket;
      setActive(prev => ({ ...prev, status: updated.status }));
      setTickets(prev => prev.map(t => t._id === updated._id ? { ...t, status: updated.status } : t));
    } catch { /* ignore */ } finally { setUpdSt(false); }
  };

  const isClosed = activeTicket && ['RESOLVED','CLOSED'].includes(activeTicket.status);

  if (activeTicket) {
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {/* Ticket header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <Btn onClick={() => { setActive(null); fetchAll(); }}>← Back to tickets</Btn>
          <div style={{ flex:1, fontWeight:800, fontSize:16 }}>{activeTicket.subject}</div>
          <TicketStatusBadge status={activeTicket.status} />
          <Select value={activeTicket.status} onChange={e => changeStatus(e.target.value)}
            style={{ opacity: updatingStatus ? 0.6 : 1 }}>
            {Object.keys(TICKET_STATUS_META).map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </Select>
        </div>

        <div style={{ fontSize:13, color:C.mute }}>
          From: <strong style={{ color: C.text }}>{activeTicket.user?.name}</strong> ({activeTicket.user?.email})
          {activeTicket.order && <> · Order #{activeTicket.order.orderNumber || activeTicket.order._id?.slice(-8).toUpperCase()}</>}
          {' · '}#{activeTicket._id?.slice(-8).toUpperCase()}
        </div>

        {/* Messages */}
        <Card>
          <div style={{ display:'flex', flexDirection:'column', gap:10, maxHeight:420, overflowY:'auto' }}>
            {(activeTicket.messages || []).map((msg, i) => {
              const isAdmin = msg.senderRole === 'admin';
              return (
                <div key={i} style={{ display:'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth:'72%' }}>
                    {!isAdmin && (
                      <div style={{ fontSize:11, fontWeight:700, color: C.mute, marginBottom:4, paddingLeft:4 }}>
                        {msg.sender?.name || activeTicket.user?.name}
                      </div>
                    )}
                    <div style={{
                      padding:'10px 14px',
                      borderRadius: isAdmin ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isAdmin ? C.accent : C.bg,
                      color: isAdmin ? 'white' : C.text,
                      border: isAdmin ? 'none' : `1px solid ${C.line}`,
                      fontSize:13, lineHeight:1.6,
                    }}>
                      {msg.text}
                    </div>
                    <div style={{ fontSize:10, color:'#aaa', marginTop:3,
                      textAlign: isAdmin ? 'right' : 'left', paddingLeft:4 }}>
                      {new Date(msg.createdAt).toLocaleString('en-IN',{ hour:'2-digit', minute:'2-digit', day:'numeric', month:'short' })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </Card>

        {/* Reply box */}
        {isClosed ? (
          <div style={{ background:C.surf, border:`1px solid ${C.line}`, borderRadius:10,
            padding:'12px 16px', textAlign:'center', color:C.mute, fontSize:13 }}>
            This ticket is {activeTicket.status.toLowerCase()}. No further replies.
          </div>
        ) : (
          <Card>
            <div style={{ marginBottom:8, fontWeight:700, fontSize:13 }}>Reply as Support Team</div>
            <textarea value={reply} onChange={e => setReply(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
              placeholder="Type your reply… (Enter to send)"
              rows={4}
              style={{ width:'100%', border:`1px solid ${C.line}`, borderRadius:8, padding:'10px 12px',
                fontSize:13, resize:'vertical', outline:'none', fontFamily:'inherit', boxSizing:'border-box', marginBottom:10, background: C.bg, color: C.text }} />
            <Btn variant="primary" onClick={sendReply} disabled={sending || !reply.trim()}>
              {sending ? 'Sending…' : 'Send Reply'}
            </Btn>
          </Card>
        )}
      </div>
    );
  }

  const sq = search.trim().toLowerCase();
  const visibleTickets = tickets.filter(t => {
    if (!sq) return true;
    return (
      t._id?.toLowerCase().includes(sq) ||
      t._id?.slice(-8).toLowerCase().includes(sq) ||
      t.subject?.toLowerCase().includes(sq) ||
      t.user?.name?.toLowerCase().includes(sq) ||
      t.user?.email?.toLowerCase().includes(sq) ||
      t.user?.phone?.toLowerCase().includes(sq) ||
      t.order?.orderNumber?.toLowerCase().includes(sq) ||
      t.order?._id?.slice(-8).toLowerCase().includes(sq)
    );
  });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        <Select value={filterStatus} onChange={e => setFilterSt(e.target.value)}>
          <option value="">All Status</option>
          {Object.keys(TICKET_STATUS_META).map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
        </Select>
        {/* Search */}
        <div style={{ display:'flex', alignItems:'center', gap:8, background:C.bg, border:`1px solid ${C.line}`, borderRadius:8, padding:'0 10px', height:36, flex:1, maxWidth:340 }}>
          <span style={{ color:C.mute, display:'flex', alignItems:'center', flexShrink:0 }}><SvgAt el={Icon.search} size={14} /></span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Name, email, phone, ticket ID, order #…"
            style={{ flex:1, border:'none', outline:'none', background:'transparent', fontSize:12.5, color:C.text, fontFamily:'inherit', minWidth:0 }} />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ background:'none', border:'none', color:C.mute, cursor:'pointer', padding:0, fontSize:14, lineHeight:1 }}>✕</button>
          )}
        </div>
        <Btn onClick={fetchAll}>Refresh</Btn>
      </div>

      {loading ? <Loader /> : visibleTickets.length === 0 ? (
        <Empty text={sq ? 'No tickets match your search' : 'No support tickets found'} />
      ) : (
        <Card>
          <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <Th>Ticket</Th>
                <Th>User</Th>
                <Th>Order</Th>
                <Th>Status</Th>
                <Th>Last Updated</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {visibleTickets.map(t => (
                <tr key={t._id}>
                  <Td>
                    <div style={{ fontWeight:700, fontSize:13 }}>{t.subject}</div>
                    <div style={{ fontSize:11, color:C.mute }}>#{t._id?.slice(-8).toUpperCase()}</div>
                  </Td>
                  <Td>
                    <div style={{ fontWeight:600, fontSize:13 }}>{t.user?.name}</div>
                    <div style={{ fontSize:11, color:C.mute }}>{t.user?.email}</div>
                  </Td>
                  <Td>{t.order ? `#${t.order.orderNumber || t.order._id?.slice(-8).toUpperCase()}` : '—'}</Td>
                  <Td><TicketStatusBadge status={t.status} /></Td>
                  <Td style={{ color:C.mute, fontSize:12 }}>
                    {new Date(t.updatedAt).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                  </Td>
                  <Td>
                    <Btn variant="primary" onClick={() => openTicket(t._id)}>Open</Btn>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */

/* ════════════════════ SETTINGS TAB ════════════════════ */
function AdminSettingsTab() {
  const [cfg, setCfg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    settingsApi.getCodSettings()
      .then(r => {
        const s = r.data?.data?.codSettings || {};
        setCfg({
          minOrderAmount: s.minOrderAmount ?? 0,
          maxOrderAmount: s.maxOrderAmount ?? 0,
          codEnabled:     s.codEnabled     ?? true,
          bookingEnabled: s.bookingEnabled ?? false,
          bookingType:    s.bookingType    ?? 'flat',
          bookingValue:   s.bookingValue   ?? 500,
        });
      })
      .catch(() => {});
  }, []);

  const set = (k, v) => setCfg(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    setSaving(true);
    await settingsApi.updateCodSettings(cfg).catch(() => {});
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!cfg) return <div style={{ padding: 40, textAlign: 'center', color: C.mute }}>Loading settings…</div>;

  const inp = {
    width: '100%', height: 40, padding: '0 12px',
    border: `1px solid ${C.line}`, borderRadius: 8, fontSize: 14, fontWeight: 600,
    outline: 'none', boxSizing: 'border-box', background: C.bg, color: C.text, fontFamily: 'inherit',
  };
  const lbl = { fontSize: 11.5, fontWeight: 600, color: C.mute, display: 'block', marginBottom: 6 };
  const hint = { fontSize: 11, color: C.mute, marginTop: 5 };

  function Toggle({ on, onChange }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={onChange}>
        <div style={{ position: 'relative', width: 44, height: 24 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: on ? C.accent : C.mute, transition: 'background .2s' }} />
          <div style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: on ? C.green : C.mute, minWidth: 52 }}>{on ? 'Enabled' : 'Disabled'}</span>
      </div>
    );
  }

  function SectionCard({ icon, title, sub, children, toggle }) {
    return (
      <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.line}`, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, background: 'rgba(249,115,22,.12)', color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: C.text }}>{title}</div>
            {sub && <div style={{ fontSize: 11.5, color: C.mute, marginTop: 1 }}>{sub}</div>}
          </div>
          {toggle}
        </div>
        <div style={{ padding: '20px' }}>{children}</div>
      </div>
    );
  }

  const numVal = v => v === 0 ? '' : v;
  const numChg = (k) => (e) => set(k, e.target.value === '' ? 0 : Number(e.target.value));

  return (
    <div style={{ maxWidth: 620 }}>
      <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.line}`, overflow: 'hidden' }}>

        {/* ── Row: Order limits ── */}
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.line}` }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 2 }}>COD Order Amount Limits</div>
          <div style={{ fontSize: 11.5, color: C.mute, marginBottom: 14 }}>Applies to COD orders only. Online (Razorpay) orders have no restrictions. Leave empty for no limit.</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl}>Minimum Amount (Rs.)</label>
              <input type="number" min="0" value={numVal(cfg.minOrderAmount)} placeholder="No minimum"
                onChange={numChg('minOrderAmount')} style={inp} />
            </div>
            <div>
              <label style={lbl}>Maximum Amount (Rs.)</label>
              <input type="number" min="0" value={numVal(cfg.maxOrderAmount)} placeholder="No maximum"
                onChange={numChg('maxOrderAmount')} style={inp} />
            </div>
          </div>
        </div>

        {/* ── Row: COD toggle + Booking toggle ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${C.line}` }}>
          {/* COD enabled */}
          <div style={{ padding: '18px 22px', borderRight: `1px solid ${C.line}` }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 2 }}>Cash on Delivery</div>
            <div style={{ fontSize: 11.5, color: C.mute, marginBottom: 14 }}>Allow customers to pay cash on delivery.</div>
            <Toggle on={cfg.codEnabled} onChange={() => set('codEnabled', !cfg.codEnabled)} />
          </div>
          {/* Booking enabled */}
          <div style={{ padding: '18px 22px' }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 2 }}>COD Booking Amount</div>
            <div style={{ fontSize: 11.5, color: C.mute, marginBottom: 14 }}>Collect non-refundable advance via Razorpay for COD orders.</div>
            <Toggle on={cfg.bookingEnabled} onChange={() => set('bookingEnabled', !cfg.bookingEnabled)} />
          </div>
        </div>

        {/* ── Row: Booking fields (only when booking enabled) ── */}
        {cfg.bookingEnabled && (
          <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.line}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={lbl}>Booking Amount Type</label>
                <select value={cfg.bookingType} onChange={e => set('bookingType', e.target.value)}
                  style={{ ...inp, fontWeight: 500 }}>
                  <option value="flat">Fixed Amount (Rs.)</option>
                  <option value="percent">Percentage of Order (%)</option>
                </select>
              </div>
              <div>
                <label style={lbl}>{cfg.bookingType === 'percent' ? 'Percentage (%)' : 'Amount (Rs.)'}</label>
                <input type="number" min="0" max={cfg.bookingType === 'percent' ? 100 : undefined}
                  value={numVal(cfg.bookingValue)} placeholder="e.g. 500"
                  onChange={numChg('bookingValue')} style={inp} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ background: C.accent + '12', border: `1px solid ${C.accent}30`, borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>Preview</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>
                  {cfg.bookingType === 'percent' ? `${cfg.bookingValue || 0}% of order total` : `Rs. ${Number(cfg.bookingValue || 0).toLocaleString('en-IN')}`}
                </div>
                <div style={{ fontSize: 11, color: C.mute, marginTop: 2 }}>Razorpay (UPI) · Non-refundable</div>
              </div>
              <div style={{ background: 'rgba(239,68,68,.08)', border: `1px solid rgba(239,68,68,.2)`, borderRadius: 8, padding: '12px 14px', fontSize: 12, color: '#f87171', display: 'flex', alignItems: 'center' }}>
                ⚠ This booking is <strong>&nbsp;non-refundable&nbsp;</strong> and collected before the order is confirmed.
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Btn variant="primary" onClick={save} disabled={saving} style={{ padding: '9px 26px' }}>
            {saving ? 'Saving…' : 'Save Settings'}
          </Btn>
          {saved && <span style={{ color: C.green, fontWeight: 600, fontSize: 13 }}>✓ Saved</span>}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */

const NAV_SECTIONS = [
  {
    label: null,
    tabs: [
      { id: 'Overview',      iconEl: Icon.grid },
      { id: 'Users',         iconEl: Icon.users },
      { id: 'Employees',     iconEl: Icon.person },
      { id: 'Orders',        iconEl: Icon.orders },
      { id: 'Returns',       iconEl: Icon.refund },
      { id: 'Coupons',       iconEl: Icon.coupon },
      { id: 'Notifications', iconEl: Icon.bell },
      { id: 'Support',       iconEl: Icon.support },
    ],
  },
  {
    label: 'CATALOG',
    tabs: [
      { id: 'Catalog',  iconEl: Icon.book },
    ],
  },
  {
    label: 'SETTINGS',
    tabs: [
      { id: 'Settings', iconEl: Icon.gear },
    ],
  },
];

const TABS = NAV_SECTIONS.flatMap(s => s.tabs);

export default function AdminDashboard() {
  const { isMobile, isTablet } = useResponsive();
  const [tab, setTab]               = useState('Overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openTicketCount, setOTC]   = useState(0);
  const navigate                    = useNavigate();
  const { user, logout }            = useAuth();
  const { notifications }           = useNotifications();

  // Fetch open ticket count on mount
  useEffect(() => {
    supportApi.getAllTickets({ status: 'OPEN', limit: 1 })
      .then(res => setOTC(res.data?.data?.pagination?.total ?? 0))
      .catch(() => {});
  }, []);

  // Increment badge when a new support ticket SSE notification arrives
  useEffect(() => {
    const latest = notifications[0];
    if (latest && latest.title?.includes('Support Ticket') && tab !== 'Support') {
      setOTC(prev => prev + 1);
    }
  }, [notifications]);

  // Clear badge when Support tab is opened
  const handleTabClick = (id) => {
    setTab(id);
    if (id === 'Support') setOTC(0);
    if (isMobile) setSidebarOpen(false);
  };

  // Overview "View all" shortcut links dispatch this event
  useEffect(() => {
    const handler = (e) => handleTabClick(e.detail);
    window.addEventListener('overview-nav', handler);
    return () => window.removeEventListener('overview-nav', handler);
  }, [isMobile]);

  if (user && user.role !== 'admin') { navigate('/'); return null; }

  const TAB_SUBTITLES = {
    Overview:      'Welcome back, Admin! Here\'s what\'s happening with your store today.',
    Users:         'Manage all registered accounts',
    Employees:     'Manage and verify employee accounts',
    Orders:        'View and manage all customer orders',
    Returns:       'Monitor and take action on all return & refund requests',
    Coupons:       'Create and manage discount coupons for customers',
    Notifications: 'Broadcast notifications to customers, employees, or everyone',
    Support:       'View and respond to customer support tickets',
    Catalog:       'Manage brands, categories, sub-categories, attributes and events',
    Settings:      'Configure COD availability, order amount limits, and booking payments',
  };
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Mobile sidebar backdrop ── */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 99 }} />
      )}

      {/* ── Sidebar ── */}
      <div style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, width: 220,
        background: C.sidebar, display: 'flex', flexDirection: 'column',
        zIndex: 100, borderRight: `1px solid ${C.line}`,
        transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
        transition: 'transform .25s ease',
      }}>

        {/* Logo */}
        <div style={{ padding: '20px 18px 18px', borderBottom: `1px solid ${C.line}` }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 19, color: C.text, letterSpacing: '-.4px', lineHeight: 1 }}>
            <span style={{ color: C.accent }}>Trade</span>Engine
          </div>
          <div style={{ fontSize: 11, color: C.mute, marginTop: 4, fontWeight: 500, letterSpacing: '.02em' }}>Admin Panel</div>
        </div>

        {/* Nav sections */}
        <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }}>
          {NAV_SECTIONS.map((section, si) => (
            <div key={si} style={{ marginBottom: 4 }}>
              {section.label && (
                <div style={{ padding: '12px 10px 5px', fontSize: 10, fontWeight: 600, color: C.mute, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                  {section.label}
                </div>
              )}
              {section.tabs.map(t => {
                const active = tab === t.id;
                const label = t.id === 'Support' ? 'Support Tickets' : t.id;
                return (
                  <button key={t.id} onClick={() => handleTabClick(t.id)}
                    style={{
                      width: '100%', textAlign: 'left',
                      padding: '9px 12px',
                      background: active ? C.active : 'transparent',
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 10,
                      color: active ? C.text : C.sub,
                      fontWeight: active ? 600 : 400,
                      fontSize: 13.5,
                      borderRadius: 8,
                      transition: 'all .12s',
                      marginBottom: 2,
                    }}>
                    <span style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: active ? C.accent : 'inherit',
                      opacity: active ? 1 : 0.75, flexShrink: 0,
                    }}>
                      <SvgAt el={t.iconEl} size={17} />
                    </span>
                    <span style={{ flex: 1 }}>{label}</span>
                    {t.id === 'Support' && openTicketCount > 0 && (
                      <span style={{
                        background: C.red, color: 'white', fontSize: 10, fontWeight: 700,
                        minWidth: 18, height: 18, borderRadius: 99, display: 'flex',
                        alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                      }}>{openTicketCount > 99 ? '99+' : openTicketCount}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div style={{ padding: '12px 10px', borderTop: `1px solid ${C.line}` }}>
          {/* User row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, marginBottom: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Syne', sans-serif", fontWeight: 800, color: 'white', fontSize: 14, flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: C.mute }}>Admin</div>
            </div>
          </div>
          {/* Back to store */}
          <button onClick={() => navigate('/')}
            style={{
              width: '100%', padding: '8px 12px',
              background: 'rgba(255,255,255,.04)', border: `1px solid ${C.line}`,
              borderRadius: 8, color: C.sub, fontWeight: 500, fontSize: 13,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: 'inherit',
            }}>
            <span style={{ flex: 1, textAlign: 'left' }}>Back to Store</span>
            <span style={{ color: C.mute, display: 'flex', alignItems: 'center' }}>{Icon.extlink}</span>
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ marginLeft: isMobile ? 0 : 220, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* ── Topbar ── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 90,
          background: C.sidebar, borderBottom: `1px solid ${C.line}`,
          padding: isMobile ? '0 14px' : '0 24px', height: 58, display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14,
        }}>
          {/* Hamburger */}
          <div onClick={() => setSidebarOpen(s => !s)}
            style={{ color: C.mute, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {Icon.menu}
          </div>

          {/* Search — hidden on mobile */}
          {!isMobile && (
            <div style={{
              flex: 1, maxWidth: 380,
              display: 'flex', alignItems: 'center', gap: 8,
              background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8,
              padding: '0 12px', height: 36,
            }}>
              <span style={{ color: C.mute, display: 'flex', alignItems: 'center' }}>{Icon.search}</span>
              <input placeholder="Search orders, users, products…" style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontSize: 13, color: C.text, fontFamily: "'DM Sans', sans-serif",
              }} />
            </div>
          )}
          {/* Mobile: page title in topbar */}
          {isMobile && (
            <div style={{ flex: 1, fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {tab}
            </div>
          )}

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginLeft: 'auto' }}>
            {/* Notification bell */}
            <div style={{ position: 'relative', cursor: 'pointer', color: C.mute, display: 'flex', alignItems: 'center' }}
              onClick={() => handleTabClick('Notifications')}>
              {Icon.bell}
              {openTicketCount > 0 && (
                <span style={{
                  position: 'absolute', top: -5, right: -5, background: C.red, color: 'white',
                  fontSize: 9, fontWeight: 800, minWidth: 16, height: 16, borderRadius: 99,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
                }}>{openTicketCount}</span>
              )}
            </div>
            {/* User chip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Syne', sans-serif", fontWeight: 800, color: 'white', fontSize: 13, flexShrink: 0,
              }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              {!isMobile && (
                <>
                  <div style={{ lineHeight: 1.25 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{user?.name}</div>
                    <div style={{ fontSize: 11, color: C.mute }}>Administrator</div>
                  </div>
                </>
              )}
            </div>
            {/* Logout */}
            <button onClick={() => { logout(); navigate('/login'); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.red + '18', border: `1px solid ${C.red}44`,
                borderRadius: 8, padding: '6px 14px', color: C.red, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              {!isMobile && 'Logout'}
            </button>
          </div>
        </div>

        {/* ── Page content ── */}
        <div style={{ padding: isMobile ? '18px 14px' : isTablet ? '22px 20px' : '28px 30px', flex: 1 }}>
          {/* Page title — hidden on mobile (shown in topbar instead) */}
          {!isMobile && (
            <div style={{ marginBottom: 22 }}>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 700, color: C.text, margin: 0, lineHeight: 1 }}>{tab}</h1>
              <p style={{ color: C.mute, margin: '6px 0 0', fontSize: 13 }}>{TAB_SUBTITLES[tab]}</p>
            </div>
          )}

          {tab === 'Overview'      && <OverviewTab />}
          {tab === 'Users'         && <UsersTab />}
          {tab === 'Employees'     && <EmployeesTab />}
          {tab === 'Orders'        && <OrdersTab />}
          {tab === 'Returns'       && <AdminReturnsTab />}
          {tab === 'Coupons'       && <AdminCouponsTab />}
          {tab === 'Notifications' && <AdminNotificationsTab />}
          {tab === 'Support'       && <AdminSupportTab />}
          {tab === 'Catalog'       && <AdminCatalogTab />}
          {tab === 'Settings'      && <AdminSettingsTab />}
        </div>
      </div>
    </div>
  );
}


