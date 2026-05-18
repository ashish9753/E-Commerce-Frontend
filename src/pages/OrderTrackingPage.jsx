import { useSearchParams, useNavigate } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { formatPriceShort, formatDate } from '../utils/formatters';
import { useState } from 'react';

export default function OrderTrackingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { orders } = useOrders();
  const [trackId, setTrackId] = useState(searchParams.get('id') || '');
  const [searched, setSearched] = useState(!!searchParams.get('id'));

  const order = orders.find(o => o.id === trackId);

  const getStepState = (idx) => {
    const doneCount = order?.timeline.filter(t => t.state === 'done').length || 0;
    const activeIdx = order?.timeline.findIndex(t => t.state === 'active') ?? -1;
    if (idx < doneCount) return 'done';
    if (idx === activeIdx) return 'active';
    return '';
  };

  const stepIcons = ['📋', '✅', '📦', '🚚', '🏃', '🏠'];

  return (
    <div className="wrap" style={{ paddingTop: 24, paddingBottom: 80 }}>
      <div className="page-title">Track Order</div>
      <div className="page-sub">Enter your order ID to see real-time tracking</div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 32, maxWidth: 560 }}>
        <input className="input" placeholder="e.g. TE1ABC2DEF" value={trackId} onChange={e => setTrackId(e.target.value.toUpperCase())} style={{ height: 48 }} />
        <button className="btn btn-primary" style={{ height: 48, padding: '0 24px' }} onClick={() => setSearched(true)}>Track</button>
      </div>

      {searched && !order && (
        <div className="empty-state">
          <div className="emo">🔍</div>
          <h3>Order not found</h3>
          <p>Check the order ID and try again. You can find it in your order confirmation email.</p>
          <button className="btn btn-ghost" onClick={() => navigate('/orders')}>View My Orders</button>
        </div>
      )}

      {order && (
        <>
          <div className="tr-hero">
            <div className="tr-head-row">
              <div>
                <div className="tr-oid">Order ID</div>
                <div className="tr-onum">{order.id}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginTop: 4 }}>Placed on {formatDate(order.placedAt)}</div>
              </div>
              <div className="tr-status">
                <div className="dot" />
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </div>
            </div>
            <div className="tr-steps">
              {order.timeline.map((step, i) => (
                <div key={i} className={`tr-step ${getStepState(i)}`}>
                  <div className="ic">{stepIcons[i] || '📍'}</div>
                  <div className="nm">{step.event}</div>
                  <div className="tm">{step.time ? formatDate(step.time) : '—'}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="tr-body">
            <div>
              <div className="tr-card">
                <h4>Delivery Address</h4>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{order.customer?.name}</div>
                <div style={{ fontSize: 13, color: 'var(--mute)', marginTop: 4 }}>{order.customer?.address}, {order.customer?.city}</div>
                <div style={{ fontSize: 13, color: 'var(--mute)' }}>{order.customer?.phone}</div>
              </div>
              <div className="tr-card" style={{ marginTop: 16 }}>
                <h4>Order Items</h4>
                {order.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line)', alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, background: 'var(--surface)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{item.emo}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--mute)' }}>Qty: {item.qty}</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{formatPriceShort(item.price * item.qty)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="tr-side">
              <div className="tr-card">
                <h4>Order Timeline</h4>
                <div className="timeline">
                  {order.timeline.map((step, i) => (
                    <div key={i} className={`tl-row ${step.state}`}>
                      <div className="tl-dot">{step.state === 'done' ? '✓' : step.state === 'active' ? '●' : '○'}</div>
                      <div>
                        <div className="ev">{step.event}</div>
                        {step.loc && <div className="loc">{step.loc}</div>}
                        <div className="tm">{step.time ? formatDate(step.time) : 'Pending'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="tr-card">
                <h4>Payment Summary</h4>
                <div style={{ fontSize: 13, color: 'var(--mute)', display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span>Payment Method</span>
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{order.paymentMethod?.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--mute)', display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span>Total Paid</span>
                  <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}>{formatPriceShort(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
