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
import '../../../css/orderReport.css';

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

const STATUS_TONE = {
  Placed: 'slate',
  Processing: 'amber',
  Shipped: 'blue',
  Delivered: 'green',
  Cancelled: 'coral',
};

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
  if (preset === 'all') {
    return { from: '2000-01-01', to };
  }
  return { from: to, to };
};

const daysBetween = (a, b) => (new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24);

const formatDate = (v) => v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const OrderReportPage = () => {
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [preset, setPreset] = useState('30d');
  const [range, setRange] = useState(rangeForPreset('30d'));
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const list = await getAllOrders({});
        setAllOrders(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Error loading orders for report:', err);
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

  // ---- filter by date range ----
  const filtered = useMemo(() => {
    const fromTime = new Date(range.from).setHours(0, 0, 0, 0);
    const toTime = new Date(range.to).setHours(23, 59, 59, 999);
    return allOrders.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return t >= fromTime && t <= toTime;
    });
  }, [allOrders, range]);

  // ---- searched (for the detail table only) ----
  const searched = useMemo(() => {
    if (!search.trim()) return filtered;
    const q = search.trim().toLowerCase();
    return filtered.filter((o) =>
      o.orderId?.toLowerCase().includes(q) ||
      o.user?.email?.toLowerCase().includes(q) ||
      o.user?.name?.toLowerCase().includes(q) ||
      o.shippingAddress?.fullName?.toLowerCase().includes(q)
    );
  }, [filtered, search]);

  // ---- aggregates ----
  const stats = useMemo(() => {
    const total = filtered.length;
    const delivered = filtered.filter((o) => o.isDelivered).length;
    const cancelled = filtered.filter((o) => o.status === 'Cancelled').length;
    const inProgress = total - delivered - cancelled;
    const paid = filtered.filter((o) => o.isPaid).length;
    const revenue = filtered.reduce((sum, o) => sum + (o.status !== 'Cancelled' ? o.totalPrice || 0 : 0), 0);
    const avgOrderValue = total ? revenue / (total - cancelled || 1) : 0;

    const deliveryDurations = filtered
      .filter((o) => o.isDelivered && o.deliveredAt)
      .map((o) => daysBetween(o.createdAt, o.deliveredAt));
    const avgDeliveryDays = deliveryDurations.length
      ? (deliveryDurations.reduce((a, b) => a + b, 0) / deliveryDurations.length)
      : 0;

    const statusMap = {};
    filtered.forEach((o) => { statusMap[o.status || 'Unknown'] = (statusMap[o.status || 'Unknown'] || 0) + 1; });

    const paymentMap = {};
    filtered.forEach((o) => {
      const key = o.paymentMethod || 'Unknown';
      if (!paymentMap[key]) paymentMap[key] = { count: 0, revenue: 0 };
      paymentMap[key].count += 1;
      paymentMap[key].revenue += o.totalPrice || 0;
    });

    const reasonMap = {};
    filtered.filter((o) => o.status === 'Cancelled' && o.cancelReason).forEach((o) => {
      reasonMap[o.cancelReason] = (reasonMap[o.cancelReason] || 0) + 1;
    });

    const trendMap = {};
    filtered.forEach((o) => {
      const day = new Date(o.createdAt).toISOString().slice(0, 10);
      if (!trendMap[day]) trendMap[day] = { orders: 0, revenue: 0 };
      trendMap[day].orders += 1;
      if (o.status !== 'Cancelled') trendMap[day].revenue += o.totalPrice || 0;
    });
    const trend = Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));

    return {
      total, delivered, cancelled, inProgress, paid,
      revenue, avgOrderValue, avgDeliveryDays,
      statusBreakdown: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
      paymentBreakdown: Object.entries(paymentMap).map(([method, v]) => ({ method, ...v })),
      cancellationReasons: Object.entries(reasonMap).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count),
      trend,
    };
  }, [filtered]);

  const trendData = {
    labels: stats.trend.map((p) => p.date),
    datasets: [{
      label: 'Orders',
      data: stats.trend.map((p) => p.orders),
      borderColor: '#1B1F3B',
      backgroundColor: 'rgba(27, 31, 59, 0.08)',
      pointBackgroundColor: '#FFC53D',
      tension: 0.35,
      fill: true,
    }],
  };

  const statusData = {
    labels: stats.statusBreakdown.map((s) => s.status),
    datasets: [{ data: stats.statusBreakdown.map((s) => s.count), backgroundColor: PALETTE, borderWidth: 1 }],
  };

  const paymentData = {
    labels: stats.paymentBreakdown.map((p) => p.method),
    datasets: [{ label: 'Orders', data: stats.paymentBreakdown.map((p) => p.count), backgroundColor: '#2A5CAF', borderRadius: 6 }],
  };

  const maxReason = Math.max(1, ...stats.cancellationReasons.map((r) => r.count));

  const handleExportCsv = () => {
    const rows = [
      ['Order ID', 'Customer', 'Email', 'Items', 'Total', 'Payment', 'Paid', 'Status', 'Placed', 'Delivered'],
      ...searched.map((o) => [
        o.orderId,
        o.user?.name || o.shippingAddress?.fullName || 'Guest',
        o.user?.email || '',
        o.orderItems?.reduce((sum, it) => sum + it.qty, 0) || 0,
        o.totalPrice,
        o.paymentMethod,
        o.isPaid ? 'Yes' : 'No',
        o.status,
        formatDate(o.createdAt),
        formatDate(o.deliveredAt),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order_report_${range.from}_to_${range.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div className="orp-header">
          <h1>Order Report</h1>
          <button className="orp-export-btn" onClick={handleExportCsv} disabled={loading || !searched.length}>
            Export CSV
          </button>
        </div>

        <div className="orp-filter-bar">
          <div className="orp-presets">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                className={`orp-preset-btn ${preset === p.key ? 'active' : ''}`}
                onClick={() => applyPreset(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="orp-date-inputs">
            <input type="date" value={range.from} max={range.to} onChange={(e) => handleCustomDate('from', e.target.value)} />
            <span>to</span>
            <input type="date" value={range.to} min={range.from} onChange={(e) => handleCustomDate('to', e.target.value)} />
          </div>
        </div>

        {error && <div className="orp-error">{error}</div>}

        {/* Summary cards */}
        <div className="orp-grid">
          <div className="orp-card">
            <h3>Total orders</h3>
            <p>{loading ? '—' : stats.total}</p>
          </div>
          <div className="orp-card orp-card-green">
            <h3>Delivered</h3>
            <p>{loading ? '—' : stats.delivered}</p>
          </div>
          <div className="orp-card orp-card-amber">
            <h3>In progress</h3>
            <p>{loading ? '—' : stats.inProgress}</p>
          </div>
          <div className="orp-card orp-card-coral">
            <h3>Cancelled</h3>
            <p>{loading ? '—' : stats.cancelled}</p>
          </div>
          <div className="orp-card">
            <h3>Revenue</h3>
            <p>{loading ? '—' : formatPrice(stats.revenue)}</p>
          </div>
          <div className="orp-card">
            <h3>Avg. order value</h3>
            <p>{loading ? '—' : formatPrice(stats.avgOrderValue)}</p>
          </div>
          <div className="orp-card">
            <h3>Avg. delivery time</h3>
            <p>{loading ? '—' : `${stats.avgDeliveryDays.toFixed(1)}d`}</p>
          </div>
          <div className="orp-card">
            <h3>Paid orders</h3>
            <p>{loading ? '—' : `${stats.paid}/${stats.total}`}</p>
          </div>
        </div>

        {/* Trend */}
        <div className="orp-chart-container">
          <h3>Orders trend</h3>
          {stats.trend.length === 0 && !loading ? (
            <p className="orp-empty">No orders in this range.</p>
          ) : <Line data={trendData} />}
        </div>

        {/* Status + Payment */}
        <div className="orp-charts-section">
          <div className="orp-chart-container">
            <h3>Status mix</h3>
            {stats.statusBreakdown.length === 0 && !loading ? (
              <p className="orp-empty">No orders in this range.</p>
            ) : <center><Pie data={statusData} className="orp-piechart" /></center>}
          </div>
          <div className="orp-chart-container">
            <h3>Payment methods</h3>
            {stats.paymentBreakdown.length === 0 && !loading ? (
              <p className="orp-empty">No payment data.</p>
            ) : <Bar data={paymentData} />}
          </div>
        </div>

        {/* Cancellation reasons */}
        <div className="orp-chart-container">
          <h3>Cancellation reasons</h3>
          {stats.cancellationReasons.length === 0 && !loading ? (
            <p className="orp-empty">No cancellations in this range.</p>
          ) : (
            <div className="orp-reason-list">
              {stats.cancellationReasons.map((r) => (
                <div className="orp-reason-row" key={r.reason}>
                  <span className="orp-reason-label">{r.reason}</span>
                  <div className="orp-reason-bar-track">
                    <div className="orp-reason-bar-fill" style={{ width: `${(r.count / maxReason) * 100}%` }} />
                  </div>
                  <span className="orp-reason-count">{r.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Full order detail table */}
        <div className="orp-chart-container">
          <div className="orp-table-header">
            <h3>All orders in range ({searched.length})</h3>
            <input
              type="text"
              placeholder="Search order ID, name, email…"
              className="orp-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {searched.length === 0 && !loading ? (
            <p className="orp-empty">No orders match.</p>
          ) : (
            <div className="orp-table-scroll">
              <table className="orp-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Placed</th>
                    <th>Delivered</th>
                  </tr>
                </thead>
                <tbody>
                  {searched.map((o) => {
                    const tone = STATUS_TONE[o.status] || 'slate';
                    const qty = o.orderItems?.reduce((sum, it) => sum + it.qty, 0) || 0;
                    return (
                      <tr key={o._id}>
                        <td className="orp-mono">{o.orderId}</td>
                        <td>
                          <div className="orp-customer-cell">
                            <span>{o.user?.name || o.shippingAddress?.fullName || 'Guest'}</span>
                            <span className="orp-muted-cell">{o.user?.email || o.shippingAddress?.phone || '—'}</span>
                          </div>
                        </td>
                        <td>{qty}</td>
                        <td>{formatPrice(o.totalPrice)}</td>
                        <td>
                          {o.paymentMethod} · <span className={o.isPaid ? 'orp-paid-yes' : 'orp-paid-no'}>{o.isPaid ? 'Paid' : 'Unpaid'}</span>
                        </td>
                        <td><span className={`orp-pill orp-pill-${tone}`}>{o.status}</span></td>
                        <td>{formatDate(o.createdAt)}</td>
                        <td>{formatDate(o.deliveredAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderReportPage;
