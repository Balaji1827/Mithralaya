import React, { useEffect, useMemo, useState } from 'react';
import { AdminSidebar } from '../AdminDashboardPage';
import { getAllOrders } from '../../../services/orderService';
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
import '../../../css/customerReport.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const PALETTE = ['#1B1F3B', '#FFC53D', '#2A5CAF', '#1F9D66', '#E23D5D', '#8b5cf6'];

// "Existing customer, no activity" window — a registered customer whose
// most recent order is older than this counts as inactive/lapsed. This is
// independent of the date-range filter above, since it's about lifetime
// order history, not orders within the selected window.
const INACTIVITY_DAYS = 30;

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

// Identity key for grouping — registered customers group by user id;
// guests (no user) group by shipping phone, since that's the closest
// thing to a stable identifier we have for a non-account checkout.
const customerKey = (o) => o.user?._id || `guest:${o.shippingAddress?.phone || o._id}`;

const formatDate = (t) => new Date(t).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const daysSince = (t) => Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24));

const CustomerReportPage = () => {
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
        console.error('Error loading orders for customer report:', err);
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

  // non-cancelled orders only, across all history — used to establish each
  // customer's first-ever order date regardless of the selected range
  const liveOrders = useMemo(
    () => allOrders.filter((o) => o.status !== 'Cancelled'),
    [allOrders]
  );

  const firstOrderDateByCustomer = useMemo(() => {
    const map = new Map();
    liveOrders.forEach((o) => {
      const key = customerKey(o);
      const t = new Date(o.createdAt).getTime();
      if (!map.has(key) || t < map.get(key)) map.set(key, t);
    });
    return map;
  }, [liveOrders]);

  // Lifetime record per customer, built from ALL history regardless of the
  // date-range filter — this is what "existing customer, no activity in
  // 30 days" needs, since it's about how long it's been since their last
  // order, not whether they ordered inside the currently selected window.
  const lifetimeCustomers = useMemo(() => {
    const map = new Map();
    liveOrders.forEach((o) => {
      const key = customerKey(o);
      const t = new Date(o.createdAt).getTime();
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: o.user?.name || o.shippingAddress?.fullName || 'Guest',
          email: o.user?.email || '',
          phone: o.shippingAddress?.phone || '',
          isGuest: !o.user,
          lifetimeOrders: 0,
          lifetimeSpent: 0,
          lastOrderAt: t,
        });
      }
      const c = map.get(key);
      c.lifetimeOrders += 1;
      c.lifetimeSpent += o.totalPrice || 0;
      if (t > c.lastOrderAt) c.lastOrderAt = t;
    });
    return [...map.values()];
  }, [liveOrders]);

  const inactiveCustomers = useMemo(() => {
    const cutoff = Date.now() - INACTIVITY_DAYS * 24 * 60 * 60 * 1000;
    return lifetimeCustomers
      .filter((c) => !c.isGuest && c.lastOrderAt < cutoff)
      .sort((a, b) => a.lastOrderAt - b.lastOrderAt); // most lapsed first
  }, [lifetimeCustomers]);

  const filtered = useMemo(() => {
    const fromTime = new Date(range.from).setHours(0, 0, 0, 0);
    const toTime = new Date(range.to).setHours(23, 59, 59, 999);
    return liveOrders.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return t >= fromTime && t <= toTime;
    });
  }, [liveOrders, range]);

  const stats = useMemo(() => {
    const fromTime = new Date(range.from).setHours(0, 0, 0, 0);

    const customerMap = new Map();
    filtered.forEach((o) => {
      const key = customerKey(o);
      const isGuest = !o.user;
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          key,
          name: o.user?.name || o.shippingAddress?.fullName || 'Guest',
          email: o.user?.email || '',
          isGuest,
          orders: 0,
          totalSpent: 0,
        });
      }
      const c = customerMap.get(key);
      c.orders += 1;
      c.totalSpent += o.totalPrice || 0;
    });

    const customers = [...customerMap.values()];
    const registered = customers.filter((c) => !c.isGuest);
    const guests = customers.filter((c) => c.isGuest);

    const newCustomers = registered.filter((c) => {
      const first = firstOrderDateByCustomer.get(c.key);
      return first >= fromTime;
    });
    const returningCustomers = registered.filter((c) => {
      const first = firstOrderDateByCustomer.get(c.key);
      return first < fromTime;
    });

    const guestOrders = filtered.filter((o) => !o.user).length;
    const revenue = filtered.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

    const topCustomers = [...customers]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return {
      totalCustomers: customers.length,
      registeredCount: registered.length,
      guestCount: guests.length,
      newCount: newCustomers.length,
      returningCount: returningCustomers.length,
      guestOrders,
      revenue,
      avgSpendPerCustomer: customers.length ? revenue / customers.length : 0,
      topCustomers,
      typeBreakdown: [
        { type: 'New', count: newCustomers.length },
        { type: 'Returning', count: returningCustomers.length },
        { type: 'Guest', count: guests.length },
      ].filter((t) => t.count > 0),
    };
  }, [filtered, firstOrderDateByCustomer, range]);

  const typeData = {
    labels: stats.typeBreakdown.map((t) => t.type),
    datasets: [{ data: stats.typeBreakdown.map((t) => t.count), backgroundColor: PALETTE, borderWidth: 1 }],
  };

  const topCustomersData = {
    labels: stats.topCustomers.map((c) => c.name),
    datasets: [{ label: 'Total spent', data: stats.topCustomers.map((c) => c.totalSpent), backgroundColor: '#2A5CAF', borderRadius: 6 }],
  };

  const handleExportCsv = () => {
    const rows = [
      ['Name', 'Email', 'Type', 'Orders', 'Total spent'],
      ...stats.topCustomers.map((c) => [
        c.name, c.email, c.isGuest ? 'Guest' : 'Registered', c.orders, c.totalSpent,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer_report_${range.from}_to_${range.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportInactiveCsv = () => {
    const rows = [
      ['Name', 'Email', 'Phone', 'Last order date', 'Days inactive', 'Lifetime orders', 'Lifetime spent'],
      ...inactiveCustomers.map((c) => [
        c.name, c.email, c.phone, formatDate(c.lastOrderAt), daysSince(c.lastOrderAt), c.lifetimeOrders, c.lifetimeSpent,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inactive_customers_${INACTIVITY_DAYS}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div className="cst-header">
          <h1>Customer Report</h1>
          <button className="cst-export-btn" onClick={handleExportCsv} disabled={loading || !stats.topCustomers.length}>
            Export CSV
          </button>
        </div>

        <div className="cst-filter-bar">
          <div className="cst-presets">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                className={`cst-preset-btn ${preset === p.key ? 'active' : ''}`}
                onClick={() => applyPreset(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="cst-date-inputs">
            <input type="date" value={range.from} max={range.to} onChange={(e) => handleCustomDate('from', e.target.value)} />
            <span>to</span>
            <input type="date" value={range.to} min={range.from} onChange={(e) => handleCustomDate('to', e.target.value)} />
          </div>
        </div>

        {error && <div className="cst-error">{error}</div>}

        {/* Summary cards */}
        <div className="cst-grid">
          <div className="cst-card">
            <h3>Total customers</h3>
            <p>{loading ? '—' : stats.totalCustomers}</p>
          </div>
          <div className="cst-card cst-card-green">
            <h3>New</h3>
            <p>{loading ? '—' : stats.newCount}</p>
          </div>
          <div className="cst-card cst-card-blue">
            <h3>Returning</h3>
            <p>{loading ? '—' : stats.returningCount}</p>
          </div>
          <div className="cst-card">
            <h3>Guest orders</h3>
            <p>{loading ? '—' : stats.guestOrders}</p>
          </div>
          <div className="cst-card">
            <h3>Revenue</h3>
            <p>{loading ? '—' : formatPrice(stats.revenue)}</p>
          </div>
          <div className="cst-card">
            <h3>Avg. spend / customer</h3>
            <p>{loading ? '—' : formatPrice(stats.avgSpendPerCustomer)}</p>
          </div>
          <div className="cst-card cst-card-coral">
            <h3>Inactive {INACTIVITY_DAYS}+ days</h3>
            <p>{loading ? '—' : inactiveCustomers.length}</p>
          </div>
        </div>

        {/* Customer mix + Top customers chart */}
        <div className="cst-charts-section">
          <div className="cst-chart-container">
            <h3>Customer mix</h3>
            {stats.typeBreakdown.length === 0 && !loading ? (
              <p className="cst-empty">No customers in this range.</p>
            ) : <center><Pie data={typeData} className="cst-piechart" /></center>}
          </div>
          <div className="cst-chart-container">
            <h3>Top customers by spend</h3>
            {stats.topCustomers.length === 0 && !loading ? (
              <p className="cst-empty">No customers in this range.</p>
            ) : <Bar data={topCustomersData} />}
          </div>
        </div>

        {/* Top customers table */}
        <div className="cst-chart-container">
          <h3>Top 10 customers</h3>
          {stats.topCustomers.length === 0 && !loading ? (
            <p className="cst-empty">No customers in this range.</p>
          ) : (
            <table className="cst-table">
              <thead>
                <tr><th>#</th><th>Name</th><th>Email</th><th>Type</th><th>Orders</th><th>Total spent</th></tr>
              </thead>
              <tbody>
                {stats.topCustomers.map((c, i) => (
                  <tr key={c.key}>
                    <td className="cst-muted-cell">{i + 1}</td>
                    <td>{c.name}</td>
                    <td className="cst-muted-cell">{c.email || '—'}</td>
                    <td>
                      <span className={`cst-pill ${c.isGuest ? 'cst-pill-slate' : 'cst-pill-blue'}`}>
                        {c.isGuest ? 'Guest' : 'Registered'}
                      </span>
                    </td>
                    <td>{c.orders}</td>
                    <td>{formatPrice(c.totalSpent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Existing customers with no orders in the inactivity window —
            lifetime-based, not affected by the date-range filter above */}
        <div className="cst-chart-container">
          <div className="cst-table-header">
            <h3>Existing customers, no activity in {INACTIVITY_DAYS}+ days ({inactiveCustomers.length})</h3>
            <button className="cst-export-btn" onClick={handleExportInactiveCsv} disabled={loading || !inactiveCustomers.length}>
              Export CSV
            </button>
          </div>
          {inactiveCustomers.length === 0 && !loading ? (
            <p className="cst-empty">No lapsed customers — everyone with an account has ordered within the last {INACTIVITY_DAYS} days.</p>
          ) : (
            <div className="cst-table-scroll">
              <table className="cst-table">
                <thead>
                  <tr>
                    <th>Name</th><th>Email</th><th>Last order</th><th>Days inactive</th><th>Lifetime orders</th><th>Lifetime spent</th>
                  </tr>
                </thead>
                <tbody>
                  {inactiveCustomers.map((c) => (
                    <tr key={c.key}>
                      <td>{c.name}</td>
                      <td className="cst-muted-cell">{c.email || '—'}</td>
                      <td>{formatDate(c.lastOrderAt)}</td>
                      <td className="cst-days-inactive">{daysSince(c.lastOrderAt)}d</td>
                      <td>{c.lifetimeOrders}</td>
                      <td>{formatPrice(c.lifetimeSpent)}</td>
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

export default CustomerReportPage;
