import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { RootLayout } from './components/layout/RootLayout';

// Pages
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { ProductDetails } from './pages/ProductDetails';
import { ShopProfile } from './pages/ShopProfile';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { TrackOrder } from './pages/TrackOrder';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { NotFound } from './pages/NotFound';

// Seller Portal Pages
import { SellerLayout } from './pages/seller/SellerLayout';
import { SellerDashboard } from './pages/seller/SellerDashboard';
import { SellerProducts } from './pages/seller/SellerProducts';
import { SellerProductForm } from './pages/seller/SellerProductForm';
import { SellerOrders } from './pages/seller/SellerOrders';
import { SellerOnboarding } from './pages/seller/SellerOnboarding';

// Admin Portal Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminAudit } from './pages/admin/AdminAudit';

export function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<RootLayout />}>
                  {/* Public Storefront Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/catalog" element={<Catalog />} />
                  <Route path="/product/:slug" element={<ProductDetails />} />
                  <Route path="/shop/:slug" element={<ShopProfile />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-confirmation/:orderReference" element={<OrderConfirmation />} />
                  <Route path="/track-order" element={<TrackOrder />} />
                  <Route path="/track-order/:orderReference" element={<TrackOrder />} />

                  {/* Auth Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />

                  {/* Standalone Seller Onboarding Route */}
                  <Route path="/seller/onboarding" element={<SellerOnboarding />} />

                  {/* Seller Dashboard Portal Nested Routes */}
                  <Route path="/seller" element={<SellerLayout />}>
                    <Route index element={<SellerDashboard />} />
                    <Route path="products" element={<SellerProducts />} />
                    <Route path="products/new" element={<SellerProductForm />} />
                    <Route path="products/edit/:id" element={<SellerProductForm />} />
                    <Route path="orders" element={<SellerOrders />} />
                  </Route>

                  {/* Super Admin Control Nested Routes */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="shops" element={<AdminDashboard />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="audit" element={<AdminAudit />} />
                  </Route>

                  {/* Fallback 404 Route */}
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}

export default App;
