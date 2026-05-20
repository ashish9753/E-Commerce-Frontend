import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Share2, ShieldCheck, RefreshCw, Truck, Star, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { productsApi } from '../api/products';
import { reviewsApi } from '../api/reviews';
import { deliveryAreasApi } from '../api/deliveryAreas';
import { normalizeProduct, normalizeProducts } from '../utils/normalizers';
import { formatPriceShort, stars } from '../utils/formatters';
import ProductCard from '../components/product/ProductCard';

/* ── helpers ── */
const Rs = (n) => `Rs. ${Math.round(Number(n || 0)).toLocaleString('en-IN')}`;

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggle, isWished } = useWishlist();
  const { user } = useAuth();
  const toast = useToast();

  const [product, setProduct]     = useState(null);
  const [related, setRelated]     = useState([]);
  const [reviews, setReviews]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [qty, setQty]             = useState(1);
  const [activeTab, setActiveTab]     = useState('description');
  const [activeThumb, setActiveThumb] = useState(0);
  const [pincode, setPincode]         = useState('');
  const [pinResult, setPinResult]     = useState(null); // { available, city, deliveryCharge } | null
  const [pinChecking, setPinChecking] = useState(false);

  const checkPincode = async (pin) => {
    const p = (pin || pincode).trim();
    if (p.length !== 6) return;
    setPinChecking(true);
    try {
      const { data } = await deliveryAreasApi.check(p);
      setPinResult(data.data);
    } catch { setPinResult({ available: false }); }
    finally { setPinChecking(false); }
  };

  // Auto-check using saved address pincode when user is logged in
  useEffect(() => {
    const savedPin = user?.addresses?.[0]?.pincode;
    if (savedPin && savedPin.length === 6) {
      setPincode(savedPin);
      checkPincode(savedPin);
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    productsApi.getById(id)
      .then(({ data }) => {
        const p = normalizeProduct(data.data.product);
        setProduct(p);
        if (p.categoryObj?._id || p.category) {
          productsApi.getAll({ category: p.categoryObj?._id || p.category, limit: 4 })
            .then(({ data: rData }) => {
              const prods = normalizeProducts(rData.data?.products || rData.data?.data || [])
                .filter(r => r._id !== p._id).slice(0, 4);
              setRelated(prods);
            }).catch(() => {});
        }
        reviewsApi.getForProduct(p._id)
          .then(({ data: rData }) => setReviews(rData.data?.data || rData.data?.reviews || []))
          .catch(() => {});
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="wrap py-20 text-center">
      <div className="spinner mx-auto" style={{ width:40, height:40 }} />
    </div>
  );
  if (!product) return (
    <div className="wrap py-20 text-center">
      <div style={{ fontSize:80 }}>😕</div>
      <h2 className="text-2xl font-bold mt-4 mb-4">Product not found</h2>
      <button className="btn btn-primary" onClick={() => navigate('/products')}>Browse products</button>
    </div>
  );

  const wished   = isWished(product._id);
  const images   = product.images?.length ? product.images : [];
  const thumbs   = images.slice(0, 6);
  const mrp      = Number(product.was || product.price || 0);
  const sale     = Number(product.price || 0);
  const discount = mrp > sale && sale > 0 ? Math.round(((mrp - sale) / mrp) * 100) : 0;
  const inStock  = product.stock > 0;

  /* Description lines → bullets */
  const descLines = (product.description || '').split('\n').map(l => l.trim()).filter(Boolean);

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
    <div style={{ background:'#fff', minHeight:'100vh' }}>
      <div style={{ maxWidth:1400, margin:'0 auto', padding:'0 16px' }}>

        {/* Breadcrumb */}
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#555', padding:'12px 0' }}>
          <span style={{ cursor:'pointer', color:'#007185' }} onClick={() => navigate('/')}>Home</span>
          <ChevronRight size={12} />
          <span style={{ cursor:'pointer', color:'#007185' }} onClick={() => navigate(`/products?category=${encodeURIComponent(product.category||'')}`)}>
            {product.category || 'Products'}
          </span>
          <ChevronRight size={12} />
          <span style={{ color:'#555', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:300 }}>{product.name}</span>
        </div>

        {/* Main 3-col layout */}
        <div style={{ display:'grid', gridTemplateColumns:'auto 1fr 300px', gap:24, alignItems:'start', paddingBottom:40 }}>

          {/* ── Col 1: Image Gallery ── */}
          <div style={{ width:420 }}>
            {/* Thumbnails + main image side by side */}
            <div style={{ display:'flex', gap:10 }}>
              {/* Thumb strip */}
              {thumbs.length > 1 && (
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {thumbs.map((img, i) => (
                    <div key={i} onClick={() => setActiveThumb(i)}
                      style={{ width:52, height:52, border:`2px solid ${activeThumb===i ? '#FF5A1F' : '#ddd'}`,
                        borderRadius:4, overflow:'hidden', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                        background:'#f7f7f7', flexShrink:0 }}>
                      <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'contain', padding:2 }} />
                    </div>
                  ))}
                </div>
              )}

              {/* Main image */}
              <div style={{ flex:1, aspectRatio:'1', background:'#f7f7f7', borderRadius:6,
                display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', position:'relative' }}>
                {thumbs[activeThumb] ? (
                  <img src={thumbs[activeThumb]} alt={product.name}
                    style={{ width:'100%', height:'100%', objectFit:'contain', padding:12 }} />
                ) : (
                  <span style={{ fontSize:120 }}>🛍️</span>
                )}
                {/* Share icon */}
                <button onClick={() => { navigator.clipboard?.writeText(window.location.href); toast('Link copied!'); }}
                  style={{ position:'absolute', top:10, right:10, width:34, height:34, borderRadius:'50%',
                    background:'white', border:'1px solid #ddd', cursor:'pointer', display:'flex',
                    alignItems:'center', justifyContent:'center' }}>
                  <Share2 size={15} color="#555" />
                </button>
              </div>
            </div>

            {/* Wishlist + share row */}
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <button onClick={handleWish}
                style={{ flex:1, height:38, border:'1px solid #ddd', borderRadius:4, background:'white',
                  cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                  fontSize:13, fontWeight:600, color:'#333' }}>
                <Heart size={16} fill={wished ? '#FF5A1F' : 'none'} color={wished ? '#FF5A1F' : '#555'} />
                {wished ? 'Wishlisted' : 'Add to Wish List'}
              </button>
            </div>
          </div>

          {/* ── Col 2: Product Info ── */}
          <div style={{ minWidth:0 }}>
            {/* Brand */}
            {product.brand && (
              <div style={{ fontSize:13, color:'#007185', marginBottom:4, cursor:'pointer' }}
                onClick={() => navigate(`/products?brand=${encodeURIComponent(product.brand)}`)}>
                Visit the {product.brand} Store
              </div>
            )}

            {/* Title */}
            <h1 style={{ fontSize:22, fontWeight:400, lineHeight:1.35, color:'#0F1111', margin:'0 0 10px' }}>
              {product.name}
            </h1>

            {/* Rating row */}
            {(product.rating > 0 || reviews.length > 0) && (
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, fontSize:13 }}>
                <span style={{ color:'#FF5A1F', fontWeight:700 }}>{Number(product.rating||0).toFixed(1)}</span>
                <span style={{ color:'#FF5A1F', fontSize:15 }}>{stars(product.rating)}</span>
                <span style={{ color:'#007185', cursor:'pointer' }}>({reviews.length} ratings)</span>
              </div>
            )}

            <div style={{ height:1, background:'#e7e7e7', margin:'10px 0' }} />

            {/* Price block */}
            <div style={{ marginBottom:12 }}>
              {discount > 0 && (
                <div style={{ fontSize:14, color:'#CC0C39', fontWeight:600, marginBottom:2 }}>-{discount}% off</div>
              )}
              <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
                <span style={{ fontSize:28, fontWeight:400, color:'#0F1111' }}>
                  <span style={{ fontSize:16, verticalAlign:'super', fontWeight:500 }}>Rs.</span>
                  {Math.round(sale).toLocaleString('en-IN')}
                </span>
                {discount > 0 && (
                  <span style={{ fontSize:13, color:'#555' }}>
                    M.R.P: <span style={{ textDecoration:'line-through' }}>{Rs(mrp)}</span>
                  </span>
                )}
              </div>
              <div style={{ fontSize:12, color:'#555', marginTop:2 }}>Inclusive of all taxes</div>
            </div>

            <div style={{ height:1, background:'#e7e7e7', margin:'12px 0' }} />

            {/* Service badges */}
            <div style={{ display:'flex', gap:20, marginBottom:16, flexWrap:'wrap' }}>
              {[
                { icon:<ShieldCheck size={22} color="#555" />, line1:'Warranty', line2:'Brand authorized' },
                { icon:<RefreshCw size={22} color="#555" />, line1: product.returnable===false ? 'Non-returnable' : `${product.returnWindow||7} Day`, line2: product.returnable===false ? '' : 'Easy Return' },
                { icon:<Truck size={22} color="#555" />, line1:'Free Delivery', line2:'Orders above Rs.5,000' },
                { icon:<Star size={22} color="#555" />, line1:'Top Brand', line2:'Authorized seller' },
              ].map((b, i) => (
                <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, minWidth:70, textAlign:'center' }}>
                  {b.icon}
                  <div style={{ fontSize:11, fontWeight:600, color:'#333', lineHeight:1.2 }}>{b.line1}</div>
                  {b.line2 && <div style={{ fontSize:10, color:'#666', lineHeight:1.2 }}>{b.line2}</div>}
                </div>
              ))}
            </div>

            <div style={{ height:1, background:'#e7e7e7', margin:'12px 0' }} />

            {/* Inline spec table */}
            {product.specs?.length > 0 && (
              <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:16, fontSize:13 }}>
                <tbody>
                  {product.specs.slice(0,6).map((s, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid #f0f0f0' }}>
                      <td style={{ padding:'7px 0', width:160, color:'#555', fontWeight:600, verticalAlign:'top' }}>{s.k}</td>
                      <td style={{ padding:'7px 0', color:'#0F1111', verticalAlign:'top' }}>{s.v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* About this item */}
            {descLines.length > 0 && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:18, fontWeight:700, color:'#0F1111', marginBottom:10 }}>About this item</div>
                <ul style={{ margin:0, paddingLeft:20, display:'flex', flexDirection:'column', gap:6 }}>
                  {descLines.map((line, i) => (
                    <li key={i} style={{ fontSize:13, color:'#333', lineHeight:1.6 }}>{line}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ height:1, background:'#e7e7e7', margin:'16px 0' }} />

            {/* Tabs: specs + description only */}
            <div>
              <div style={{ display:'flex', gap:0, borderBottom:'1px solid #e7e7e7', marginBottom:16 }}>
                {['description','specs'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    style={{ padding:'10px 20px', fontSize:13, fontWeight: activeTab===tab ? 700 : 500,
                      color: activeTab===tab ? '#0F1111' : '#666',
                      borderBottom: activeTab===tab ? '3px solid #FF5A1F' : '3px solid transparent',
                      background:'none', border:'none',
                      cursor:'pointer', textTransform:'capitalize' }}>
                    {tab === 'specs' ? 'Specifications' : 'Product Details'}
                  </button>
                ))}
              </div>

              {activeTab === 'specs' && (
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <tbody>
                    {product.specs.length > 0 ? product.specs.map((s, i) => (
                      <tr key={i} style={{ background: i%2===0 ? '#f7f7f7' : 'white' }}>
                        <td style={{ padding:'9px 12px', width:200, fontWeight:600, color:'#555' }}>{s.k}</td>
                        <td style={{ padding:'9px 12px', color:'#0F1111' }}>{s.v}</td>
                      </tr>
                    )) : <tr><td colSpan={2} style={{ padding:16, color:'#999', textAlign:'center' }}>No specifications available.</td></tr>}
                  </tbody>
                </table>
              )}

              {activeTab === 'description' && (
                <div style={{ fontSize:13, lineHeight:1.8, color:'#333' }}>
                  {product.description || 'No description available.'}
                </div>
              )}
            </div>
          </div>

          {/* ── Col 3: Sticky Buy Box ── */}
          <div style={{ position:'sticky', top:80, alignSelf:'start' }}>
            <div style={{ border:'1px solid #ddd', borderRadius:8, padding:18, background:'white' }}>
              {/* Price */}
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:24, fontWeight:400, color:'#0F1111' }}>
                  <span style={{ fontSize:14, verticalAlign:'super' }}>Rs.</span>
                  {Math.round(sale).toLocaleString('en-IN')}
                </div>
                {discount > 0 && (
                  <div style={{ fontSize:12, color:'#555', marginTop:2 }}>
                    M.R.P: <span style={{ textDecoration:'line-through' }}>{Rs(mrp)}</span>
                    <span style={{ color:'#CC0C39', marginLeft:6 }}>-{discount}%</span>
                  </div>
                )}
                <div style={{ fontSize:12, color:'#555', marginTop:2 }}>Inclusive of all taxes</div>
              </div>

              {/* Delivery */}
              <div style={{ fontSize:13, marginBottom:10 }}>
                <span style={{ color:'#555' }}>FREE delivery </span>
                <span style={{ fontWeight:600, color:'#0F1111' }}>on orders above Rs. 5,000</span>
              </div>

              {/* Pincode checker */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#555', marginBottom:6 }}>
                  Check delivery availability
                  {user?.addresses?.[0]?.pincode && (
                    <span style={{ fontWeight:400, color:'#007185', marginLeft:6 }}>
                      (auto: {user.addresses[0].city || user.addresses[0].pincode})
                    </span>
                  )}
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <input
                    value={pincode}
                    onChange={e => { setPincode(e.target.value.replace(/\D/g,'').slice(0,6)); setPinResult(null); }}
                    onKeyDown={e => e.key==='Enter' && checkPincode('')}
                    placeholder="Enter pincode"
                    maxLength={6}
                    style={{ flex:1, height:34, border:'1px solid #ddd', borderRadius:4,
                      padding:'0 10px', fontSize:13, outline:'none' }}
                  />
                  <button onClick={() => checkPincode('')} disabled={pincode.length!==6 || pinChecking}
                    style={{ padding:'0 12px', height:34, borderRadius:4, border:'1px solid #ddd',
                      background:'#f0f2f2', fontSize:12, fontWeight:700, cursor: pincode.length===6?'pointer':'not-allowed',
                      color:'#0F1111', whiteSpace:'nowrap' }}>
                    {pinChecking ? '...' : 'Check'}
                  </button>
                </div>
                {pinResult && (
                  pinResult.available ? (
                    <div style={{ marginTop:6, fontSize:12, color:'#007600', fontWeight:600 }}>
                      ✓ Delivery available{pinResult.city ? ` in ${pinResult.city}` : ''}
                      {pinResult.deliveryCharge === 0
                        ? ' — Free delivery'
                        : ` — Delivery charge: Rs. ${pinResult.deliveryCharge}`}
                    </div>
                  ) : (
                    <div style={{ marginTop:6, fontSize:12, color:'#CC0C39', fontWeight:600 }}>
                      ✗ Delivery not available in this area
                    </div>
                  )
                )}
              </div>

              {/* Stock */}
              <div style={{ fontSize:18, fontWeight:400, marginBottom:14,
                color: product.stock > 5 ? '#007600' : product.stock > 0 ? '#FF5A1F' : '#CC0C39' }}>
                {product.stock > 5 ? 'In stock' : product.stock > 0 ? `Only ${product.stock} left` : 'Currently unavailable'}
              </div>

              {/* Quantity */}
              {inStock && (
                <div style={{ marginBottom:12 }}>
                  <label style={{ fontSize:13, fontWeight:600, color:'#0F1111', display:'block', marginBottom:4 }}>Quantity:</label>
                  <select value={qty} onChange={e => setQty(Number(e.target.value))}
                    style={{ width:'100%', height:36, border:'1px solid #ddd', borderRadius:4, fontSize:13,
                      background:'#f0f2f2', padding:'0 8px', cursor:'pointer' }}>
                    {Array.from({ length: 10 }, (_, i) => i+1).map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Add to Cart */}
              <button onClick={handleAddToCart} disabled={!inStock}
                style={{ width:'100%', height:44, borderRadius:99, border:'none',
                  background: inStock ? '#FFD814' : '#e5e5e5',
                  color: inStock ? '#0F1111' : '#999',
                  fontWeight:600, fontSize:14, cursor: inStock ? 'pointer' : 'not-allowed', marginBottom:8,
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <ShoppingCart size={16} /> Add to Cart
              </button>

              {/* Buy Now */}
              <button onClick={handleBuyNow} disabled={!inStock}
                style={{ width:'100%', height:44, borderRadius:99, border:'none',
                  background: inStock ? '#FF5A1F' : '#e5e5e5',
                  color: inStock ? 'white' : '#999',
                  fontWeight:600, fontSize:14, cursor: inStock ? 'pointer' : 'not-allowed', marginBottom:14,
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                {inStock ? 'Buy Now' : 'Out of Stock'}
              </button>

              {/* Seller info */}
              <div style={{ fontSize:12, color:'#555', display:'flex', flexDirection:'column', gap:5 }}>
                <div><span style={{ display:'inline-block', width:80 }}>Ships from</span><span style={{ color:'#0F1111', fontWeight:500 }}>TradeEngine</span></div>
                <div><span style={{ display:'inline-block', width:80 }}>Sold by</span><span style={{ color:'#007185', fontWeight:500, cursor:'pointer' }}>TradeEngine</span></div>
                <div><span style={{ display:'inline-block', width:80 }}>Payment</span><span style={{ color:'#0F1111', fontWeight:500 }}>Secure transaction</span></div>
              </div>

              {/* Return policy */}
              <div style={{ marginTop:14, padding:'10px 12px', background:'#f7f7f7', borderRadius:6, fontSize:12 }}>
                {product.returnable === false ? (
                  <div style={{ color:'#CC0C39', fontWeight:600 }}>🚫 Non-returnable item</div>
                ) : (
                  <div style={{ color:'#007600' }}>✓ {product.returnWindow||7}-day easy return policy</div>
                )}
                <div style={{ color:'#007600', marginTop:4 }}>✓ Brand authorized warranty</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Customer Reviews (full width) ── */}
        <div style={{ borderTop:'1px solid #e7e7e7', paddingTop:32, marginBottom:40 }}>
          <div style={{ fontSize:22, fontWeight:700, color:'#0F1111', marginBottom:20 }}>
            Customer Reviews
            {reviews.length > 0 && <span style={{ fontSize:14, fontWeight:400, color:'#666', marginLeft:10 }}>({reviews.length} ratings)</span>}
          </div>

          {reviews.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:'#999' }}>
              <div style={{ fontSize:56 }}>★</div>
              <p style={{ fontSize:14, marginTop:8 }}>No reviews yet. Be the first!</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:40 }}>
              {/* Rating summary sidebar */}
              <div>
                <div style={{ fontSize:48, fontWeight:900, lineHeight:1, color:'#0F1111' }}>{Number(product.rating||0).toFixed(1)}</div>
                <div style={{ color:'#FF5A1F', fontSize:20, margin:'6px 0' }}>{stars(product.rating)}</div>
                <div style={{ fontSize:13, color:'#666', marginBottom:16 }}>{reviews.length} global ratings</div>
                {[5,4,3,2,1].map(n => {
                  const count = reviews.filter(r => r.rating === n).length;
                  const pct = reviews.length ? Math.round((count/reviews.length)*100) : 0;
                  return (
                    <div key={n} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                      <span style={{ fontSize:13, color:'#007185', width:40, flexShrink:0 }}>{n} star</span>
                      <div style={{ flex:1, height:10, background:'#e5e7eb', borderRadius:99, overflow:'hidden' }}>
                        <div style={{ width:`${pct}%`, height:'100%', background:'#FF5A1F', borderRadius:99 }} />
                      </div>
                      <span style={{ fontSize:12, color:'#888', width:30, textAlign:'right' }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>

              {/* Review list */}
              <div>
                {reviews.map((r, i) => (
                  <div key={i} style={{ borderBottom:'1px solid #f0f0f0', paddingBottom:20, marginBottom:20 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                      <div style={{ width:36, height:36, borderRadius:'50%', background:'#FF5A1F', color:'white',
                        display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:15, flexShrink:0 }}>
                        {(r.user?.name||'C')[0].toUpperCase()}
                      </div>
                      <span style={{ fontWeight:700, fontSize:14, color:'#0F1111' }}>{r.user?.name||'Customer'}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                      <span style={{ color:'#FF5A1F', fontSize:16 }}>{stars(r.rating)}</span>
                      {r.isVerifiedPurchase && (
                        <span style={{ fontSize:11, fontWeight:700, color:'#007600', background:'#e6f4ea', padding:'2px 8px', borderRadius:99 }}>
                          ✓ Verified Purchase
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize:12, color:'#999', marginBottom:8 }}>
                      Reviewed on {new Date(r.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
                    </div>
                    {r.comment && <p style={{ margin:0, fontSize:14, color:'#333', lineHeight:1.7 }}>{r.comment}</p>}
                    {r.images?.length > 0 && (
                      <div style={{ display:'flex', gap:8, marginTop:10 }}>
                        {r.images.map((img, j) => (
                          <img key={j} src={img} alt="" style={{ width:70, height:70, objectFit:'cover', borderRadius:6, border:'1px solid #eee' }} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section style={{ paddingBottom:60 }}>
            <div style={{ height:1, background:'#e7e7e7', marginBottom:24 }} />
            <div style={{ fontSize:22, fontWeight:700, color:'#0F1111', marginBottom:16 }}>Related Products</div>
            <div className="grid grid-cols-4 gap-5 max-lg:grid-cols-3 max-md:grid-cols-2">
              {related.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
