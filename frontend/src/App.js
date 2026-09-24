import { Routes, Route, useLocation } from 'react-router-dom';
import AdminHeroBannersPage from './pages/admin/AdminHeroBannersPage';
import CategoryPage from './pages/CategoryPage';
import ProductListPage from './pages/ProductListPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import ProfilePage from './pages/PrivacyPolicyPage';
import AuthPage from './pages/AuthPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminProductEditPage from './pages/admin/AdminProductEditPage';
import AdminTextileProductPage from './pages/admin/AdminTextileProductPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminCouponsPage from './pages/admin/AdminCouponsPage';
import AdminExclusiveBannersPage from './pages/admin/AdminExclusiveBannersPage';
import PrivateRoute from './routes/PrivateRoute';
import AdminRoute from './routes/AdminRoute';
import UserDashboard from './pages/UserDashboard';
import TermsConditionsPage from './pages/TermsConditionsPage';
import PrivacyPolicy from './pages/PrivacyPolicyPage';
import ContactPage from './pages/ContactPage';
import TrackOrderPage from './pages/TrackOrderPage';
import WalletPage from './pages/WalletPage';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import AllProducts from './components/product/AllProducts';
import AdminReviewPage from './pages/admin/AdminReviewPage';
import AdminCustomer from './pages/admin/AdminCustomer';
import AdminSliderPage from './pages/admin/AdminSliderPage';
import Wishlistpage from '../src/pages/Wishlistpage';
import SalesReportPage from './pages/admin/Report/SalesReportPage';
import OrderReportPage from './pages/admin/Report/OrderReportPage';
import CustomerReportPage from './pages/admin/Report/CustomerReportPage';
import ProductReportPage from './pages/admin/Report/ProductReportPage';
import AdminContactUs from './pages/admin/AdminContactUs';
import ReturnsRefunds from './pages/ReturnsRefunds';
import FAQs from './pages/FAQs';
import AboutUs from './pages/AboutUs';
import TermsConditions from './pages/TermsConditions';
import SellWithUs from './pages/SellWithUs';
import AdminReels from './pages/admin/Adminreels';

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="app">
      {!isAdminRoute && <Header />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/terms" element={<TermsConditionsPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/account" element={<UserDashboard />} />
          <Route
            path="/wallet"
            element={
              <PrivateRoute>
                <WalletPage />
              </PrivateRoute>
            }
          />
          <Route path="/all-product" element={<AllProducts />} />
          <Route
            path="/wishlist"
            element={
              <PrivateRoute>
                <Wishlistpage />
              </PrivateRoute>
            }
          />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/product/:id" element={<ProductDetailsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/return-refunds" element={<ReturnsRefunds />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/terms-conditions" element={<TermsConditions />} />
          <Route path="/sell-with-us" element={<SellWithUs />} />




          <Route
            path="/checkout"
            element={
              <PrivateRoute>
                <CheckoutPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/order-success/:orderId"
            element={
              <PrivateRoute>
                <OrderSuccessPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/track-order" element={<TrackOrderPage />} />

          {/* ✅ ADMIN ROUTES */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/products"
            element={
              <AdminRoute>
                <AdminProductsPage />
              </AdminRoute>
            }
          />

          {/* ✅ FIXED: NEW PRODUCT ROUTE */}
          <Route
            path="/admin/products/new"
            element={
              <AdminRoute>
                <AdminTextileProductPage />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/products/textile/:id"
            element={
              <AdminRoute>
                <AdminTextileProductPage />
              </AdminRoute>
            }
          />

          {/* ✅ EDIT PRODUCT ROUTE */}
          <Route
            path="/admin/products/:id"
            element={
              <AdminRoute>
                <AdminProductEditPage />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/orders"
            element={
              <AdminRoute>
                <AdminOrdersPage />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsersPage />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/customer"
            element={
              <AdminRoute>
                <AdminCustomer />
              </AdminRoute>
            }
          />
          <Route path="/admin/report/sales" element={<AdminRoute><SalesReportPage /></AdminRoute>} />
          <Route path="/admin/report/orders" element={<AdminRoute><OrderReportPage /></AdminRoute>} />
          <Route path="/admin/report/customers" element={<AdminRoute><CustomerReportPage /></AdminRoute>} />
          <Route path="/admin/report/products" element={<AdminRoute><ProductReportPage /></AdminRoute>} />
          <Route
            path="/admin/coupons"
            element={
              <AdminRoute>
                <AdminCouponsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/exclusive-banners"
            element={
              <AdminRoute>
                <AdminExclusiveBannersPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/slider-banners"
            element={
              <AdminRoute>
                <AdminSliderPage />
              </AdminRoute>
            }
          />
           <Route
            path="/admin/reels-page"
            element={
              <AdminRoute>
                <AdminReels />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/contact-us"
            element={
              <AdminRoute>
                <AdminContactUs />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/hero-banners"
            element={
              <AdminRoute>
                <AdminHeroBannersPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/review-page"
            element={
              <AdminRoute>
                <AdminReviewPage />
              </AdminRoute>
            }
          />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default App;
