import React, { useEffect, useMemo, useState } from 'react';
import { AdminSidebar } from './AdminDashboardPage';
import { getAllOrders, updateOrderStatus, deleteOrder, downloadOrdersExcel, downloadOrdersPdf } from '../../services/orderService';
import formatPrice from '../../utils/formatPrice';
import "../../css/adminOrders.css";
// Table.jsx lives at src/components/Table.jsx
import { Table } from '../../components/Table';

// Added 'Rejected' alongside the existing statuses. Payment (Paid/Unpaid)
// stays as its own separate dropdown, unchanged.
const STATUS_OPTIONS = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Rejected'];

const STATUS_TONE = {
  Placed: 'slate',
  Processing: 'amber',
  Shipped: 'blue',
  Delivered: 'green',
  Cancelled: 'coral',
  Rejected: 'coral'
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDateShort = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const StatusPill = ({ tone, children }) => (
  <span className={`aop-pill aop-pill-${tone}`}>{children}</span>
);

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [activeOrder, setActiveOrder] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const [statusFilter, setStatusFilter] = useState('all');

  const load = async (search = '', date = '', month = '') => {
    const params = { search };
    if (date) params.date = date;
    if (month) params.month = month;
    const list = await getAllOrders(params);
    setOrders(list);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    load(searchTerm);
  };

  const updateStatus = async (id, status) => {
    await updateOrderStatus(id, { status });
    load();
    setActiveOrder((prev) => (prev && prev._id === id ? { ...prev, status } : prev));
  };

  const updatePaid = async (id, isPaid) => {
    await updateOrderStatus(id, { isPaid: isPaid === 'true' });
    load();
    setActiveOrder((prev) => (prev && prev._id === id ? { ...prev, isPaid: isPaid === 'true' } : prev));
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      await deleteOrder(id);
      if (activeOrder && activeOrder._id === id) setActiveOrder(null);
      load();
    }
  };

  const handleFilterChange = () => {
    if (filterType === 'date' && selectedDate) {
      load(searchTerm, selectedDate);
    } else if (filterType === 'month' && selectedMonth) {
      load(searchTerm, '', selectedMonth);
    } else {
      load(searchTerm);
    }
  };

  // Builds the current filter params consistently for both export buttons.
  const currentExportParams = () => {
    const params = { search: searchTerm };
    if (filterType === 'date' && selectedDate) params.date = selectedDate;
    if (filterType === 'month' && selectedMonth) params.month = selectedMonth;
    return params;
  };

  const handleDownloadExcel = async () => {
    setDownloading(true);
    try {
      await downloadOrdersExcel(currentExportParams());
    } catch (error) {
      console.error('Error downloading Excel:', error);
    } finally {
      setDownloading(false);
    }
  };

  // Downloads the "Order Report" PDF, scoped to whatever search/date/month
  // filter is currently applied — same behavior as the Excel download and
  // the product PDF export on AdminProductsPage.
  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      await downloadOrdersPdf(currentExportParams());
    } catch (error) {
      console.error('Failed to download orders PDF:', error);
      alert('Failed to download PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Applies the top status filter on top of whatever `orders` currently
  // holds. 'all' shows everything; any other value shows only orders
  // whose status matches exactly.
  const displayedOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  // ---- Table column definitions (same shape used on AdminProductsPage) ----
  const columns = useMemo(
    () => [
      {
        Header: 'Order',
        id: 'orderId',
        accessor: (o) => o.orderId,
        Cell: ({ row }) => {
          const o = row.original;
          return (
            <button className="aop-order-cell" onClick={() => setActiveOrder(o)}>
              <span className="aop-order-id">{o.orderId}</span>
              <span className="aop-order-date">{formatDateShort(o.createdAt)}</span>
            </button>
          );
        }
      },
      {
        Header: 'Customer',
        id: 'user',
        accessor: (o) => o.user?.name || o.shippingAddress?.fullName || 'Guest',
        Cell: ({ row }) => {
          const o = row.original;
          const name = o.user?.name || o.shippingAddress?.fullName || 'Guest';
          const sub = o.user?.email || o.shippingAddress?.phone || '—';
          return (
            <div className="aop-customer-cell">
              <span className="aop-customer-name">{name}</span>
              <span className="aop-customer-sub">{sub}</span>
            </div>
          );
        }
      },
      {
        Header: 'Items',
        id: 'items',
        disableSortBy: true,
        accessor: (o) => o.orderItems?.length || 0,
        Cell: ({ row }) => {
          const items = row.original.orderItems || [];
          const first = items[0];
          const totalQty = items.reduce((sum, it) => sum + (it.qty || 0), 0);
          if (!first) return <span className="aop-muted">No items</span>;
          return (
            <div className="aop-items-cell">
              <img className="aop-item-thumb" src={first.image} alt={first.name} />
              <div className="aop-items-info">
                <span className="aop-item-name">{first.name}</span>
                <span className="aop-item-meta">
                  {first.size ? `${first.size} · ` : ''}{first.color ? `${first.color} · ` : ''}Qty {totalQty}
                  {items.length > 1 ? ` · +${items.length - 1} more` : ''}
                </span>
              </div>
            </div>
          );
        }
      },
      {
        Header: 'Payment',
        id: 'payment',
        disableSortBy: true,
        Cell: ({ row }) => {
          const o = row.original;
          return (
            <div className="aop-payment-cell">
              <span className="aop-method-tag">{o.paymentMethod || '—'}</span>
              <select
                className={`aop-select aop-pill-select ${o.isPaid ? 'aop-pill-green' : 'aop-pill-coral'}`}
                value={o.isPaid.toString()}
                onChange={(e) => updatePaid(o._id, e.target.value)}
              >
                <option value="true">Paid</option>
                <option value="false">Unpaid</option>
              </select>
            </div>
          );
        }
      },
      {
        Header: 'Total',
        id: 'total',
        accessor: (o) => o.totalPrice,
        Cell: ({ row }) => {
          const o = row.original;
          return (
            <div className="aop-total-cell">
              <span className="aop-total-amount">{formatPrice(o.totalPrice)}</span>
              <span className="aop-total-sub">
                {formatPrice(o.itemsPrice)} + {formatPrice(o.taxPrice)} tax
              </span>
            </div>
          );
        }
      },
      {
        Header: 'Status',
        id: 'status',
        disableSortBy: true,
        Cell: ({ row }) => {
          const o = row.original;
          const tone = STATUS_TONE[o.status] || 'slate';
          return (
            <select
              className={`aop-select aop-pill-select aop-pill-${tone}`}
              value={o.status || 'Placed'}
              onChange={(e) => updateStatus(o._id, e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          );
        }
      },
      {
        Header: 'Delivery',
        id: 'delivery',
        disableSortBy: true,
        Cell: ({ row }) => {
          const o = row.original;
          return o.isDelivered ? (
            <div className="aop-total-cell">
              <StatusPill tone="green">Delivered</StatusPill>
              <span className="aop-total-sub">{formatDateShort(o.deliveredAt)}</span>
            </div>
          ) : (
            <StatusPill tone="slate">Pending</StatusPill>
          );
        }
      },
      {
        Header: '',
        id: 'actions',
        disableSortBy: true,
        Cell: ({ row }) => {
          const o = row.original;
          return (
            <div className="aop-actions-cell">
              <button className="aop-view-btn" onClick={() => setActiveOrder(o)}>View</button>
              <button className="aop-delete-btn" onClick={() => handleDelete(o._id)} aria-label="Delete order">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            </div>
          );
        }
      }
    ],
    []
  );

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">

        {/* ---- standalone status filter, top of page ---- */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '16px'
          }}
        >
          <label
            htmlFor="aop-top-status-filter"
            style={{ fontSize: '13px', fontWeight: 600, color: '#555' }}
          >
            Filter by Status
          </label>
          <select
            id="aop-top-status-filter"
            className="aop-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="aop-header">
          <div>
            <h1>Orders</h1>
            <p className="aop-subhead">
              {displayedOrders.length} order{displayedOrders.length === 1 ? '' : 's'}
              {statusFilter !== 'all' ? ` · ${statusFilter}` : ' on file'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="aop-search-form">
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="aop-search-input"
          />
          <button type="submit" className="aop-search-btn">Search</button>

          {/* NEW: Download PDF, next to the existing Excel download */}
          <button
            type="button"
            className="aop-download-btn"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            title={searchTerm ? `Exports only orders matching "${searchTerm}"` : 'Exports all orders'}
          >
            {downloadingPdf ? 'Preparing…' : '📄 Download PDF'}
          </button>

          <button type="button" className="aop-download-btn" onClick={handleDownloadExcel} disabled={downloading}>
            {downloading ? 'Preparing…' : 'Download report'}
          </button>
        </form>

        <div className="aop-filter-bar">
          <select
            className="aop-filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Orders</option>
            <option value="date">Filter by Date</option>
            <option value="month">Filter by Month</option>
          </select>

          {filterType === 'date' && (
            <input
              type="date"
              className="aop-filter-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          )}

          {filterType === 'month' && (
            <input
              type="month"
              className="aop-filter-input"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          )}

          <button className="aop-apply-btn" onClick={handleFilterChange}>
            Apply Filter
          </button>
        </div>

        <Table columns={columns} data={displayedOrders} show />
      </div>

      {activeOrder && (
        <OrderDrawer
          order={activeOrder}
          onClose={() => setActiveOrder(null)}
          onStatusChange={updateStatus}
          onPaidChange={updatePaid}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

const OrderDrawer = ({ order, onClose, onStatusChange, onPaidChange, onDelete }) => {
  const addr = order.shippingAddress || {};
  const tone = STATUS_TONE[order.status] || 'slate';

  return (
    <div className="aop-drawer-backdrop" onClick={onClose}>
      <div className="aop-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="aop-drawer-header">
          <div>
            <p className="aop-drawer-eyebrow">Order</p>
            <h2 className="aop-drawer-id">{order.orderId}</h2>
          </div>
          <button className="aop-drawer-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="aop-drawer-body">
          <div className="aop-drawer-row">
            <select
              className={`aop-select aop-pill-select aop-pill-${tone}`}
              value={order.status || 'Placed'}
              onChange={(e) => onStatusChange(order._id, e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              className={`aop-select aop-pill-select ${order.isPaid ? 'aop-pill-green' : 'aop-pill-coral'}`}
              value={order.isPaid.toString()}
              onChange={(e) => onPaidChange(order._id, e.target.value)}
            >
              <option value="true">Paid</option>
              <option value="false">Unpaid</option>
            </select>
            {order.isDelivered ? (
              <StatusPill tone="green">Delivered</StatusPill>
            ) : (
              <StatusPill tone="slate">Not delivered</StatusPill>
            )}
          </div>

          {order.status === 'Cancelled' && order.cancelReason && (
            <div className="aop-drawer-note aop-drawer-note-coral">
              Cancelled: {order.cancelReason}
            </div>
          )}

          {order.status === 'Rejected' && order.cancelReason && (
            <div className="aop-drawer-note aop-drawer-note-coral">
              Rejected: {order.cancelReason}
            </div>
          )}

          <section className="aop-drawer-section">
            <h3>Customer</h3>
            <p className="aop-drawer-line-strong">{order.user?.name || addr.fullName || 'Guest checkout'}</p>
            <p className="aop-drawer-line">{order.user?.email || '—'}</p>
          </section>

          <section className="aop-drawer-section">
            <h3>Shipping address</h3>
            <p className="aop-drawer-line-strong">{addr.fullName} {addr.suggestedName ? `· ${addr.suggestedName}` : ''}</p>
            <p className="aop-drawer-line">{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}</p>
            <p className="aop-drawer-line">{addr.city}, {addr.state} {addr.pincode}</p>
            <p className="aop-drawer-line">{addr.phone}</p>
          </section>

          <section className="aop-drawer-section">
            <h3>Items ({order.orderItems?.length || 0})</h3>
            <div className="aop-drawer-items">
              {(order.orderItems || []).map((it, i) => (
                <div className="aop-drawer-item" key={i}>
                  <img src={it.image} alt={it.name} className="aop-drawer-item-thumb" />
                  <div className="aop-drawer-item-info">
                    <span className="aop-drawer-line-strong">{it.name}</span>
                    <span className="aop-drawer-line">
                      {it.size ? `Size ${it.size}` : ''}{it.color ? ` · ${it.color}` : ''} · Qty {it.qty}
                    </span>
                  </div>
                  <span className="aop-drawer-line-strong">{formatPrice(it.price * it.qty)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="aop-drawer-section">
            <h3>Payment breakdown</h3>
            <div className="aop-breakdown-row">
              <span>Items</span><span>{formatPrice(order.itemsPrice)}</span>
            </div>
            <div className="aop-breakdown-row">
              <span>Shipping</span><span>{order.shippingPrice ? formatPrice(order.shippingPrice) : 'Free'}</span>
            </div>
            <div className="aop-breakdown-row">
              <span>Tax</span><span>{formatPrice(order.taxPrice)}</span>
            </div>
            <div className="aop-breakdown-row aop-breakdown-total">
              <span>Total</span><span>{formatPrice(order.totalPrice)}</span>
            </div>
            <p className="aop-drawer-line">Paid via {order.paymentMethod || '—'}</p>
          </section>

          <section className="aop-drawer-section">
            <h3>Timeline</h3>
            <div className="aop-breakdown-row"><span>Placed</span><span>{formatDate(order.createdAt)}</span></div>
            {order.paidAt && <div className="aop-breakdown-row"><span>Paid</span><span>{formatDate(order.paidAt)}</span></div>}
            {order.deliveredAt && <div className="aop-breakdown-row"><span>Delivered</span><span>{formatDate(order.deliveredAt)}</span></div>}
            <div className="aop-breakdown-row"><span>Last updated</span><span>{formatDate(order.updatedAt)}</span></div>
          </section>

          <button className="aop-drawer-delete" onClick={() => onDelete(order._id)}>
            Delete order
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminOrdersPage;
