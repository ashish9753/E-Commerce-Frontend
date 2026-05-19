import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { useToast } from '../context/ToastContext';
import { usersApi } from '../api/users';
import { formatPriceShort } from '../utils/formatters';
import { getErrorMessage } from '../api/client';

const PAYMENT_OPTIONS = [
  { id: 'COD', ic: '💵', nm: 'Cash on Delivery', sub: 'Pay when your order arrives' },
];

function AddressForm({ onSave, onCancel, initial = {} }) {
  const [form, setForm] = useState({
    fullName: initial.fullName || '',
    phone: initial.phone || '',
    pincode: initial.pincode || '',
    state: initial.state || '',
    city: initial.city || '',
    houseNo: initial.houseNo || '',
    area: initial.area || '',
    landmark: initial.landmark || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="bg-surface rounded-[14px] p-5 mb-4">
      <div className="text-sm font-bold mb-4">New Delivery Address</div>
      <div className="form-row">
        <div className="field"><label>Full Name</label><input className="input" value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Suman Shrestha" /></div>
        <div className="field"><label>Phone</label><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+977 98XXXXXXXX" /></div>
      </div>
      <div className="form-row" style={{ marginTop: 10 }}>
        <div className="field"><label>House / Flat No.</label><input className="input" value={form.houseNo} onChange={e => set('houseNo', e.target.value)} placeholder="Street / Ward No." /></div>
        <div className="field"><label>Area / Tole</label><input className="input" value={form.area} onChange={e => set('area', e.target.value)} placeholder="Locality" /></div>
      </div>
      <div className="form-row" style={{ marginTop: 10 }}>
        <div className="field"><label>City</label><input className="input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Kathmandu" /></div>
        <div className="field"><label>State</label><input className="input" value={form.state} onChange={e => set('state', e.target.value)} placeholder="Bagmati" /></div>
        <div className="field"><label>Pincode</label><input className="input" value={form.pincode} onChange={e => set('pincode', e.target.value)} placeholder="44600" /></div>
      </div>
      <div className="field" style={{ marginTop: 10 }}><label>Landmark (optional)</label><input className="input" value={form.landmark} onChange={e => set('landmark', e.target.value)} placeholder="Near landmark..." /></div>
      <div className="flex gap-2 mt-4">
        <button className="btn btn-primary" onClick={() => onSave(form)}>Save Address</button>
        {onCancel && <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, total, deliveryCharge, discountAmount, clearCart } = useCart();
  const { user } = useAuth();
  const { placeOrder } = useOrders();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [payment, setPayment] = useState('COD');
  const [loading, setLoading] = useState(false);
  const [addrLoading, setAddrLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    usersApi.getProfile()
      .then(({ data }) => {
        const addrs = data.data?.user?.addresses || [];
        setAddresses(addrs);
        if (addrs.length > 0) setSelectedAddressId(addrs[0]._id);
        else setShowAddForm(true);
      })
      .catch(() => {})
      .finally(() => setAddrLoading(false));
  }, [user, navigate]);

  if (items.length === 0) { navigate('/cart'); return null; }

  const handleSaveAddress = async (formData) => {
    try {
      const { data } = await usersApi.addAddress(formData);
      const addrs = data.data?.user?.addresses || [];
      setAddresses(addrs);
      const newest = addrs[addrs.length - 1];
      if (newest) setSelectedAddressId(newest._id);
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

  return (
    <div className="wrap" style={{ paddingTop: 24 }}>
      <div className="ch-steps">
        <div className={`ch-step ${step >= 1 ? 'on' : ''} ${step > 1 ? 'done' : ''}`}>
          <div className="n">{step > 1 ? '✓' : '1'}</div> Delivery Address
        </div>
        <div className="ch-sep" />
        <div className={`ch-step ${step >= 2 ? 'on' : ''} ${step > 2 ? 'done' : ''}`}>
          <div className="n">{step > 2 ? '✓' : '2'}</div> Payment Method
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
              <div className="ch-stit">Delivery Address</div>
              <div className="ch-ssub">Select or add a delivery address</div>

              {addrLoading ? (
                <div className="py-8 text-center text-mute">Loading addresses...</div>
              ) : (
                <>
                  {addresses.map(addr => (
                    <div key={addr._id} className={`delivery-opt ${selectedAddressId === addr._id ? 'on' : ''}`} onClick={() => { setSelectedAddressId(addr._id); setShowAddForm(false); }}>
                      <div className="ic">📍</div>
                      <div className="meta">
                        <div className="nm">{addr.fullName} · {addr.phone}</div>
                        <div className="sub">{addr.houseNo}, {addr.area}, {addr.city}, {addr.state} {addr.pincode}</div>
                      </div>
                    </div>
                  ))}

                  {!showAddForm ? (
                    <button className="btn btn-ghost w-full mt-3" onClick={() => { setShowAddForm(true); setSelectedAddressId(null); }}>
                      + Add New Address
                    </button>
                  ) : (
                    <AddressForm
                      onSave={handleSaveAddress}
                      onCancel={addresses.length > 0 ? () => { setShowAddForm(false); setSelectedAddressId(addresses[0]._id); } : undefined}
                    />
                  )}
                </>
              )}

              <button
                className="btn btn-accent"
                style={{ marginTop: 20, width: '100%', height: 48 }}
                disabled={!selectedAddressId}
                onClick={() => setStep(2)}
              >
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <>
              <div className="ch-section">
                <div className="ch-stit">Payment Method</div>
                <div className="ch-ssub">Select your preferred payment option</div>
                {PAYMENT_OPTIONS.map(opt => (
                  <div key={opt.id} className={`pay-opt ${payment === opt.id ? 'on' : ''}`} onClick={() => setPayment(opt.id)}>
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
                {selectedAddress && (
                  <>
                    <div style={{ fontWeight: 700 }}>{selectedAddress.fullName} · {selectedAddress.phone}</div>
                    <div style={{ color: 'var(--mute)', fontSize: 13, marginTop: 4 }}>
                      {selectedAddress.houseNo}, {selectedAddress.area}, {selectedAddress.city}, {selectedAddress.state} {selectedAddress.pincode}
                    </div>
                  </>
                )}
              </div>

              <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 18, marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--mute)', marginBottom: 10 }}>Payment</div>
                <div style={{ fontWeight: 600 }}>{PAYMENT_OPTIONS.find(p => p.id === payment)?.nm}</div>
              </div>

              {payment === 'COD' && total > 10000 && (
                <div style={{ background: 'var(--warn-tint)', border: '1px solid var(--warn)', borderRadius: 12, padding: 16, marginTop: 18, fontSize: 13, color: 'var(--warn)' }}>
                  ⚠️ A booking amount may be required for COD orders above Rs. 10,000.
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
          {items.map(item => {
            const product = item.product || {};
            const image = product.images?.[0];
            const title = product.title || product.name || 'Product';
            const itemPrice = item.price || product.discountPrice || product.price || 0;

            return (
              <div key={item._id || product._id} className="ch-sum-row">
                <div className="ch-sum-img">
                  {image ? <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : '🛍️'}
                  <div className="q">{item.quantity}</div>
                </div>
                <div className="ch-sum-name">{title}</div>
                <div className="ch-sum-price">{formatPriceShort(itemPrice * item.quantity)}</div>
              </div>
            );
          })}
          <div style={{ borderTop: '1px solid var(--line)', marginTop: 16, paddingTop: 16 }}>
            <div className="sum-row"><span>Subtotal</span><b>{formatPriceShort(subtotal)}</b></div>
            {discountAmount > 0 && <div className="sum-row ok"><span>Coupon</span><b>−{formatPriceShort(discountAmount)}</b></div>}
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
