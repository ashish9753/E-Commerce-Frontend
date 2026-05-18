import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingCart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPriceShort, stars } from '../utils/formatters';

export default function WishlistPage() {
  const navigate = useNavigate();
  const { items, remove } = useWishlist();
  const { addToCart } = useCart();
  const toast = useToast();

  const moveToCart = (item) => {
    addToCart(item);
    remove(item.id);
    toast('Moved to cart!');
  };

  return (
    <div className="wrap" style={{ paddingTop: 24, paddingBottom: 80 }}>
      <div className="page-title">Wishlist</div>
      <div className="page-sub">{items.length} saved item{items.length !== 1 ? 's' : ''}</div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="emo">❤️</div>
          <h3>Your wishlist is empty</h3>
          <p>Save products you love and come back to them later.</p>
          <button className="btn btn-primary" onClick={() => navigate('/products')}>Discover Products</button>
        </div>
      ) : (
        <div className="wishlist-grid">
          {items.map(item => (
            <div key={item.id} className="product card-hover" style={{ cursor: 'default' }}>
              <div className="ph" style={{ cursor: 'pointer' }} onClick={() => navigate(`/product/${item.id}`)}>
                {item.badge && <span className={`badge ${item.badge}`}>{item.badge === 'sale' ? `-${item.off}%` : 'New'}</span>}
                <span className="emo">{item.emo}</span>
                <button className="wish active" onClick={() => { remove(item.id); toast('Removed from wishlist'); }}>
                  ♥
                </button>
              </div>
              <div className="pmeta">
                <div className="brand">{item.brand}</div>
                <div className="name">{item.name}</div>
                <div className="rate"><span className="stars">{stars(item.rating)}</span> {item.rating}</div>
                <div className="price-row">
                  <span className="price num">{formatPriceShort(item.price)}</span>
                  <span className="was num">{formatPriceShort(item.was)}</span>
                </div>
                <button className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: 10 }} onClick={() => moveToCart(item)}>
                  <ShoppingCart size={14} /> Move to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
