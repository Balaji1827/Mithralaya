import React, { useEffect, useMemo, useState } from 'react';
import { AdminSidebar } from '../AdminDashboardPage';
import { getAllOrders } from '../../../services/orderService';
import { getTextileProducts } from '../../../services/productService';
import formatPrice from '../../../utils/formatPrice';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import '../../../css/productReport.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const PALETTE = ['#1B1F3B', '#FFC53D', '#2A5CAF', '#1F9D66', '#E23D5D', '#8b5cf6'];
const LOW_STOCK_THRESHOLD = 5;

const toISODate = (d) => d.toISOString().slice(0, 10);

const PRESETS = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: 'month', label: 'This month' },
  { key: 'all', label: 'All time' },
  { key: 'custom', label: 'Custom' },
];

const rangeForPreset = (preset) => {
  const today = new Date();
  const to = toISODate(today);
  if (preset === '7d') {
    const from = new Date(today); from.setDate(from.getDate() - 6);
    return { from: toISODate(from), to };
  }
  if (preset === '30d') {
    const from = new Date(today); from.setDate(from.getDate() - 29);
    return { from: toISODate(from), to };
  }
  if (preset === 'month') {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: toISODate(from), to };
  }
  if (preset === 'all') return { from: '2000-01-01', to };
  return { from: to, to };
};

// stock is already aggregated server-side onto product.stock (see
// listTextileProducts), no need to sum variants ourselves

const ProductReportPage = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [productsError, setProductsError] = useState('');
  const [preset, setPreset] = useState('30d');
  const [range, setRange] = useState(rangeForPreset('30d'));

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      setProductsError('');
      try {
        const orderList = await getAllOrders({});
        setOrders(Array.isArray(orderList) ? orderList : []);
      } catch (err) {
        console.error('Error loading orders for product report:', err);
        setError('Could not load sales data.');
        setOrders([]);
      }
      try {
        const res = await getTextileProducts({ limit: 1000 });
        setProducts(Array.isArray(res?.products) ? res.products : []);
      } catch (err) {
        console.error('Error loading product catalog:', err);
        setProductsError('Could not load the product catalog — stock and category data will be empty.');
        setProducts([]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const applyPreset = (key) => {
    setPreset(key);
    if (key !== 'custom') setRange(rangeForPreset(key));
  };

  const handleCustomDate = (field, value) => {
    setPreset('custom');
    setRange((prev) => ({ ...prev, [field]: value }));
  };

  const filteredOrders = useMemo(() => {
    const fromTime = new Date(range.from).setHours(0, 0, 0, 0);
    const toTime = new Date(range.to).setHours(23, 59, 59, 999);
    return orders.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return t >= fromTime && t <= toTime && o.status !== 'Cancelled';
    });
  }, [orders, range]);

  const stats = useMemo(() => {
    // sales aggregation from order items
    const salesMap = {};
    filteredOrders.forEach((o) => {
      (o.orderItems || []).forEach((it) => {
        if (!salesMap[it.name]) salesMap[it.name] = { totalSold: 0, revenue: 0 };
        salesMap[it.name].totalSold += it.qty || 0;
        salesMap[it.name].revenue += (it.price || 0) * (it.qty || 0);
      });
    });

    const soldEntries = Object.entries(salesMap).map(([name, v]) => ({ name, ...v }));
    const topSellers = [...soldEntries].sort((a, b) => b.totalSold - a.totalSold).slice(0, 10);
    const lowSellers = [...soldEntries].sort((a, b) => a.totalSold - b.totalSold).slice(0, 10);

    const unitsSold = soldEntries.reduce((sum, p) => sum + p.totalSold, 0);
    const revenue = soldEntries.reduce((sum, p) => sum + p.revenue, 0);

    // catalog-side stats
    const totalProducts = products.length;
    const stockLevels = products.map((p) => ({
      name: p.name,
      category: p.subCategory || p.category || 'Uncategorized',
      stock: p.stock || 0,
    }));
    const outOfStock = stockLevels.filter((p) => p.stock === 0);
    const lowStock = stockLevels.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD);
    const inStock = stockLevels.filter((p) => p.stock > LOW_STOCK_THRESHOLD);

    const soldNames = new Set(Object.keys(salesMap));
    const neverSold = products
      .filter((p) => !soldNames.has(p.name))
      .map((p) => ({ name: p.name, category: p.subCategory || p.category || 'Uncategorized', stock: p.stock || 0 }));

    const categoryMap = {};
    products.forEach((p) => {
      const cat = p.subCategory || p.category || 'Uncategorized';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    return {
      topSellers, lowSellers, unitsSold, revenue,
      totalProducts, outOfStock, lowStock, inStock, neverSold,
      stockLevels: stockLevels.sort((a, b) => a.stock - b.stock),
      categoryBreakdown: Object.entries(categoryMap).map(([category, count]) => ({ category, count })),
    };
  }, [filteredOrders, products]);

  const topSellersData = {
    labels: stats.topSellers.map((p) => p.name),
    datasets: [{ label: 'Units sold', data: stats.topSellers.map((p) => p.totalSold), backgroundColor: '#1F9D66', borderRadius: 6 }],
  };

  const lowSellersData = {
    labels: stats.lowSellers.map((p) => p.name),
    datasets: [{ label: 'Units sold', data: stats.lowSellers.map((p) => p.totalSold), backgroundColor: '#E23D5D', borderRadius: 6 }],
  };

  const categoryData = {
    labels: stats.categoryBreakdown.map((c) => c.category),
    datasets: [{ data: stats.categoryBreakdown.map((c) => c.count), backgroundColor: PALETTE, borderWidth: 1 }],
  };

  const handleExportCsv = () => {
    const rows = [
      ['Product', 'Category', 'Stock', 'Units sold (range)', 'Revenue (range)'],
      ...stats.stockLevels.map((p) => {
        const sold = [...stats.topSellers, ...stats.lowSellers].find((s) => s.name === p.name);
        return [p.name, p.category, p.stock, sold?.totalSold || 0, sold?.revenue || 0];
      }),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product_report_${range.from}_to_${range.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div className="pdr-header">
          <h1>Product Report</h1>
          <button className="pdr-export-btn" onClick={handleExportCsv} disabled={loading}>
            Export CSV
          </button>
        </div>

        <div className="pdr-filter-bar">
          <div className="pdr-presets">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                className={`pdr-preset-btn ${preset === p.key ? 'active' : ''}`}
                onClick={() => applyPreset(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="pdr-date-inputs">
            <input type="date" value={range.from} max={range.to} onChange={(e) => handleCustomDate('from', e.target.value)} />
            <span>to</span>
            <input type="date" value={range.to} min={range.from} onChange={(e) => handleCustomDate('to', e.target.value)} />
          </div>
        </div>

        {error && <div className="pdr-error">{error}</div>}
        {productsError && <div className="pdr-error pdr-error-warn">{productsError}</div>}

        {/* Summary cards */}
        <div className="pdr-grid">
          <div className="pdr-card">
            <h3>Catalog size</h3>
            <p>{loading ? '—' : stats.totalProducts}</p>
          </div>
          <div className="pdr-card">
            <h3>Units sold</h3>
            <p>{loading ? '—' : stats.unitsSold}</p>
          </div>
          <div className="pdr-card">
            <h3>Revenue</h3>
            <p>{loading ? '—' : formatPrice(stats.revenue)}</p>
          </div>
          <div className="pdr-card pdr-card-amber">
            <h3>Low stock (≤{LOW_STOCK_THRESHOLD})</h3>
            <p>{loading ? '—' : stats.lowStock.length}</p>
          </div>
          <div className="pdr-card pdr-card-coral">
            <h3>Out of stock</h3>
            <p>{loading ? '—' : stats.outOfStock.length}</p>
          </div>
          <div className="pdr-card">
            <h3>Never sold (range)</h3>
            <p>{loading ? '—' : stats.neverSold.length}</p>
          </div>
        </div>

        {/* Top / Low sellers */}
        <div className="pdr-charts-section">
          <div className="pdr-chart-container">
            <h3>Top selling products</h3>
            {stats.topSellers.length === 0 && !loading ? (
              <p className="pdr-empty">No sales in this range.</p>
            ) : <Bar data={topSellersData} />}
          </div>
          <div className="pdr-chart-container">
            <h3>Lowest selling products</h3>
            {stats.lowSellers.length === 0 && !loading ? (
              <p className="pdr-empty">No sales in this range.</p>
            ) : <Bar data={lowSellersData} />}
          </div>
        </div>

        {/* Category mix */}
        <div className="pdr-chart-container">
          <h3>Category mix</h3>
          {stats.categoryBreakdown.length === 0 && !loading ? (
            <p className="pdr-empty">No category data available.</p>
          ) : <center><Pie data={categoryData} className="pdr-piechart" /></center>}
        </div>

        {/* Never sold */}
        {stats.neverSold.length > 0 && (
          <div className="pdr-chart-container">
            <h3>Never sold in this range ({stats.neverSold.length})</h3>
            <table className="pdr-table">
              <thead><tr><th>Product</th><th>Category</th><th>Stock</th></tr></thead>
              <tbody>
                {stats.neverSold.slice(0, 20).map((p) => (
                  <tr key={p.name}>
                    <td>{p.name}</td>
                    <td className="pdr-muted-cell">{p.category}</td>
                    <td className={p.stock === 0 ? 'pdr-stock-critical' : ''}>{p.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Full stock table */}
        <div className="pdr-chart-container">
          <h3>Overall product stock ({stats.stockLevels.length})</h3>
          {stats.stockLevels.length === 0 && !loading ? (
            <p className="pdr-empty">No product catalog data available.</p>
          ) : (
            <div className="pdr-table-scroll">
              <table className="pdr-table">
                <thead>
                  <tr><th>Product</th><th>Category</th><th>Stock</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {stats.stockLevels.map((p) => (
                    <tr key={p.name}>
                      <td>{p.name}</td>
                      <td className="pdr-muted-cell">{p.category}</td>
                      <td className={p.stock === 0 ? 'pdr-stock-critical' : p.stock <= LOW_STOCK_THRESHOLD ? 'pdr-stock-low' : ''}>{p.stock}</td>
                      <td>
                        {p.stock === 0 ? (
                          <span className="pdr-pill pdr-pill-coral">Out of stock</span>
                        ) : p.stock <= LOW_STOCK_THRESHOLD ? (
                          <span className="pdr-pill pdr-pill-amber">Low stock</span>
                        ) : (
                          <span className="pdr-pill pdr-pill-green">In stock</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductReportPage;
