import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { employeeApi } from '../../api/seller';
import { categoriesApi } from '../../api/categories';
import { returnsApi } from '../../api/returns';
import { getErrorMessage } from '../../api/client';
import { useCatalog } from '../../context/CatalogContext';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

/* ── palette ── */
const C = {
  accent: '#FF5A1F', blue: '#3b82f6', green: '#22c55e',
  yellow: '#f59e0b', purple: '#8b5cf6', red: '#ef4444',
  mute: '#6b7280', line: '#e5e7eb', surf: '#f9fafb',
};
const STATUS_COLORS = {
  PLACED: C.yellow, CONFIRMED: C.blue, PACKED: C.purple,
  SHIPPED: '#06b6d4', OUT_FOR_DELIVERY: C.accent,
  DELIVERED: C.green, CANCELLED: C.red, RETURNED: C.mute,
};

const fmt    = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtRs  = (n) => `Rs. ${fmt(n)}`;
const fmtPct = (n) => `${Number(n || 0).toFixed(1)}%`;

/* ── shared UI ── */
function KpiCard({ label, value, sub, color, icon }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: '20px 22px', flex: 1, minWidth: 160, boxShadow: '0 1px 3px #0000000d', borderLeft: `4px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.mute, marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: C.mute, marginTop: 3 }}>{sub}</div>}
        </div>
        <span style={{ fontSize: 26, opacity: .6 }}>{icon}</span>
      </div>
    </div>
  );
}
function Card({ title, children, style }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 3px #0000000d', overflow: 'hidden', ...style }}>
      {title && <div style={{ fontWeight: 800, fontSize: 14, padding: '18px 22px 0', color: '#0f172a' }}>{title}</div>}
      <div style={{ padding: 22 }}>{children}</div>
    </div>
  );
}
function Th({ ch }) { return <th style={{ textAlign: 'left', padding: '8px 14px', fontSize: 11, fontWeight: 700, color: C.mute, letterSpacing: '.06em', textTransform: 'uppercase', borderBottom: `1px solid ${C.line}`, whiteSpace: 'nowrap' }}>{ch}</th>; }
function Td({ children, style }) { return <td style={{ padding: '10px 14px', fontSize: 13, borderBottom: `1px solid ${C.line}`, ...style }}>{children}</td>; }
function Badge({ text, color }) {
  return <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: color + '20', color }}>{text}</span>;
}
function Inp({ value, onChange, placeholder, type = 'text', style }) {
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    style={{ height: 36, border: `1px solid ${C.line}`, borderRadius: 8, padding: '0 12px', fontSize: 13, outline: 'none', background: C.surf, width: '100%', ...style }} />;
}
function Sel({ value, onChange, children, style }) {
  return <select value={value} onChange={onChange}
    style={{ height: 36, border: `1px solid ${C.line}`, borderRadius: 8, padding: '0 10px', fontSize: 13, background: C.surf, cursor: 'pointer', ...style }}>{children}</select>;
}
function Loader() {
  return <div style={{ padding: 60, textAlign: 'center', color: C.mute }}><div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 10px' }} />Loading…</div>;
}
function Empty({ text }) {
  return <div style={{ padding: '40px 0', textAlign: 'center', color: C.mute, fontSize: 14 }}>{text}</div>;
}

/* ══════════════════════════════════════════════════════
   OVERVIEW TAB
══════════════════════════════════════════════════════ */
function OverviewTab({ profile }) {
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
  const breakdown = ordersData?.statusBreakdown || [];

  const totalStock  = products.reduce((a, p) => a + (p.stock || 0), 0);
  const stockValue  = products.reduce((a, p) => a + ((p.discountPrice || p.price || 0) * (p.stock || 0)), 0);
  const publishedN  = products.filter(p => p.isPublished).length;
  const lowStock    = products.filter(p => p.stock > 0 && p.stock <= 5);
  const outOfStock  = products.filter(p => p.stock === 0);
  const delivered   = breakdown.find(b => b._id === 'DELIVERED')?.count || 0;
  const pending     = breakdown.filter(b => ['PLACED','CONFIRMED','PACKED','SHIPPED','OUT_FOR_DELIVERY'].includes(b._id)).reduce((a,b)=>a+b.count,0);

  // Stock distribution for bar chart
  const stockChart = products.slice(0, 8).map(p => ({ name: p.title?.slice(0,14), stock: p.stock, revenue: (p.discountPrice||p.price||0)*p.sold }));

  // Payment method breakdown from orders
  const payMethods = {};
  orders.forEach(o => { payMethods[o.paymentMethod] = (payMethods[o.paymentMethod]||0) + 1; });
  const payChart = Object.entries(payMethods).map(([k,v]) => ({ name: k, value: v }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Total Revenue"    value={fmtRs(revenue)}       sub="Full order amount"     color={C.green}  icon="💰" />
        <KpiCard label="Total Orders"     value={fmt(orders.length)}   sub={`${delivered} delivered`} color={C.blue} icon="📦" />
        <KpiCard label="Active Products"  value={publishedN}           sub={`${products.length} total`} color={C.accent} icon="🛒" />
        <KpiCard label="Pending Orders"   value={fmt(pending)}         sub="To be processed"       color={C.yellow} icon="⏳" />
      </div>

      {/* Stock + Payment row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
        <Card title="Inventory Value">
          <div style={{ fontSize: 28, fontWeight: 800, color: C.purple, marginBottom: 4 }}>{fmtRs(stockValue)}</div>
          <div style={{ fontSize: 12, color: C.mute, marginBottom: 16 }}>{fmt(totalStock)} units in stock</div>
          {outOfStock.length > 0 && (
            <div style={{ background: C.red+'14', border:`1px solid ${C.red}33`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: C.red, marginBottom: 8 }}>
              ⚠️ <strong>{outOfStock.length} products</strong> out of stock
            </div>
          )}
          {lowStock.length > 0 && (
            <div style={{ background: C.yellow+'14', border:`1px solid ${C.yellow}33`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: C.yellow }}>
              ⚡ <strong>{lowStock.length} products</strong> with ≤5 units left
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
                <Tooltip />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10 }} />
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
                <Tooltip />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10 }} />
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
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="stock" fill={C.blue} radius={[4,4,0,0]} name="Stock" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Shop info */}
      <Card title="Shop Profile">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          {[
            ['Shop Name', profile?.shopName],
            ['GST Number', profile?.gstNumber || '—'],
            ['Business Address', profile?.businessAddress || '—'],
            ['Rating', `★ ${(profile?.rating||0).toFixed(1)}`],
            ['Total Sales', fmtRs(profile?.totalSales)],
            ['Verified', profile?.isVerified ? '✅ Yes' : '⏳ Pending'],
          ].map(([l,v]) => (
            <div key={l}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.mute, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>{l}</div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{v}</div>
            </div>
          ))}
        </div>
        {!profile?.isVerified && (
          <div style={{ marginTop: 16, padding: 14, background: C.yellow+'14', border:`1px solid ${C.yellow}44`, borderRadius: 10, fontSize: 12, color: C.yellow }}>
            ⏳ Your shop is pending admin verification. Products won't be publicly visible until approved.
          </div>
        )}
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MY PRODUCTS TAB
══════════════════════════════════════════════════════ */
function ProductsTab({ onEdit }) {
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
      {/* Mini stats */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Total Products"    value={all.length}                       sub={`${all.filter(p=>p.isPublished).length} live`}    color={C.blue}   icon="📦" />
        <KpiCard label="Units in Stock"    value={fmt(all.reduce((a,p)=>a+(p.stock||0),0))} sub="Across all products" color={C.green}  icon="🏷️" />
        <KpiCard label="Total Sold"        value={fmt(totalSold)}                   sub="Units sold ever"                                   color={C.accent} icon="✅" />
        <KpiCard label="Stock Value"       value={fmtRs(totalRevPotential)}         sub="At current prices"                                 color={C.purple} icon="💎" />
      </div>

      {/* Filters */}
      <Card>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Inp value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products…" style={{ flex: 1, minWidth: 200 }} />
          <Sel value={stockF} onChange={e=>setStockF(e.target.value)} style={{ width: 140 }}>
            <option value="">All Stock</option>
            <option value="ok">In Stock (&gt;5)</option>
            <option value="low">Low Stock (≤5)</option>
            <option value="out">Out of Stock</option>
          </Sel>
          <Sel value={pubF} onChange={e=>setPubF(e.target.value)} style={{ width: 130 }}>
            <option value="">All Status</option>
            <option value="live">Published</option>
            <option value="hidden">Hidden</option>
          </Sel>
          {(search||stockF||pubF) && <button onClick={()=>{setSearch('');setStockF('');setPubF('');}} style={{ fontSize:12,padding:'0 12px',height:36,borderRadius:8,border:`1px solid ${C.line}`,background:'white',cursor:'pointer',color:C.mute }}>Clear</button>}
          <span style={{ fontSize:13,color:C.mute,marginLeft:'auto' }}><strong>{products.length}</strong> of <strong>{all.length}</strong></span>
        </div>
      </Card>

      {/* Table */}
      <Card title={`Products (${products.length})`}>
        {products.length === 0 ? <Empty text="No products match your filters" /> :
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%',borderCollapse:'collapse' }}>
              <thead><tr>
                {['Product','Category','MRP','Sale Price','Discount','Stock','Sold','Revenue Earned','Status','Actions'].map(h=><Th key={h} ch={h} />)}
              </tr></thead>
              <tbody>
                {products.map(p => {
                  const mrp = p.price || 0;
                  const sale = p.discountPrice || p.price || 0;
                  const disc = mrp > sale ? Math.round(((mrp-sale)/mrp)*100) : 0;
                  const earned = sale * (p.sold || 0);
                  const catName = typeof p.category === 'object' ? p.category?.name : p.category;
                  return (
                    <tr key={p._id} style={{ opacity: busy===p._id ? .5:1 }}>
                      <Td>
                        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                          <div style={{ width:42,height:42,borderRadius:10,background:C.surf,overflow:'hidden',flexShrink:0,border:`1px solid ${C.line}` }}>
                            {p.images?.[0] ? <img src={p.images[0]} alt="" style={{ width:'100%',height:'100%',objectFit:'contain' }} /> : <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%'}}>🛍️</div>}
                          </div>
                          <div>
                            <div style={{ fontWeight:700,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{p.title}</div>
                            <div style={{ fontSize:11,color:C.mute }}>{p.brand}</div>
                          </div>
                        </div>
                      </Td>
                      <Td style={{ color:C.mute }}>{catName || '—'}</Td>
                      <Td style={{ color:C.mute,textDecoration: disc>0?'line-through':'none' }}>{fmtRs(mrp)}</Td>
                      <Td><span style={{ fontWeight:700 }}>{fmtRs(sale)}</span></Td>
                      <Td>
                        {disc > 0
                          ? <Badge text={`-${disc}%`} color={C.green} />
                          : <span style={{ color:C.mute }}>—</span>
                        }
                      </Td>
                      <Td>
                        <span style={{ fontWeight:700,color: p.stock===0?C.red:p.stock<=5?C.yellow:C.green }}>
                          {p.stock === 0 ? '⚠️ 0' : p.stock}
                        </span>
                      </Td>
                      <Td style={{ fontWeight:600 }}>{fmt(p.sold||0)}</Td>
                      <Td><span style={{ fontWeight:700,color:C.green }}>{fmtRs(earned)}</span></Td>
                      <Td>
                        <button onClick={()=>handleTogglePublish(p)} disabled={busy===p._id}
                          style={{ fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:8,border:'none',cursor:'pointer',background:p.isPublished?C.green+'20':C.red+'20',color:p.isPublished?C.green:C.red }}>
                          {p.isPublished ? 'Live' : 'Hidden'}
                        </button>
                      </Td>
                      <Td>
                        <div style={{ display:'flex',gap:6 }}>
                          <button onClick={()=>onEdit(p)} style={{ fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:8,border:`1px solid ${C.line}`,background:'white',cursor:'pointer' }}>Edit</button>
                          <button onClick={()=>handleDelete(p._id,p.title)} disabled={busy===p._id} style={{ fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:8,border:'none',background:C.red+'14',color:C.red,cursor:'pointer' }}>Delete</button>
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

/* ══════════════════════════════════════════════════════
   ORDERS TAB
══════════════════════════════════════════════════════ */
const EMPLOYEE_STATUSES = ['CONFIRMED','PACKED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED'];
const STATUS_NEXT = {
  PLACED:           'CONFIRMED',
  CONFIRMED:        'PACKED',
  PACKED:           'SHIPPED',
  SHIPPED:          'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'DELIVERED',
};

function OrderStatusCell({ order, onUpdated, onViewReturns }) {
  const [saving, setSaving]   = useState(false);
  const [tracking, setTracking] = useState(order.trackingId || '');
  const [open, setOpen]       = useState(false);
  const current = order.orderStatus;
  const isReturned  = current === 'RETURNED';
  const isCancelled = current === 'CANCELLED';
  const isDelivered = current === 'DELIVERED';
  const isFinal = isReturned || isCancelled || isDelivered;
  const nextStatus = STATUS_NEXT[current];
  const sm = STATUS_COLORS[current] || '#6b7280';

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
    <div style={{ position:'relative', minWidth:190 }}>
      {/* Current status badge */}
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700,
          padding:'3px 9px', borderRadius:99, background: sm+'20', color: sm }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background: sm }} />{current.replace(/_/g,' ')}
        </span>
        {!isFinal && (
          <button onClick={() => setOpen(o=>!o)}
            style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6, background: open?'#e2e8f0':'#f1f5f9',
              border:`1px solid ${C.line}`, cursor:'pointer', color:C.mute }}>
            {open ? '✕' : '✏️ Change'}
          </button>
        )}
      </div>

      {/* Quick-advance button */}
      {!isFinal && !open && nextStatus && (
        <button onClick={() => doUpdate(nextStatus)} disabled={saving}
          style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:6,
            background: STATUS_COLORS[nextStatus]+'22', color: STATUS_COLORS[nextStatus],
            border:`1px solid ${STATUS_COLORS[nextStatus]}44`, cursor:'pointer',
            opacity: saving ? 0.6 : 1, whiteSpace:'nowrap' }}>
          {saving ? '…' : `→ Mark ${nextStatus.replace(/_/g,' ')}`}
        </button>
      )}

      {/* RETURNED — prompt employee to handle via Returns tab */}
      {isReturned && (
        <button onClick={onViewReturns}
          style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:6,
            background:'#8b5cf620', color:'#8b5cf6',
            border:'1px solid #8b5cf644', cursor:'pointer', whiteSpace:'nowrap' }}>
          ↩️ Handle Return →
        </button>
      )}

      {/* DELIVERED */}
      {isDelivered && (
        <span style={{ fontSize:11, color:C.green, fontWeight:600 }}>✓ Delivered</span>
      )}

      {/* CANCELLED */}
      {isCancelled && (
        <span style={{ fontSize:11, color:C.mute }}>Order cancelled</span>
      )}

      {/* Expanded panel */}
      {open && (
        <div style={{ position:'absolute', top:'100%', left:0, zIndex:50, background:'white',
          border:`1px solid ${C.line}`, borderRadius:10, padding:14, boxShadow:'0 4px 20px #0002', width:240, marginTop:4 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.mute, marginBottom:8, textTransform:'uppercase' }}>Set Status</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:10 }}>
            {EMPLOYEE_STATUSES.map(s => (
              <button key={s} onClick={() => doUpdate(s)} disabled={saving || s === current}
                style={{ textAlign:'left', padding:'7px 10px', borderRadius:7,
                  background: s === current ? STATUS_COLORS[s]+'22' : 'white',
                  border:`1px solid ${s === current ? STATUS_COLORS[s] : C.line}`,
                  color: s === current ? STATUS_COLORS[s] : '#333',
                  fontWeight: s === current ? 700 : 500, fontSize:12,
                  cursor: s === current ? 'default' : 'pointer',
                  opacity: saving ? 0.6 : 1 }}>
                {s === current ? '✓ ' : ''}{s.replace(/_/g,' ')}
              </button>
            ))}
          </div>
          <div style={{ fontSize:11, fontWeight:700, color:C.mute, marginBottom:5, textTransform:'uppercase' }}>Tracking ID (optional)</div>
          <input value={tracking} onChange={e=>setTracking(e.target.value)} placeholder="e.g. FEDEX123456"
            style={{ width:'100%', height:32, border:`1px solid ${C.line}`, borderRadius:6, padding:'0 8px', fontSize:12, outline:'none', boxSizing:'border-box' }} />
          <button onClick={() => setOpen(false)}
            style={{ marginTop:8, width:'100%', padding:'6px', borderRadius:6, border:`1px solid ${C.line}`, background:'white', fontSize:12, cursor:'pointer', color:C.mute }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function OrdersTab({ onViewReturns }) {
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
      : o
    ));
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
    <div style={{ display:'flex',flexDirection:'column',gap:20 }}>
      <div style={{ display:'flex',gap:16,flexWrap:'wrap' }}>
        <KpiCard label="Total Orders"   value={fmt(all.length)}  sub={`${delivered} delivered`}    color={C.blue}   icon="📦" />
        <KpiCard label="Revenue Earned" value={fmtRs(revenue)}   sub="From paid orders"            color={C.green}  icon="💰" />
        <KpiCard label="Pending"        value={fmt(pending)}     sub="Awaiting fulfilment"          color={C.yellow} icon="⏳" />
        <KpiCard label="Cancelled"      value={fmt(all.filter(o=>o.orderStatus==='CANCELLED').length)} sub="" color={C.red} icon="❌" />
      </div>

      {breakdown.length > 0 && (
        <Card title="Order Status Breakdown">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={breakdown.map(b=>({name:b._id,count:b.count}))} margin={{top:4,right:8,left:-10,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
              <XAxis dataKey="name" tick={{fontSize:10}} />
              <YAxis tick={{fontSize:10}} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[5,5,0,0]}>
                {breakdown.map(b=><Cell key={b._id} fill={STATUS_COLORS[b._id]||C.mute} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <div style={{ display:'flex',gap:10,flexWrap:'wrap',alignItems:'center' }}>
          <Inp value={search} onChange={e=>setSearch(e.target.value)} placeholder="Order #, customer name…" style={{ flex:1,minWidth:200 }} />
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
          {(search||statusF||payF)&&<button onClick={()=>{setSearch('');setStatF('');setPayF('');}} style={{fontSize:12,padding:'0 12px',height:36,borderRadius:8,border:`1px solid ${C.line}`,background:'white',cursor:'pointer',color:C.mute}}>Clear</button>}
          <span style={{fontSize:13,color:C.mute,marginLeft:'auto'}}><strong>{orders.length}</strong> of <strong>{all.length}</strong></span>
        </div>
      </Card>

      <Card title={`Orders (${orders.length})`}>
        {orders.length === 0 ? <Empty text="No orders match your filters" /> :
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%',borderCollapse:'collapse' }}>
              <thead><tr>
                {['Order #','Customer','Products','Total','Payment','Date','Status / Action'].map(h=><Th key={h} ch={h} />)}
              </tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id}>
                    <Td>
                      <span style={{ fontFamily:'monospace',fontSize:12,fontWeight:700 }}>{o.orderNumber}</span>
                      {o.trackingId && <div style={{ fontSize:10,color:C.mute,marginTop:2 }}>Track: {o.trackingId}</div>}
                    </Td>
                    <Td>
                      <div style={{ fontWeight:600 }}>{o.user?.name||'—'}</div>
                      <div style={{ fontSize:11,color:C.mute }}>{o.user?.email}</div>
                      <div style={{ fontSize:11,color:C.mute }}>{o.user?.phone}</div>
                    </Td>
                    <Td>
                      <div style={{ display:'flex',flexDirection:'column',gap:3 }}>
                        {o.orderItems?.slice(0,2).map(item=>(
                          <div key={item._id} style={{ fontSize:12,display:'flex',alignItems:'center',gap:6 }}>
                            <div style={{ width:24,height:24,borderRadius:4,background:C.surf,overflow:'hidden',flexShrink:0 }}>
                              {item.image ? <img src={item.image} style={{ width:'100%',height:'100%',objectFit:'contain' }} /> : '🛍️'}
                            </div>
                            <span style={{ maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{item.title}</span>
                            <span style={{ color:C.mute }}>×{item.quantity}</span>
                          </div>
                        ))}
                        {o.orderItems?.length > 2 && <span style={{ fontSize:11,color:C.mute }}>+{o.orderItems.length-2} more</span>}
                      </div>
                    </Td>
                    <Td>
                      <span style={{ fontWeight:700 }}>{fmtRs(o.totalPrice)}</span>
                      <div style={{ marginTop:3 }}>
                        <Badge text={o.paymentMethod} color={C.blue} />
                      </div>
                      <div style={{ marginTop:3 }}>
                        <Badge text={o.paymentStatus} color={o.paymentStatus==='PAID'?C.green:o.paymentStatus==='FAILED'?C.red:C.yellow} />
                      </div>
                    </Td>
                    <Td style={{ color:C.mute,fontSize:12 }}>{new Date(o.createdAt).toLocaleDateString()}</Td>
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

/* ══════════════════════════════════════════════════════
   PRODUCT FORM (Add / Edit)
══════════════════════════════════════════════════════ */
function ProductForm({ initial, categories, onSave, onCancel }) {
  const { brands: catalogBrands } = useCatalog();
  const empty = { title:'',description:'',shortDescription:'',brand:'',price:'',discountPrice:'',stock:'',category:'',isFeatured:false,isPublished:true,returnable:true,returnWindow:7 };
  const [form, setForm] = useState(initial ? {
    title: initial.title||'', description: initial.description||'',
    shortDescription: initial.shortDescription||'', brand: initial.brand||'',
    price: initial.price||'', discountPrice: initial.discountPrice||'',
    stock: initial.stock??'',
    category: (typeof initial.category==='object'?initial.category?._id:initial.category)||'',
    isFeatured: initial.isFeatured||false, isPublished: initial.isPublished!==false,
    returnable: initial.returnable !== false, returnWindow: initial.returnWindow || 7,
  } : empty);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const mrp = Number(form.price)||0;
  const sale = Number(form.discountPrice)||0;
  const disc = mrp > sale && sale > 0 ? Math.round(((mrp-sale)/mrp)*100) : 0;
  const profit = sale > 0 ? sale : mrp;

  const handleSubmit = async () => {
    if (!form.title||!form.description||!form.price||form.stock===''||!form.category) {
      setError('Title, description, price, stock, and category are required.');
      return;
    }
    setSaving(true); setError('');
    try {
      const payload = { ...form, price:Number(form.price), stock:Number(form.stock), discountPrice:form.discountPrice?Number(form.discountPrice):undefined, returnWindow: form.returnable ? Number(form.returnWindow) : undefined };
      await onSave(payload);
    } catch(err) { setError(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const LabelStyle = { display:'block',fontSize:11,fontWeight:700,color:C.mute,marginBottom:5,textTransform:'uppercase',letterSpacing:'.06em' };

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:20 }}>
      {/* Profit preview */}
      {(mrp > 0 || sale > 0) && (
        <div style={{ display:'flex',gap:16,flexWrap:'wrap' }}>
          <KpiCard label="MRP"       value={fmtRs(mrp)}    sub="Original price"    color={C.mute}   icon="🏷️" />
          <KpiCard label="Sale Price" value={fmtRs(profit)} sub="Customer pays"     color={C.green}  icon="💰" />
          <KpiCard label="Discount"  value={disc>0?`${disc}%`:'—'}  sub="Off MRP"   color={C.accent} icon="🎁" />
          <KpiCard label="Stock Value" value={fmtRs(profit*(Number(form.stock)||0))} sub="At sale price" color={C.purple} icon="📦" />
        </div>
      )}

      <Card title={initial ? 'Edit Product' : 'Add New Product'}>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
          <div><label style={LabelStyle}>Title *</label><Inp value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Product name" /></div>
          <div>
            <label style={LabelStyle}>Brand</label>
            <Sel value={form.brand} onChange={e=>set('brand',e.target.value)}>
              <option value="">— Select Brand —</option>
              {catalogBrands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
            </Sel>
          </div>
          <div>
            <label style={LabelStyle}>Category *</label>
            <Sel value={form.category} onChange={e=>set('category',e.target.value)} style={{ width:'100%' }}>
              <option value="">Select category…</option>
              {categories.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
            </Sel>
          </div>
          <div><label style={LabelStyle}>Stock *</label><Inp type="number" value={form.stock} onChange={e=>set('stock',e.target.value)} placeholder="0" /></div>
          <div>
            <label style={LabelStyle}>MRP (Rs.) *</label>
            <Inp type="number" value={form.price} onChange={e=>set('price',e.target.value)} placeholder="0" />
          </div>
          <div>
            <label style={LabelStyle}>Sale Price (Rs.) <span style={{ color:C.green }}>— Optional discount</span></label>
            <Inp type="number" value={form.discountPrice} onChange={e=>set('discountPrice',e.target.value)} placeholder="Leave blank = no discount" />
            {disc > 0 && <div style={{ fontSize:12,color:C.green,marginTop:4 }}>✓ {disc}% off MRP</div>}
          </div>
        </div>

        <div style={{ marginTop:16 }}>
          <label style={LabelStyle}>Short Description</label>
          <Inp value={form.shortDescription} onChange={e=>set('shortDescription',e.target.value)} placeholder="Brief product tagline" />
        </div>
        <div style={{ marginTop:16 }}>
          <label style={LabelStyle}>Full Description *</label>
          <textarea className="input" rows={4} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Detailed product description…" style={{ resize:'vertical',width:'100%' }} />
        </div>

        <div style={{ display:'flex',gap:24,marginTop:16,flexWrap:'wrap',alignItems:'center' }}>
          <label style={{ display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:600,fontSize:13 }}>
            <input type="checkbox" checked={form.isFeatured} onChange={e=>set('isFeatured',e.target.checked)} />
            Mark as Featured
          </label>
          <label style={{ display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:600,fontSize:13 }}>
            <input type="checkbox" checked={form.isPublished} onChange={e=>set('isPublished',e.target.checked)} />
            Publish immediately
          </label>
        </div>

        {/* Return Policy */}
        <div style={{ marginTop:18, padding:'14px 16px', borderRadius:10, border:`1px solid ${C.line}`, background:'#f8fafc' }}>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:10, color:'#0f172a' }}>↩️ Return Policy</div>
          <div style={{ display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontWeight:600, fontSize:13 }}>
              <input type="checkbox" checked={form.returnable} onChange={e=>set('returnable',e.target.checked)} />
              Allow Returns
            </label>
            {form.returnable && (
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:13, fontWeight:600, color:'#374151' }}>Return window:</span>
                {[7, 10].map(days => (
                  <button key={days} type="button"
                    onClick={() => set('returnWindow', days)}
                    style={{ padding:'5px 16px', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer',
                      background: form.returnWindow === days ? C.accent : 'white',
                      color:      form.returnWindow === days ? 'white'  : C.mute,
                      border: `1px solid ${form.returnWindow === days ? C.accent : C.line}` }}>
                    {days} days
                  </button>
                ))}
              </div>
            )}
            {!form.returnable && (
              <span style={{ fontSize:12, color:C.red, fontWeight:600, background:C.red+'10', padding:'4px 10px', borderRadius:6 }}>
                ⚠️ Non-returnable — customers cannot raise return requests
              </span>
            )}
          </div>
        </div>

        {error && <div style={{ marginTop:14,color:C.red,fontSize:13,fontWeight:600,background:C.red+'10',padding:'8px 12px',borderRadius:8 }}>{error}</div>}

        <div style={{ display:'flex',gap:10,marginTop:20 }}>
          <button className="btn btn-accent" onClick={handleSubmit} disabled={saving}>
            {saving ? <span className="spinner" /> : initial ? 'Save Changes' : 'Add Product'}
          </button>
          {onCancel && <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>}
        </div>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   RETURNS TAB — employee
══════════════════════════════════════════════════════ */
const RETURN_STATUS_META = {
  REQUESTED:         { label:'Requested',        color:'#f59e0b' },
  EMPLOYEE_APPROVED: { label:'You Approved',     color:'#22c55e' },
  EMPLOYEE_REJECTED: { label:'You Rejected',     color:'#ef4444' },
  APPROVED:         { label:'Admin Approved',   color:'#22c55e' },
  REJECTED:         { label:'Admin Rejected',   color:'#dc2626' },
  PICKUP_SCHEDULED: { label:'Pickup Scheduled', color:'#8b5cf6' },
  ITEM_RECEIVED:    { label:'Item Received',    color:'#06b6d4' },
  REFUND_INITIATED: { label:'Refund Initiated', color:'#FF5A1F' },
  REFUND_COMPLETED: { label:'Refund Completed', color:'#16a34a' },
  REPLACEMENT_SENT: { label:'Replacement Sent', color:'#8b5cf6' },
  COMPLETED:        { label:'Completed',        color:'#16a34a' },
};

function EmployeeReturnBadge({ status }) {
  const m = RETURN_STATUS_META[status] || { label: status, color: '#888' };
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700,
      padding:'3px 9px', borderRadius:99, background: m.color + '20', color: m.color }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background: m.color }} />{m.label}
    </span>
  );
}

function EmployeeReturnsTab() {
  const [returns, setReturns]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('ALL');
  const [actionId, setActionId]   = useState(null);
  const [note, setNote]           = useState('');
  const [saving, setSaving]       = useState(false);
  const toast = { show: (msg, type) => alert(`${type?.toUpperCase()}: ${msg}`) }; // fallback

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
    } catch(e) {
      alert(e?.response?.data?.message || 'Action failed');
    } finally { setSaving(false); }
  };

  const doAdvance = async (id) => {
    setSaving(true);
    try {
      await returnsApi.employeeAdvance(id, {});
      load();
    } catch(e) {
      alert(e?.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  const filtered = filter === 'ALL' ? returns : returns.filter(r => r.status === filter);

  const stats = {
    pending:   returns.filter(r => r.status === 'REQUESTED').length,
    approved:  returns.filter(r => ['APPROVED','PICKUP_SCHEDULED','ITEM_RECEIVED','REFUND_INITIATED'].includes(r.status)).length,
    completed: returns.filter(r => r.status === 'REFUND_COMPLETED').length,
    rejected:  returns.filter(r => r.status === 'EMPLOYEE_REJECTED').length,
    total:     returns.length,
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* KPI row */}
      <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
        {[
          { label:'Total Returns', value: stats.total,     color: C.blue   },
          { label:'Pending Action',value: stats.pending,   color: C.yellow },
          { label:'In Progress',   value: stats.approved,  color: C.green  },
          { label:'Completed',     value: stats.completed, color: C.purple },
          { label:'Rejected',      value: stats.rejected,  color: C.red    },
        ].map(k => (
          <KpiCard key={k.label} label={k.label} value={k.value} color={k.color} icon="" />
        ))}
      </div>

      <Card title="Return Requests">
        {/* Filter pills */}
        <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap', alignItems:'center' }}>
          {[
            { key:'ALL',              label:'All' },
            { key:'REQUESTED',        label:'Pending' },
            { key:'APPROVED',         label:'Admin OK' },
            { key:'PICKUP_SCHEDULED', label:'Pickup' },
            { key:'ITEM_RECEIVED',    label:'Received' },
            { key:'REFUND_INITIATED', label:'Refunding' },
            { key:'REFUND_COMPLETED', label:'Done' },
            { key:'EMPLOYEE_REJECTED',  label:'Rejected' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ padding:'5px 16px', borderRadius:99, border:'1px solid', fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap',
                borderColor: filter===f.key ? C.accent : C.line,
                background:  filter===f.key ? C.accent : 'white',
                color:       filter===f.key ? 'white'  : C.mute }}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:40, color:C.mute }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:40, color:C.mute }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📦</div>
            <div style={{ fontWeight:700 }}>No return requests</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {filtered.map(req => {
              const isOpen = actionId === req._id;
              const canAct     = req.status === 'REQUESTED';
              const canAdvance = ['APPROVED','PICKUP_SCHEDULED','ITEM_RECEIVED','REFUND_INITIATED'].includes(req.status);
              const isDone     = ['REFUND_COMPLETED','REPLACEMENT_SENT','COMPLETED','EMPLOYEE_REJECTED'].includes(req.status);

              const ADVANCE_LABELS = {
                APPROVED:         { icon:'📦', label:'Schedule Pickup',        next:'PICKUP_SCHEDULED' },
                PICKUP_SCHEDULED: { icon:'✓',  label:'Mark Item Received',     next:'ITEM_RECEIVED'    },
                ITEM_RECEIVED:    { icon:'💸', label:'Initiate Refund',         next:'REFUND_INITIATED' },
                REFUND_INITIATED: { icon:'✅', label:'Mark Refund Completed',   next:'REFUND_COMPLETED' },
              };
              const adv = ADVANCE_LABELS[req.status];

              // Mini pipeline tracker for in-progress returns
              const PIPELINE = ['PICKUP_SCHEDULED','ITEM_RECEIVED','REFUND_INITIATED','REFUND_COMPLETED'];
              const pipelineIdx = PIPELINE.indexOf(req.status);

              return (
                <div key={req._id} style={{ border:`1px solid ${C.line}`, borderRadius:12, overflow:'hidden' }}>
                  {/* Card header */}
                  <div style={{ background:C.surf, padding:'12px 16px', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:13 }}>
                        Return #{req._id?.slice(-8).toUpperCase()}
                      </div>
                      <div style={{ fontSize:11, color:C.mute, marginTop:2 }}>
                        {req.user?.name} · {req.user?.email}
                      </div>
                    </div>
                    <EmployeeReturnBadge status={req.status} />
                    {canAct && (
                      <button onClick={() => setActionId(isOpen ? null : req._id)}
                        style={{ padding:'5px 14px', borderRadius:8, background:isOpen?'#f1f5f9':'#FF5A1F', color:isOpen?C.mute:'white',
                          border:'none', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                        {isOpen ? 'Close' : 'Take Action'}
                      </button>
                    )}
                  </div>

                  {/* Item info */}
                  <div style={{ padding:'12px 16px', display:'flex', gap:12, alignItems:'center' }}>
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
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:13, fontWeight:800, color:C.accent }}>
                        Rs. {Number(req.refundAmount || 0).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize:11, color:C.mute, marginTop:2 }}>
                        {req.order?.orderNumber || req.order?._id?.slice(-6)?.toUpperCase() || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Pipeline progress bar (for approved returns) */}
                  {pipelineIdx >= 0 && (
                    <div style={{ padding:'10px 16px', borderTop:`1px solid ${C.line}`, background:'#fafafa' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:0 }}>
                        {PIPELINE.map((step, i) => {
                          const done    = i < pipelineIdx;
                          const active  = i === pipelineIdx;
                          const stepCol = done ? C.green : active ? C.accent : C.line;
                          const labels  = { PICKUP_SCHEDULED:'Pickup', ITEM_RECEIVED:'Received', REFUND_INITIATED:'Refund', REFUND_COMPLETED:'Done' };
                          return (
                            <div key={step} style={{ display:'flex', alignItems:'center', flex: i < PIPELINE.length-1 ? 1 : 'none' }}>
                              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                                <div style={{ width:22, height:22, borderRadius:'50%', background: done?C.green:active?C.accent:'#e5e7eb',
                                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'white', fontWeight:800 }}>
                                  {done ? '✓' : i+1}
                                </div>
                                <div style={{ fontSize:9, fontWeight:700, color: active?C.accent:done?C.green:C.mute, whiteSpace:'nowrap' }}>
                                  {labels[step]}
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

                  {/* Approve/Reject action panel */}
                  {isOpen && canAct && (
                    <div style={{ padding:'14px 16px', background:'#fffbf5', borderTop:`1px solid ${C.line}` }}>
                      <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>Your response to customer:</div>
                      <textarea rows={2} value={note} onChange={e=>setNote(e.target.value)}
                        placeholder="Optional note to customer (e.g. 'Please pack item securely')"
                        style={{ width:'100%', border:`1px solid ${C.line}`, borderRadius:8, padding:'8px 12px', fontSize:13, resize:'none', outline:'none', fontFamily:'inherit', boxSizing:'border-box', marginBottom:10 }} />
                      <div style={{ display:'flex', gap:10 }}>
                        <button onClick={() => doAction(req._id, 'approve')} disabled={saving}
                          style={{ flex:1, padding:'9px', borderRadius:8, background:'#22c55e', color:'white', border:'none', fontWeight:700, fontSize:13, cursor:'pointer', opacity:saving?0.6:1 }}>
                          ✅ Approve & Start Pickup
                        </button>
                        <button onClick={() => doAction(req._id, 'reject')} disabled={saving}
                          style={{ flex:1, padding:'9px', borderRadius:8, background:'#ef4444', color:'white', border:'none', fontWeight:700, fontSize:13, cursor:'pointer', opacity:saving?0.6:1 }}>
                          ❌ Reject Return
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Pipeline advance button */}
                  {canAdvance && adv && (
                    <div style={{ padding:'12px 16px', borderTop:`1px solid ${C.line}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:'#f0fdf4' }}>
                      <div style={{ fontSize:12, color:'#166534', fontWeight:600 }}>
                        Next step: <strong>{adv.next.replace(/_/g,' ')}</strong>
                      </div>
                      <button onClick={() => doAdvance(req._id)} disabled={saving}
                        style={{ padding:'8px 20px', borderRadius:8, background:'#22c55e', color:'white', border:'none',
                          fontWeight:700, fontSize:13, cursor:'pointer', opacity:saving?0.6:1, whiteSpace:'nowrap' }}>
                        {saving ? '…' : `${adv.icon} ${adv.label}`}
                      </button>
                    </div>
                  )}

                  {/* Done state */}
                  {req.status === 'REFUND_COMPLETED' && (
                    <div style={{ padding:'10px 16px', background:'#f0fdf4', borderTop:`1px solid ${C.line}`, fontSize:12, color:'#16a34a', fontWeight:700, textAlign:'center' }}>
                      ✅ Refund completed — this return is closed
                    </div>
                  )}
                  {req.status === 'EMPLOYEE_REJECTED' && (
                    <div style={{ padding:'10px 16px', background:'#fef2f2', borderTop:`1px solid ${C.line}`, fontSize:12, color:'#dc2626', fontWeight:600 }}>
                      Return rejected. Admin may review and override.
                    </div>
                  )}

                  {/* Notes */}
                  {(req.employeeNote || req.adminNote) && (
                    <div style={{ padding:'10px 16px', background:'#f8fafc', borderTop:`1px solid ${C.line}`, fontSize:12, color:'#555' }}>
                      {req.employeeNote && <div><strong>Your note:</strong> {req.employeeNote}</div>}
                      {req.adminNote  && <div style={{ marginTop:4 }}><strong>Admin note:</strong> {req.adminNote}</div>}
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
   REGISTER FORM
══════════════════════════════════════════════════════ */
function RegisterForm({ onDone }) {
  const [form, setForm] = useState({ shopName:'',shopDescription:'',gstNumber:'',businessAddress:'' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = async () => {
    if (!form.shopName) { setError('Shop name is required.'); return; }
    setSaving(true); setError('');
    try { await employeeApi.registerEmployee(form); onDone(); }
    catch(err) { setError(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ maxWidth:560,margin:'0 auto' }}>
      <Card title="Register as Employee">
        <div style={{ textAlign:'center',padding:'12px 0 24px' }}>
          <div style={{ fontSize:48 }}>🏪</div>
          <div style={{ fontWeight:800,fontSize:18,marginTop:8 }}>Set up your employee account</div>
          <div style={{ color:C.mute,fontSize:13,marginTop:4 }}>Complete your shop profile to start listing products</div>
        </div>
        {[['Shop Name *','shopName'],['GST Number','gstNumber'],['Business Address','businessAddress']].map(([l,k])=>(
          <div key={k} style={{ marginBottom:14 }}>
            <label style={{ display:'block',fontSize:11,fontWeight:700,color:C.mute,marginBottom:5,textTransform:'uppercase',letterSpacing:'.06em' }}>{l}</label>
            <Inp value={form[k]} onChange={e=>set(k,e.target.value)} />
          </div>
        ))}
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block',fontSize:11,fontWeight:700,color:C.mute,marginBottom:5,textTransform:'uppercase',letterSpacing:'.06em' }}>Shop Description</label>
          <textarea className="input" rows={3} value={form.shopDescription} onChange={e=>set('shopDescription',e.target.value)} style={{ resize:'vertical',width:'100%' }} />
        </div>
        {error && <div style={{ color:C.red,fontSize:13,marginBottom:12,background:C.red+'10',padding:'8px 12px',borderRadius:8 }}>{error}</div>}
        <button className="btn btn-accent" onClick={handleSubmit} disabled={saving} style={{ width:'100%',height:44 }}>
          {saving ? <span className="spinner" /> : 'Create Employee Account'}
        </button>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN EMPLOYEE DASHBOARD
══════════════════════════════════════════════════════ */
const TABS = [
  { id:'Overview',    icon:'📊' },
  { id:'My Products', icon:'🛒' },
  { id:'Orders',      icon:'📦' },
  { id:'Returns',     icon:'↩️' },
  { id:'Add Product', icon:'➕' },
];

export default function SellerDashboard() {
  const [tab, setTab]           = useState('Overview');
  const [profile, setProfile]   = useState(null);
  const [categories, setCats]   = useState([]);
  const [editProduct, setEdit]  = useState(null);
  const [loading, setLoading]   = useState(true);
  const navigate                = useNavigate();
  const { user }                = useAuth();

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

  const handleAddProduct = async (data) => {
    await employeeApi.createProduct(data);
    setTab('My Products');
  };

  const handleEditSave = async (data) => {
    await employeeApi.updateProduct(editProduct._id, data);
    setEdit(null);
    setTab('My Products');
  };

  const visibleTabs = profile ? TABS : [];

  return (
    <div style={{ minHeight:'100vh',background:'#f1f5f9' }}>
      {/* Sidebar */}
      <div style={{ position:'fixed',left:0,top:0,bottom:0,width:220,background:'#0f172a',display:'flex',flexDirection:'column',zIndex:100 }}>
        <div style={{ padding:'24px 20px',borderBottom:'1px solid #1e293b' }}>
          <div style={{ fontWeight:800,fontSize:17,color:'white' }}><span style={{ color:C.accent }}>Trade</span>Engine</div>
          <div style={{ fontSize:11,color:'#64748b',marginTop:3 }}>Employee Panel</div>
        </div>

        <div style={{ padding:'16px 20px',borderBottom:'1px solid #1e293b' }}>
          <div style={{ width:40,height:40,borderRadius:'50%',background:C.yellow+'22',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:C.yellow,fontSize:16,marginBottom:8 }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ fontWeight:700,color:'white',fontSize:13 }}>{user?.name}</div>
          <div style={{ fontSize:11,color:'#64748b',marginBottom:6 }}>{user?.email}</div>
          {profile && <div style={{ fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:6,background:C.yellow+'22',color:C.yellow,display:'inline-block' }}>🏪 {profile.shopName}</div>}
        </div>

        <nav style={{ flex:1,padding:'12px 0' }}>
          {visibleTabs.map(t => (
            <button key={t.id} onClick={()=>{ setTab(t.id); setEdit(null); }}
              style={{ width:'100%',textAlign:'left',padding:'11px 20px',background:tab===t.id&&!editProduct?C.accent+'22':'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:10,color:tab===t.id&&!editProduct?C.accent:'#94a3b8',fontWeight:tab===t.id&&!editProduct?700:500,fontSize:14,borderLeft:tab===t.id&&!editProduct?`3px solid ${C.accent}`:'3px solid transparent',transition:'all .15s' }}>
              {t.icon} {t.id}
            </button>
          ))}
          {editProduct && (
            <button style={{ width:'100%',textAlign:'left',padding:'11px 20px',background:C.accent+'22',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:10,color:C.accent,fontWeight:700,fontSize:14,borderLeft:`3px solid ${C.accent}` }}>
              ✏️ Edit Product
            </button>
          )}
        </nav>

        <div style={{ padding:'16px 20px',borderTop:'1px solid #1e293b' }}>
          <button onClick={()=>navigate('/')} style={{ width:'100%',padding:'9px 16px',background:'#1e293b',border:'none',borderRadius:10,color:'#94a3b8',fontWeight:600,fontSize:13,cursor:'pointer',textAlign:'left' }}>
            ← Back to Store
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft:220,padding:'32px 36px' }}>
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:24,fontWeight:800,color:'#0f172a',margin:0 }}>
            {editProduct ? '✏️ Edit Product' : (TABS.find(t=>t.id===tab)?.icon + ' ' + tab)}
          </h1>
          <p style={{ color:C.mute,margin:'4px 0 0',fontSize:13 }}>
            {tab==='Overview'    && 'Your shop performance and key metrics'}
            {tab==='My Products' && 'Manage your product listings'}
            {tab==='Orders'      && 'Track orders containing your products'}
            {tab==='Returns'     && 'Review and respond to return requests from customers'}
            {tab==='Add Product' && 'Create a new product listing'}
            {editProduct         && `Editing: ${editProduct.title}`}
          </p>
        </div>

        {loading ? <Loader /> : !profile ? (
          <RegisterForm onDone={() => { loadProfile(); setTab('Overview'); }} />
        ) : (
          <>
            {tab==='Overview'    && !editProduct && <OverviewTab profile={profile} />}
            {tab==='My Products' && !editProduct && <ProductsTab onEdit={p=>setEdit(p)} />}
            {tab==='My Products' && editProduct  && <ProductForm initial={editProduct} categories={categories} onSave={handleEditSave} onCancel={()=>setEdit(null)} />}
            {tab==='Orders'      && !editProduct && <OrdersTab onViewReturns={() => setTab('Returns')} />}
            {tab==='Returns'     && !editProduct && <EmployeeReturnsTab />}
            {tab==='Add Product' && !editProduct && <ProductForm categories={categories} onSave={handleAddProduct} />}
          </>
        )}
      </div>
    </div>
  );
}

