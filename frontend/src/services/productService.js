import api from './api';

export const getCategories = async () => {
  const { data } = await api.get('/categories');
  return data;
};


export const getProducts = async (query = {}) => {
  const response = await api.get('/products', { params: query });
  return response.data;
};

export const getProduct = async (id) => {
  const res = await api.get(`/products/${id}`);
  return res.data;
};

export const createProduct = async (payload) => {
  const { data } = await api.post('/products', payload);
  return data;
};

export const updateProduct = async (id, payload) => {
  const { data } = await api.put(`/products/${id}`, payload);
  return data;
};

export const deleteProduct = async (id) => {
  const { data } = await api.delete(`/products/${id}`);
  return data;
};

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const { data } = await api.post('/upload', formData);
  return data;
};

export const getTextileConfig = async () => {
  const { data } = await api.get('/product-catalog/textile-config');
  return data;
};

export const getTextileNavigation = async () => {
  const { data } = await api.get('/product-catalog/textile-navigation');
  return data;
};

export const createTextileProduct = async (payload) => {
  const { data } = await api.post('/products/textile', payload);
  return data;
};

export const getTextileProducts = async (query = {}) => {
  const { data } = await api.get('/products/textile', { params: query });
  return data;
};

export const getTextileProduct = async (id) => {
  const { data } = await api.get(`/products/textile/${id}`);
  return data;
};

export const getStorefrontTextileProduct = async (id) => {
  const { data } = await api.get(`/products/textile-store/${id}`);
  return data;
};

export const updateTextileProduct = async (id, payload) => {
  const { data } = await api.put(`/products/textile/${id}`, payload);
  return data;
};

export const updateTextileVariant = async (variantId, payload) => {
  const { data } = await api.put(`/products/textile/variants/${variantId}`, payload);
  return data;
};

export const deleteTextileProduct = async (id) => {
  const { data } = await api.delete(`/products/textile/${id}`);
  return data;
};

export const deleteTextileVariant = async (variantId) => {
  const { data } = await api.delete(`/products/textile/variants/${variantId}`);
  return data;
};


export const getTextileFilters = async (query = {}) => {
  const { data } = await api.get('/products/textile-filters', { params: query });
  return data;
};


export const getProductsCreatedByStats = async () => {
  const { data } = await api.get('/products/textile-created-by-stats');
  return data;
};


export const downloadProductsCreatedByExcel = async () => {
  const response = await api.get('/products/textile-created-by-download', {
    responseType: 'blob'
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'products-created-by.xlsx');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};


export const downloadProductsPdf = async (query = {}) => {
  const response = await api.get('/products/textile-products-download-pdf', {
    params: query,
    responseType: 'blob'
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'product-information.pdf');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};