import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Share2, GitCompare } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCompare } from '../context/CompareContext';
import { useToast } from '../context/ToastContext';
import { getProductById, products } from '../data/products';
import { formatPriceShort, stars } from '../utils/formatters';
import ProductCard from '../components/product/ProductCard';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = getProductById(id);
  const { addToCart } = useCart();
  const { toggle, isWished } = useWishlist();
  const { toggle: toggleCompare, isComparing } = useCompare();
  const toast = useToast();
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('specs');
  const [activeThumb, setActiveThumb] = useState(0);

  if (!product) return (
    <div className="wrap py-20 text-center">
      <div className="text-[80px]">😕</div>
      <h2 className="text-2xl font-bold mt-4 mb-4">Product not found</h2>
      <button className="btn btn-primary" onClick={() => navigate('/products')}>Browse products</button>
    </div>
  );

  const wished = isWished(product.id);
  const comparing = isComparing(product.id);
  const thumbEmojis = [product.emo, '📦', '🔧', '📋'];

  const handleAddToCart = () => { for (let i = 0; i < qty; i++) addToCart(product); toast(`${product.name} added to cart`); };
  const handleBuyNow = () => { addToCart(product, qty); navigate('/cart'); };
  const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div className="wrap">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-soft py-6">
        <a className="text-mute font-medium cursor-pointer hover:text-ink" onClick={() => navigate('/')}>Home</a>
        <span>›</span>
        <a className="text-mute font-medium cursor-pointer hover:text-ink" onClick={() => navigate(`/products?category=${product.category}`)}>{product.category}</a>
        <span>›</span>
        <span className="text-ink font-semibold">{product.name}</span>
      </div>

      <div className="grid grid-cols-2 gap-16 py-6 pb-20 max-md:grid-cols-1">
        {/* Gallery */}
        <div className="sticky top-32.5 self-start">
          <div className="aspect-square bg-surface rounded-[20px] flex items-center justify-center relative overflow-hidden">
            <span className="text-[200px] leading-none">{thumbEmojis[activeThumb]}</span>
          </div>
          <div className="flex gap-2.5 mt-3.5">
            {thumbEmojis.map((e, i) => (
              <div key={i} className={`w-18 aspect-square bg-surface rounded-xl flex items-center justify-center text-[34px] border-2 cursor-pointer shrink-0 transition-all ${activeThumb === i ? 'border-ink bg-white' : 'border-transparent'}`} onClick={() => setActiveThumb(i)}>{e}</div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="pt-2">
          <div className="text-[11px] text-accent font-bold tracking-widest uppercase">{product.brand} · {product.category}</div>
          <div className="font-serif text-[42px] leading-[1.05] tracking-tight font-normal mt-2.5">{product.name}</div>

          <div className="flex items-center gap-3.5 mt-4.5 text-[13px] text-mute">
            <span className="bg-ok text-white px-2.25 py-0.75 rounded-md font-bold inline-flex items-center gap-1">★ {product.rating}</span>
            <span>{product.reviews.toLocaleString()} reviews</span>
            <span className={`tag ${product.stock > 5 ? 'tag-ok' : 'tag-warn'}`}>
              {product.stock > 5 ? 'In Stock' : `Only ${product.stock} left`}
            </span>
          </div>

          <div className="flex items-baseline gap-3.5 my-6 py-5 border-t border-b border-line">
            <span className="text-[40px] font-bold tracking-tight tabular-nums">{formatPriceShort(product.price)}</span>
            <span className="text-base text-soft line-through tabular-nums">{formatPriceShort(product.was)}</span>
            <span className="text-[13px] text-ok font-bold bg-ok-tint px-2.5 py-1 rounded-md">{product.off}% off</span>
          </div>

          <div className="my-6">
            {(product.attrs || []).map((a, i) => (
              <div key={i} className="flex items-center gap-3.5 py-2.5 border-b border-dashed border-line text-[13px]">
                <span className="w-35 text-mute font-semibold">{a.k}</span>
                <span className="flex-1 font-semibold">{a.v}</span>
              </div>
            ))}
          </div>

          <div className="my-5">
            <div className="text-[11px] font-bold tracking-widest uppercase text-mute mb-2.5">Quantity</div>
            <div className="flex items-center border-[1.5px] border-line-2 rounded-full h-12.5 w-fit">
              <button className="w-10.5 h-12.5 text-lg text-mute bg-transparent border-0 cursor-pointer hover:text-ink" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span className="w-8 text-center font-bold">{qty}</span>
              <button className="w-10.5 h-12.5 text-lg text-mute bg-transparent border-0 cursor-pointer hover:text-ink" onClick={() => setQty(q => Math.min(product.stock, q + 1))}>+</button>
            </div>
          </div>

          <div className="grid grid-cols-[auto_1fr_1fr] gap-2.5 my-6">
            <button className="btn btn-ghost w-12.5 h-12.5 rounded-full p-0" onClick={() => { toggle(product); toast(wished ? 'Removed from wishlist' : 'Added to wishlist'); }}>
              <Heart size={18} fill={wished ? 'currentColor' : 'none'} color={wished ? '#FF5A1F' : undefined} />
            </button>
            <button className="btn btn-ghost h-12.5 text-sm" onClick={handleAddToCart}><ShoppingCart size={16} /> Add to Cart</button>
            <button className="btn btn-accent h-12.5 text-sm" onClick={handleBuyNow}>Buy Now</button>
          </div>

          <div className="flex gap-2 mb-4">
            <button className="btn btn-ghost btn-sm" onClick={() => { toggleCompare(product); toast(comparing ? 'Removed from comparison' : 'Added to comparison'); }}>
              <GitCompare size={14} /> {comparing ? 'Remove Compare' : 'Compare'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard?.writeText(window.location.href); toast('Link copied!'); }}>
              <Share2 size={14} /> Share
            </button>
          </div>

          <div className="bg-surface-2 border border-line rounded-[14px] p-4.5">
            {['Free delivery in Kathmandu Valley on orders above Rs. 5,000','Brand authorized warranty included','7-day easy return policy','EMI options available at checkout'].map(t => (
              <div key={t} className="flex items-center gap-3 py-1.5 text-[13px] text-mute">
                <span className="text-ok">✓</span> {t}
              </div>
            ))}
          </div>

          <div className="pt-10 border-t border-line mt-10">
            <div className="flex gap-8 border-b border-line">
              {['specs','description','reviews'].map(tab => (
                <button key={tab} className={`py-3.5 text-sm font-semibold border-b-2 cursor-pointer bg-transparent border-l-0 border-r-0 border-t-0 transition-colors ${activeTab === tab ? 'text-ink border-b-ink' : 'text-mute border-b-transparent'}`} onClick={() => setActiveTab(tab)}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <div className="py-6">
              {activeTab === 'specs' && (
                <div className="grid grid-cols-2 gap-x-12">
                  {(product.specs || []).map((s, i) => (
                    <div key={i} className="flex justify-between py-3 border-b border-line text-[13px]">
                      <span className="text-mute">{s.k}</span><span className="font-semibold">{s.v}</span>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'description' && <div className="text-sm leading-[1.7] text-mute">{product.description}</div>}
              {activeTab === 'reviews' && (
                <div className="text-center py-10 text-mute">
                  <div className="text-[64px] mb-2">★</div>
                  <div className="text-[48px] font-extrabold">{product.rating}</div>
                  <div>{product.reviews.toLocaleString()} verified reviews</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="py-18">
          <div className="flex items-end justify-between mb-9 gap-6">
            <div>
              <div className="kicker">More Like This</div>
              <h2 className="font-serif text-[44px] leading-none tracking-tight font-normal mt-2">Related <i className="text-accent">products</i></h2>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-5 max-lg:grid-cols-3 max-md:grid-cols-2">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
