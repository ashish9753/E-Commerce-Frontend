import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import WishlistPage from './pages/WishlistPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import ReturnsPage from './pages/ReturnsPage';
import ReturnStatusPage from './pages/ReturnStatusPage';
import ComparePage from './pages/ComparePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import SellerDashboard from './pages/seller/SellerDashboard';

const Spinner = () => <div className="min-h-screen flex items-center justify-center"><div className="spinner" style={{ width: 40, height: 40 }} /></div>;

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function SellerRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'seller' && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Guest-only auth pages */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* Public pages */}
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/products" element={<Layout><ProductListPage /></Layout>} />
        <Route path="/product/:id" element={<Layout><ProductDetailPage /></Layout>} />
        <Route path="/compare" element={<Layout><ComparePage /></Layout>} />

        {/* Auth-optional pages */}
        <Route path="/cart" element={<Layout><CartPage /></Layout>} />

        {/* Protected pages */}
        <Route path="/checkout" element={<Layout><PrivateRoute><CheckoutPage /></PrivateRoute></Layout>} />
        <Route path="/profile" element={<Layout><PrivateRoute><ProfilePage /></PrivateRoute></Layout>} />
        <Route path="/orders" element={<Layout><PrivateRoute><OrdersPage /></PrivateRoute></Layout>} />
        <Route path="/wishlist" element={<Layout><PrivateRoute><WishlistPage /></PrivateRoute></Layout>} />
        <Route path="/track" element={<Layout><PrivateRoute><OrderTrackingPage /></PrivateRoute></Layout>} />
        <Route path="/returns" element={<Layout><PrivateRoute><ReturnsPage /></PrivateRoute></Layout>} />
        <Route path="/return-status/:returnId" element={<Layout><PrivateRoute><ReturnStatusPage /></PrivateRoute></Layout>} />

        {/* Admin */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

        {/* Seller */}
        <Route path="/seller" element={<SellerRoute><SellerDashboard /></SellerRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
