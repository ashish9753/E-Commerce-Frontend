import { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { generateOrderId } from '../utils/formatters';

const OrderContext = createContext(null);
const ORDERS_KEY = 'orders';

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState(() => storage.get(ORDERS_KEY) || []);

  useEffect(() => {
    storage.set(ORDERS_KEY, orders);
  }, [orders]);

  const placeOrder = (cartItems, orderDetails) => {
    const order = {
      id: generateOrderId(),
      items: cartItems,
      ...orderDetails,
      status: 'confirmed',
      placedAt: new Date().toISOString(),
      timeline: [
        { event: 'Order Placed', loc: 'Trade Engine System', time: new Date().toISOString(), state: 'done' },
        { event: 'Payment Confirmed', loc: 'Payment Gateway', time: new Date().toISOString(), state: 'done' },
        { event: 'Processing', loc: 'Trade Engine Warehouse', time: null, state: 'active' },
        { event: 'Shipped', loc: '', time: null, state: 'upcoming' },
        { event: 'Out for Delivery', loc: '', time: null, state: 'upcoming' },
        { event: 'Delivered', loc: '', time: null, state: 'upcoming' },
      ],
    };
    setOrders(prev => [order, ...prev]);
    return order;
  };

  const getUserOrders = (userId) => orders.filter(o => o.userId === userId);

  const submitReturn = (orderId, returnData) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, returnRequest: { ...returnData, status: 'pending', submittedAt: new Date().toISOString() } } : o
    ));
  };

  return (
    <OrderContext.Provider value={{ orders, placeOrder, getUserOrders, submitReturn }}>
      {children}
    </OrderContext.Provider>
  );
}

export const useOrders = () => useContext(OrderContext);
