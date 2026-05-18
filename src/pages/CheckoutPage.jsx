import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { useToast } from '../context/ToastContext';
import { formatPriceShort } from '../utils/formatters';
import { validators } from '../utils/validators';

const DELIVERY_OPTIONS = [
  { id: 'valley', ic: '🚚', nm: 'Deliver – Kathmandu Valley', sub: '1–2 business days', price: 0, free: true },
  { id: 'outside', ic: '🚛', nm: 'Deliver – Outside Valley', sub: '3–5 business days', price: 250 },
  { id: 'pickup', ic: '🏪', nm: 'Self Pickup at Store', sub: 'Ready in 2 hours · Showroom, Kathmandu', price: 0, free: true },
  { id: 'courier', ic: '📦', nm: 'Courier Service', sub: '2–4 business days · Tracking included', price: 180 },
];

const PAYMENT_OPTIONS = [
  { id: 'fonepay', cls: 'fonepay', ic: 'FP', nm: 'Fonepay QR', sub: 'Scan and pay via any Nepali banking app' },
  { id: 'cod', cls: 'cod', ic: '💵', nm: 'Cash on Delivery', sub: 'Booking amount required for orders above Rs. 10,000' },
  { id: 'card', cls: 'card', ic: '💳', nm: 'Debit / Credit Card', sub: 'Visa, Mastercard, UnionPay accepted' },
];

function FonepayQR({ amount }) {
  const N = 21;
  const cells = [];
  let seed = 42;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const isFinder = (x, y) => {
    const inBox = (x0, y0) => x >= x0 && x < x0 + 7 && y >= y0 && y < y0 + 7;
    return inBox(0, 0) || inBox(N - 7, 0) || inBox(0, N - 7);
  };
  const finderFill = (x, y) => {
    const f = (x0, y0) => { const lx = x - x0, ly = y - y0; if (lx < 0 || ly < 0 || lx > 6 || ly > 6) return null; if (lx === 0 || lx === 6 || ly === 0 || ly === 6) return 1; if (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4) return 1; return 0; };
    return f(0, 0) ?? f(N - 7, 0) ?? f(0, N - 7);
  };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const v = isFinder(x, y) ? finderFill(x, y) : (rnd() > 0.5 ? 1 : 0);
    if (v) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#0A0A0A" />);
  }

  return (
    <div className="fone-qr">
      <div className="qr-box">
        <svg className="qr-svg" viewBox="0 0 21 21">{cells}</svg>
        <div className="qr-logo">FP</div>
      </div>
      <div className="fone-meta">
        <div className="nm">Scan to Pay via Fonepay</div>
        <div className="am">{formatPriceShort(amount)}</div>
        <div className="sub">Open your banking app → Scan QR → Confirm payment</div>
        <div className="verify">⏳ Waiting for payment confirmation...</div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, total, deliveryCharge, voucherDiscount, clearCart } = useCart();
  const { user } = useAuth();
  const { placeOrder } = useOrders();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [delivery, setDelivery] = useState('valley');
  const [payment, setPayment] = useState('fonepay');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: 'Kathmandu',
    district: 'Bagmati',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const setField = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: null })); };

  const validateStep1 = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    const emailErr = validators.email(form.email);
    if (emailErr) errs.email = emailErr;
    const phoneErr = validators.phone(form.phone);
    if (phoneErr) errs.phone = phoneErr;
    if (!form.address.trim()) errs.address = 'Address is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    const order = placeOrder(items, {
      userId: user?.id || 'guest',
      customer: form,
      delivery: DELIVERY_OPTIONS.find(d => d.id === delivery),
      paymentMethod: payment,
      subtotal,
      voucherDiscount,
      deliveryCharge,
      total,
    });
    clearCart();
    setLoading(false);
    toast('Order placed successfully!');
    navigate(`/track?id=${order.id}`);
  };

  const selectedDelivery = DELIVERY_OPTIONS.find(d => d.id === delivery);

  return (
    <div className="wrap" style={{ paddingTop: 24 }}>
      <div className="ch-steps">
        <div className={`ch-step ${step >= 1 ? 'on' : ''} ${step > 1 ? 'done' : ''}`}>
          <div className="n">{step > 1 ? '✓' : '1'}</div> Delivery Info
        </div>
        <div className="ch-sep" />
        <div className={`ch-step ${step >= 2 ? 'on' : ''} ${step > 2 ? 'done' : ''}`}>
          <div className="n">{step > 2 ? '✓' : '2'}</div> Delivery & Payment
        </div>
        <div className="ch-sep" />
        <div className={`ch-step ${step >= 3 ? 'on' : ''}`}>
          <div className="n">3</div> Confirm & Pay
        </div>
      </div>

      <div className="ch-layout">
        <div>
          {step === 1 && (
            <div className="ch-section">
              <div className="ch-stit">Delivery Information</div>
              <div className="ch-ssub">Enter your delivery address</div>
              <div className="form-row">
                <div className="field">
                  <label>Full Name</label>
                  <input className={`input ${errors.name ? 'error' : ''}`} value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Suman Shrestha" />
                  {errors.name && <div className="field-error">{errors.name}</div>}
                </div>
                <div className="field">
                  <label>Phone Number</label>
                  <input className={`input ${errors.phone ? 'error' : ''}`} value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="+977 98XXXXXXXX" />
                  {errors.phone && <div className="field-error">{errors.phone}</div>}
                </div>
              </div>
              <div className="form-row full" style={{ marginTop: 14 }}>
                <div className="field">
                  <label>Email</label>
                  <input className={`input ${errors.email ? 'error' : ''}`} type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="you@example.com" />
                  {errors.email && <div className="field-error">{errors.email}</div>}
                </div>
              </div>
              <div className="form-row full" style={{ marginTop: 14 }}>
                <div className="field">
                  <label>Delivery Address</label>
                  <input className={`input ${errors.address ? 'error' : ''}`} value={form.address} onChange={e => setField('address', e.target.value)} placeholder="Street / Tole / Ward No." />
                  {errors.address && <div className="field-error">{errors.address}</div>}
                </div>
              </div>
              <div className="form-row" style={{ marginTop: 14 }}>
                <div className="field">
                  <label>City</label>
                  <input className="input" value={form.city} onChange={e => setField('city', e.target.value)} />
                </div>
                <div className="field">
                  <label>District</label>
                  <input className="input" value={form.district} onChange={e => setField('district', e.target.value)} />
                </div>
              </div>
              <div className="form-row full" style={{ marginTop: 14 }}>
                <div className="field">
                  <label>Order Notes (optional)</label>
                  <textarea className="textarea input" rows={3} value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Special instructions for delivery..." />
                </div>
              </div>
              <button className="btn btn-accent" style={{ marginTop: 20, width: '100%', height: 48 }} onClick={() => { if (validateStep1()) setStep(2); }}>
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <>
              <div className="ch-section">
                <div className="ch-stit">Delivery Method</div>
                <div className="ch-ssub">Choose how you'd like to receive your order</div>
                {DELIVERY_OPTIONS.map(opt => (
                  <div key={opt.id} className={`delivery-opt ${delivery === opt.id ? 'on' : ''}`} onClick={() => setDelivery(opt.id)}>
                    <div className="ic">{opt.ic}</div>
                    <div className="meta">
                      <div className="nm">{opt.nm}</div>
                      <div className="sub">{opt.sub}</div>
                    </div>
                    <div className={`price ${opt.free ? 'free' : ''}`}>{opt.free ? 'FREE' : formatPriceShort(opt.price)}</div>
                  </div>
                ))}
              </div>

              <div className="ch-section">
                <div className="ch-stit">Payment Method</div>
                <div className="ch-ssub">Select your preferred payment option</div>
                {PAYMENT_OPTIONS.map(opt => (
                  <div key={opt.id} className={`pay-opt ${opt.cls} ${payment === opt.id ? 'on' : ''}`} onClick={() => setPayment(opt.id)}>
                    <div className="ic">{opt.ic}</div>
                    <div className="meta">
                      <div className="nm">{opt.nm}</div>
                      <div className="sub">{opt.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" style={{ flex: 1, height: 48 }} onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-accent" style={{ flex: 2, height: 48 }} onClick={() => setStep(3)}>Review Order →</button>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="ch-section">
              <div className="ch-stit">Review & Confirm</div>
              <div className="ch-ssub">Check your order details before placing</div>

              <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 18, marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--mute)', marginBottom: 10 }}>Delivering to</div>
                <div style={{ fontWeight: 700 }}>{form.name}</div>
                <div style={{ color: 'var(--mute)', fontSize: 13, marginTop: 4 }}>{form.address}, {form.city}, {form.district}</div>
                <div style={{ color: 'var(--mute)', fontSize: 13 }}>{form.phone}</div>
              </div>

              <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 18, marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--mute)', marginBottom: 10 }}>Delivery & Payment</div>
                <div style={{ fontWeight: 600 }}>{selectedDelivery?.nm}</div>
                <div style={{ fontWeight: 600, marginTop: 4 }}>{PAYMENT_OPTIONS.find(p => p.id === payment)?.nm}</div>
              </div>

              {payment === 'fonepay' && <FonepayQR amount={total} />}

              {payment === 'cod' && total > 10000 && (
                <div style={{ background: 'var(--warn-tint)', border: '1px solid var(--warn)', borderRadius: 12, padding: 16, marginTop: 18, fontSize: 13, color: 'var(--warn)' }}>
                  ⚠️ For COD orders above Rs. 10,000, a non-refundable booking amount of Rs. {Math.round(total * 0.1).toLocaleString()} (10%) is required.
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button className="btn btn-ghost" style={{ flex: 1, height: 48 }} onClick={() => setStep(2)}>← Back</button>
                <button className="btn btn-accent" style={{ flex: 2, height: 48 }} disabled={loading} onClick={handlePlaceOrder}>
                  {loading ? <span className="spinner" /> : `Place Order · ${formatPriceShort(total)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="ch-summary">
          <div className="sum-tit">Order Items ({items.length})</div>
          {items.map(item => (
            <div key={item.id} className="ch-sum-row">
              <div className="ch-sum-img">
                {item.emo}
                <div className="q">{item.qty}</div>
              </div>
              <div className="ch-sum-name">{item.name}</div>
              <div className="ch-sum-price">{formatPriceShort(item.price * item.qty)}</div>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--line)', marginTop: 16, paddingTop: 16 }}>
            <div className="sum-row"><span>Subtotal</span><b>{formatPriceShort(subtotal)}</b></div>
            {voucherDiscount > 0 && <div className="sum-row ok"><span>Voucher</span><b>−{formatPriceShort(voucherDiscount)}</b></div>}
            <div className="sum-row"><span>Delivery</span><b>{deliveryCharge === 0 ? 'FREE' : formatPriceShort(deliveryCharge)}</b></div>
            <div className="sum-tot">
              <span className="l">Total</span>
              <span className="v">{formatPriceShort(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
