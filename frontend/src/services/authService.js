// frontend/src/services/authService.js
import api from './api';

// 🔐 Email/password register
export const register = async (data) => {
  const res = await api.post('/auth/register', data);
  return res.data;
};

// 🔐 Email/password login
export const login = async (data) => {
  const res = await api.post('/auth/login', data);
  return res.data;
};

// 🔐 Google login
export const googleLogin = async (data) => {
  const res = await api.post('/auth/google', data);
  return res.data;
};

// 🔐 Phone OTP: request
export const requestOtp = async (phone) => {
  const res = await api.post('/auth/phone/request-otp', { phone });
  return res.data;
};

// 🔐 Phone OTP: verify
export const verifyOtp = async ({ phone, otp }) => {
  const res = await api.post('/auth/phone/verify-otp', { phone, otp });
  return res.data;
};

// 🔐 Logout
export const logout = async () => {
  const res = await api.post('/auth/logout');
  return res.data;
};

/* ✅✅ PROFILE ENDPOINTS */

// GET /api/auth/profile  (authController.getProfile)
export const getProfile = async () => {
  const res = await api.get('/auth/profile');
  return res.data;
};

// PUT /api/auth/profile  (authController.updateProfile)
export const updateProfile = async (payload) => {
  const res = await api.put('/auth/profile', payload);
  return res.data;
};