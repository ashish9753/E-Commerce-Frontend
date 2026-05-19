import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { formatPriceShort, formatDate } from '../utils/formatters';

const STATUS_META = {
  PLACED:           { label: 'Order Placed',       color: '#f59e0b', bg: '#fef3c7' },
  CONFIRMED:        { label: 'Confirmed',           color: '#3b82f6', bg: '#dbeafe' },
  PACKED:           { label: 'Packed',              color: '#8b5cf6', bg: '#ede9fe' },
  SHIPPED:          { label: 'Shipped',             color: '#06b6d4', bg: '#cffafe' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery',    color: '#FF5A1F', bg: '#ffedd5' },
  DELIVERED:        { label: 'Delivered',           color: '#16a34a', bg: '#dcfce7' },
  CANCELLED:        { label: 'Cancelled',           color: '#dc2626', bg: '#fee2e2' },
  RETURNED:         { label: 'Returned',            color: '#6b7280', bg: '#f3f4f6' },
};

const FILTERS = ['All Orders', 'Active', 'Delivered', 'Cancelled'];

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.PLACED;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700,
      padding:'4px 10px', borderRadius:99, background:m.bg, color:m.color }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:m.color }} />
      {m.label}
    </span>
  );
}

export default function OrdersPage() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const { getMyOrders } = useOrders();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('All Orders');
  const [search, setSearch]   = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    getMyOrders({ limit: 50 }).then(r => {
      if (r.success) setOrders(r.data || r.orders || []);
    }).finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchQ = !q || o.orderNumber?.toLowerCase().includes(q) ||
      o._id?.toLowerCase().includes(q) ||
      o.orderItems?.some(i => i.title?.toLowerCase().includes(q));
    const s = o.orderStatus;
    const matchF =
      filter === 'All Orders' ? true :
      filter === 'Active'     ? ['PLACED','CONFIRMED','PACKED','SHIPPED','OUT_FOR_DELIVERY'].includes(s) :
      filter === 'Delivered'  ? s === 'DELIVERED' :
      filter === 'Cancelled'  ? s === 'CANCELLED' : true;
    return matchQ && matchF;
  });

  return (
    <div style={{ background:'#f0f2f2', minHeight:'100vh', padding:'24px 0 60px' }}>
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'0 16px' }}>

        {/* Header */}
        <div style={{ background:'white', borderRadius:8, padding:'20px 24px', marginBottom:16, border:'1px solid #ddd' }}>
          <h1 style={{ margin:0, fontSize:22, fontWeight:700 }}>Your Orders</h1>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#666' }}>{orders.length} order{orders.length!==1?'s':''} total</p>
        </div>

        {/* Filter + Search */}
        <div style={{ background:'white', borderRadius:8, border:'1px solid #ddd', marginBottom:16, overflow:'hidden' }}>
          <div style={{ display:'flex', borderBottom:'1px solid #ddd', padding:'0 16px' }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding:'14px 16px', border:'none', background:'none', fontWeight:filter===f?700:500,
                  fontSize:13, cursor:'pointer', color:filter===f?'#c45500':'#444',
                  borderBottom:filter===f?'2px solid #c45500':'2px solid transparent',
                  marginBottom:-1, transition:'all .15s' }}>
                {f}
              </button>
            ))}
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8, padding:'8px 0' }}>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search orders…"
                style={{ height:34, border:'1px solid #ccc', borderRadius:6, padding:'0 12px', fontSize:13, outline:'none', width:220 }} />
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ background:'white',borderRadius:8,border:'1px solid #ddd',padding:60,textAlign:'center',color:'#888' }}>
            <div className="spinner" style={{ width:32,height:32,margin:'0 auto 12px' }} />
            Loading your orders…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background:'white',borderRadius:8,border:'1px solid #ddd',padding:'60px 24px',textAlign:'center' }}>
            <div style={{ fontSize:56,marginBottom:16 }}>📦</div>
            <div style={{ fontSize:18,fontWeight:700,marginBottom:8 }}>No orders found</div>
            <div style={{ color:'#888',marginBottom:24 }}>
              {search ? 'Try a different search term' : 'Looks like you haven\'t placed any orders yet'}
            </div>
            <button onClick={()=>navigate('/products')}
              style={{ background:'#FFD814',border:'1px solid #FBA131',borderRadius:20,padding:'8px 24px',fontWeight:700,fontSize:14,cursor:'pointer' }}>
              Start Shopping
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {filtered.map(order => {
              const status = order.orderStatus || 'PLACED';
              const isDelivered = status === 'DELIVERED';
              const isCancelled = status === 'CANCELLED';
              const isActive = ['PLACED','CONFIRMED','PACKED','SHIPPED','OUT_FOR_DELIVERY'].includes(status);

              return (
                <div key={order._id} style={{ background:'white', borderRadius:8, border:'1px solid #ddd', overflow:'hidden' }}>
                  {/* Order header - Amazon style grey bar */}
                  <div style={{ background:'#f0f2f2', padding:'12px 20px', display:'flex', alignItems:'center', gap:32, flexWrap:'wrap', borderBottom:'1px solid #ddd' }}>
                    <div>
                      <div style={{ fontSize:10,fontWeight:700,color:'#888',letterSpacing:'.06em',textTransform:'uppercase' }}>Order Placed</div>
                      <div style={{ fontSize:13,fontWeight:600,marginTop:2 }}>{formatDate(order.createdAt)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:10,fontWeight:700,color:'#888',letterSpacing:'.06em',textTransform:'uppercase' }}>Total</div>
                      <div style={{ fontSize:13,fontWeight:700,marginTop:2 }}>{formatPriceShort(order.totalPrice)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:10,fontWeight:700,color:'#888',letterSpacing:'.06em',textTransform:'uppercase' }}>Ship To</div>
                      <div style={{ fontSize:13,fontWeight:600,marginTop:2 }}>{order.shippingAddress?.fullName || '—'}</div>
                    </div>
                    <div style={{ marginLeft:'auto', textAlign:'right' }}>
                      <div style={{ fontSize:10,fontWeight:700,color:'#888',letterSpacing:'.06em',textTransform:'uppercase' }}>Order # {order._id?.slice(-8).toUpperCase()}</div>
                      <button onClick={()=>navigate(`/track?id=${order._id}`)}
                        style={{ fontSize:12,color:'#007185',background:'none',border:'none',cursor:'pointer',fontWeight:600,marginTop:2 }}>
                        View order details →
                      </button>
                    </div>
                  </div>

                  {/* Status bar */}
                  <div style={{ padding:'14px 20px', borderBottom:'1px solid #eee', display:'flex', alignItems:'center', gap:12 }}>
                    <StatusBadge status={status} />
                    {isDelivered && order.deliveredAt && (
                      <span style={{ fontSize:13,color:'#007600',fontWeight:600 }}>
                        Delivered on {formatDate(order.deliveredAt)}
                      </span>
                    )}
                    {isActive && (
                      <span style={{ fontSize:13,color:'#007185',fontWeight:600 }}>
                        Est. delivery: {order.estimatedDeliveryDate ? formatDate(order.estimatedDeliveryDate) : '3-5 business days'}
                      </span>
                    )}
                    {isCancelled && order.cancellationReason && (
                      <span style={{ fontSize:13,color:'#888' }}>Reason: {order.cancellationReason}</span>
                    )}
                    {order.trackingId && (
                      <span style={{ fontSize:12,color:'#888',marginLeft:'auto' }}>Tracking: <strong>{order.trackingId}</strong></span>
                    )}
                  </div>

                  {/* Order items */}
                  <div style={{ padding:'16px 20px' }}>
                    {(order.orderItems || []).map((item, i) => (
                      <div key={i} style={{ display:'flex', gap:16, padding:'12px 0', borderBottom:i<order.orderItems.length-1?'1px solid #f0f0f0':'none', alignItems:'flex-start' }}>
                        {/* Image */}
                        <div style={{ width:80, height:80, border:'1px solid #ddd', borderRadius:6, overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:'#fafafa' }}>
                          {item.image
                            ? <img src={item.image} alt={item.title} style={{ width:'100%', height:'100%', objectFit:'contain' }} />
                            : <span style={{ fontSize:32 }}>🛍️</span>
                          }
                        </div>

                        {/* Details */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:600, fontSize:14, marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize:12, color:'#888', marginBottom:6 }}>
                            Qty: {item.quantity} · {formatPriceShort(item.price)} each
                          </div>
                          <div style={{ fontSize:14, fontWeight:700 }}>
                            {formatPriceShort(item.price * item.quantity)}
                          </div>
                        </div>

                        {/* Actions per item */}
                        <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
                          <button onClick={()=>navigate(`/track?id=${order._id}`)}
                            style={{ fontSize:12,fontWeight:600,padding:'6px 14px',borderRadius:20,border:'1px solid #D5D9D9',background:'linear-gradient(to bottom, #f7f8fa, #e7e9ec)',cursor:'pointer',whiteSpace:'nowrap' }}>
                            Track Package
                          </button>
                          {isDelivered && (
                            <button onClick={()=>navigate(`/returns?orderId=${order._id}`)}
                              style={{ fontSize:12,fontWeight:600,padding:'6px 14px',borderRadius:20,border:'1px solid #D5D9D9',background:'linear-gradient(to bottom, #f7f8fa, #e7e9ec)',cursor:'pointer' }}>
                              Return / Refund
                            </button>
                          )}
                          <button onClick={()=>navigate(`/product/${item.product?._id||item.product}`)}
                            style={{ fontSize:12,fontWeight:600,padding:'6px 14px',borderRadius:20,border:'1px solid #D5D9D9',background:'linear-gradient(to bottom, #f7f8fa, #e7e9ec)',cursor:'pointer' }}>
                            Buy Again
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div style={{ borderTop:'1px solid #eee', padding:'12px 20px', display:'flex', gap:12, alignItems:'center' }}>
                    <span style={{ fontSize:12, color:'#888' }}>
                      Payment: <strong style={{ color:'#333' }}>{order.paymentMethod}</strong>
                      {' · '}
                      <strong style={{ color: order.paymentStatus==='PAID'?'#007600':'#c7a200' }}>{order.paymentStatus}</strong>
                    </span>
                    <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                      <button onClick={()=>navigate(`/track?id=${order._id}`)}
                        style={{ fontSize:12,fontWeight:600,padding:'6px 16px',borderRadius:20,border:'1px solid #D5D9D9',background:'linear-gradient(to bottom,#f7f8fa,#e7e9ec)',cursor:'pointer' }}>
                        Order Details
                      </button>
                      {isDelivered && (
                        <button onClick={()=>navigate(`/returns?orderId=${order._id}`)}
                          style={{ fontSize:12,fontWeight:600,padding:'6px 16px',borderRadius:20,border:'1px solid #D5D9D9',background:'linear-gradient(to bottom,#f7f8fa,#e7e9ec)',cursor:'pointer' }}>
                          Write a Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
