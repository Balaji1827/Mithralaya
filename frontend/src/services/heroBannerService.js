import api from './api';

const API_ORIGIN = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

const resolveMediaUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path}`;
};

export const getHeroBanners = async () => {
  const { data } = await api.get('/hero-banners');
  return data
    .filter((b) => b.isActive)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((b) => ({ ...b, image: resolveMediaUrl(b.image) }));
};

export const createHeroBanner = async (formData) => {
  const { data } = await api.post('/hero-banners', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};

export const updateHeroBanner = async (id, formData) => {
  const { data } = await api.put(`/hero-banners/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};

export const deleteHeroBanner = async (id) => {
  const { data } = await api.delete(`/hero-banners/${id}`);
  return data;
};

export const toggleHeroBannerStatus = async (id, payload) => {
  const { data } = await api.patch(`/hero-banners/${id}`, payload);
  return data;
};