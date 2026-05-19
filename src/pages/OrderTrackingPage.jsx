import { useSearchParams, useNavigate } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { formatPriceShort, formatDate } from '../utils/formatters';
import { useState, useEffect } from 'react';

const STATUS_STEPS = ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const STEP_ICONS = ['📋', '✅', '📦', '🚚', '🏃', '🏠'];
const STEP_LABELS = ['Order Placed', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

export default function OrderTrackingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getOrderById, cancelOrder } = useOrders();
  const [trackId, setTrackId] = useState(searchParams.get('id') || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (searchParams.get('id')) { setTrackId(searchParams.get('id')); fetchOrder(searchParams.get('id')); }
  }, []);

  const fetchOrder = async (id) => {
    if (!id?.trim()) return;
    if (!user) { navigate('/login'); return; }
    setLoading(true);
    setSearched(true);
    const result = await getOrderById(id.trim());
    setLoading(false);
    setOrder(result.success ? result.order : null);
  };

  const handleCancel = async () => {
    if (!order || !window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    const result = await cancelOrder(order._id);
    setCancelling(false);
    if (result.success) setOrder(result.order);
  };

  const currentStepIndex = order ? STATUS_STEPS.indexOf(order.orderStatus) : -1;
  const isCancelled = order?.orderStatus === 'CANCELLED';

  return (
    <div className="wrap" style={{ paddingTop: 24, paddingBottom: 80 }}>
      <div className="page-title">Track Order</div>
      <div className="page-sub">Enter your order ID to see real-time tracking</div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 32, maxWidth: 560 }}>
        <input className="input" placeholder="Order ID" value={trackId} onChange={e => setTrackId(e.target.value)} style={{ height: 48 }} />
        <button className="btn btn-primary" style={{ height: 48, padding: '0 24px' }} disabled={loading} onClick={() => fetchOrder(trackId)}>
          {loading ? '...' : 'Track'}
        </button>
      </div>

      {searched && !loading && !order && (
        <div className="empty-state">
          <div className="emo">🔍</div>
          <h3>Order not found</h3>
          <p>Check the order ID and try again.</p>
          <button className="btn btn-ghost" onClick={() => navigate('/orders')}>View My Orders</button>
        </div>
      )}

      {order && (
        <>
          <div className="tr-hero">
            <div className="tr-head-row">
              <div>
                <div className="tr-oid">Order ID</div>
                <div className="tr-onum">#{order._id?.slice(-8).toUpperCase()}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginTop: 4 }}>Placed on {formatDate(order.createdAt)}</div>
              </div>
              <div className="tr-status">
                <div className="dot" style={isCancelled ? { background: '#ef4444' } : {}} />
                {isCancelled ? 'Cancelled' : (order.orderStatus || '').replace(/_/g, ' ')}
              </div>
            </div>

            {!isCancelled && (
              <div className="tr-steps">
                {STATUS_STEPS.map((status, i) => {
                  const state = i < currentStepIndex ? 'done' : i === currentStepIndex ? 'active' : '';
                  return (
                    <div key={status} className={`tr-step ${state}`}>
                      <div className="ic">{STEP_ICONS[i]}</div>
                      <div className="nm">{STEP_LABELS[i]}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="tr-body">
            <div>
              <div className="tr-card">
                <h4>Delivery Address</h4>
                {order.shippingAddress && (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{order.shippingAddress.fullName}</div>
                    <div style={{ fontSize: 13, color: 'var(--mute)', marginTop: 4 }}>
                      {order.shippingAddress.houseNo}, {order.shippingAddress.area}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--mute)' }}>{order.shippingAddress.phone}</div>
                  </>
                )}
              </div>

              <div className="tr-card" style={{ marginTop: 16 }}>
                <h4>Order Items</h4>
                {(order.orderItems || []).map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line)', alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, background: 'var(--surface)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {item.image ? <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : '🛍️'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--mute)' }}>Qty: {item.quantity}</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{formatPriceShort(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>

              {['PLACED', 'CONFIRMED'].includes(order.orderStatus) && (
                <button className="btn btn-ghost" style={{ marginTop: 16, color: 'var(--bad)', borderColor: 'var(--bad)' }} disabled={cancelling} onClick={handleCancel}>
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              )}

              {order.orderStatus === 'DELIVERED' && (
                <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => navigate(`/returns?orderId=${order._id}`)}>
                  Return / Refund
                </button>
              )}
            </div>

            <div className="tr-side">
              <div className="tr-card">
                <h4>Status History</h4>
                <div className="timeline">
                  {(order.statusHistory || []).map((entry, i) => (
                    <div key={i} className="tl-row done">
                      <div className="tl-dot">✓</div>
                      <div>
                        <div className="ev">{entry.status?.replace(/_/g, ' ')}</div>
                        {entry.note && <div className="loc">{entry.note}</div>}
                        <div className="tm">{entry.timestamp ? formatDate(entry.timestamp) : ''}</div>
                      </div>
                    </div>
                  ))}
                  {(!order.statusHistory || order.statusHistory.length === 0) && (
                    <div className="tl-row active"><div className="tl-dot">●</div><div><div className="ev">{(order.orderStatus || '').replace(/_/g, ' ')}</div></div></div>
                  )}
                </div>
              </div>

              <div className="tr-card">
                <h4>Payment Summary</h4>
                <div style={{ fontSize: 13, color: 'var(--mute)', display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span>Payment Method</span>
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{order.paymentMethod}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--mute)', display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span>Status</span>
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{order.paymentStatus}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--mute)', display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span>Total</span>
                  <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}>{formatPriceShort(order.totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
