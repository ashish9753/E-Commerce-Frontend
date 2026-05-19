import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Share2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { productsApi } from '../api/products';
import { reviewsApi } from '../api/reviews';
import { normalizeProduct, normalizeProducts } from '../utils/normalizers';
import { formatPriceShort, stars } from '../utils/formatters';
import ProductCard from '../components/product/ProductCard';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggle, isWished } = useWishlist();
  const { user } = useAuth();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('reviews');
  const [activeThumb, setActiveThumb] = useState(0);

  useEffect(() => {
    setLoading(true);
    productsApi.getById(id)
      .then(({ data }) => {
        const p = normalizeProduct(data.data.product);
        setProduct(p);
        // Fetch related (same category)
        if (p.categoryObj?._id || p.category) {
          productsApi.getAll({ category: p.categoryObj?._id || p.category, limit: 4 })
            .then(({ data: rData }) => {
              const prods = normalizeProducts(rData.data?.products || rData.data?.data || [])
                .filter(r => r._id !== p._id)
                .slice(0, 4);
              setRelated(prods);
            })
            .catch(() => {});
        }
        // Fetch reviews
        reviewsApi.getForProduct(p._id)
          .then(({ data: rData }) => setReviews(rData.data?.data || rData.data?.reviews || []))
          .catch(() => {});
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="wrap py-20 text-center">
      <div className="spinner mx-auto" style={{ width: 40, height: 40 }} />
    </div>
  );

  if (!product) return (
    <div className="wrap py-20 text-center">
      <div className="text-[80px]">😕</div>
      <h2 className="text-2xl font-bold mt-4 mb-4">Product not found</h2>
      <button className="btn btn-primary" onClick={() => navigate('/products')}>Browse products</button>
    </div>
  );

  const wished = isWished(product._id);
  const images = product.images?.length ? product.images : [];
  const thumbs = images.slice(0, 4);

  const handleAddToCart = async () => {
    if (!user) { toast('Please sign in to add items to cart', 'error'); navigate('/login'); return; }
    const result = await addToCart(product._id, qty);
    if (result?.success === false) toast(result.error, 'error');
    else toast(`${product.name} added to cart`);
  };

  const handleBuyNow = async () => {
    if (!user) { navigate('/login'); return; }
    const result = await addToCart(product._id, qty);
    if (result?.success === false) { toast(result.error, 'error'); return; }
    navigate('/cart');
  };

  const handleWish = async () => {
    if (!user) { toast('Please sign in to save items', 'error'); navigate('/login'); return; }
    await toggle(product);
    toast(wished ? 'Removed from wishlist' : 'Added to wishlist');
  };

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
            {thumbs[activeThumb] ? (
              <img src={thumbs[activeThumb]} alt={product.name} className="w-full h-full object-contain p-6" />
            ) : (
              <span className="text-[200px] leading-none">🛍️</span>
            )}
          </div>
          {thumbs.length > 1 && (
            <div className="flex gap-2.5 mt-3.5">
              {thumbs.map((img, i) => (
                <div key={i} className={`w-18 aspect-square bg-surface rounded-xl flex items-center justify-center border-2 cursor-pointer shrink-0 transition-all overflow-hidden ${activeThumb === i ? 'border-ink' : 'border-transparent'}`} onClick={() => setActiveThumb(i)}>
                  <img src={img} alt="" className="w-full h-full object-contain p-2" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="pt-2">
          <div className="text-[11px] text-accent font-bold tracking-widest uppercase">{product.brand} · {product.category}</div>
          <div className="font-serif text-[42px] leading-[1.05] tracking-tight font-normal mt-2.5">{product.name}</div>

          <div className="flex items-center gap-3.5 mt-4.5 text-[13px] text-mute">
            {product.rating > 0 && (
              <span className="bg-ok text-white px-2.25 py-0.75 rounded-md font-bold inline-flex items-center gap-1">★ {product.rating}</span>
            )}
            {product.reviews > 0 && <span>{product.reviews.toLocaleString()} reviews</span>}
            <span className={`tag ${product.stock > 5 ? 'tag-ok' : product.stock > 0 ? 'tag-warn' : 'tag-bad'}`}>
              {product.stock > 5 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left` : 'Out of Stock'}
            </span>
          </div>

          <div className="flex items-baseline gap-3.5 my-6 py-5 border-t border-b border-line">
            <span className="text-[40px] font-bold tracking-tight tabular-nums">{formatPriceShort(product.price)}</span>
            {product.off > 0 && (
              <>
                <span className="text-base text-soft line-through tabular-nums">{formatPriceShort(product.was)}</span>
                <span className="text-[13px] text-ok font-bold bg-ok-tint px-2.5 py-1 rounded-md">{product.off}% off</span>
              </>
            )}
          </div>

          {product.specs.length > 0 && (
            <div className="my-6">
              {product.specs.slice(0, 5).map((s, i) => (
                <div key={i} className="flex items-center gap-3.5 py-2.5 border-b border-dashed border-line text-[13px]">
                  <span className="w-35 text-mute font-semibold">{s.k}</span>
                  <span className="flex-1 font-semibold">{s.v}</span>
                </div>
              ))}
            </div>
          )}

          <div className="my-5">
            <div className="text-[11px] font-bold tracking-widest uppercase text-mute mb-2.5">Quantity</div>
            <div className="flex items-center border-[1.5px] border-line-2 rounded-full h-12.5 w-fit">
              <button className="w-10.5 h-12.5 text-lg text-mute bg-transparent border-0 cursor-pointer hover:text-ink" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span className="w-8 text-center font-bold">{qty}</span>
              <button className="w-10.5 h-12.5 text-lg text-mute bg-transparent border-0 cursor-pointer hover:text-ink" onClick={() => setQty(q => Math.min(product.stock, q + 1))}>+</button>
            </div>
          </div>

          <div className="grid grid-cols-[auto_1fr_1fr] gap-2.5 my-6">
            <button className="btn btn-ghost w-12.5 h-12.5 rounded-full p-0" onClick={handleWish}>
              <Heart size={18} fill={wished ? 'currentColor' : 'none'} color={wished ? '#FF5A1F' : undefined} />
            </button>
            <button className="btn btn-ghost h-12.5 text-sm" onClick={handleAddToCart} disabled={product.stock === 0}>
              <ShoppingCart size={16} /> Add to Cart
            </button>
            <button className="btn btn-accent h-12.5 text-sm" onClick={handleBuyNow} disabled={product.stock === 0}>
              {product.stock === 0 ? 'Out of Stock' : 'Buy Now'}
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard?.writeText(window.location.href); toast('Link copied!'); }}>
              <Share2 size={14} /> Share
            </button>
          </div>

          <div className="bg-surface-2 border border-line rounded-[14px] p-4.5">
            <div className="flex items-center gap-3 py-1.5 text-[13px] text-mute">
              <span className="text-ok">✓</span> Free delivery on orders above Rs. 5,000
            </div>
            <div className="flex items-center gap-3 py-1.5 text-[13px] text-mute">
              <span className="text-ok">✓</span> Brand authorized warranty included
            </div>
            {product?.returnable === false ? (
              <div className="flex items-center gap-3 py-1.5 text-[13px]" style={{ color: '#dc2626' }}>
                <span>🚫</span> <strong>Non-returnable</strong> — This item cannot be returned
              </div>
            ) : (
              <div className="flex items-center gap-3 py-1.5 text-[13px] text-mute">
                <span className="text-ok">✓</span> {product?.returnWindow || 7}-day easy return policy
              </div>
            )}
          </div>

          <div className="pt-10 border-t border-line mt-10">
            <div className="flex gap-8 border-b border-line">
              {['specs', 'description', 'reviews'].map(tab => (
                <button key={tab} className={`py-3.5 text-sm font-semibold border-b-2 cursor-pointer bg-transparent border-l-0 border-r-0 border-t-0 transition-colors ${activeTab === tab ? 'text-ink border-b-ink' : 'text-mute border-b-transparent'}`} onClick={() => setActiveTab(tab)}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <div className="py-6">
              {activeTab === 'specs' && (
                <div className="grid grid-cols-2 gap-x-12">
                  {product.specs.map((s, i) => (
                    <div key={i} className="flex justify-between py-3 border-b border-line text-[13px]">
                      <span className="text-mute">{s.k}</span><span className="font-semibold">{s.v}</span>
                    </div>
                  ))}
                  {product.specs.length === 0 && <p className="text-mute text-sm col-span-2">No specifications available.</p>}
                </div>
              )}
              {activeTab === 'description' && (
                <div className="text-sm leading-[1.7] text-mute whitespace-pre-wrap">
                  {product.description || 'No description available.'}
                </div>
              )}
              {activeTab === 'reviews' && (
                <div>
                  {reviews.length === 0 ? (
                    <div className="text-center py-10 text-mute">
                      <div className="text-[64px] mb-2">★</div>
                      <p>No reviews yet. Be the first!</p>
                    </div>
                  ) : (
                    <div>
                      {/* Rating summary */}
                      <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:24, padding:'16px 20px', background:'#f8fafc', borderRadius:12 }}>
                        <div style={{ textAlign:'center' }}>
                          <div style={{ fontSize:48, fontWeight:900, lineHeight:1 }}>{Number(product.rating || 0).toFixed(1)}</div>
                          <div style={{ color:'#F5A623', fontSize:18, marginTop:4 }}>{stars(product.rating)}</div>
                          <div style={{ fontSize:12, color:'#888', marginTop:2 }}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</div>
                        </div>
                        <div style={{ flex:1 }}>
                          {[5,4,3,2,1].map(n => {
                            const count = reviews.filter(r => r.rating === n).length;
                            const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                            return (
                              <div key={n} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                                <span style={{ fontSize:11, color:'#555', width:8 }}>{n}</span>
                                <span style={{ color:'#F5A623', fontSize:11 }}>★</span>
                                <div style={{ flex:1, height:6, background:'#e5e7eb', borderRadius:99, overflow:'hidden' }}>
                                  <div style={{ width:`${pct}%`, height:'100%', background:'#F5A623', borderRadius:99 }} />
                                </div>
                                <span style={{ fontSize:11, color:'#888', width:28 }}>{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Review cards */}
                      {reviews.map((r, i) => (
                        <div key={i} style={{ borderBottom:'1px solid #f0f0f0', padding:'16px 0' }}>
                          <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                            {/* Avatar */}
                            <div style={{ width:36, height:36, borderRadius:'50%', background:'#FF5A1F', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:15, flexShrink:0 }}>
                              {(r.user?.name || 'C')[0].toUpperCase()}
                            </div>
                            <div style={{ flex:1 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                                <span style={{ fontWeight:700, fontSize:13 }}>{r.user?.name || 'Customer'}</span>
                                {r.isVerifiedPurchase && (
                                  <span style={{ fontSize:10, fontWeight:700, color:'#16a34a', background:'#dcfce7', padding:'2px 7px', borderRadius:99 }}>✓ Verified Purchase</span>
                                )}
                                <span style={{ fontSize:11, color:'#aaa', marginLeft:'auto' }}>
                                  {new Date(r.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                                </span>
                              </div>
                              <div style={{ color:'#F5A623', fontSize:15, margin:'4px 0' }}>{stars(r.rating)}</div>
                              {r.comment && <p style={{ margin:0, fontSize:13, color:'#444', lineHeight:1.6 }}>{r.comment}</p>}
                              {r.images?.length > 0 && (
                                <div style={{ display:'flex', gap:8, marginTop:8 }}>
                                  {r.images.map((img, j) => (
                                    <img key={j} src={img} alt="" style={{ width:60, height:60, objectFit:'cover', borderRadius:6, border:'1px solid #eee' }} />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
            {related.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
