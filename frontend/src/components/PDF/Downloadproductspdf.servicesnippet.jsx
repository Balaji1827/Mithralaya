// ============================================================
// ADD THIS TO services/productService.js
// (place it next to your existing downloadProductsCreatedByExcel function
// — mirrors that function's blob-download pattern exactly)
// ============================================================

export const downloadProductsPdf = async () => {
  const response = await api.get('/products/textile/report/products/pdf', {
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

// NOTE: adjust the URL path above ('/products/textile/report/products/pdf')
// to match whatever route you wire up for downloadProductsPdf on the
// backend, and adjust `api` to whatever your axios instance is called in
// this file (it should already be imported/defined near the top, since
// downloadProductsCreatedByExcel uses the same instance).