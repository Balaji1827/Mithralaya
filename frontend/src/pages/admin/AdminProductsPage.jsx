import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from './AdminDashboardPage';
import AdminHeader from '../../pages/admin/AdminHeader';
import {
  getCategories,
  getProducts,
  deleteProduct,
  getTextileProducts,
  getTextileProduct,
  deleteTextileProduct,
  getProductsCreatedByStats,
  downloadProductsCreatedByExcel,
  downloadProductsPdf
} from '../../services/productService';
import formatPrice from '../../utils/formatPrice';
import '../../css/AdminProductPage.css';
import { FaEdit, FaEye, FaTrash, FaTimes } from "react-icons/fa";
// Table.jsx lives at src/components/Table.jsx
import { Table } from '../../components/Table';

const SIZE_ORDER = ['S', 'M', 'L', 'XL', 'XXL'];

const AdminProductsPage = () => {

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTextileProduct, setSelectedTextileProduct] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [createdByStats, setCreatedByStats] = useState([]);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const loadCreatedByStats = async () => {
      try {
        const data = await getProductsCreatedByStats();
        setCreatedByStats(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error loading created-by stats:', error);
        setCreatedByStats([]);
      }
    };
    loadCreatedByStats();
  }, []);

  const handleDownloadReport = async () => {
    setDownloadingReport(true);
    try {
      await downloadProductsCreatedByExcel();
    } catch (error) {
      console.error('Failed to download report:', error);
      alert('Failed to download report');
    } finally {
      setDownloadingReport(false);
    }
  };

  // Downloads the "Product Information" PDF, scoped to whatever's
  // currently in the search box — e.g. if the admin searched "cotton" and
  // is looking at filtered results, the PDF only contains those matching
  // products instead of the full catalog. Passing an empty/no search term
  // exports everything, same as loading the page with no search.
  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      await downloadProductsPdf(searchTerm ? { search: searchTerm } : {});
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const load = async (page = 1, search = '') => {
    setLoading(true);

    try {
      const [textileResult, categoryList] = await Promise.all([
        getTextileProducts({
          page,
          limit: 10,
          search
        }),
        getCategories()
      ]);

      // 👇 இதே இடத்தில் வைக்கணும்
      // console.log(
      //   "Current Page:",
      //   textileResult.currentPage,
      //   textileResult.products.map((p) => p.name)
      // );

      // console.log(textileResult);

      setProducts(
        (textileResult.products || []).map((p) => ({
          ...p,
          catalogType: "textile"
        }))
      );

      setTotalPages(textileResult.totalPages || 1);
      setCurrentPage(textileResult.currentPage || page);
      setCategories(categoryList || []);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    load(1, searchTerm);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this product?')) {
      await deleteProduct(id);
      load(currentPage);
    }
  };

  const handleTextileDelete = async (id) => {
    if (window.confirm('Delete this textile product and deactivate its variants?')) {
      await deleteTextileProduct(id);
      load(currentPage, searchTerm);
    }
  };

  const handleView = async (id) => {
    setViewLoading(true);
    try {
      setSelectedTextileProduct(await getTextileProduct(id));
    } finally {
      setViewLoading(false);
    }
  };

  const handleSelectProduct = (id) => {
    setSelectedProducts((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProducts(products.map((p) => p._id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedProducts.length) {
      alert("Please select products");
      return;
    }

    if (!window.confirm(`Delete ${selectedProducts.length} products?`)) {
      return;
    }

    try {
      const selectedRows = products.filter((p) =>
        selectedProducts.includes(p._id)
      );

      await Promise.all(
        selectedRows.map((p) =>
          p.catalogType === "textile"
            ? deleteTextileProduct(p._id)
            : deleteProduct(p._id)
        )
      );

      setSelectedProducts([]);
      load(currentPage, searchTerm);
    } catch (error) {
      console.error(error);
      alert("Failed to delete products");
    }
  };


  const normalizeLabel = (value = '') =>
    String(value)
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '');

  const getCategoryName = (product) => {
    if (product.category?.name) return product.category.name;
    if (product.categoryName) return product.categoryName;
    if (product.category?.slug) return product.category.slug;

    if (typeof product.category === 'string') {
      const category = categories.find((item) => item._id === product.category);
      if (category?.name) return category.name;
    }

    if (product.subCategory) {
      const category = categories.find((item) =>
        (item.subCategories || []).includes(product.subCategory)
      );
      if (category?.name) return category.name;
    }

    const searchableText = normalizeLabel(
      [product.name, product.slug, product.description].filter(Boolean).join(' ')
    );

    const category = categories.find((item) => {
      const categoryName = normalizeLabel(item.name);
      const categorySlug = normalizeLabel(item.slug);
      const singularName = categoryName.endsWith('s')
        ? categoryName.slice(0, -1)
        : categoryName;

      return (
        searchableText.includes(categoryName) ||
        searchableText.includes(categorySlug) ||
        searchableText.includes(singularName)
      );
    });

    if (category?.name) return category.name;

    return "N/A";
  };

  // Build a size -> variant lookup for the size-matrix table in the drawer
  // (and now also reused inside the "Size / stock" column below).
  const getSizeMatrix = (variants = []) => {
    const bySize = {};
    variants.forEach((v) => {
      bySize[v.size] = v;
    });

    const extraSizes = Object.keys(bySize).filter((s) => !SIZE_ORDER.includes(s));
    const columns = [...SIZE_ORDER, ...extraSizes].filter((s) => bySize[s] !== undefined || SIZE_ORDER.includes(s));

    return { bySize, columns };
  };

  // ---- react-table column definitions ----
  const columns = useMemo(
    () => [
      {
        Header: 'Name',
        accessor: 'name',
        Cell: ({ row }) => {
          const p = row.original;
          return (
            <>
              <strong>{p.name}</strong>
              <div className="apl-category-path">
                {p.catalogType === 'textile'
                  ? [p.category, p.subCategory, p.productType, p.sleeveOrStyle].filter(Boolean).join(' / ')
                  : [getCategoryName(p), p.subCategory].filter((value) => value && value !== 'N/A').join(' / ') || 'Legacy product'}
              </div>
            </>
          );
        }
      },
      {
        Header: 'Image',
        id: 'image',
        disableSortBy: true,
        Cell: ({ row }) => {
          const p = row.original;
          return p.images?.[0] ? (
            <img
              src={p.images[0]}
              alt={p.name}
              className="apl-thumb"
            />
          ) : (
            'No Image'
          );
        }
      },
      { Header: 'Material', accessor: 'material' },
      { Header: 'Brand', accessor: 'brand' },
      {
        Header: 'Color',
        id: 'color',
        Cell: ({ row }) => row.original.colors?.join(', ') || row.original.color
      },
      {
        Header: 'Variants',
        id: 'variants',
        accessor: (p) => p.totalVariants || 0
      },
      {
        Header: 'Size / stock',
        id: 'sizeStock',
        disableSortBy: true,
        Cell: ({ row }) => {
          const p = row.original;
          if (!(p.catalogType === 'textile' && p.variants?.length)) return 'N/A';

          const { bySize, columns: sizeColumns } = getSizeMatrix(p.variants);
          return (
            <table className="apl-size-table">
              <thead>
                <tr>
                  {sizeColumns.map((size) => (
                    <th key={size}>{size}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {sizeColumns.map((size) => (
                    <td key={size} className={bySize[size] && bySize[size].stockAvailable === 0 ? 'apl-stock-zero' : ''}>
                      {bySize[size] ? bySize[size].stockAvailable : '-'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          );
        }
      },
      {
        Header: 'Stock',
        id: 'stock',
        accessor: (p) => p.totalStock || p.stock || 0
      },
      {
        Header: "Price",
        id: "price",
        Cell: ({ row }) => {
          const variants = row.original.variants || [];

          if (!variants.length) return "N/A";

          // first variant-oda prices (ellam same-a irundha idhu подhum;
          // size-wise vera prices irundha range kaattum)
          const v = variants[0];

          const retailPrices = variants.map(x => Number(x.retailPrice)).filter(n => n > 0);
          const minRetail = retailPrices.length ? Math.min(...retailPrices) : 0;
          const maxRetail = retailPrices.length ? Math.max(...retailPrices) : 0;

          const retailDisplay =
            minRetail === maxRetail
              ? `₹${minRetail}`
              : `₹${minRetail} - ₹${maxRetail}`;

          return (
            <div style={{ fontSize: "12px", lineHeight: 1.6 }}>
              <div><strong style={{ fontSize: "13px" }}>{retailDisplay}</strong></div>
              <div style={{ color: "#777" }}>MRP: ₹{v.mrp || 0}</div>
              <div style={{ color: "#777" }}>WS: ₹{v.wholesalePrice || 0}</div>
              <div style={{ color: "#999" }}>PP: ₹{v.purchasePrice || 0}</div>
            </div>
          );
        }
      },
      {
        Header: "MRP",
        id: "mrp",
        Cell: ({ row }) => {
          const v = row.original.variants?.[0];
          return v ? `₹${v.mrp}` : `₹${row.original.mrp || 0}`;
        }
      },
      {
        Header: 'Supplier',
        id: 'supplier',
        accessor: (p) => p.supplier?.name || 'N/A'
      },
      {
        Header: 'Status',
        id: 'status',
        Cell: ({ row }) => (
          <span className={`apl-status-badge apl-status-${row.original.status?.toLowerCase()}`}>
            {row.original.status}
          </span>
        )
      },
      {
        Header: 'Actions',
        id: 'actions',
        disableSortBy: true,
        Cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="apl-action-icons">
              <FaEye className="apl-action-icon apl-view-icon" onClick={() => handleView(p._id)} />
              <FaEdit
                className="apl-action-icon apl-edit-icon"
                onClick={() => navigate(`/admin/products/textile/${p._id}`)}
              />
              <FaTrash className="apl-action-icon apl-delete-icon" onClick={() => handleTextileDelete(p._id)} />
            </div>
          );
        }
      },
      {
        Header: "Created By",
        id: "createdBy",
        Cell: ({ row }) => {
          const user = row.original.createdBy;

          if (!user) return "N/A";

          return (
            <div>
              <strong>{user.name}</strong>
              <div style={{ fontSize: "12px", color: "#777" }}>
                {user.email}
              </div>
            </div>
          );
        }
      },
      {
        Header: "Created Date",
        id: "createdDate",
        Cell: ({ row }) => {
          return new Date(row.original.createdAt).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
        }
      },
      {
        id: 'select',
        disableSortBy: true,
        Header: () => (
          <input
            type="checkbox"
            checked={products.length > 0 && selectedProducts.length === products.length}
            onChange={handleSelectAll}
          />
        ),
        Cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedProducts.includes(row.original._id)}
            onChange={() => handleSelectProduct(row.original._id)}
          />
        )
      }
    ],
    [selectedProducts, products, categories]
  );

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <AdminHeader title="Products" />

        {createdByStats.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '18px'
            }}
          >
            {createdByStats.map((admin) => (
              <div
                key={admin.email || admin.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  background: '#fff',
                  border: '1px solid #ececf7',
                  borderRadius: '999px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#1e1b3a'
                }}
              >
                👤 {admin.name}
                <span style={{ color: '#6366f1', fontWeight: 700 }}>
                  {admin.totalProducts}
                </span>
              </div>
            ))}

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                title={searchTerm ? `Exports only products matching "${searchTerm}"` : 'Exports all products'}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e0dcf5',
                  background: '#fff',
                  color: '#4c3f8c',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: downloadingPdf ? 'not-allowed' : 'pointer',
                  opacity: downloadingPdf ? 0.7 : 1
                }}
              >
                {downloadingPdf
                  ? 'Preparing...'
                  : searchTerm
                    ? `📄 Download PDF (filtered: "${searchTerm}")`
                    : '📄 Download PDF'}
              </button>

              <button
                type="button"
                onClick={handleDownloadReport}
                disabled={downloadingReport}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: downloadingReport ? 'not-allowed' : 'pointer',
                  opacity: downloadingReport ? 0.7 : 1
                }}
              >
                {downloadingReport ? 'Preparing...' : '⬇ Download Report'}
              </button>
            </div>
          </div>
        )}

        <div className="apl-header">
          <div className="apl-header-actions">
            <form onSubmit={handleSearch} className="apl-search-form">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="apl-search-input"
              />
              <button type="submit" className="apl-search-btn">Search</button>
              <button
                className="apl-btn-add"
                onClick={() => navigate('/admin/products/new')}
              >
                Add Product
              </button>
              <button
                type="button"
                className="apl-btn-danger"
                onClick={handleDeleteSelected}
                disabled={!selectedProducts.length}
              >
                Delete Selected ({selectedProducts.length})
              </button>
            </form>

          </div>
        </div>

        {loading ? (
          <div>Loading products...</div>
        ) : (
          <Table
            key={currentPage}
            columns={columns}
            data={products}
            show={totalPages > 1}
            pagecount={{
              current_page: currentPage,
              last_page: totalPages,
            }}
            setPageno={(page) => {
              setCurrentPage(page);
              load(page, searchTerm);
            }}
            pageno={currentPage}
          />
        )}

        {(selectedTextileProduct || viewLoading) && (
          <div className="apl-drawer-backdrop" onClick={() => setSelectedTextileProduct(null)}>
            <aside className="apl-drawer" onClick={(event) => event.stopPropagation()}>
              <button className="apl-drawer-close" onClick={() => setSelectedTextileProduct(null)} title="Close"><FaTimes /></button>
              {viewLoading ? <p>Loading product details...</p> : (
                <>
                  <h2>{selectedTextileProduct.name}</h2>
                  <p className="apl-category-path">{[selectedTextileProduct.category, selectedTextileProduct.subCategory, selectedTextileProduct.productType, selectedTextileProduct.sleeveOrStyle].filter(Boolean).join(' / ')}</p>
                  <div className="apl-drawer-facts">
                    <div>
                      <strong>Material</strong>
                      <span>{selectedTextileProduct.material || 'N/A'}</span>
                    </div>
                    <div>
                      <strong>Brand</strong>
                      <span>{selectedTextileProduct.brand || 'N/A'}</span>
                    </div>
                    <div>
                      <strong>Color</strong>
                      <span>{selectedTextileProduct.colors?.join(', ') || selectedTextileProduct.color || 'N/A'}</span>
                    </div>
                    <div>
                      <strong>Status</strong>
                      <span>{selectedTextileProduct.status || 'N/A'}</span>
                    </div>
                  </div>

                  <h3>Stock by size</h3>
                  {(() => {
                    const { bySize, columns: drawerColumns } = getSizeMatrix(selectedTextileProduct.variants || []);
                    return (
                      <div className="apl-variant-wrap">
                        <table className="apl-variant-table apl-size-matrix">
                          <thead>
                            <tr>
                              <th>Size</th>
                              {drawerColumns.map((size) => (
                                <th key={size}>{size}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>Stock</td>
                              {drawerColumns.map((size) => (
                                <td key={size} className={bySize[size] && bySize[size].stockAvailable === 0 ? 'apl-stock-zero' : ''}>
                                  {bySize[size] ? bySize[size].stockAvailable : '-'}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductsPage;
