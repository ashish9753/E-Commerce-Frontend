import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { useToast } from '../context/ToastContext';
import { returnsApi } from '../api/returns';
import { getErrorMessage } from '../api/client';
import { formatPriceShort } from '../utils/formatters';

const REASONS = [
  { id: 'defective', label: '🔧 Defective / Not Working' },
  { id: 'wrong_item', label: '📦 Wrong Item Received' },
  { id: 'damaged', label: '💥 Damaged in Transit' },
  { id: 'not_as_described', label: '📋 Not as Described' },
  { id: 'changed_mind', label: '🔄 Changed My Mind' },
  { id: 'missing_parts', label: '🧩 Missing Parts/Accessories' },
];

export default function ReturnsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getMyOrders } = useOrders();
  const toast = useToast();

  const [orders, setOrders] = useState([]);
  const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [reason, setReason] = useState('');
  const [method, setMethod] = useState('refund');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    getMyOrders({ limit: 50 })
      .then(result => {
        if (result.success) {
          const eligible = (result.data || result.orders || []).filter(o => o.orderStatus === 'DELIVERED');
          setOrders(eligible);
        }
      });
  }, [user, getMyOrders]);

  if (!user) { navigate('/login'); return null; }

  const selectedOrder = orders.find(o => o._id === orderId);

  const handleSubmit = async () => {
    if (!orderId) { toast('Please select an order', 'error'); return; }
    if (selectedItemIndex === null) { toast('Please select the item to return', 'error'); return; }
    if (!reason) { toast('Please select a reason', 'error'); return; }

    setLoading(true);
    try {
      const item = selectedOrder.orderItems[selectedItemIndex];
      await returnsApi.submit({
        orderId,
        productId: item.product?._id || item.product,
        reason,
        resolution: method,
        description,
      });
      setSubmitted(true);
      toast('Return request submitted!');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return (
    <div className="wrap">
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <div style={{ fontSize: 80 }}>✅</div>
        <h2 style={{ fontFamily: 'Instrument Serif', fontSize: 40, marginTop: 16, fontWeight: 400 }}>Return Submitted</h2>
        <p style={{ color: 'var(--mute)', marginTop: 12, maxWidth: 480, margin: '16px auto 32px' }}>
          Your return request has been submitted. Our team will review it within 24–48 hours and contact you at {user.email}.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/orders')}>View Orders</button>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Continue Shopping</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="wrap">
      <div className="return-page">
        <div className="rp-card">
          <div className="rp-title">Return via Portal</div>
          <p className="rp-sub">Submit a return request for your delivered order. We'll process it within 24–48 hours.</p>

          <div className="rp-section">
            <span className="lab">Select Order</span>
            {orders.length === 0 ? (
              <div style={{ color: 'var(--mute)', fontSize: 14 }}>No eligible orders for return. Only delivered orders are eligible.</div>
            ) : (
              <select className="select" value={orderId} onChange={e => { setOrderId(e.target.value); setSelectedItemIndex(null); }}>
                <option value="">Select an order...</option>
                {orders.map(o => (
                  <option key={o._id} value={o._id}>
                    #{o._id?.slice(-8).toUpperCase()} — {(o.orderItems || []).length} item(s)
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedOrder && (
            <div className="rp-section">
              <span className="lab">Select Item to Return</span>
              {(selectedOrder.orderItems || []).map((item, i) => (
                <div key={i} className="rp-product" style={{ cursor: 'pointer', border: selectedItemIndex === i ? '2px solid var(--accent)' : '2px solid transparent', borderRadius: 12 }} onClick={() => setSelectedItemIndex(i)}>
                  <div className="img">
                    {item.image ? <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : '🛍️'}
                  </div>
                  <div>
                    <div className="nm">{item.title}</div>
                    <div className="meta">Qty: {item.quantity}</div>
                  </div>
                  <div className="rp-price">{formatPriceShort(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>
          )}

          <div className="rp-section">
            <span className="lab">Reason for Return</span>
            <div className="rp-reasons">
              {REASONS.map(r => (
                <button key={r.id} className={`rp-reason ${reason === r.id ? 'on' : ''}`} onClick={() => setReason(r.id)}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rp-section">
            <span className="lab">Additional Details (optional)</span>
            <textarea className="textarea input" rows={3} placeholder="Describe the issue in detail..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="rp-section">
            <span className="lab">Resolution Preference</span>
            <div className="rp-method">
              {[
                { id: 'refund', em: '💰', nm: 'Refund', sub: 'Original payment method' },
                { id: 'replacement', em: '🔄', nm: 'Replacement', sub: 'Same product' },
                { id: 'store_credit', em: '🎫', nm: 'Store Credit', sub: 'Use on next order' },
              ].map(m => (
                <button key={m.id} className={`rp-method-item ${method === m.id ? 'on' : ''}`} onClick={() => setMethod(m.id)}>
                  <div className="em">{m.em}</div>
                  <div className="nm">{m.nm}</div>
                  <div className="sub">{m.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-accent" style={{ width: '100%', height: 48 }} disabled={loading} onClick={handleSubmit}>
            {loading ? <span className="spinner" /> : 'Submit Return Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
