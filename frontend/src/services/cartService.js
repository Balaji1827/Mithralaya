import api from './api';

export const getCart = async () => {
  const res = await api.get('/cart');
  return res.data;
};

export const addToCart = async (data) => {
  const res = await api.post('/cart', data);
  return res.data;
};

export const updateCartItem = async (data) => {
  const res = await api.put('/cart', data);
  return res.data;
};

export const removeFromCart = async (productId, size, color) => {
  const res = await api.delete('/cart', {
    data: { productId, size, color }
  });
  return res.data;
};

export const clearCart = async () => {
  const res = await api.delete('/cart/clear');
  return res.data;
};
