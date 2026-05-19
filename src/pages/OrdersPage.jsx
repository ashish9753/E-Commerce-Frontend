import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { formatPriceShort, formatDate } from '../utils/formatters';

const STATUS_COLORS = {
  PLACED: 'tag-info',
  CONFIRMED: 'tag-info',
  PACKED: 'tag-warn',
  SHIPPED: 'tag-accent',
  OUT_FOR_DELIVERY: 'tag-accent',
  DELIVERED: 'tag-ok',
  CANCELLED: 'tag-bad',
  RETURNED: 'tag-bad',
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getMyOrders } = useOrders();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    getMyOrders({ limit: 20 })
      .then(result => {
        if (result.success) {
          setOrders(result.data || result.orders || []);
          setTotal(result.total || 0);
        }
      })
      .finally(() => setLoading(false));
  }, [user, navigate, getMyOrders]);

  if (!user) return null;

  return (
    <div className="wrap">
      <div className="orders-page">
        <div className="opg-title">My Orders</div>
        <div className="opg-sub">{total} order{total !== 1 ? 's' : ''} placed</div>

        {loading ? (
          <div className="py-20 text-center text-mute">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="emo">📦</div>
            <h3>No orders yet</h3>
            <p>Your order history will appear here.</p>
            <button className="btn btn-primary" onClick={() => navigate('/products')}>Start Shopping</button>
          </div>
        ) : (
          orders.map(order => {
            const statusLabel = order.orderStatus || 'PLACED';
            return (
              <div key={order._id} className="order-card" onClick={() => navigate(`/track?id=${order._id}`)}>
                <div className="oc-head">
                  <div className="oc-id">
                    <div className="lab">Order ID</div>
                    <div className="num">#{order._id?.slice(-8).toUpperCase()}</div>
                    <div className="date">{formatDate(order.createdAt)}</div>
                  </div>
                  <span className={`tag ${STATUS_COLORS[statusLabel] || 'tag-info'}`}>
                    {statusLabel.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="oc-items">
                  {(order.orderItems || []).slice(0, 4).map((item, i) => (
                    <div key={i} className="oc-th">
                      {item.image ? (
                        <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : '🛍️'}
                    </div>
                  ))}
                  {(order.orderItems || []).length > 4 && (
                    <div className="oc-more">+{order.orderItems.length - 4}</div>
                  )}
                </div>
                <div className="oc-foot">
                  <div className="oc-tot">
                    {(order.orderItems || []).length} item{(order.orderItems || []).length !== 1 ? 's' : ''} · Total: <b>{formatPriceShort(order.totalPrice)}</b>
                  </div>
                  <div className="oc-actions">
                    <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); navigate(`/track?id=${order._id}`); }}>Track Order</button>
                    {order.orderStatus === 'DELIVERED' && (
                      <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); navigate(`/returns?orderId=${order._id}`); }}>Return</button>
                    )}
                    {['PLACED', 'CONFIRMED'].includes(order.orderStatus) && (
                      <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); navigate(`/track?id=${order._id}`); }}>Cancel</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
