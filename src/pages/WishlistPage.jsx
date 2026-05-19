import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { normalizeProduct } from '../utils/normalizers';
import { formatPriceShort, stars } from '../utils/formatters';

export default function WishlistPage() {
  const navigate = useNavigate();
  const { items, remove } = useWishlist();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();

  if (!user) {
    return (
      <div className="wrap py-20 text-center">
        <div className="text-[80px]">❤️</div>
        <h3 className="text-2xl font-bold mt-4 mb-2">Sign in to view your wishlist</h3>
        <button className="btn btn-primary" onClick={() => navigate('/login')}>Sign In</button>
      </div>
    );
  }

  const moveToCart = async (item) => {
    const productId = item._id || item;
    const result = await addToCart(productId, 1);
    if (result?.success === false) { toast(result.error, 'error'); return; }
    await remove(productId);
    toast('Moved to cart!');
  };

  // Items can be populated product objects or just IDs
  const normalizedItems = items.map(item =>
    typeof item === 'object' && item._id ? normalizeProduct(item) : null
  ).filter(Boolean);

  return (
    <div className="wrap" style={{ paddingTop: 24, paddingBottom: 80 }}>
      <div className="page-title">Wishlist</div>
      <div className="page-sub">{normalizedItems.length} saved item{normalizedItems.length !== 1 ? 's' : ''}</div>

      {normalizedItems.length === 0 ? (
        <div className="empty-state">
          <div className="emo">❤️</div>
          <h3>Your wishlist is empty</h3>
          <p>Save products you love and come back to them later.</p>
          <button className="btn btn-primary" onClick={() => navigate('/products')}>Discover Products</button>
        </div>
      ) : (
        <div className="wishlist-grid">
          {normalizedItems.map(item => {
            const image = item.images?.[0];
            return (
              <div key={item._id} className="product card-hover" style={{ cursor: 'default' }}>
                <div className="ph" style={{ cursor: 'pointer' }} onClick={() => navigate(`/product/${item._id}`)}>
                  {item.badge && <span className={`badge ${item.badge}`}>{item.badge === 'sale' ? `-${item.off}%` : 'New'}</span>}
                  {image ? (
                    <img src={image} alt={item.name} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                  ) : (
                    <span className="emo">🛍️</span>
                  )}
                  <button className="wish active" onClick={() => { remove(item._id); toast('Removed from wishlist'); }}>♥</button>
                </div>
                <div className="pmeta">
                  <div className="brand">{item.brand}</div>
                  <div className="name">{item.name}</div>
                  <div className="rate"><span className="stars">{stars(item.rating)}</span> {item.rating}</div>
                  <div className="price-row">
                    <span className="price num">{formatPriceShort(item.price)}</span>
                    {item.off > 0 && <span className="was num">{formatPriceShort(item.was)}</span>}
                  </div>
                  <button className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: 10 }} onClick={() => moveToCart(item)}>
                    <ShoppingCart size={14} /> Move to Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
