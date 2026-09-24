import React, { useEffect, useMemo, useState } from 'react';
import { AdminSidebar } from '../AdminDashboardPage';
import { getAllOrders } from '../../../services/orderService';
import formatPrice from '../../../utils/formatPrice';
import { Pie, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
} from 'chart.js';
import '../../../css/salesReport.css';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title
);

const PALETTE = ['#1B1F3B', '#FFC53D', '#2A5CAF', '#1F9D66', '#E23D5D', '#8b5cf6'];

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

const SalesReportPage = () => {
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [preset, setPreset] = useState('30d');
  const [range, setRange] = useState(rangeForPreset('30d'));

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const list = await getAllOrders({});
        setAllOrders(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Error loading orders for sales report:', err);
        setError('Could not load orders.');
        setAllOrders([]);
      } finally {
        setLoading(false);
      }
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

  const filtered = useMemo(() => {
    const fromTime = new Date(range.from).setHours(0, 0, 0, 0);
    const toTime = new Date(range.to).setHours(23, 59, 59, 999);
    return allOrders.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return t >= fromTime && t <= toTime;
    });
  }, [allOrders, range]);

  const stats = useMemo(() => {
    const live = filtered.filter((o) => o.status !== 'Cancelled');
    const cancelled = filtered.filter((o) => o.status === 'Cancelled');

    const revenue = live.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const paidRevenue = live.filter((o) => o.isPaid).reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const outstandingRevenue = revenue - paidRevenue;
    const lostRevenue = cancelled.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

    const orders = live.length;
    const avgOrderValue = orders ? revenue / orders : 0;

    const itemsSold = live.reduce((sum, o) => sum + (o.orderItems?.reduce((s, it) => s + (it.qty || 0), 0) || 0), 0);
    const taxCollected = live.reduce((sum, o) => sum + (o.taxPrice || 0), 0);
    const shippingCollected = live.reduce((sum, o) => sum + (o.shippingPrice || 0), 0);

    // revenue trend by day
    const trendMap = {};
    live.forEach((o) => {
      const day = new Date(o.createdAt).toISOString().slice(0, 10);
      trendMap[day] = (trendMap[day] || 0) + (o.totalPrice || 0);
    });
    const trend = Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));

    // revenue by payment method
    const paymentMap = {};
    live.forEach((o) => {
      const key = o.paymentMethod || 'Unknown';
      paymentMap[key] = (paymentMap[key] || 0) + (o.totalPrice || 0);
    });

    // top products by revenue
    const productMap = {};
    live.forEach((o) => {
      (o.orderItems || []).forEach((it) => {
        if (!productMap[it.name]) productMap[it.name] = { totalSold: 0, revenue: 0 };
        productMap[it.name].totalSold += it.qty || 0;
        productMap[it.name].revenue += (it.price || 0) * (it.qty || 0);
      });
    });
    const topProducts = Object.entries(productMap)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      revenue, paidRevenue, outstandingRevenue, lostRevenue,
      orders, avgOrderValue, itemsSold, taxCollected, shippingCollected,
      trend,
      paymentBreakdown: Object.entries(paymentMap).map(([method, revenue]) => ({ method, revenue })),
      topProducts,
    };
  }, [filtered]);

  const trendData = {
    labels: stats.trend.map((p) => p.date),
    datasets: [{
      label: 'Revenue',
      data: stats.trend.map((p) => p.revenue),
      borderColor: '#1B1F3B',
      backgroundColor: 'rgba(27, 31, 59, 0.08)',
      pointBackgroundColor: '#FFC53D',
      tension: 0.35,
      fill: true,
    }],
  };

  const paymentData = {
    labels: stats.paymentBreakdown.map((p) => p.method),
    datasets: [{ data: stats.paymentBreakdown.map((p) => p.revenue), backgroundColor: PALETTE, borderWidth: 1 }],
  };

  const topProductsData = {
    labels: stats.topProducts.map((p) => p.name),
    datasets: [{ label: 'Revenue', data: stats.topProducts.map((p) => p.revenue), backgroundColor: '#8b5cf6', borderRadius: 6 }],
  };

  const handleExportCsv = () => {
    const rows = [
      ['Date', 'Revenue'],
      ...stats.trend.map((p) => [p.date, p.revenue]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_report_${range.from}_to_${range.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div className="slr-header">
          <h1>Sales Report</h1>
          <button className="slr-export-btn" onClick={handleExportCsv} disabled={loading || !stats.trend.length}>
            Export CSV
          </button>
        </div>

        <div className="slr-filter-bar">
          <div className="slr-presets">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                className={`slr-preset-btn ${preset === p.key ? 'active' : ''}`}
                onClick={() => applyPreset(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="slr-date-inputs">
            <input type="date" value={range.from} max={range.to} onChange={(e) => handleCustomDate('from', e.target.value)} />
            <span>to</span>
            <input type="date" value={range.to} min={range.from} onChange={(e) => handleCustomDate('to', e.target.value)} />
          </div>
        </div>

        {error && <div className="slr-error">{error}</div>}

        {/* Summary cards */}
        <div className="slr-grid">
          <div className="slr-card slr-card-highlight">
            <h3>Revenue</h3>
            <p>{loading ? '—' : formatPrice(stats.revenue)}</p>
          </div>
          <div className="slr-card">
            <h3>Orders</h3>
            <p>{loading ? '—' : stats.orders}</p>
          </div>
          <div className="slr-card">
            <h3>Avg. order value</h3>
            <p>{loading ? '—' : formatPrice(stats.avgOrderValue)}</p>
          </div>
          <div className="slr-card">
            <h3>Items sold</h3>
            <p>{loading ? '—' : stats.itemsSold}</p>
          </div>
          <div className="slr-card slr-card-green">
            <h3>Collected</h3>
            <p>{loading ? '—' : formatPrice(stats.paidRevenue)}</p>
          </div>
          <div className="slr-card slr-card-amber">
            <h3>Outstanding</h3>
            <p>{loading ? '—' : formatPrice(stats.outstandingRevenue)}</p>
          </div>
          <div className="slr-card">
            <h3>Tax collected</h3>
            <p>{loading ? '—' : formatPrice(stats.taxCollected)}</p>
          </div>
          <div className="slr-card slr-card-coral">
            <h3>Lost to cancellations</h3>
            <p>{loading ? '—' : formatPrice(stats.lostRevenue)}</p>
          </div>
        </div>

        {/* Revenue trend */}
        <div className="slr-chart-container">
          <h3>Revenue trend</h3>
          {stats.trend.length === 0 && !loading ? (
            <p className="slr-empty">No revenue in this range.</p>
          ) : <Line data={trendData} />}
        </div>

        {/* Payment + Top products */}
        <div className="slr-charts-section">
          <div className="slr-chart-container">
            <h3>Revenue by payment method</h3>
            {stats.paymentBreakdown.length === 0 && !loading ? (
              <p className="slr-empty">No payment data.</p>
            ) : <center><Pie data={paymentData} className="slr-piechart" /></center>}
          </div>
          <div className="slr-chart-container">
            <h3>Top products by revenue</h3>
            {stats.topProducts.length === 0 && !loading ? (
              <p className="slr-empty">No product sales in this range.</p>
            ) : <Bar data={topProductsData} />}
          </div>
        </div>

        {/* Top products table */}
        <div className="slr-chart-container">
          <h3>Top 10 products</h3>
          {stats.topProducts.length === 0 && !loading ? (
            <p className="slr-empty">No product sales in this range.</p>
          ) : (
            <table className="slr-table">
              <thead>
                <tr><th>#</th><th>Product</th><th>Units sold</th><th>Revenue</th></tr>
              </thead>
              <tbody>
                {stats.topProducts.map((p, i) => (
                  <tr key={p.name}>
                    <td className="slr-muted-cell">{i + 1}</td>
                    <td>{p.name}</td>
                    <td>{p.totalSold}</td>
                    <td>{formatPrice(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesReportPage;
