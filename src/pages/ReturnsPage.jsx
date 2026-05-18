import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { useToast } from '../context/ToastContext';
import { formatPriceShort } from '../utils/formatters';

const REASONS = [
  { id: 'defective', label: '🔧 Defective / Not Working' },
  { id: 'wrong', label: '📦 Wrong Item Received' },
  { id: 'damaged', label: '💥 Damaged in Transit' },
  { id: 'not_as_described', label: '📋 Not as Described' },
  { id: 'changed_mind', label: '🔄 Changed My Mind' },
  { id: 'missing_parts', label: '🧩 Missing Parts/Accessories' },
];

export default function ReturnsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getUserOrders, submitReturn } = useOrders();
  const toast = useToast();

  const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
  const [selectedItem, setSelectedItem] = useState(null);
  const [reason, setReason] = useState('');
  const [method, setMethod] = useState('refund');
  const [description, setDescription] = useState('');
  const [uploaded, setUploaded] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  if (!user) { navigate('/login'); return null; }

  const orders = getUserOrders(user.id).filter(o => o.status === 'delivered' && !o.returnRequest);
  const selectedOrder = orders.find(o => o.id === orderId);

  const handleSubmit = () => {
    if (!orderId) { toast('Please select an order', 'error'); return; }
    if (!selectedItem) { toast('Please select the item to return', 'error'); return; }
    if (!reason) { toast('Please select a reason', 'error'); return; }
    submitReturn(orderId, { item: selectedItem, reason, method, description, uploads: uploaded.length });
    setSubmitted(true);
    toast('Return request submitted!');
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
              <div style={{ color: 'var(--mute)', fontSize: 14 }}>No eligible orders for return. Only delivered orders within 7 days are eligible.</div>
            ) : (
              <select className="select" value={orderId} onChange={e => { setOrderId(e.target.value); setSelectedItem(null); }}>
                <option value="">Select an order...</option>
                {orders.map(o => <option key={o.id} value={o.id}>{o.id} — {o.items.length} item(s)</option>)}
              </select>
            )}
          </div>

          {selectedOrder && (
            <div className="rp-section">
              <span className="lab">Select Item to Return</span>
              {selectedOrder.items.map((item, i) => (
                <div key={i} className={`rp-product`} style={{ cursor: 'pointer', border: selectedItem?.id === item.id ? '2px solid var(--accent)' : '2px solid transparent', borderRadius: 12 }} onClick={() => setSelectedItem(item)}>
                  <div className="img">{item.emo}</div>
                  <div>
                    <div className="nm">{item.name}</div>
                    <div className="meta">{item.brand} · Qty: {item.qty}</div>
                  </div>
                  <div className="rp-price">{formatPriceShort(item.price * item.qty)}</div>
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
            <span className="lab">Upload Photos / Videos</span>
            <div className="rp-upload" onClick={() => document.getElementById('ret-upload').click()}>
              <div className="ic">📸</div>
              <div className="rp-up-tit">{uploaded.length > 0 ? `${uploaded.length} file(s) selected` : 'Click to upload'}</div>
              <div className="rp-up-sub">JPG, PNG, MP4 up to 50MB each · Max 5 files</div>
              <input id="ret-upload" type="file" multiple accept="image/*,video/*" style={{ display: 'none' }} onChange={e => setUploaded(Array.from(e.target.files))} />
            </div>
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

          <button className="btn btn-accent" style={{ width: '100%', height: 48 }} onClick={handleSubmit}>
            Submit Return Request
          </button>
        </div>
      </div>
    </div>
  );
}
