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
import { CatalogProvider } from './context/CatalogContext';

// Prevent mouse wheel from changing number input values globally
document.addEventListener('wheel', () => {
  if (document.activeElement?.type === 'number') document.activeElement.blur();
}, { passive: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <CatalogProvider>
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
        </CatalogProvider>
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
);
