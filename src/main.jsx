import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { CompareProvider } from './context/CompareContext';
import { OrderProvider } from './context/OrderContext';
import { NotificationProvider } from './context/NotificationContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <NotificationProvider>
          <OrderProvider>
            <CartProvider>
              <WishlistProvider>
                <CompareProvider>
                  <App />
                </CompareProvider>
              </WishlistProvider>
            </CartProvider>
          </OrderProvider>
        </NotificationProvider>
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
);
