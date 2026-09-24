import React, { createContext, useContext, useEffect, useState } from 'react';
import * as authService from '../services/authService';
import { addToCart as addToCartService } from '../services/cartService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Load user from localStorage on app start
  useEffect(() => {
    const storedUser = localStorage.getItem("mmw_user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  // ✅ If a product was queued (Add to Cart while logged out), add it now.
  //    Called right after every successful login/register.
  const addPendingCartItem = async () => {
    const pending = localStorage.getItem('pendingCartItem');
    if (!pending) return;

    try {
      const item = JSON.parse(pending);
      await addToCartService(item);
    } catch (err) {
      console.error('Failed to add pending cart item:', err);
    } finally {
      localStorage.removeItem('pendingCartItem');
    }
  };

  // ✅ Email/Password Login
  const login = async ({ email, password }) => {
    const data = await authService.login({ email, password });

    setUser(data);
    localStorage.setItem("mmw_user", JSON.stringify(data));
    localStorage.setItem("mmw_token", data.token);

    await addPendingCartItem();

    return data;
  };

  // ✅ Register
  const register = async ({ name, email, password, phone }) => {
    const data = await authService.register({ name, email, password, phone });
    setUser(data);
    localStorage.setItem('mmw_user', JSON.stringify(data));
    localStorage.setItem('mmw_token', data.token);

    await addPendingCartItem();

    return data;
  };

  // ✅ Google Login
  const googleLogin = async (idToken) => {
    const data = await authService.googleLogin(idToken);
    setUser(data);
    localStorage.setItem('mmw_user', JSON.stringify(data));
    localStorage.setItem('mmw_token', data.token);

    await addPendingCartItem();

    return data;
  };

  // ✅ Request Phone OTP
  const requestOtp = async (phone) => {
    return await authService.requestOtp(phone);
  };

  // ✅ Verify Phone OTP Login
  const verifyOtpLogin = async ({ phone, otp }) => {
    const data = await authService.verifyOtp({ phone, otp });
    setUser(data);
    localStorage.setItem('mmw_user', JSON.stringify(data));
    localStorage.setItem('mmw_token', data.token);

    await addPendingCartItem();

    return data;
  };

  // ✅ Logout
  const logout = async () => {
    await authService.logout();
    setUser(null);
    localStorage.removeItem('mmw_user');
    localStorage.removeItem('mmw_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        googleLogin,
        requestOtp,
        verifyOtpLogin,
        logout
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

// ✅ Custom Hook
export const useAuth = () => useContext(AuthContext);
