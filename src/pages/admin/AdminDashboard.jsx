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

/* ── palette ── */
const C = {
  accent: '#FF5A1F',
  blue:   '#3b82f6',
  green:  '#22c55e',
  yellow: '#f59e0b',
  purple: '#8b5cf6',
  red:    '#ef4444',
  cyan:   '#06b6d4',
  pink:   '#ec4899',
  mute:   '#6b7280',
  line:   '#e5e7eb',
  surf:   '#f9fafb',
};

const STATUS_COLORS = {
  PLACED: C.yellow, CONFIRMED: C.blue, PACKED: C.purple,
  SHIPPED: C.cyan, OUT_FOR_DELIVERY: C.accent, DELIVERED: C.green,
  CANCELLED: C.red, RETURNED: C.mute,
};

const ROLE_COLORS = { admin: C.purple, seller: C.yellow, user: C.blue };

/* ── shared helpers ── */
const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtRs = (n) => `Rs. ${fmt(n)}`;

function Badge({ text, color }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, fontWeight: 700,
      padding: '2px 9px', borderRadius: 99,
      background: color + '20', color,
    }}>{text}</span>
  );
}

function KpiCard({ label, value, sub, color, icon }) {
  return (
    <div style={{
      background: 'white', borderRadius: 16, padding: '22px 24px',
      flex: 1, minWidth: 170, boxShadow: '0 1px 3px #0000000d',
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.mute, marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)' }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: C.mute, marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{ fontSize: 28, opacity: .6 }}>{icon}</div>
      </div>
    </div>
  );
}

function Card({ title, children, action }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 3px #0000000d', overflow: 'hidden' }}>
      {(title || action) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px 0' }}>
          {title && <div style={{ fontWeight: 800, fontSize: 15 }}>{title}</div>}
          {action}
        </div>
      )}
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  );
}

function Th({ children }) {
  return <th style={{ textAlign: 'left', padding: '8px 14px', fontSize: 11, fontWeight: 700, color: C.mute, letterSpacing: '.06em', textTransform: 'uppercase', borderBottom: `1px solid ${C.line}`, whiteSpace: 'nowrap' }}>{children}</th>;
}
function Td({ children, style }) {
  return <td style={{ padding: '11px 14px', fontSize: 13, borderBottom: `1px solid ${C.line}`, ...style }}>{children}</td>;
}
function Input({ value, onChange, placeholder, style }) {
  return <input value={value} onChange={onChange} placeholder={placeholder}
    style={{ height: 36, border: `1px solid ${C.line}`, borderRadius: 8, padding: '0 12px', fontSize: 13, outline: 'none', background: C.surf, ...style }} />;
}
function Select({ value, onChange, children, style }) {
  return <select value={value} onChange={onChange}
    style={{ height: 36, border: `1px solid ${C.line}`, borderRadius: 8, padding: '0 10px', fontSize: 13, background: C.surf, cursor: 'pointer', ...style }}>{children}</select>;
}
function Btn({ children, onClick, disabled, variant = 'ghost', style }) {
  const base = { fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8, cursor: 'pointer', border: 'none', transition: 'all .15s', ...style };
  const variants = {
    ghost:   { background: C.surf, color: C.mute, border: `1px solid ${C.line}` },
    danger:  { background: '#ef444414', color: C.red },
    success: { background: '#22c55e14', color: C.green },
    warn:    { background: '#f59e0b14', color: C.yellow },
    primary: { background: C.accent, color: 'white' },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], opacity: disabled ? .5 : 1 }}>{children}</button>;
}

/* ══════════════════════════════════════════════════════
   OVERVIEW TAB
══════════════════════════════════════════════════════ */
function OverviewTab() {
  const [stats, setStats]       = useState(null);
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([adminApi.getOrderStats(), adminApi.getOrders({ limit: 8 })])
      .then(([s, o]) => {
        setStats(s.data?.data || {});
        setOrders(o.data?.data?.data || []);
      }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const breakdown = stats?.statusBreakdown || [];
  const delivered = breakdown.find(b => b._id === 'DELIVERED')?.count || 0;
  const inProgress = breakdown.filter(b => ['PLACED','CONFIRMED','PACKED','SHIPPED','OUT_FOR_DELIVERY'].includes(b._id)).reduce((a,b) => a+b.count, 0);
  const cancelled = breakdown.find(b => b._id === 'CANCELLED')?.count || 0;
  const total = stats?.totalOrders || 0;

  const donutData = breakdown.map(b => ({ name: b._id, value: b.count }));

  // Fake monthly trend using breakdown data (real would need a /stats/monthly endpoint)
  const barData = breakdown.map(b => ({ name: b._id.slice(0,4), count: b.count }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI row */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Total Orders"   value={fmt(total)}                   sub={`${delivered} delivered`}    color={C.blue}   icon="📦" />
        <KpiCard label="Revenue"        value={fmtRs(stats?.totalRevenue)}   sub="From paid orders"            color={C.green}  icon="💰" />
        <KpiCard label="In Progress"    value={fmt(inProgress)}              sub="Active orders"               color={C.yellow} icon="🚚" />
        <KpiCard label="Cancelled"      value={fmt(cancelled)}               sub="Cancelled orders"            color={C.red}    icon="❌" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 20 }}>
        <Card title="Order Status">
          {donutData.length === 0
            ? <Empty text="No order data yet" />
            : <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                    paddingAngle={3} dataKey="value">
                    {donutData.map(d => <Cell key={d.name} fill={STATUS_COLORS[d.name] || C.mute} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
          }
        </Card>

        <Card title="Orders by Status">
          {barData.length === 0
            ? <Empty text="No data" />
            : <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6,6,0,0]}>
                    {barData.map(d => <Cell key={d.name} fill={STATUS_COLORS[d.name.toUpperCase().slice(0,4)] || C.accent} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
          }
        </Card>
      </div>

      {/* Recent orders */}
      <Card title="Recent Orders">
        {orders.length === 0
          ? <Empty text="No orders yet" />
          : <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <Th>Order #</Th><Th>Customer</Th><Th>Items</Th><Th>Total</Th><Th>Payment</Th><Th>Status</Th><Th>Date</Th>
              </tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id}>
                    <Td><span style={{ fontWeight: 700 }}>{o.orderNumber}</span></Td>
                    <Td><div style={{ fontWeight: 600 }}>{o.user?.name || '—'}</div><div style={{ fontSize: 11, color: C.mute }}>{o.user?.email}</div></Td>
                    <Td>{o.orderItems?.length}</Td>
                    <Td><span style={{ fontWeight: 700 }}>{fmtRs(o.totalPrice)}</span></Td>
                    <Td><Badge text={o.paymentStatus} color={o.paymentStatus === 'PAID' ? C.green : C.yellow} /></Td>
                    <Td><Badge text={o.orderStatus} color={STATUS_COLORS[o.orderStatus] || C.mute} /></Td>
                    <Td style={{ color: C.mute, fontSize: 12 }}>{new Date(o.createdAt).toLocaleDateString()}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </Card>
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

  const roleCounts = { admin: 0, seller: 0, user: 0 };
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
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Total Users"   value={fmt(all.length)}            sub="All accounts"            color={C.blue}   icon="👥" />
        <KpiCard label="Admins"        value={fmt(roleCounts.admin)}      sub="Admin accounts"          color={C.purple} icon="🛡️" />
        <KpiCard label="Sellers"       value={fmt(roleCounts.seller)}     sub="Seller accounts"         color={C.yellow} icon="🏪" />
        <KpiCard label="Customers"     value={fmt(roleCounts.user)}       sub="Regular users"           color={C.green}  icon="🛍️" />
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
              <option value="seller">Seller</option>
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
function SellersTab() {
  const [all, setAll]         = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState(null);
  const [search, setSearch]   = useState('');
  const [verFilter, setVer]   = useState('');

  useEffect(() => {
    adminApi.getSellers({ limit: 200 })
      .then(r => setAll(r.data?.data?.data || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const sellers = all.filter(s => {
    const q = search.toLowerCase();
    const matchQ = !q || s.shopName?.toLowerCase().includes(q) || s.user?.name?.toLowerCase().includes(q) || s.user?.email?.toLowerCase().includes(q);
    const matchV = !verFilter || (verFilter === 'verified' ? s.isVerified : !s.isVerified);
    return matchQ && matchV;
  });

  const verified = all.filter(s => s.isVerified).length;

  const handleVerify = async (id, isVerified) => {
    setBusy(id);
    await adminApi.verifySeller(id).catch(() => {});
    setAll(prev => prev.map(x => x._id === id ? { ...x, isVerified: !isVerified } : x));
    setBusy(null);
  };

  if (loading) return <Loader />;

  const donutData = [
    { name: 'Verified', value: verified },
    { name: 'Pending', value: all.length - verified },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Total Sellers" value={fmt(all.length)} sub="Registered shops" color={C.yellow} icon="🏪" />
        <KpiCard label="Verified"      value={fmt(verified)}   sub="Approved sellers" color={C.green}  icon="✅" />
        <KpiCard label="Pending"       value={fmt(all.length - verified)} sub="Awaiting approval" color={C.red} icon="⏳" />
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
            Showing <strong>{sellers.length}</strong> of <strong>{all.length}</strong> sellers
          </div>
        </Card>
      </div>

      <Card title={`Sellers (${sellers.length})`}>
        {sellers.length === 0
          ? <Empty text="No sellers match your filters" />
          : <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <Th>Shop</Th><Th>Owner</Th><Th>Contact</Th><Th>Rating</Th><Th>Total Sales</Th><Th>Registered</Th><Th>Status</Th><Th>Action</Th>
                </tr></thead>
                <tbody>
                  {sellers.map(s => (
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

  if (loading) return <Loader />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                  <Th>Order #</Th><Th>Customer</Th><Th>Items</Th><Th>Total</Th><Th>Method</Th><Th>Payment</Th><Th>Date</Th><Th>Status</Th><Th>Update</Th>
                </tr></thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o._id} style={{ opacity: updating === o._id ? .5 : 1 }}>
                      <Td><span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 12 }}>{o.orderNumber}</span></Td>
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
                        <select value={o.orderStatus} disabled={updating === o._id || ['DELIVERED','CANCELLED','RETURNED'].includes(o.orderStatus)}
                          onChange={e => handleStatusChange(o._id, e.target.value)}
                          style={{ fontSize: 12, padding: '5px 8px', borderRadius: 8, border: `1px solid ${C.line}`, background: 'white', cursor: 'pointer' }}>
                          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
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

/* ── Shared micro-components ─────────────────────── */
function Loader() {
  return (
    <div style={{ padding: 60, textAlign: 'center', color: C.mute }}>
      <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 12px' }} />
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
  'REQUESTED','SELLER_APPROVED','SELLER_REJECTED',
  'APPROVED','REJECTED','PICKUP_SCHEDULED',
  'ITEM_RECEIVED','REFUND_INITIATED','REFUND_COMPLETED',
  'REPLACEMENT_SENT','COMPLETED',
];

const RETURN_STATUS_META = {
  REQUESTED:        { label:'Requested',        color:'#f59e0b' },
  SELLER_APPROVED:  { label:'Seller Approved',  color:'#3b82f6' },
  SELLER_REJECTED:  { label:'Seller Rejected',  color:'#ef4444' },
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
  const [returns, setReturns]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('ALL');
  const [actionId, setActionId]     = useState(null);
  const [actionForm, setActionForm] = useState({ status:'', adminNote:'', refundAmount:'' });
  const [saving, setSaving]         = useState(false);

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
      await returnsApi.process(id, actionForm);
      setActionId(null); setActionForm({ status:'', adminNote:'', refundAmount:'' });
      load();
    } catch(e) {
      alert(e?.response?.data?.message || 'Action failed');
    } finally { setSaving(false); }
  };

  const filtered = filter === 'ALL' ? returns : returns.filter(r => r.status === filter);

  const stats = {
    total:          returns.length,
    sellerPending:  returns.filter(r => r.status === 'REQUESTED').length,
    sellerRejected: returns.filter(r => r.status === 'SELLER_REJECTED').length,
    adminPending:   returns.filter(r => r.status === 'SELLER_APPROVED').length,
    done:           returns.filter(r => ['COMPLETED','REJECTED','REFUND_COMPLETED','REPLACEMENT_SENT'].includes(r.status)).length,
    value:          returns.reduce((s, r) => s + (r.refundAmount || 0), 0),
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Flow explanation */}
      <div style={{ background:'white', borderRadius:12, padding:'14px 20px', boxShadow:'0 1px 3px #0000000d', display:'flex', gap:0, alignItems:'center', flexWrap:'wrap' }}>
        {[
          { icon:'📤', label:'Customer Submits', color:C.blue },
          { icon:'→', label:'', color:'#aaa' },
          { icon:'🏪', label:'Seller Approves/Rejects', color:C.yellow },
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
      <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
        <KpiCard label="Total Returns"      value={stats.total}          color={C.blue}   icon="↩️" />
        <KpiCard label="Awaiting Seller"    value={stats.sellerPending}  color={C.yellow} icon="🏪" sub="Seller hasn't responded" />
        <KpiCard label="Seller Rejected"    value={stats.sellerRejected} color={C.red}    icon="⚠️" sub="May need admin override" />
        <KpiCard label="Awaiting You"       value={stats.adminPending}   color={C.accent} icon="🛡️" sub="Seller approved — confirm" />
        <KpiCard label="Refund Value"       value={fmtRs(stats.value)}   color={C.green}  icon="💳" />
      </div>

      {/* Seller-rejected alert banner */}
      {stats.sellerRejected > 0 && (
        <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:12, padding:'14px 18px', display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:24 }}>⚠️</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:14, color:'#dc2626' }}>{stats.sellerRejected} return{stats.sellerRejected > 1 ? 's' : ''} rejected by seller — needs your review</div>
            <div style={{ fontSize:12, color:'#b91c1c', marginTop:2 }}>You can override the seller's decision and approve these returns if warranted.</div>
          </div>
          <button onClick={() => setFilter('SELLER_REJECTED')}
            style={{ padding:'7px 16px', borderRadius:8, background:'#dc2626', color:'white', border:'none', fontWeight:700, fontSize:13, cursor:'pointer' }}>
            Review Now
          </button>
        </div>
      )}

      <Card title="Return Requests">
        {/* Filter pills */}
        <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap' }}>
          <button key="ALL" onClick={() => setFilter('ALL')}
            style={{ padding:'5px 14px', borderRadius:99, fontSize:12, fontWeight:700, cursor:'pointer',
              border: filter==='ALL' ? `1px solid ${C.accent}` : `1px solid ${C.line}`,
              background: filter==='ALL' ? C.accent : 'white',
              color: filter==='ALL' ? 'white' : C.mute }}>
            All
          </button>
          {ADMIN_RETURN_STATUSES.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding:'5px 14px', borderRadius:99, fontSize:12, fontWeight:700, cursor:'pointer',
                border: filter===f ? `1px solid ${RETURN_STATUS_META[f]?.color}` : `1px solid ${C.line}`,
                background: filter===f ? RETURN_STATUS_META[f]?.color : 'white',
                color: filter===f ? 'white' : C.mute }}>
              {RETURN_STATUS_META[f]?.label || f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:40, color:C.mute }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:40, color:C.mute }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📦</div>
            <div style={{ fontWeight:700 }}>No returns in this category</div>
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
                      <div style={{ fontWeight:700, fontSize:13 }}>Return #{req._id?.slice(-8).toUpperCase()}</div>
                      <div style={{ fontSize:11, color:C.mute, marginTop:2 }}>
                        {req.user?.name} · {req.user?.email}
                      </div>
                    </div>
                    <ReturnStatusBadge status={req.status} />
                    <div style={{ fontSize:14, fontWeight:800, color:C.accent }}>
                      {fmtRs(req.refundAmount || 0)}
                    </div>
                    <button onClick={() => { setActionId(isOpen ? null : req._id); setActionForm({ status:'', adminNote:'', refundAmount: req.refundAmount || '' }); }}
                      style={{ padding:'6px 14px', borderRadius:8, background: isOpen ? '#e2e8f0' : C.accent, color: isOpen ? C.mute : 'white',
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
                      <div style={{ fontWeight:600, fontSize:13 }}>{req.product?.title || 'Product'}</div>
                      <div style={{ fontSize:12, color:C.mute, marginTop:2 }}>
                        Reason: <strong>{req.reason?.replace(/_/g,' ')}</strong>
                        {' · '}Resolution: <strong>{req.resolution || 'refund'}</strong>
                      </div>
                      {req.description && <div style={{ fontSize:12, color:'#666', marginTop:2 }}>"{req.description}"</div>}
                    </div>
                    <div style={{ textAlign:'right', fontSize:12, color:C.mute }}>
                      <div>Order: {req.order?.orderNumber || req.order?._id?.slice(-6)?.toUpperCase() || '—'}</div>
                      <div style={{ marginTop:4, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                        {req.order?.paymentMethod === 'COD' && (
                          <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:4, background:'#fef9c3', color:'#854d0e', border:'1px solid #fde047' }}>COD</span>
                        )}
                        {req.refundMethod === 'bank_transfer' && req.bankDetails?.accountNumber && (
                          <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:4, background:'#dcfce7', color:'#15803d' }}>Bank ✓</span>
                        )}
                        {req.refundMethod === 'upi' && req.bankDetails?.upiId && (
                          <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:4, background:'#dcfce7', color:'#15803d' }}>UPI ✓</span>
                        )}
                        {req.resolution === 'refund' && !req.bankDetails?.accountNumber && !req.bankDetails?.upiId && req.refundMethod !== 'original_payment' && (
                          <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:4, background:'#fee2e2', color:'#dc2626' }}>Bank details pending</span>
                        )}
                        {req.sellerNote && <span style={{ color:'#007185' }}>Seller replied</span>}
                      </div>
                    </div>
                  </div>

                  {/* Notes from seller */}
                  {(req.sellerNote || req.adminNote) && (
                    <div style={{ padding:'8px 18px', background:'#f8fafc', borderTop:`1px solid ${C.line}`, fontSize:12, color:'#555', display:'flex', gap:16, flexWrap:'wrap' }}>
                      {req.sellerNote && <span><strong>Seller:</strong> {req.sellerNote}</span>}
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
                    <div style={{ padding:'16px 18px', background:'#fffbf5', borderTop:`1px solid ${C.line}` }}>
                      <div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>Admin Action</div>

                      {/* Seller-rejection override notice */}
                      {req.status === 'SELLER_REJECTED' && (
                        <div style={{ background:'#fef9c3', border:'1px solid #fde047', borderRadius:8, padding:'10px 14px', marginBottom:12, fontSize:12, color:'#854d0e' }}>
                          ⚠️ <strong>Seller rejected this return.</strong> You can override and set status to <em>Approved</em> if the customer's claim is valid.
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
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                        <div>
                          <label style={{ fontSize:11, fontWeight:700, color:C.mute, display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.06em' }}>New Status *</label>
                          <select value={actionForm.status} onChange={e=>setActionForm(f=>({...f,status:e.target.value}))}
                            style={{ width:'100%', height:36, border:`1px solid ${C.line}`, borderRadius:8, padding:'0 10px', fontSize:13, outline:'none', background:'white' }}>
                            <option value="">— Select Status —</option>
                            {ADMIN_RETURN_STATUSES.map(s => (
                              <option key={s} value={s}>{RETURN_STATUS_META[s]?.label || s}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize:11, fontWeight:700, color:C.mute, display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.06em' }}>Refund Amount (Rs.)</label>
                          <input type="number" value={actionForm.refundAmount} onChange={e=>setActionForm(f=>({...f,refundAmount:e.target.value}))}
                            style={{ width:'100%', height:36, border:`1px solid ${C.line}`, borderRadius:8, padding:'0 10px', fontSize:13, outline:'none', background:'white', boxSizing:'border-box' }} />
                        </div>
                      </div>
                      <div style={{ marginBottom:12 }}>
                        <label style={{ fontSize:11, fontWeight:700, color:C.mute, display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.06em' }}>Note to Customer</label>
                        <textarea rows={2} value={actionForm.adminNote} onChange={e=>setActionForm(f=>({...f,adminNote:e.target.value}))}
                          placeholder="Message to customer about this update…"
                          style={{ width:'100%', border:`1px solid ${C.line}`, borderRadius:8, padding:'8px 12px', fontSize:13, resize:'none', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
                      </div>
                      <div style={{ display:'flex', gap:10 }}>
                        <button onClick={() => doProcess(req._id)} disabled={saving || !actionForm.status}
                          style={{ padding:'9px 24px', borderRadius:8, background: !actionForm.status ? '#e2e8f0' : C.accent, color: !actionForm.status ? C.mute : 'white',
                            border:'none', fontWeight:700, fontSize:13, cursor: actionForm.status ? 'pointer' : 'not-allowed', opacity: saving ? 0.6 : 1 }}>
                          {saving ? 'Saving…' : 'Update Return Status'}
                        </button>
                        <button onClick={() => setActionId(null)}
                          style={{ padding:'9px 20px', borderRadius:8, background:'white', border:`1px solid ${C.line}`, fontWeight:600, fontSize:13, cursor:'pointer', color:C.mute }}>
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
  const InpStyle   = { height:36, border:`1px solid ${C.line}`, borderRadius:8, padding:'0 12px', fontSize:13, outline:'none', background:'#f8fafc', width:'100%', boxSizing:'border-box' };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* KPIs */}
      <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
        <KpiCard label="Total Coupons" value={coupons.length} color={C.blue}   icon="🎟️" />
        <KpiCard label="Active"        value={active}         color={C.green}  icon="✅" />
        <KpiCard label="Expired"       value={expired}        color={C.red}    icon="⏰" />
        <KpiCard label="Inactive"      value={inactive}       color={C.mute}   icon="🔒" />
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
              style={{ padding:'10px 18px', borderRadius:8, background:'white', border:`1px solid ${C.line}`, fontWeight:600, fontSize:13, cursor:'pointer', color:C.mute }}>
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
                    <tr key={c._id} style={{ background: isExpired ? '#fff5f5' : 'white' }}>
                      <td style={{ padding:'10px 12px', borderBottom:`1px solid ${C.line}` }}>
                        <span style={{ fontFamily:'monospace', fontWeight:800, fontSize:13, background:'#f1f5f9', padding:'3px 8px', borderRadius:6, letterSpacing:'.08em' }}>
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
                            style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:6, background:'#f1f5f9', border:`1px solid ${C.line}`, cursor:'pointer', color:'#333' }}>
                            ✏️ Edit
                          </button>
                          <button onClick={()=>handleToggle(c)}
                            style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:6, background: c.isActive?'#fef2f2':'#f0fdf4', border:`1px solid ${c.isActive?C.red:C.green}`, cursor:'pointer', color:c.isActive?C.red:C.green }}>
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
  const InpStyle   = { height:36, border:`1px solid ${C.line}`, borderRadius:8, padding:'0 12px', fontSize:13, outline:'none', background:'#f8fafc', width:'100%', boxSizing:'border-box' };

  const TARGET_OPTIONS = [
    { value:'user',   label:'👤 All Customers', desc:'Every registered buyer' },
    { value:'seller', label:'🏪 All Sellers',    desc:'Every registered seller' },
    { value:'all',    label:'📢 Everyone',       desc:'All users on the platform' },
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
                { mode:'broadcast', label:'📢 Broadcast (group)' },
                { mode:'personal',  label:'👤 Personal (one user)' },
              ].map(opt => (
                <button key={opt.mode} onClick={() => set('sendMode', opt.mode)}
                  style={{ padding:'9px 20px', border:'none', cursor:'pointer', fontWeight:700, fontSize:13, transition:'all .15s',
                    background: form.sendMode===opt.mode ? C.accent : 'white',
                    color:      form.sendMode===opt.mode ? 'white' : C.mute }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Broadcast: pick role */}
          {form.sendMode === 'broadcast' && (
            <div style={{ gridColumn:'1/-1', display:'flex', gap:10, flexWrap:'wrap' }}>
              {TARGET_OPTIONS.map(opt => (
                <div key={opt.value} onClick={() => set('targetRole', opt.value)}
                  style={{ flex:'1 1 150px', padding:'12px 16px', borderRadius:10,
                    border:`2px solid ${form.targetRole===opt.value ? C.accent : C.line}`,
                    background: form.targetRole===opt.value ? C.accent+'10' : 'white', cursor:'pointer', transition:'all .15s' }}>
                  <div style={{ fontWeight:700, fontSize:13 }}>{opt.label}</div>
                  <div style={{ fontSize:11, color:C.mute, marginTop:2 }}>{opt.desc}</div>
                </div>
              ))}
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
                  background:'#f0fdf4', border:`1px solid ${C.green}`, fontSize:13, fontWeight:700, color:C.green, whiteSpace:'nowrap' }}>
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
            style={{ padding:'11px 18px', borderRadius:8, background:'white', border:`1px solid ${C.line}`, fontWeight:600, fontSize:13, cursor:'pointer', color:C.mute }}>
            Clear
          </button>
        </div>
      </Card>

      {/* Send history */}
      {history.length > 0 && (
        <Card title="Recent Sends">
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {history.map((h, i) => (
              <div key={i} style={{ display:'flex', gap:12, alignItems:'center', padding:'10px 14px', background:'#f8fafc', borderRadius:8, fontSize:13 }}>
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
  OPEN:        { label: 'Open',        color: '#3b82f6', bg: '#dbeafe' },
  IN_PROGRESS: { label: 'In Progress', color: '#f59e0b', bg: '#fef3c7' },
  RESOLVED:    { label: 'Resolved',    color: '#16a34a', bg: '#dcfce7' },
  CLOSED:      { label: 'Closed',      color: '#6b7280', bg: '#f3f4f6' },
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
          From: <strong style={{ color:'#0f172a' }}>{activeTicket.user?.name}</strong> ({activeTicket.user?.email})
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
                      <div style={{ fontSize:11, fontWeight:700, color:'#555', marginBottom:4, paddingLeft:4 }}>
                        {msg.sender?.name || activeTicket.user?.name}
                      </div>
                    )}
                    <div style={{
                      padding:'10px 14px',
                      borderRadius: isAdmin ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isAdmin ? C.accent : C.surf,
                      color: isAdmin ? 'white' : '#1a1a1a',
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
                fontSize:13, resize:'vertical', outline:'none', fontFamily:'inherit', boxSizing:'border-box', marginBottom:10 }} />
            <Btn variant="primary" onClick={sendReply} disabled={sending || !reply.trim()}>
              {sending ? 'Sending…' : 'Send Reply'}
            </Btn>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        <Select value={filterStatus} onChange={e => setFilterSt(e.target.value)}>
          <option value="">All Status</option>
          {Object.keys(TICKET_STATUS_META).map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
        </Select>
        <Btn onClick={fetchAll}>Refresh</Btn>
      </div>

      {loading ? <Loader /> : tickets.length === 0 ? (
        <Empty text="No support tickets found" />
      ) : (
        <Card>
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
              {tickets.map(t => (
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
        </Card>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */

const TABS = [
  { id: 'Overview',      icon: '📊' },
  { id: 'Users',         icon: '👥' },
  { id: 'Sellers',       icon: '🏪' },
  { id: 'Orders',        icon: '📦' },
  { id: 'Returns',       icon: '↩️' },
  { id: 'Coupons',       icon: '🎟️' },
  { id: 'Notifications', icon: '🔔' },
  { id: 'Support',       icon: '🎫' },
];

export default function AdminDashboard() {
  const [tab, setTab]               = useState('Overview');
  const [openTicketCount, setOTC]   = useState(0);
  const navigate                    = useNavigate();
  const { user }                    = useAuth();
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
  };

  if (user && user.role !== 'admin') { navigate('/'); return null; }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Sidebar */}
      <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 220, background: '#0f172a', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: 'white' }}>
            <span style={{ color: C.accent }}>Trade</span>Engine
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>Admin Panel</div>
        </div>

        {/* User info */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.accent + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: C.accent, fontSize: 16, marginBottom: 8 }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ fontWeight: 700, color: 'white', fontSize: 13 }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{user?.email}</div>
          <Badge text="Admin" color={C.purple} />
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => handleTabClick(t.id)}
              style={{
                width: '100%', textAlign: 'left', padding: '11px 20px',
                background: tab === t.id ? C.accent + '22' : 'none',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                color: tab === t.id ? C.accent : '#94a3b8',
                fontWeight: tab === t.id ? 700 : 500, fontSize: 14,
                borderLeft: tab === t.id ? `3px solid ${C.accent}` : '3px solid transparent',
                transition: 'all .15s',
              }}>
              <span>{t.icon}</span>
              <span style={{ flex: 1 }}>{t.id}</span>
              {t.id === 'Support' && openTicketCount > 0 && (
                <span style={{
                  background: C.accent, color: 'white', fontSize: 11, fontWeight: 800,
                  minWidth: 20, height: 20, borderRadius: 99, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', padding: '0 5px',
                }}>
                  {openTicketCount > 99 ? '99+' : openTicketCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Back to store */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #1e293b' }}>
          <button onClick={() => navigate('/')}
            style={{ width: '100%', padding: '9px 16px', background: '#1e293b', border: 'none', borderRadius: 10, color: '#94a3b8', fontWeight: 600, fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
            ← Back to Store
          </button>
        </div>
      </div>

      {/* Main area */}
      <div style={{ marginLeft: 220, padding: '32px 36px' }}>
        {/* Page title */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>
            {TABS.find(t => t.id === tab)?.icon} {tab}
          </h1>
          <p style={{ color: C.mute, margin: '4px 0 0', fontSize: 13 }}>
            {tab === 'Overview' && 'Platform performance at a glance'}
            {tab === 'Users'    && 'Manage all registered accounts'}
            {tab === 'Sellers'  && 'Manage and verify seller accounts'}
            {tab === 'Orders'   && 'View and manage all customer orders'}
            {tab === 'Returns'  && 'Monitor and take action on all return & refund requests'}
            {tab === 'Coupons'       && 'Create and manage discount coupons for customers'}
            {tab === 'Notifications' && 'Broadcast notifications to customers, sellers, or everyone'}
            {tab === 'Support'       && 'View and respond to customer support tickets'}
          </p>
        </div>

        {tab === 'Overview'      && <OverviewTab />}
        {tab === 'Users'         && <UsersTab />}
        {tab === 'Sellers'       && <SellersTab />}
        {tab === 'Orders'        && <OrdersTab />}
        {tab === 'Returns'       && <AdminReturnsTab />}
        {tab === 'Coupons'       && <AdminCouponsTab />}
        {tab === 'Notifications' && <AdminNotificationsTab />}
        {tab === 'Support'       && <AdminSupportTab />}
      </div>
    </div>
  );
}
