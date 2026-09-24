import api from './api';

/* ---------- User ---------- */

export const createReview = (payload) =>
  api.post('/reviews', payload).then(res => res.data);

export const getMyReviews = () =>
  api.get('/reviews/my').then(res => res.data);

/* ---------- Public ---------- */

export const getProductReviews = (productId) =>
  api.get(`/reviews/product/${productId}`).then(res => res.data);


export const createAdminReview = (payload) =>
  api.post('/reviews/admin', payload).then(res => res.data);

export const getAllReviews = () =>
  api.get("/reviews/admin");

export const approveReview = (id) =>
  api.put(`/reviews/approve/${id}`);

export const rejectReview = (id) =>
  api.put(`/reviews/reject/${id}`);

export const replyReview = (id, reply) =>
  api.put(`/reviews/reply/${id}`, { reply });

export const deleteReview = (id) =>
  api.delete(`/reviews/${id}`);