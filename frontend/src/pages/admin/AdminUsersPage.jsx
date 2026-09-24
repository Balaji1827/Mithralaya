import React, { useEffect, useMemo, useState } from 'react';
import { AdminSidebar } from './AdminDashboardPage';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import "../../css/admindetails.css";
// Table.jsx lives at src/components/Table.jsx
import { Table } from '../../components/Table';

// Matches ADMIN_TIER_ROLES in adminController.js — keep these in sync if
// you add/remove a role on the backend.
const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin / Manager' },
  { value: 'sales', label: 'Sales' },
  { value: 'staff', label: 'Staff' },
  { value: 'reporting_manager', label: 'Reporting Manager' },
  { value: 'superadmin', label: 'Super Admin' }
];

const ROLE_LABELS = Object.fromEntries(ROLE_OPTIONS.map((r) => [r.value, r.label]));

// Added phone — optional (User model has it as a plain optional String,
// and existing admins like Manoj/Balaji don't have one on file), so it's
// not required for account creation the way name/email/password are.
const EMPTY_FORM = { name: '', email: '', password: '', role: 'admin', phone: '' };

const AdminUsersPage = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = Boolean(currentUser?.isSuperAdmin);

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async (search = '') => {
    const { data } = await api.get('/admin/users', { params: { search } });
    setUsers(data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    load(searchTerm);
  };

  const toggleAdmin = async (u) => {
    await api.put(`/admin/users/${u._id}`, { isAdmin: !u.isAdmin });
    load();
  };

  const handleDelete = async (u) => {
    if (!isSuperAdmin) return; // extra client-side guard; server must enforce this too
    if (window.confirm('Delete this user?')) {
      await api.delete(`/admin/users/${u._id}`);
      load();
    }
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormError('');
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError('Name, email, and password are all required.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/admin/users', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        phone: form.phone.trim() || undefined
      });
      setShowAddModal(false);
      setForm(EMPTY_FORM);
      load(searchTerm);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create admin.');
    } finally {
      setSaving(false);
    }
  };

  // Same filter as before — only admins are shown on this page
  const admins = useMemo(() => users.filter((u) => u.isAdmin), [users]);

  const columns = useMemo(
    () => [
      { Header: 'Name', accessor: 'name' },
      { Header: 'Email', accessor: 'email' },
      {
        Header: 'Phone',
        id: 'phone',
        accessor: (u) => u.phone || '-'
      },
      {
        Header: 'Role',
        id: 'role',
        accessor: (u) => ROLE_LABELS[u.role] || (u.isSuperAdmin ? 'Super Admin' : 'Admin'),
        Cell: ({ row }) => {
          const u = row.original;
          const label = ROLE_LABELS[u.role] || (u.isSuperAdmin ? 'Super Admin' : 'Admin');
          return (
            <span className={`aup-role-badge ${u.isSuperAdmin ? 'aup-role-super' : 'aup-role-admin'}`}>
              {label}
            </span>
          );
        }
      },
      {
        Header: '',
        id: 'actions',
        disableSortBy: true,
        Cell: ({ row }) => {
          const u = row.original;
          const canDeleteThis = isSuperAdmin && !u.isSuperAdmin; // super admins aren't deletable from here either
          return (
            <div className="aup-actions">
              <button className="aup-btn-warning" onClick={() => toggleAdmin(u)}>
                Remove Admin
              </button>
              <button
                className="aup-btn-danger"
                onClick={() => handleDelete(u)}
                disabled={!canDeleteThis}
                title={!isSuperAdmin ? 'Only super admins can delete admins' : undefined}
              >
                Delete
              </button>
            </div>
          );
        }
      }
    ],
    [isSuperAdmin]
  );


  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div className="aup-header">
          <h1>Users</h1>
          {isSuperAdmin && (
            <button className="aup-btn-add" onClick={() => setShowAddModal(true)}>
              Add Admin
            </button>
          )}
        </div>

        <form onSubmit={handleSearch} className="aup-search-form">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="aup-search-input"
          />
          <button type="submit" className="aup-search-btn">Search</button>
        </form>

        <Table columns={columns} data={admins} show />

        {showAddModal && (
          <div className="aup-modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="aup-modal" onClick={(e) => e.stopPropagation()}>
              <h2>Add New Admin</h2>
              <form onSubmit={handleAddAdmin}>
                <div className="aup-form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    required
                  />
                </div>
                <div className="aup-form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    required
                  />
                </div>
                <div className="aup-form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    placeholder="Optional"
                    value={form.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                  />
                </div>
                <div className="aup-form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => handleFormChange('password', e.target.value)}
                    required
                  />
                </div>
                <div className="aup-form-group">
                  <label>Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => handleFormChange('role', e.target.value)}
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                {formError && <div className="aup-form-error">{formError}</div>}

                <div className="aup-modal-actions">
                  <button
                    type="button"
                    className="aup-btn-cancel"
                    onClick={() => {
                      setShowAddModal(false);
                      setForm(EMPTY_FORM);
                      setFormError('');
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="aup-btn-add" disabled={saving}>
                    {saving ? 'Creating...' : 'Create Admin'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;
