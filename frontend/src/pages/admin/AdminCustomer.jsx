import React, { useEffect, useMemo, useState } from "react";
import { AdminSidebar } from "./AdminDashboardPage";
import api from "../../services/api";
import { getAllOrders } from "../../services/orderService";
import formatPrice from "../../utils/formatPrice";
import "../../css/admincustomerpage.css";
// Table.jsx lives at src/components/Table.jsx
import { Table } from "../../components/Table";

const STATUS_COLORS = {
  Placed: '#64748b',
  Processing: '#d97706',
  Shipped: '#2563eb',
  Delivered: '#16a34a',
  Cancelled: '#dc2626',
  Rejected: '#dc2626'
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Picks the default address if one is marked, otherwise the first
// address on file. Most customers in this app only ever have one.
const getPrimaryAddress = (customer) => {
  if (!customer.addresses?.length) return null;
  return customer.addresses.find((a) => a.isDefault) || customer.addresses[0];
};

// Fixed-width, single-line-per-part cell style with ellipsis truncation.
// Explicitly re-declares nowrap + overflow + ellipsis on a fixed width so
// long text always truncates cleanly inside its own cell instead of
// bleeding into neighboring columns (white-space is inherited, and the
// base table cell class sets nowrap). Full text is on the title tooltip.
const ADDRESS_COL_WIDTH = 190;
const addressLineStyle = {
  width: ADDRESS_COL_WIDTH,
  maxWidth: ADDRESS_COL_WIDTH,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
};

const AdminCustomer = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Order-count-per-customer, built from the full order list so the table
  // can show "3 orders" etc. without a separate request per row.
  const [ordersByUserId, setOrdersByUserId] = useState({});

  // Drawer state for the "View Orders" button — fetched fresh (scoped by
  // that customer's email) rather than reused from the bulk list above,
  // so it reflects the latest data and also picks up any guest-checkout
  // orders placed under the same email.
  const [orderDrawerCustomer, setOrderDrawerCustomer] = useState(null);
  const [drawerOrders, setDrawerOrders] = useState([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const loadCustomers = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/admin/users");

      const onlyCustomers = data.filter((user) => !user.isAdmin);

      setCustomers(onlyCustomers);
      setFilteredCustomers(onlyCustomers);
    } catch (err) {
      console.error(err);
      alert("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  // Loads every order once and buckets counts/totals by registered
  // customer (order.user._id). Guest-checkout orders (user: null) aren't
  // tied to any account, so they intentionally don't count toward any
  // customer row here — they're still reachable per-customer via the
  // "View Orders" drawer's email-based search, which also matches
  // shippingAddress.fullName for guest orders.
  const loadOrderCounts = async () => {
    try {
      const allOrders = await getAllOrders({});
      const counts = {};
      allOrders.forEach((order) => {
        const uid = order.user?._id;
        if (!uid) return;
        if (!counts[uid]) counts[uid] = { count: 0, total: 0 };
        counts[uid].count += 1;
        counts[uid].total += order.totalPrice || 0;
      });
      setOrdersByUserId(counts);
    } catch (err) {
      console.error('Failed to load order counts:', err);
    }
  };

  useEffect(() => {
    loadCustomers();
    loadOrderCounts();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();

    const value = search.toLowerCase();

    const filtered = customers.filter((customer) => {
      const addr = getPrimaryAddress(customer);
      return (
        customer.name?.toLowerCase().includes(value) ||
        customer.email?.toLowerCase().includes(value) ||
        customer.phone?.toLowerCase().includes(value) ||
        addr?.pincode?.toLowerCase().includes(value) ||
        addr?.city?.toLowerCase().includes(value) ||
        addr?.state?.toLowerCase().includes(value) ||
        addr?.address?.toLowerCase().includes(value)
      );
    });

    setFilteredCustomers(filtered);
  };

  const handleDelete = async (customer) => {
    const confirmDelete = window.confirm(
      `Delete ${customer.name}?`
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/admin/users/${customer._id}`);
      loadCustomers();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  const openOrderDrawer = async (customer) => {
    setOrderDrawerCustomer(customer);
    setDrawerLoading(true);
    try {
      // Scoped by email — matches both this customer's own account orders
      // and any guest-checkout orders placed under the same email, thanks
      // to buildOrderFilter's customer matching on the backend.
      const orders = await getAllOrders({ search: customer.email });
      setDrawerOrders(orders);
    } catch (err) {
      console.error('Failed to load customer orders:', err);
      setDrawerOrders([]);
    } finally {
      setDrawerLoading(false);
    }
  };

  const closeOrderDrawer = () => {
    setOrderDrawerCustomer(null);
    setDrawerOrders([]);
  };

  // Downloads the "Customer Report" PDF, scoped to whatever's currently
  // in the search box — same pattern as the products/orders PDF exports.
  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const response = await api.get('/admin/users/download-pdf', {
        params: search ? { search } : {},
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'customer-report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download customer PDF:', err);
      alert('Failed to download PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Table.jsx's Cell only receives the row's data, not its index, so the
  // serial number is baked into the row objects up front instead.
  const rows = useMemo(
    () => filteredCustomers.map((c, i) => ({ ...c, _serial: i + 1 })),
    [filteredCustomers]
  );

  const columns = useMemo(
    () => [
      { Header: '#', accessor: '_serial', disableSortBy: true },
      { Header: 'Name', accessor: 'name' },
      { Header: 'Email', accessor: 'email' },
      {
        Header: 'Phone',
        id: 'phone',
        accessor: (c) => c.phone || '-'
      },
      {
        Header: 'Date of Birth',
        id: 'dob',
        accessor: (c) => c.dob || c.dateOfBirth || null,
        Cell: ({ row }) => {
          const raw = row.original.dob || row.original.dateOfBirth;
          return raw ? formatDate(raw) : '-';
        }
      },
      {
        Header: 'Address',
        id: 'address',
        disableSortBy: true,
        Cell: ({ row }) => {
          const addr = getPrimaryAddress(row.original);
          if (!addr) return <span style={{ color: '#999' }}>No address on file</span>;

          const cityState = [addr.city, addr.state].filter(Boolean).join(', ');
          const fullAddress = [addr.address, cityState, addr.pincode].filter(Boolean).join(', ');

          return (
            <div title={fullAddress} style={{ fontSize: '12px', lineHeight: 1.5 }}>
              <div style={addressLineStyle}>{addr.address}</div>
              <div style={{ ...addressLineStyle, color: '#777' }}>{cityState}</div>
            </div>
          );
        }
      },
      {
        Header: 'Pincode',
        id: 'pincode',
        accessor: (c) => getPrimaryAddress(c)?.pincode || '-'
      },
      {
        Header: 'Orders',
        id: 'orders',
        disableSortBy: true,
        accessor: (c) => ordersByUserId[c._id]?.count || 0,
        Cell: ({ row }) => {
          const stats = ordersByUserId[row.original._id];
          return (
            <button
              type="button"
              onClick={() => openOrderDrawer(row.original)}
              title="View this customer's order history"
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                background: '#f8f8fb',
                fontSize: '12px',
                fontWeight: 600,
                color: '#333',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {stats ? `${stats.count} order${stats.count === 1 ? '' : 's'}` : '0 orders'}
              {stats?.total ? ` · ${formatPrice(stats.total)}` : ''}
            </button>
          );
        }
      },
      {
        Header: 'Joined',
        id: 'joined',
        accessor: (c) => (c.createdAt ? new Date(c.createdAt).getTime() : 0),
        Cell: ({ row }) =>
          row.original.createdAt
            ? new Date(row.original.createdAt).toLocaleDateString()
            : '-'
      },
      {
        Header: 'Action',
        id: 'action',
        disableSortBy: true,
        Cell: ({ row }) => (
          <button className="acp-btn-danger" onClick={() => handleDelete(row.original)}>
            Delete
          </button>
        )
      }
    ],
    [ordersByUserId]
  );

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-content">

        <div className="acp-header">
          <h1>Customers</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              title={search ? `Exports only customers matching "${search}"` : 'Exports all customers'}
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
              {downloadingPdf ? 'Preparing...' : '📄 Download PDF'}
            </button>
            <button className="acp-refresh-btn" onClick={() => { loadCustomers(); loadOrderCounts(); }}>
              Refresh
            </button>
          </div>
        </div>

        <form className="acp-search-form" onSubmit={handleSearch}>
          <input
            className="acp-search-input"
            type="text"
            placeholder="Search name, email, phone, address, pincode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button className="acp-search-btn" type="submit">
            Search
          </button>
        </form>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <Table columns={columns} data={rows} show />
        )}

      </div>

      {orderDrawerCustomer && (
        <div
          onClick={closeOrderDrawer}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '380px',
              maxWidth: '90vw',
              height: '100%',
              background: '#fff',
              padding: '24px',
              overflowY: 'auto',
              position: 'relative'
            }}
          >
            <button
              onClick={closeOrderDrawer}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                border: 'none',
                background: 'transparent',
                fontSize: '22px',
                cursor: 'pointer',
                lineHeight: 1
              }}
            >
              ×
            </button>

            <h2 style={{ marginBottom: '4px' }}>{orderDrawerCustomer.name}</h2>
            <p style={{ color: '#777', marginBottom: '20px', fontSize: '13px' }}>
              {orderDrawerCustomer.email}
            </p>

            {drawerLoading ? (
              <p>Loading orders...</p>
            ) : drawerOrders.length === 0 ? (
              <p style={{ color: '#999' }}>No orders found for this customer.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {drawerOrders.map((order) => {
                  const color = STATUS_COLORS[order.status] || '#64748b';
                  return (
                    <div
                      key={order._id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        border: '1px solid #eee',
                        borderRadius: '8px'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '13px' }}>{order.orderId}</strong>
                        <div style={{ fontSize: '11px', color: '#999' }}>
                          {formatDate(order.createdAt)}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#fff',
                          background: color,
                          padding: '3px 8px',
                          borderRadius: '999px'
                        }}
                      >
                        {order.status}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>
                        {formatPrice(order.totalPrice)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};

export default AdminCustomer;
