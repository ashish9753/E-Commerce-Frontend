import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { formatPriceShort, formatDate } from '../utils/formatters';

const STATUS_COLORS = {
  confirmed: 'tag-info',
  processing: 'tag-warn',
  shipped: 'tag-accent',
  delivered: 'tag-ok',
  cancelled: 'tag-bad',
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getUserOrders } = useOrders();

  if (!user) { navigate('/login'); return null; }

  const orders = getUserOrders(user.id);

  return (
    <div className="wrap">
      <div className="orders-page">
        <div className="opg-title">My Orders</div>
        <div className="opg-sub">{orders.length} orders placed</div>

        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="emo">📦</div>
            <h3>No orders yet</h3>
            <p>Your order history will appear here.</p>
            <button className="btn btn-primary" onClick={() => navigate('/products')}>Start Shopping</button>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="order-card" onClick={() => navigate(`/track?id=${order.id}`)}>
              <div className="oc-head">
                <div className="oc-id">
                  <div className="lab">Order ID</div>
                  <div className="num">{order.id}</div>
                  <div className="date">{formatDate(order.placedAt)}</div>
                </div>
                <span className={`tag ${STATUS_COLORS[order.status] || 'tag-info'}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              <div className="oc-items">
                {order.items.slice(0, 4).map((item, i) => (
                  <div key={i} className="oc-th">{item.emo}</div>
                ))}
                {order.items.length > 4 && (
                  <div className="oc-more">+{order.items.length - 4}</div>
                )}
              </div>
              <div className="oc-foot">
                <div className="oc-tot">
                  {order.items.length} item{order.items.length !== 1 ? 's' : ''} · Total: <b>{formatPriceShort(order.total)}</b>
                </div>
                <div className="oc-actions">
                  <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); navigate(`/track?id=${order.id}`); }}>Track Order</button>
                  {order.status === 'delivered' && !order.returnRequest && (
                    <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); navigate(`/returns?orderId=${order.id}`); }}>Return</button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
