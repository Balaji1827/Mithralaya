import api from './api';

// GET /api/wishlist
export const getWishlist = async () => {
  const res = await api.get('/wishlist');
  return res.data;      // array of Product objects
};

// POST /api/wishlist
export const addToWishlist = async (productId) => {
  const res = await api.post('/wishlist', { productId });
  return res.data;      // updated wishlist
};

// DELETE /api/wishlist/:productId
export const removeFromWishlist = async (productId) => {
  const res = await api.delete(`/wishlist/${productId}`);
  return res.data;      // updated wishlist
};
