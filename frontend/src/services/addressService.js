import api from './api';

export const getAddresses = async () => {
  const res = await api.get('/addresses');
  return res.data;
};

export const createAddress = async (payload) => {
  const res = await api.post('/addresses', payload);
  return res.data;
};

export const updateAddress = async (id, payload) => {
  const res = await api.put(`/addresses/${id}`, payload);
  return res.data;
};

export const deleteAddress = async (id) => {
  const res = await api.delete(`/addresses/${id}`);
  return res.data;
};

export const setDefaultAddress = async (id) => {
  const res = await api.put(`/addresses/${id}/default`);
  return res.data;
};
