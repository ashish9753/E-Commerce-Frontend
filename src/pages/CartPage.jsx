import { useNavigate } from 'react-router-dom';
import { Trash2, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { validateVoucher } from '../data/vouchers';
import { formatPriceShort } from '../utils/formatters';
import { useState } from 'react';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, updateQty, removeFromCart, subtotal, savings, deliveryCharge, total, voucher, applyVoucher, removeVoucher, voucherDiscount } = useCart();
  const { toggle } = useWishlist();
  const toast = useToast();
  const [voucherCode, setVoucherCode] = useState('');

  const handleApplyVoucher = () => {
    const result = validateVoucher(voucherCode, subtotal);
    if (result.valid) { applyVoucher(result); toast(`Voucher applied! You saved ${formatPriceShort(result.discount)}`); }
    else toast(result.error, 'error');
  };

  const handleSaveForLater = (item) => { toggle(item); removeFromCart(item.id); toast('Moved to wishlist'); };

  if (items.length === 0) return (
    <div className="wrap py-20 text-center">
      <div className="text-[80px]">🛒</div>
      <h3 className="text-2xl font-bold mt-4 mb-2">Your cart is empty</h3>
      <p className="text-mute mb-6">Looks like you haven't added anything yet.</p>
      <button className="btn btn-primary" onClick={() => navigate('/products')}>Start Shopping</button>
    </div>
  );

  return (
    <div className="wrap pt-6">
      <h1 className="font-serif text-[44px] leading-[1.05] tracking-tight font-normal mb-8">Shopping Cart ({items.length})</h1>
      <div className="grid grid-cols-[1fr_380px] gap-9 pb-20 max-md:grid-cols-1">
        {/* Items */}
        <div>
          {items.map(item => (
            <div key={item.id} className="grid grid-cols-[120px_1fr_auto] gap-5 p-5 border border-line rounded-[14px] mb-3 items-center bg-white">
              <div className="w-30 h-30 bg-surface rounded-[10px] flex items-center justify-center text-[54px]">{item.emo}</div>
              <div>
                <div className="text-[11px] text-soft font-semibold tracking-wider uppercase">{item.brand}</div>
                <div className="text-base font-bold tracking-tight mt-1">{item.name}</div>
                <div className="flex gap-2 mt-2">
                  <span className="text-[11px] text-mute bg-surface px-2.25 py-0.75 rounded-full">{item.category}</span>
                  {item.badge && <span className="text-[11px] text-mute bg-surface px-2.25 py-0.75 rounded-full">{item.badge === 'sale' ? `${item.off}% off` : 'New'}</span>}
                </div>
                <div className="flex gap-3.5 mt-3.5 text-xs items-center">
                  <div className="flex items-center border-[1.5px] border-line-2 rounded-full h-9">
                    <button className="w-10.5 h-9 text-lg text-mute bg-transparent border-0 cursor-pointer hover:text-ink" onClick={() => updateQty(item.id, item.qty - 1)}>−</button>
                    <span className="w-8 text-center font-bold">{item.qty}</span>
                    <button className="w-10.5 h-9 text-lg text-mute bg-transparent border-0 cursor-pointer hover:text-ink" onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                  </div>
                  <button className="text-mute font-semibold flex items-center gap-1.25 bg-transparent border-0 cursor-pointer hover:text-accent" onClick={() => handleSaveForLater(item)}>
                    <Heart size={13} /> Save for later
                  </button>
                  <button className="text-mute font-semibold flex items-center gap-1.25 bg-transparent border-0 cursor-pointer hover:text-accent" onClick={() => { removeFromCart(item.id); toast('Item removed'); }}>
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold tracking-tight">{formatPriceShort(item.price * item.qty)}</div>
                <div className="text-xs text-soft line-through mt-0.5">{formatPriceShort(item.was * item.qty)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="sticky top-32.5 self-start border border-line rounded-2xl p-6 bg-white">
          <div className="text-[11px] font-bold tracking-widest uppercase text-mute mb-4.5">Order Summary</div>
          {[
            { label: `Subtotal (${items.reduce((s,i)=>s+i.qty,0)} items)`, val: formatPriceShort(subtotal) },
            { label: 'You save', val: `−${formatPriceShort(savings)}`, ok: true },
            ...(voucherDiscount > 0 ? [{ label: 'Voucher discount', val: `−${formatPriceShort(voucherDiscount)}`, ok: true }] : []),
            { label: 'Delivery', val: deliveryCharge === 0 ? 'FREE' : formatPriceShort(deliveryCharge) },
          ].map(r => (
            <div key={r.label} className="flex justify-between py-2.5 text-sm text-mute border-b border-dashed border-line">
              <span>{r.label}</span>
              <b className={r.ok ? 'text-ok font-semibold' : 'text-ink font-semibold'}>{r.val}</b>
            </div>
          ))}
          <div className="flex justify-between items-baseline pt-4 mt-1.5">
            <span className="font-bold">Total</span>
            <span className="font-serif text-[36px] leading-none">{formatPriceShort(total)}</span>
          </div>

          {!voucher ? (
            <div className="flex gap-2 my-4 p-3.5 bg-surface rounded-xl">
              <input
                className="input h-9 flex-1 bg-white"
                placeholder="Enter voucher code"
                value={voucherCode}
                onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleApplyVoucher()}
              />
              <button onClick={handleApplyVoucher} className="h-9 px-3.5 bg-ink text-white rounded-lg text-xs font-bold border-0 cursor-pointer shrink-0">Apply</button>
            </div>
          ) : (
            <div className="bg-ok-tint border border-dashed border-ok text-ok text-xs font-semibold px-3.5 py-2.5 rounded-[10px] flex justify-between items-center mt-4">
              <span>✓ {voucher.voucher.code} applied</span>
              <button onClick={removeVoucher} className="bg-transparent border-0 cursor-pointer text-ok font-bold">Remove</button>
            </div>
          )}

          <button className="btn btn-accent w-full h-13 mt-4.5 text-[15px]" onClick={() => navigate('/checkout')}>
            Proceed to Checkout →
          </button>
          <div className="flex items-center justify-center gap-1.5 mt-3.5 text-xs text-mute">🔒 Secure checkout · SSL encrypted</div>
        </div>
      </div>
    </div>
  );
}
