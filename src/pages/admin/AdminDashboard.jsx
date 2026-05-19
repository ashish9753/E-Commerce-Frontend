import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../api/admin';
import { getErrorMessage } from '../../api/client';

const TABS = ['Overview', 'Users', 'Sellers', 'Orders'];

const ORDER_STATUSES = ['CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

const statusColor = {
  PLACED: '#f59e0b', CONFIRMED: '#3b82f6', PACKED: '#8b5cf6',
  SHIPPED: '#06b6d4', OUT_FOR_DELIVERY: '#f97316', DELIVERED: '#22c55e',
  CANCELLED: '#ef4444', RETURNED: '#6b7280',
};

function StatCard({ label, value, sub, color = '#FF5A1F' }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '20px 24px', flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value ?? '—'}</div>
      <div style={{ fontWeight: 700, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Badge({ status }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
      background: (statusColor[status] || '#6b7280') + '22',
      color: statusColor[status] || '#6b7280',
      letterSpacing: '.04em',
    }}>{status}</span>
  );
}

// ─── Overview Tab ───────────────────────────────────────────────────────────
function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getOrderStats(),
      adminApi.getOrders({ limit: 5 }),
    ]).then(([statsRes, ordersRes]) => {
      setStats(statsRes.data?.data || {});
      setRecentOrders(ordersRes.data?.data?.orders || ordersRes.data?.data?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--mute)' }}>Loading stats…</div>;

  const breakdown = stats?.statusBreakdown || [];
  const delivered = breakdown.find(b => b._id === 'DELIVERED')?.count || 0;
  const pending = breakdown.filter(b => ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(b._id)).reduce((a, b) => a + b.count, 0);

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <StatCard label="Total Orders" value={stats?.totalOrders ?? 0} sub={`${delivered} delivered · ${pending} in progress`} />
        <StatCard label="Total Revenue" value={`Rs. ${(stats?.totalRevenue || 0).toLocaleString()}`} sub="From paid orders" color="#22c55e" />
        <StatCard label="Cancelled" value={breakdown.find(b => b._id === 'CANCELLED')?.count || 0} sub="Cancelled orders" color="#ef4444" />
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24 }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>Order Status Breakdown</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {breakdown.map(b => (
            <div key={b._id} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 12, padding: '12px 18px', minWidth: 120, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: statusColor[b._id] || '#6b7280' }}>{b.count}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--mute)', marginTop: 2 }}>{b._id}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 24, background: 'var(--surface)', borderRadius: 16, padding: 24 }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>Recent Orders</div>
        {recentOrders.length === 0 ? (
          <div style={{ color: 'var(--mute)', textAlign: 'center', padding: 24 }}>No orders yet</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                {['Order #', 'Customer', 'Total', 'Payment', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700, color: 'var(--mute)', fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(o => (
                <tr key={o._id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>{o.orderNumber}</td>
                  <td style={{ padding: '10px 12px' }}>{o.user?.name || '—'}<br /><span style={{ fontSize: 11, color: 'var(--mute)' }}>{o.user?.email}</span></td>
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>Rs. {o.totalPrice?.toLocaleString()}</td>
                  <td style={{ padding: '10px 12px' }}>{o.paymentStatus}</td>
                  <td style={{ padding: '10px 12px' }}><Badge status={o.orderStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Users Tab ───────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.getUsers({ limit: 100 }).then(r => {
      setUsers(r.data?.data?.users || r.data?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleBlock = async (id, isBlocked) => {
    setBusy(id);
    await adminApi.blockUser(id).catch(() => {});
    setUsers(u => u.map(x => x._id === id ? { ...x, isBlocked: !isBlocked } : x));
    setBusy(null);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setBusy(id);
    await adminApi.deleteUser(id).catch(() => {});
    setUsers(u => u.filter(x => x._id !== id));
    setBusy(null);
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--mute)' }}>Loading users…</div>;

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24 }}>
      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>All Users ({users.length})</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--line)' }}>
            {['Name', 'Email', 'Phone', 'Role', 'Joined', 'Status', 'Actions'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700, color: 'var(--mute)', fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id} style={{ borderBottom: '1px solid var(--line)', opacity: u.isBlocked ? .5 : 1 }}>
              <td style={{ padding: '10px 12px', fontWeight: 700 }}>{u.name}</td>
              <td style={{ padding: '10px 12px', color: 'var(--mute)' }}>{u.email}</td>
              <td style={{ padding: '10px 12px' }}>{u.phone}</td>
              <td style={{ padding: '10px 12px' }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: u.role === 'admin' ? '#7c3aed22' : u.role === 'seller' ? '#f59e0b22' : '#3b82f622', color: u.role === 'admin' ? '#7c3aed' : u.role === 'seller' ? '#f59e0b' : '#3b82f6' }}>{u.role}</span>
              </td>
              <td style={{ padding: '10px 12px', color: 'var(--mute)', fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
              <td style={{ padding: '10px 12px' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: u.isBlocked ? '#ef4444' : '#22c55e' }}>{u.isBlocked ? 'Blocked' : 'Active'}</span>
              </td>
              <td style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    disabled={busy === u._id}
                    onClick={() => handleBlock(u._id, u.isBlocked)}
                    style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'white', cursor: 'pointer', color: u.isBlocked ? '#22c55e' : '#f59e0b' }}
                  >{u.isBlocked ? 'Unblock' : 'Block'}</button>
                  <button
                    disabled={busy === u._id}
                    onClick={() => handleDelete(u._id, u.name)}
                    style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, border: '1px solid #ef444422', background: '#ef444411', cursor: 'pointer', color: '#ef4444' }}
                  >Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Sellers Tab ─────────────────────────────────────────────────────────────
function SellersTab() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    adminApi.getSellers({ limit: 100 }).then(r => {
      setSellers(r.data?.data?.sellers || r.data?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleVerify = async (id, isVerified) => {
    setBusy(id);
    await adminApi.verifySeller(id).catch(() => {});
    setSellers(s => s.map(x => x._id === id ? { ...x, isVerified: !isVerified } : x));
    setBusy(null);
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--mute)' }}>Loading sellers…</div>;

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24 }}>
      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>All Sellers ({sellers.length})</div>
      {sellers.length === 0 ? (
        <div style={{ color: 'var(--mute)', textAlign: 'center', padding: 40 }}>No sellers registered yet</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--line)' }}>
              {['Shop Name', 'Owner', 'Email', 'Rating', 'Total Sales', 'Verified', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700, color: 'var(--mute)', fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sellers.map(s => (
              <tr key={s._id} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 700 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {s.shopLogo ? <img src={s.shopLogo} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} /> : <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🏪</div>}
                    {s.shopName}
                  </div>
                </td>
                <td style={{ padding: '10px 12px' }}>{s.user?.name || '—'}</td>
                <td style={{ padding: '10px 12px', color: 'var(--mute)' }}>{s.user?.email || '—'}</td>
                <td style={{ padding: '10px 12px' }}>{s.rating?.toFixed(1) || '0.0'} ★</td>
                <td style={{ padding: '10px 12px', fontWeight: 700 }}>Rs. {(s.totalSales || 0).toLocaleString()}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.isVerified ? '#22c55e' : '#f59e0b' }}>{s.isVerified ? '✓ Verified' : 'Pending'}</span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <button
                    disabled={busy === s._id}
                    onClick={() => handleVerify(s._id, s.isVerified)}
                    style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 8, border: '1px solid var(--line)', background: s.isVerified ? '#ef444411' : '#22c55e11', cursor: 'pointer', color: s.isVerified ? '#ef4444' : '#22c55e' }}
                  >{s.isVerified ? 'Revoke' : 'Verify'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const params = { limit: 50 };
    if (filterStatus) params.status = filterStatus;
    adminApi.getOrders(params).then(r => {
      setOrders(r.data?.data?.orders || r.data?.data?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (orderId, status) => {
    setUpdating(orderId);
    await adminApi.updateOrderStatus(orderId, { status }).catch(() => {});
    setOrders(o => o.map(x => x._id === orderId ? { ...x, orderStatus: status } : x));
    setUpdating(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['', ...ORDER_STATUSES, 'PLACED', 'RETURNED'].map(s => (
          <button key={s || 'all'} onClick={() => setFilterStatus(s)}
            style={{ fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 99, border: '1px solid var(--line)', background: filterStatus === s ? 'var(--ink)' : 'white', color: filterStatus === s ? 'white' : 'var(--mute)', cursor: 'pointer' }}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24 }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>Orders ({orders.length})</div>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--mute)' }}>Loading…</div>
        ) : orders.length === 0 ? (
          <div style={{ color: 'var(--mute)', textAlign: 'center', padding: 40 }}>No orders found</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                {['Order #', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Update Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700, color: 'var(--mute)', fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700, whiteSpace: 'nowrap' }}>{o.orderNumber}</td>
                  <td style={{ padding: '10px 12px' }}>{o.user?.name || '—'}<br /><span style={{ fontSize: 11, color: 'var(--mute)' }}>{o.user?.email}</span></td>
                  <td style={{ padding: '10px 12px' }}>{o.orderItems?.length} item{o.orderItems?.length !== 1 ? 's' : ''}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>Rs. {o.totalPrice?.toLocaleString()}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: o.paymentStatus === 'PAID' ? '#22c55e' : '#f59e0b' }}>{o.paymentStatus}</span>
                  </td>
                  <td style={{ padding: '10px 12px' }}><Badge status={o.orderStatus} /></td>
                  <td style={{ padding: '10px 12px' }}>
                    <select
                      value={o.orderStatus}
                      disabled={updating === o._id || ['DELIVERED', 'CANCELLED', 'RETURNED'].includes(o.orderStatus)}
                      onChange={e => handleStatusChange(o._id, e.target.value)}
                      style={{ fontSize: 12, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--line)', background: 'white', cursor: 'pointer' }}
                    >
                      {['PLACED', ...ORDER_STATUSES].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [tab, setTab] = useState('Overview');
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user && user.role !== 'admin') {
    navigate('/');
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)', paddingBottom: 60 }}>
      {/* Top bar */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--line)', padding: '0 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20 }}>Admin Dashboard</div>
            <div style={{ fontSize: 12, color: 'var(--mute)' }}>Logged in as {user?.name} · {user?.email}</div>
          </div>
          <button onClick={() => navigate('/')} style={{ fontSize: 13, fontWeight: 700, padding: '8px 18px', borderRadius: 10, border: '1px solid var(--line)', background: 'white', cursor: 'pointer' }}>
            ← Storefront
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--line)', padding: '0 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 0 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ fontWeight: 700, fontSize: 13, padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', color: tab === t ? 'var(--accent)' : 'var(--mute)', transition: 'all .15s' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '32px auto', padding: '0 40px' }}>
        {tab === 'Overview' && <OverviewTab />}
        {tab === 'Users' && <UsersTab />}
        {tab === 'Sellers' && <SellersTab />}
        {tab === 'Orders' && <OrdersTab />}
      </div>
    </div>
  );
}
