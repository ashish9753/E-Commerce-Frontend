import { useSearchParams, useNavigate } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { formatPriceShort, formatDate } from '../utils/formatters';
import { useState, useEffect } from 'react';

const STEPS = [
  { key:'PLACED',           label:'Order Placed',       icon:'📋', desc:'We have received your order' },
  { key:'CONFIRMED',        label:'Confirmed',          icon:'✅', desc:'Employee has confirmed your order' },
  { key:'PACKED',           label:'Packed',             icon:'📦', desc:'Your items have been packed' },
  { key:'SHIPPED',          label:'Shipped',            icon:'🚚', desc:'Your order is on its way' },
  { key:'OUT_FOR_DELIVERY', label:'Out for Delivery',   icon:'🛵', desc:'Your order is out for delivery' },
  { key:'DELIVERED',        label:'Delivered',          icon:'🏠', desc:'Package delivered successfully' },
];

const STATUS_COLOR = {
  PLACED:'#f59e0b', CONFIRMED:'#3b82f6', PACKED:'#8b5cf6',
  SHIPPED:'#06b6d4', OUT_FOR_DELIVERY:'#FF5A1F',
  DELIVERED:'#16a34a', CANCELLED:'#dc2626', RETURNED:'#6b7280',
};

function ProgressTracker({ currentStatus }) {
  const stepIdx = STEPS.findIndex(s => s.key === currentStatus);

  return (
    <div style={{ padding:'28px 32px 24px', background:'white', border:'1px solid #ddd', borderRadius:8, marginBottom:16 }}>
      <div style={{ display:'flex', alignItems:'flex-start', position:'relative' }}>
        {/* connecting line */}
        <div style={{ position:'absolute', top:20, left:20, right:20, height:3, background:'#e5e7eb', zIndex:0 }} />
        <div style={{
          position:'absolute', top:20, left:20,
          width: stepIdx < 0 ? 0 : `calc(${(stepIdx/(STEPS.length-1))*100}% - 0px)`,
          height:3, background:'#007600', zIndex:1, transition:'width .6s ease'
        }} />

        {STEPS.map((step, i) => {
          const done    = i < stepIdx;
          const active  = i === stepIdx;
          const future  = i > stepIdx;
          return (
            <div key={step.key} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', position:'relative', zIndex:2 }}>
              <div style={{
                width:40, height:40, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:16, fontWeight:700, transition:'all .3s',
                background: done ? '#007600' : active ? '#FF5A1F' : 'white',
                border: done ? '3px solid #007600' : active ? '3px solid #FF5A1F' : '3px solid #e5e7eb',
                color: (done || active) ? 'white' : '#aaa',
                boxShadow: active ? '0 0 0 4px rgba(255,90,31,.2)' : 'none',
              }}>
                {done ? '✓' : step.icon}
              </div>
              <div style={{ marginTop:10, textAlign:'center' }}>
                <div style={{ fontSize:12, fontWeight:active?800:done?600:400, color:active?'#FF5A1F':done?'#007600':'#aaa', whiteSpace:'nowrap' }}>
                  {step.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getOrderById, cancelOrder } = useOrders();
  const [trackId, setTrackId]     = useState(searchParams.get('id') || '');
  const [order, setOrder]         = useState(null);
  const [loading, setLoading]     = useState(false);
  const [searched, setSearched]   = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) { setTrackId(id); fetchOrder(id); }
  }, []);

  const fetchOrder = async (id) => {
    if (!id?.trim()) return;
    if (!user) { navigate('/login'); return; }
    setLoading(true); setSearched(true);
    const r = await getOrderById(id.trim());
    setLoading(false);
    setOrder(r.success ? r.order : null);
  };

  const handleCancel = async () => {
    if (!order || !window.confirm('Cancel this order?')) return;
    setCancelling(true);
    const r = await cancelOrder(order._id);
    setCancelling(false);
    if (r.success) setOrder(r.order);
  };

  const isCancelled = order?.orderStatus === 'CANCELLED';
  const isDelivered = order?.orderStatus === 'DELIVERED';
  const isReturned  = order?.orderStatus === 'RETURNED';
  const canCancel   = ['PLACED','CONFIRMED'].includes(order?.orderStatus);

  const addr = order?.shippingAddress;
  const statusColor = STATUS_COLOR[order?.orderStatus] || '#666';

  return (
    <div style={{ background:'#f0f2f2', minHeight:'100vh', padding:'24px 0 60px' }}>
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'0 16px' }}>

        {/* Search bar */}
        <div style={{ background:'white', border:'1px solid #ddd', borderRadius:8, padding:'20px 24px', marginBottom:16 }}>
          <h1 style={{ margin:'0 0 16px', fontSize:20, fontWeight:700 }}>Track Package</h1>
          <div style={{ display:'flex', gap:10, maxWidth:600 }}>
            <input
              className="input"
              placeholder="Enter Order ID or paste from your order confirmation…"
              value={trackId}
              onChange={e=>setTrackId(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&fetchOrder(trackId)}
              style={{ flex:1, height:42 }}
            />
            <button
              onClick={()=>fetchOrder(trackId)}
              disabled={loading}
              style={{ height:42, padding:'0 24px', background:'#FFD814', border:'1px solid #FBA131', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer', whiteSpace:'nowrap' }}>
              {loading ? '…' : 'Track'}
            </button>
            <button onClick={()=>navigate('/orders')}
              style={{ height:42, padding:'0 16px', background:'white', border:'1px solid #D5D9D9', borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer', color:'#444' }}>
              My Orders
            </button>
          </div>
        </div>

        {/* Not found */}
        {searched && !loading && !order && (
          <div style={{ background:'white', border:'1px solid #ddd', borderRadius:8, padding:'48px 24px', textAlign:'center' }}>
            <div style={{ fontSize:52, marginBottom:16 }}>🔍</div>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Order not found</div>
            <div style={{ color:'#888', marginBottom:24 }}>Double-check the Order ID and try again.</div>
            <button onClick={()=>navigate('/orders')} style={{ background:'#FFD814', border:'1px solid #FBA131', borderRadius:20, padding:'8px 24px', fontWeight:700, fontSize:14, cursor:'pointer' }}>
              View My Orders
            </button>
          </div>
        )}

        {order && (
          <>
            {/* Order ID header */}
            <div style={{ background:'white', border:'1px solid #ddd', borderRadius:8, padding:'16px 24px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
              <div>
                <span style={{ fontSize:13, color:'#888' }}>Order # </span>
                <span style={{ fontWeight:700, fontFamily:'monospace', fontSize:15 }}>{order._id?.slice(-8).toUpperCase()}</span>
                <span style={{ fontSize:13, color:'#888', marginLeft:16 }}>Placed on {formatDate(order.createdAt)}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700, padding:'5px 12px', borderRadius:99, background:statusColor+'18', color:statusColor }}>
                  <span style={{ width:8,height:8,borderRadius:'50%',background:statusColor }} />
                  {isCancelled ? 'Cancelled' : (order.orderStatus||'').replace(/_/g,' ')}
                </span>
              </div>
            </div>

            {/* Delivery info banner */}
            {!isCancelled && !isReturned && (
              <div style={{ background: isDelivered?'#f0fff4':'#fff8f0', border:`1px solid ${isDelivered?'#bbf7d0':'#fed7aa'}`, borderRadius:8, padding:'16px 24px', marginBottom:16, display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ fontSize:36 }}>{isDelivered ? '🏠' : '🚚'}</div>
                <div>
                  {isDelivered ? (
                    <>
                      <div style={{ fontWeight:800, fontSize:17, color:'#15803d' }}>Delivered!</div>
                      <div style={{ fontSize:13, color:'#166534', marginTop:2 }}>
                        {order.deliveredAt ? `Delivered on ${formatDate(order.deliveredAt)}` : 'Your order has been delivered'}
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontWeight:800, fontSize:17, color:'#c2410c' }}>
                        Estimated Delivery: {order.estimatedDeliveryDate ? formatDate(order.estimatedDeliveryDate) : '3–5 business days'}
                      </div>
                      <div style={{ fontSize:13, color:'#9a3412', marginTop:2 }}>
                        Current status: <strong>{(order.orderStatus||'').replace(/_/g,' ')}</strong>
                        {order.trackingId && ` · Tracking ID: ${order.trackingId}`}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Return in progress banner */}
            {isReturned && (
              <div style={{ background:'#ede9fe', border:'1px solid #c4b5fd', borderRadius:8, padding:'16px 24px', marginBottom:16, display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ fontSize:36 }}>↩️</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:17, color:'#6d28d9' }}>Return in Progress</div>
                  <div style={{ fontSize:13, color:'#5b21b6', marginTop:2 }}>A return request has been submitted for this order. Track its status below.</div>
                </div>
                <button onClick={()=>navigate('/returns')}
                  style={{ padding:'9px 20px', borderRadius:20, background:'#7c3aed', border:'none', color:'white', fontWeight:700, fontSize:13, cursor:'pointer', flexShrink:0 }}>
                  Track Return →
                </button>
              </div>
            )}

            {/* Progress steps */}
            {!isCancelled && <ProgressTracker currentStatus={order.orderStatus} />}

            {/* Cancelled banner */}
            {isCancelled && (
              <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'16px 24px', marginBottom:16, display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ fontSize:36 }}>❌</div>
                <div>
                  <div style={{ fontWeight:800, fontSize:16, color:'#dc2626' }}>Order Cancelled</div>
                  {order.cancellationReason && <div style={{ fontSize:13, color:'#991b1b', marginTop:2 }}>Reason: {order.cancellationReason}</div>}
                  {order.refundStatus && <div style={{ fontSize:13, color:'#991b1b', marginTop:2 }}>Refund: {order.refundStatus} · {formatPriceShort(order.refundAmount)}</div>}
                </div>
              </div>
            )}

            {/* Main 2-col layout */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:16, alignItems:'start' }}>

              {/* Left col */}
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

                {/* Order Items */}
                <div style={{ background:'white', border:'1px solid #ddd', borderRadius:8, overflow:'hidden' }}>
                  <div style={{ padding:'14px 20px', borderBottom:'1px solid #eee', fontWeight:700, fontSize:15 }}>
                    Order Items ({order.orderItems?.length})
                  </div>
                  <div style={{ padding:'0 20px' }}>
                    {(order.orderItems || []).map((item, i) => (
                      <div key={i} style={{ display:'flex', gap:16, padding:'16px 0', borderBottom:i<order.orderItems.length-1?'1px solid #f0f0f0':'none', alignItems:'flex-start' }}>
                        <div style={{ width:80, height:80, border:'1px solid #ddd', borderRadius:6, overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:'#fafafa' }}>
                          {item.image ? <img src={item.image} alt={item.title} style={{ width:'100%',height:'100%',objectFit:'contain' }} /> : <span style={{ fontSize:32 }}>🛍️</span>}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:600, fontSize:14, marginBottom:6 }}>{item.title}</div>
                          <div style={{ fontSize:13, color:'#888', marginBottom:4 }}>Qty: {item.quantity}</div>
                          <div style={{ fontSize:14, fontWeight:700 }}>
                            {formatPriceShort(item.price * item.quantity)}
                            <span style={{ fontSize:12, fontWeight:400, color:'#888', marginLeft:6 }}>({formatPriceShort(item.price)} each)</span>
                          </div>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          {isDelivered && (
                            <button onClick={()=>navigate(`/returns?orderId=${order._id}`)}
                              style={{ fontSize:12,fontWeight:600,padding:'6px 14px',borderRadius:20,border:'1px solid #D5D9D9',background:'linear-gradient(to bottom,#f7f8fa,#e7e9ec)',cursor:'pointer' }}>
                              Return item
                            </button>
                          )}
                          <button onClick={()=>navigate(`/product/${item.product?._id||item.product}`)}
                            style={{ fontSize:12,fontWeight:600,padding:'6px 14px',borderRadius:20,border:'1px solid #D5D9D9',background:'linear-gradient(to bottom,#f7f8fa,#e7e9ec)',cursor:'pointer' }}>
                            Buy again
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status timeline */}
                {(order.statusHistory || []).length > 0 && (
                  <div style={{ background:'white', border:'1px solid #ddd', borderRadius:8, overflow:'hidden' }}>
                    <div style={{ padding:'14px 20px', borderBottom:'1px solid #eee', fontWeight:700, fontSize:15 }}>Tracking History</div>
                    <div style={{ padding:'16px 20px' }}>
                      {[...(order.statusHistory || [])].reverse().map((entry, i) => (
                        <div key={i} style={{ display:'flex', gap:16, marginBottom: i<order.statusHistory.length-1?20:0 }}>
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                            <div style={{ width:12, height:12, borderRadius:'50%', background:i===0?'#FF5A1F':'#007600', flexShrink:0, marginTop:2 }} />
                            {i<order.statusHistory.length-1 && <div style={{ width:2,flex:1,background:'#e5e7eb',marginTop:4 }} />}
                          </div>
                          <div style={{ paddingBottom: i<order.statusHistory.length-1?0:0 }}>
                            <div style={{ fontWeight:700, fontSize:13, color:i===0?'#FF5A1F':'#333' }}>
                              {entry.status?.replace(/_/g,' ')}
                            </div>
                            {entry.note && <div style={{ fontSize:12, color:'#888', marginTop:2 }}>{entry.note}</div>}
                            {entry.timestamp && <div style={{ fontSize:12, color:'#aaa', marginTop:2 }}>{formatDate(entry.timestamp)}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display:'flex', gap:10 }}>
                  {canCancel && (
                    <button disabled={cancelling} onClick={handleCancel}
                      style={{ padding:'10px 20px',borderRadius:20,border:'1px solid #c0392b',background:'white',color:'#c0392b',fontWeight:700,fontSize:13,cursor:'pointer' }}>
                      {cancelling ? 'Cancelling…' : 'Cancel Order'}
                    </button>
                  )}
                  {isDelivered && (() => {
                    const firstItem = order.orderItems?.[0];
                    const prod = firstItem?.product || {};
                    const isReturnable = prod.returnable !== false;
                    const returnWindow = prod.returnWindow || 7;
                    const deliveredAt = order.deliveredAt || order.updatedAt;
                    const daysElapsed = deliveredAt ? Math.floor((Date.now() - new Date(deliveredAt).getTime()) / 86400000) : 0;
                    const windowExpired = daysElapsed > returnWindow;
                    if (!isReturnable) return <span style={{ padding:'10px 16px',borderRadius:20,background:'#fef2f2',color:'#dc2626',fontWeight:600,fontSize:12,border:'1px solid #fecaca' }}>🚫 Non-returnable</span>;
                    if (windowExpired) return <span style={{ padding:'10px 16px',borderRadius:20,background:'#fef2f2',color:'#dc2626',fontWeight:600,fontSize:12,border:'1px solid #fecaca' }}>Return window expired</span>;
                    return (
                      <button onClick={()=>navigate(`/returns?orderId=${order._id}`)}
                        style={{ padding:'10px 20px',borderRadius:20,border:'1px solid #D5D9D9',background:'linear-gradient(to bottom,#f7f8fa,#e7e9ec)',fontWeight:600,fontSize:13,cursor:'pointer' }}>
                        Return / Refund
                      </button>
                    );
                  })()}
                  {isReturned && (
                    <button onClick={()=>navigate('/returns')}
                      style={{ padding:'10px 20px',borderRadius:20,border:'1px solid #FF5A1F',background:'#FF5A1F',color:'white',fontWeight:700,fontSize:13,cursor:'pointer' }}>
                      ↩️ Track Your Return
                    </button>
                  )}
                  <button onClick={()=>navigate('/orders')}
                    style={{ padding:'10px 20px',borderRadius:20,border:'1px solid #D5D9D9',background:'linear-gradient(to bottom,#f7f8fa,#e7e9ec)',fontWeight:600,fontSize:13,cursor:'pointer' }}>
                    ← All Orders
                  </button>
                </div>
              </div>

              {/* Right col */}
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

                {/* Delivery address */}
                <div style={{ background:'white', border:'1px solid #ddd', borderRadius:8, padding:'18px 20px' }}>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>📍 Delivery Address</div>
                  {addr ? (
                    <div style={{ fontSize:13, lineHeight:1.7, color:'#333' }}>
                      <div style={{ fontWeight:700, fontSize:14 }}>{addr.fullName}</div>
                      <div>{addr.houseNo}, {addr.area}</div>
                      <div>{addr.city}, {addr.state} — {addr.pincode}</div>
                      {addr.landmark && <div style={{ color:'#888' }}>Near: {addr.landmark}</div>}
                      <div style={{ marginTop:6, fontWeight:600 }}>📞 {addr.phone}</div>
                    </div>
                  ) : <div style={{ color:'#888', fontSize:13 }}>Address not available</div>}
                </div>

                {/* Payment summary */}
                <div style={{ background:'white', border:'1px solid #ddd', borderRadius:8, padding:'18px 20px' }}>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>💳 Payment Summary</div>
                  {[
                    ['Method',   order.paymentMethod],
                    ['Status',   order.paymentStatus],
                    ['Items',    formatPriceShort(order.itemsPrice)],
                    ['Shipping', order.shippingPrice===0 ? 'FREE' : formatPriceShort(order.shippingPrice)],
                    ['Tax',      formatPriceShort(order.taxPrice)],
                    ...(order.discountAmount>0 ? [['Discount', `-${formatPriceShort(order.discountAmount)}`]] : []),
                  ].map(([label, val]) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'5px 0', borderBottom:'1px solid #f5f5f5' }}>
                      <span style={{ color:'#666' }}>{label}</span>
                      <span style={{ fontWeight:600, color: label==='Discount'?'#c45500':'#333' }}>{val}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 0 0', borderTop:'2px solid #eee', marginTop:4 }}>
                    <span style={{ fontWeight:700, fontSize:15 }}>Order Total</span>
                    <span style={{ fontWeight:800, fontSize:18, color:'#c45500' }}>{formatPriceShort(order.totalPrice)}</span>
                  </div>
                </div>

                {/* Help */}
                <div style={{ background:'white', border:'1px solid #ddd', borderRadius:8, padding:'18px 20px' }}>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Need Help?</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {[['📞','Contact Support'],['❓','Order FAQs'],['🔄','Return Policy']].map(([ic,label])=>(
                      <button key={label} style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 0',background:'none',border:'none',cursor:'pointer',fontSize:13,color:'#007185',fontWeight:600,textAlign:'left' }}>
                        {ic} {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
