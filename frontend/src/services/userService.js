import api from './api';

// GET /api/user/me
export const getMyProfile = async () => {
  const res = await api.get('/user/me');
  return res.data;
};

// PUT /api/user/me
export const updateMyProfile = async (payload) => {
  const res = await api.put('/user/me', payload);
  return res.data;
};
