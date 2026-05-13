import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Success from './pages/Success';
import Orders from './pages/Orders';
import Messages from './pages/Messages';
import SellerProfile from './pages/SellerProfile';
import SellerDashboard from './pages/SellerDashboard';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import AdminDashboard from './pages/AdminDashboard';
import { getStoredToken, getStoredUser, hasRoleAccess } from './utils/auth';

function PrivateRoute({ children, allowedRoles = [] }) {
  const token = getStoredToken();
  const user = getStoredUser();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (!hasRoleAccess(user.role, allowedRoles)) {
    return <Navigate to="/home" replace />;
  }

  return token ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/product/:id" element={<PrivateRoute><ProductDetail /></PrivateRoute>} />
        <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
        <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
        <Route path="/success" element={<PrivateRoute><Success /></PrivateRoute>} />
        <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
        <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/seller/dashboard" element={<PrivateRoute allowedRoles={['seller', 'admin']}><SellerDashboard /></PrivateRoute>} />
        <Route path="/admin/dashboard" element={<PrivateRoute allowedRoles={['admin']}><AdminDashboard /></PrivateRoute>} />
        <Route path="/seller/:id" element={<PrivateRoute><SellerProfile /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
