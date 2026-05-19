import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { useToast } from '../context/ToastContext';
import { usersApi } from '../api/users';
import { formatPriceShort } from '../utils/formatters';
import { getErrorMessage } from '../api/client';

/* ── tiny helpers ── */
const Inp = ({ label, value, onChange, placeholder, half }) => (
  <div style={{ flex: half ? '1 1 45%' : '1 1 100%', minWidth: 0 }}>
    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5 }}>{label}</label>
    <input value={value} onChange={onChange} placeholder={placeholder}
      style={{ width: '100%', height: 38, border: '1px solid #a0a0a0', borderRadius: 4, padding: '0 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
      onFocus={e => e.target.style.borderColor = '#e77600'}
      onBlur={e => e.target.style.borderColor = '#a0a0a0'} />
  </div>
);

/* ── Address form ── */
function AddressForm({ onSave, onCancel, initial = {} }) {
  const [form, setForm] = useState({
    fullName: initial.fullName || '', phone: initial.phone || '',
    pincode:  initial.pincode  || '', state: initial.state  || '',
    city:     initial.city     || '', houseNo: initial.houseNo || '',
    area:     initial.area     || '', landmark: initial.landmark || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const valid = form.fullName && form.phone && form.city && form.state && form.pincode;

  return (
    <div style={{ border: '1px solid #e77600', borderRadius: 6, padding: '18px 20px', background: '#fffdf5', marginTop: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: '#333' }}>Add a new address</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
        <Inp label="Full Name *" value={form.fullName} onChange={e=>set('fullName',e.target.value)} placeholder="Your full name" half />
        <Inp label="Mobile Number *" value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="+91 98765XXXXX" half />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
        <Inp label="Pincode *" value={form.pincode} onChange={e=>set('pincode',e.target.value)} placeholder="110001" half />
        <Inp label="City *" value={form.city} onChange={e=>set('city',e.target.value)} placeholder="New Delhi" half />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
        <Inp label="State *" value={form.state} onChange={e=>set('state',e.target.value)} placeholder="Delhi" half />
        <Inp label="House / Flat No." value={form.houseNo} onChange={e=>set('houseNo',e.target.value)} placeholder="House No., Building" half />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <Inp label="Area / Colony / Locality" value={form.area} onChange={e=>set('area',e.target.value)} placeholder="Street, Locality" half />
        <Inp label="Landmark (optional)" value={form.landmark} onChange={e=>set('landmark',e.target.value)} placeholder="Near..." half />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => valid && onSave(form)} disabled={!valid}
          style={{ padding: '9px 20px', background: valid ? '#FFD814' : '#f0f0f0', border: '1px solid', borderColor: valid ? '#FBA131' : '#ccc',
            borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: valid ? 'pointer' : 'not-allowed', color: '#111' }}>
          Add this address
        </button>
        {onCancel && (
          <button onClick={onCancel}
            style={{ padding: '9px 18px', background: 'white', border: '1px solid #ccc', borderRadius: 6, fontSize: 13, cursor: 'pointer', color: '#555' }}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Order summary sidebar ── */
function OrderSummary({ items, subtotal, deliveryCharge, discountAmount, total, onPlace, loading, canPlace, step }) {
  return (
    <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: 6, overflow: 'hidden', position: 'sticky', top: 20 }}>
      {/* Place order button at top — Amazon style */}
      {step === 3 && (
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #ddd' }}>
          <button onClick={onPlace} disabled={loading || !canPlace}
            style={{ width: '100%', padding: '10px 0', background: '#FFD814', border: '1px solid #FBA131', borderRadius: 6,
              fontWeight: 700, fontSize: 15, cursor: canPlace ? 'pointer' : 'not-allowed', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Placing order…' : 'Place your order'}
          </button>
          <div style={{ fontSize: 11, color: '#555', marginTop: 8, lineHeight: 1.5 }}>
            By placing your order, you agree to our <span style={{ color: '#007185' }}>Privacy Policy</span> and <span style={{ color: '#007185' }}>Conditions of Use</span>.
          </div>
        </div>
      )}

      {/* Price breakdown */}
      <div style={{ padding: '16px 18px', borderBottom: '1px solid #ddd' }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#B12704', marginBottom: 14 }}>
          Order Summary
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Items ({items.length}):</span>
            <span>{formatPriceShort(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#007600' }}>
              <span>Discount:</span>
              <span>−{formatPriceShort(discountAmount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Delivery:</span>
            <span style={{ color: deliveryCharge === 0 ? '#007600' : undefined }}>
              {deliveryCharge === 0 ? 'FREE' : formatPriceShort(deliveryCharge)}
            </span>
          </div>
          <div style={{ borderTop: '1px solid #ddd', paddingTop: 10, marginTop: 4, display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 17, color: '#B12704' }}>
            <span>Order Total:</span>
            <span>{formatPriceShort(total)}</span>
          </div>
        </div>
      </div>

      {/* Items list */}
      <div style={{ padding: '14px 18px' }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: '#333' }}>
          Items in your order:
        </div>
        {items.map(item => {
          const product  = item.product || {};
          const image    = product.images?.[0];
          const title    = product.title || product.name || 'Product';
          const price    = item.price || product.discountPrice || product.price || 0;
          return (
            <div key={item._id || product._id} style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'flex-start' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 56, height: 56, border: '1px solid #ddd', borderRadius: 4, background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {image ? <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: 24 }}>🛍️</span>}
                </div>
                <div style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#555', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.quantity}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4, marginBottom: 3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {title}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{formatPriceShort(price * item.quantity)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════ Main page ══════════════════ */
export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, total, deliveryCharge, discountAmount, clearCart } = useCart();
  const { user } = useAuth();
  const { placeOrder } = useOrders();
  const toast = useToast();

  const [step, setStep]                       = useState(1);
  const [addresses, setAddresses]             = useState([]);
  const [selectedAddressId, setSelectedId]    = useState(null);
  const [showAddForm, setShowAddForm]          = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [addrLoading, setAddrLoading]         = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    usersApi.getProfile()
      .then(({ data }) => {
        const addrs = data.data?.user?.addresses || [];
        setAddresses(addrs);
        if (addrs.length > 0) setSelectedId(addrs[0]._id);
        else setShowAddForm(true);
      })
      .catch(() => {})
      .finally(() => setAddrLoading(false));
  }, [user, navigate]);

  if (items.length === 0) { navigate('/cart'); return null; }

  const handleSaveAddress = async (formData) => {
    try {
      const { data } = await usersApi.addAddress(formData);
      // backend returns { addresses: [...] } directly (not nested under user)
      const addrs = data.data?.addresses || data.data?.user?.addresses || [];
      setAddresses(addrs);
      const newest = addrs[addrs.length - 1];
      if (newest) setSelectedId(newest._id);
      setShowAddForm(false);
      toast('Address saved!');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) { toast('Please select a delivery address', 'error'); return; }
    setLoading(true);
    const result = await placeOrder({ shippingAddressId: selectedAddressId, paymentMethod: 'COD' });
    setLoading(false);
    if (result.success) {
      await clearCart();
      toast('Order placed successfully!');
      navigate(`/track?id=${result.order._id}`);
    } else {
      toast(result.error, 'error');
    }
  };

  const selectedAddress = addresses.find(a => a._id === selectedAddressId);

  const STEPS = [
    { n: 1, label: 'Delivery' },
    { n: 2, label: 'Payment' },
    { n: 3, label: 'Review' },
  ];

  return (
    <div style={{ background: '#f0f2f2', minHeight: '100vh' }}>
      {/* Checkout header */}
      <div style={{ background: '#131921', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 20, borderBottom: '1px solid #3a4553' }}>
        <div style={{ fontWeight: 800, fontSize: 22, color: 'white', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <span style={{ color: '#FF9900' }}>Trade</span><span style={{ color: 'white' }}>Engine</span>
        </div>
        <div style={{ color: '#aaa', fontSize: 18, fontWeight: 300 }}>|</div>
        <div style={{ color: '#ddd', fontSize: 16, fontWeight: 600 }}>Checkout</div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, color: '#aaa', fontSize: 12 }}>
          🔒 Secure checkout
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* Left column */}
        <div>
          {/* Step progress bar */}
          <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: 6, padding: '16px 24px', marginBottom: 16, display: 'flex', alignItems: 'center' }}>
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: s.n < step ? 'pointer' : 'default' }}
                  onClick={() => { if (s.n < step) setStep(s.n); }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700,
                    background: step === s.n ? '#FF9900' : s.n < step ? '#22c55e' : '#e5e7eb',
                    color: step === s.n || s.n < step ? 'white' : '#9ca3af' }}>
                    {s.n < step ? '✓' : s.n}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: step === s.n ? 700 : 500,
                    color: step === s.n ? '#FF9900' : s.n < step ? '#22c55e' : '#9ca3af' }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: s.n < step ? '#22c55e' : '#e5e7eb', margin: '0 12px' }} />
                )}
              </div>
            ))}
          </div>

          {/* ── Step 1: Delivery Address ── */}
          {step === 1 && (
            <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ background: '#232F3E', padding: '12px 20px' }}>
                <div style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>Step 1: Choose a shipping address</div>
              </div>
              <div style={{ padding: 20 }}>
                {addrLoading ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Loading addresses…</div>
                ) : (
                  <>
                    {addresses.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 12 }}>Your saved addresses:</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {addresses.map(addr => (
                            <div key={addr._id} onClick={() => { setSelectedId(addr._id); setShowAddForm(false); }}
                              style={{ display: 'flex', gap: 12, padding: '14px 16px', border: `2px solid ${selectedAddressId === addr._id ? '#FF9900' : '#ddd'}`,
                                borderRadius: 6, cursor: 'pointer', background: selectedAddressId === addr._id ? '#fffbf0' : 'white',
                                transition: 'all .15s' }}>
                              <div style={{ marginTop: 2, flexShrink: 0 }}>
                                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${selectedAddressId === addr._id ? '#FF9900' : '#ccc'}`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {selectedAddressId === addr._id && <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#FF9900' }} />}
                                </div>
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{addr.fullName}</div>
                                <div style={{ fontSize: 13, color: '#555', marginTop: 3, lineHeight: 1.5 }}>
                                  {addr.houseNo && `${addr.houseNo}, `}{addr.area && `${addr.area}, `}
                                  {addr.city}, {addr.state} {addr.pincode}
                                </div>
                                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>📱 {addr.phone}</div>
                                {addr.landmark && <div style={{ fontSize: 12, color: '#888' }}>Near: {addr.landmark}</div>}
                                {selectedAddressId === addr._id && (
                                  <div style={{ marginTop: 8 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#007600', background: '#f0fff4', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 4 }}>
                                      ✓ Deliver to this address
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!showAddForm ? (
                      <button onClick={() => { setShowAddForm(true); setSelectedId(null); }}
                        style={{ width: '100%', padding: '11px', border: '1px solid #aaa', borderRadius: 6, background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#555', textAlign: 'center' }}>
                        + Add a new address
                      </button>
                    ) : (
                      <AddressForm
                        onSave={handleSaveAddress}
                        onCancel={addresses.length > 0 ? () => { setShowAddForm(false); setSelectedId(addresses[0]._id); } : undefined}
                      />
                    )}

                    {selectedAddressId && !showAddForm && (
                      <button onClick={() => setStep(2)}
                        style={{ marginTop: 20, width: '100%', padding: '12px', background: '#FFD814', border: '1px solid #FBA131', borderRadius: 6, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                        Use this address
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Step 2: Payment ── */}
          {step === 2 && (
            <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ background: '#232F3E', padding: '12px 20px' }}>
                <div style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>Step 2: Choose a payment method</div>
              </div>
              <div style={{ padding: 20 }}>
                {/* COD option */}
                <div style={{ border: '2px solid #FF9900', borderRadius: 6, padding: '16px 18px', background: '#fffbf0', display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 8, background: '#FF9900', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>💵</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>Cash on Delivery (COD)</div>
                    <div style={{ fontSize: 13, color: '#555', marginTop: 3 }}>Pay in cash when your order is delivered to your door.</div>
                    <div style={{ fontSize: 12, color: '#007600', fontWeight: 600, marginTop: 4 }}>✓ No extra charge · Safe & convenient</div>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #FF9900', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF9900' }} />
                  </div>
                </div>

                {total > 10000 && (
                  <div style={{ background: '#fff8e7', border: '1px solid #f59e0b', borderRadius: 6, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#92400e' }}>
                    ⚠️ A booking amount may be required for COD orders above Rs. 10,000.
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setStep(1)}
                    style={{ padding: '11px 22px', border: '1px solid #aaa', borderRadius: 6, background: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#555' }}>
                    ← Back
                  </button>
                  <button onClick={() => setStep(3)}
                    style={{ flex: 1, padding: '12px', background: '#FFD814', border: '1px solid #FBA131', borderRadius: 6, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                    Review your order →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Review & Place ── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Delivery address review */}
              <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ background: '#232F3E', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>Review your order</div>
                </div>

                {/* Delivery summary */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0f9f4', border: '2px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📦</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Delivering to</div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{selectedAddress?.fullName}</div>
                    <div style={{ fontSize: 13, color: '#555', marginTop: 2, lineHeight: 1.6 }}>
                      {selectedAddress?.houseNo && `${selectedAddress.houseNo}, `}
                      {selectedAddress?.area && `${selectedAddress.area}, `}
                      {selectedAddress?.city}, {selectedAddress?.state} – {selectedAddress?.pincode}
                    </div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>📱 {selectedAddress?.phone}</div>
                  </div>
                  <button onClick={() => setStep(1)}
                    style={{ fontSize: 13, color: '#007185', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}>
                    Change
                  </button>
                </div>

                {/* Payment summary */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff8f0', border: '2px solid #FF9900', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>💵</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Payment method</div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Cash on Delivery</div>
                    <div style={{ fontSize: 12, color: '#007600', marginTop:2 }}>Pay when delivered · No advance payment needed</div>
                  </div>
                  <button onClick={() => setStep(2)}
                    style={{ fontSize: 13, color: '#007185', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}>
                    Change
                  </button>
                </div>

                {/* Items */}
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 14 }}>Items ordered:</div>
                  {items.map(item => {
                    const product = item.product || {};
                    const image   = product.images?.[0];
                    const title   = product.title || product.name || 'Product';
                    const price   = item.price || product.discountPrice || product.price || 0;
                    return (
                      <div key={item._id || product._id} style={{ display: 'flex', gap: 14, paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid #f0f0f0' }}>
                        <div style={{ width: 72, height: 72, border: '1px solid #ddd', borderRadius: 4, overflow: 'hidden', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {image ? <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: 32 }}>🛍️</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4, marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{title}</div>
                          <div style={{ fontSize: 12, color: '#007600', fontWeight: 600 }}>In Stock</div>
                          <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>Qty: {item.quantity}</div>
                          <div style={{ fontSize: 14, fontWeight: 800, marginTop: 4 }}>{formatPriceShort(price * item.quantity)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Place order (mobile bottom) */}
              <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: 6, padding: '18px 20px' }}>
                <button onClick={handlePlaceOrder} disabled={loading}
                  style={{ width: '100%', padding: '13px', background: '#FFD814', border: '1px solid #FBA131', borderRadius: 6,
                    fontWeight: 800, fontSize: 16, cursor: 'pointer', opacity: loading ? 0.7 : 1, marginBottom: 10 }}>
                  {loading ? 'Placing your order…' : `Place your order · ${formatPriceShort(total)}`}
                </button>
                <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6, textAlign: 'center' }}>
                  By placing your order, you agree to our{' '}
                  <span style={{ color: '#007185', cursor: 'pointer' }}>Privacy Policy</span> and{' '}
                  <span style={{ color: '#007185', cursor: 'pointer' }}>Conditions of Use</span>.
                </div>
              </div>

              <button onClick={() => setStep(2)}
                style={{ background: 'none', border: 'none', color: '#007185', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                ← Change payment method
              </button>
            </div>
          )}
        </div>

        {/* Right column — Order Summary */}
        <OrderSummary
          items={items}
          subtotal={subtotal}
          deliveryCharge={deliveryCharge}
          discountAmount={discountAmount}
          total={total}
          onPlace={handlePlaceOrder}
          loading={loading}
          canPlace={!!selectedAddressId}
          step={step}
        />
      </div>
    </div>
  );
}
