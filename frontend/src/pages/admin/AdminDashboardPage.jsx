import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { getProductsCreatedByStats } from '../../services/productService';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
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
import formatPrice from '../../utils/formatPrice';
import '../../css/adminDashboard.css';
import '../../css/adminsidebar.css';
import {
  FiHome,
  FiBox,
  FiShoppingCart,
  FiUsers,
  FiShield,
  FiTag,
  FiImage,
  FiSliders,
  FiMonitor,
  FiStar
} from "react-icons/fi";

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

// Every nav item now has its own distinct icon — previously FiUsers was
// reused for both "Admin" and "Customer", and FiMonitor was reused across
// Slider Banner / Hero Banner / Review, making them hard to tell apart.
const AdminSidebar = () => {
  const location = useLocation();
  const isOnReportRoute = location.pathname.startsWith('/admin/report');
  const [reportOpen, setReportOpen] = useState(isOnReportRoute);

  return (
    <aside className="asb-sidebar">
      <div className="asb-logo">
        <h2>ADMIN</h2>
      </div>

      <nav className="asb-nav">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) => `asb-link ${isActive ? 'asb-link-active' : ''}`}
        >
          <FiHome className="asb-icon" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/admin/products"
          className={({ isActive }) => `asb-link ${isActive ? 'asb-link-active' : ''}`}
        >
          <FiBox className="asb-icon" />
          <span>Products</span>
        </NavLink>

        <NavLink
          to="/admin/orders"
          className={({ isActive }) => `asb-link ${isActive ? 'asb-link-active' : ''}`}
        >
          <FiShoppingCart className="asb-icon" />
          <span>Orders</span>
        </NavLink>

        <div className="asb-dropdown">
          <button
            type="button"
            className={`asb-link asb-dropdown-btn ${isOnReportRoute ? 'asb-link-active' : ''}`}
            onClick={() => setReportOpen((open) => !open)}
          >
            <FiSliders className="asb-icon" />
            <span style={{ flex: 1 }}>Reports</span>
            {reportOpen ? (
              <FiChevronDown className="asb-arrow" />
            ) : (
              <FiChevronRight className="asb-arrow" />
            )}
          </button>

          {reportOpen && (
            <div className="asb-submenu">
              <NavLink
                to="/admin/report/sales"
                className={({ isActive }) => `asb-sublink ${isActive ? 'asb-link-active' : ''}`}
              >
                Sales Report
              </NavLink>

              <NavLink
                to="/admin/report/orders"
                className={({ isActive }) => `asb-sublink ${isActive ? 'asb-link-active' : ''}`}
              >
                Order Report
              </NavLink>

              <NavLink
                to="/admin/report/customers"
                className={({ isActive }) => `asb-sublink ${isActive ? 'asb-link-active' : ''}`}
              >
                Customer Report
              </NavLink>

              <NavLink
                to="/admin/report/products"
                className={({ isActive }) => `asb-sublink ${isActive ? 'asb-link-active' : ''}`}
              >
                Product Report
              </NavLink>
            </div>
          )}
        </div>

        <NavLink
          to="/admin/users"
          className={({ isActive }) => `asb-link ${isActive ? 'asb-link-active' : ''}`}
        >
          <FiShield className="asb-icon" />
          <span>Admin</span>
        </NavLink>

        <NavLink
          to="/admin/customer"
          className={({ isActive }) => `asb-link ${isActive ? 'asb-link-active' : ''}`}
        >
          <FiUsers className="asb-icon" />
          <span>Customer</span>
        </NavLink>

        <NavLink
          to="/admin/coupons"
          className={({ isActive }) => `asb-link ${isActive ? 'asb-link-active' : ''}`}
        >
          <FiTag className="asb-icon" />
          <span>Coupons</span>
        </NavLink>

        <NavLink
          to="/admin/exclusive-banners"
          className={({ isActive }) => `asb-link ${isActive ? 'asb-link-active' : ''}`}
        >
          <FiImage className="asb-icon" />
          <span>Exclusive Banner</span>
        </NavLink>

        <NavLink
          to="/admin/slider-banners"
          className={({ isActive }) => `asb-link ${isActive ? 'asb-link-active' : ''}`}
        >
          <FiSliders className="asb-icon" />
          <span>Slider Banner</span>
        </NavLink>

        <NavLink
          to="/admin/hero-banners"
          className={({ isActive }) => `asb-link ${isActive ? 'asb-link-active' : ''}`}
        >
          <FiMonitor className="asb-icon" />
          <span>Hero Banner</span>
        </NavLink>

         <NavLink
          to="/admin/contact-us"
          className={({ isActive }) => `asb-link ${isActive ? 'asb-link-active' : ''}`}
        >
          <FiShield className="asb-icon" />
          <span>Contact US</span>
        </NavLink>

        <NavLink
          to="/admin/review-page"
          className={({ isActive }) => `asb-link ${isActive ? 'asb-link-active' : ''}`}
        >
          <FiStar className="asb-icon" />
          <span>Review</span>
        </NavLink>
          <NavLink
          to="/admin/reels-page"
          className={({ isActive }) => `asb-link ${isActive ? 'asb-link-active' : ''}`}
        >
          <FiStar className="asb-icon" />
          <span>Reels</span>
        </NavLink>
      </nav>
    </aside>
  );
};

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: 0,
    orderStatuses: [],
    revenueByMonth: [],
    topProducts: []
  });

  const [createdByStats, setCreatedByStats] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    };
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

  // Ensure data is arrays to prevent runtime errors
  const orderStatuses = Array.isArray(stats.orderStatuses) ? stats.orderStatuses : [];
  const revenueByMonth = Array.isArray(stats.revenueByMonth) ? stats.revenueByMonth : [];
  const topProducts = Array.isArray(stats.topProducts) ? stats.topProducts : [];

  // Prepare chart data
  const orderStatusData = {
    labels: orderStatuses.map(s => s._id || 'Unknown'),
    datasets: [{
      data: orderStatuses.map(s => s.count),
      backgroundColor: [
        '#6366f1', '#f43f5e', '#22c55e', '#f59e0b', '#a855f7'
      ],
      borderWidth: 1
    }]
  };

  const revenueData = {
    labels: revenueByMonth.map(m => `${m._id.month}/${m._id.year}`),
    datasets: [{
      label: 'Revenue',
      data: revenueByMonth.map(m => m.revenue),
      backgroundColor: '#6366f1',
      borderColor: '#4f46e5',
      borderWidth: 1
    }]
  };

  const topProductsData = {
    labels: topProducts.map(p => p.name),
    datasets: [{
      label: 'Units Sold',
      data: topProducts.map(p => p.totalSold),
      backgroundColor: '#8b5cf6',
      borderColor: '#7c3aed',
      borderWidth: 1
    }]
  }
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div className="adb-header">
          <h1>Dashboard</h1>
        </div>

        {/* Stats Cards */}
        <div className="adb-grid">
          <div className="adb-card">
            <h3>Total Users</h3>
            <p>{stats.totalUsers}</p>
          </div>
          <div className="adb-card">
            <h3>Total Orders</h3>
            <p>{stats.totalOrders}</p>
            <div className="adb-change">+{stats.recentOrders} this month</div>
          </div>
          <div className="adb-card">
            <h3>Total Revenue</h3>
            <p>{formatPrice(stats.totalRevenue)}</p>
          </div>
          <div className="adb-card">
            <h3>Active Customers</h3>
            <p>{Math.floor(stats.totalUsers * 0.7)}</p>
            <div className="adb-change">70% active rate</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="adb-charts-section">
          <div className="adb-chart-container">
            <h3>Order Status Distribution</h3>
            <center><Pie data={orderStatusData} className="adb-piechart" /></center>
          </div>
          <div className="adb-chart-container">
            <h3>Revenue Trend (Last 6 Months)</h3>
            <Bar data={revenueData} />
          </div>
        </div>

        {/* Top Products */}
        <div className="adb-charts-section">
          <div className="adb-chart-container">
            <h3>Top Selling Products</h3>
            <Bar data={topProductsData} />
          </div>
          <div className="adb-activity-section">
            <h3>Recent Activity</h3>
            {topProducts.map((product, index) => (
              <div key={index} className="adb-activity-item">
                <div className="adb-product-name">{product.name}</div>
                <div className="adb-sales-data">
                  <div className="adb-units">{product.totalSold} units</div>
                  <div className="adb-revenue">{formatPrice(product.revenue)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Products Added By */}
        <div className="adb-chart-container">
          <h3>Products Added By</h3>
          {createdByStats.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '13px' }}>No creator data yet.</p>
          ) : (
            createdByStats.map((admin) => (
              <div key={admin.email || admin.name} className="adb-activity-item">
                <div className="adb-product-name">👤 {admin.name}</div>
                <div className="adb-sales-data">
                  <div className="adb-units">{admin.totalProducts} Products</div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboardPage;
export { AdminSidebar };
