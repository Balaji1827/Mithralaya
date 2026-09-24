import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';
import { WishlistProvider } from './contexts/WishlistContext';
import ScrollToTop from './components/ScrollToTop';
import './css/index.css';
import './css/Typography.css';
import './css/header.css';
import './css/footer.css';
import './css/home.css';
import './css/product.css';
import './css/cart.css';
import './css/auth.css';
import './css/adminDashboard.css';
import './css/adminOrders.css';
import './css/adminProductEdit.css';
import './css/checkout.css';
import './css/ContactPage.css';
import './css/exclusive.css';
import './css/marque.css';
import './css/orderSuccess.css';
import './css/PrivacyPolicyPage.css';
import './css/productdetails.css';
import './css/rewards.css';
import './css/TermsConditionsPage.css';
import './css/toast.css';
import './css/userDashboard.css';
import './css/userOrders.css';
import './css/wallet.css';
import Advertisement from './components/Advertisement/Advertisement';



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <ScrollToTop />
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
                  <Advertisement />
            
            <App />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>
);