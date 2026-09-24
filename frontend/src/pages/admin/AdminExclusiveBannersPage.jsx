import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { AdminSidebar } from './AdminDashboardPage';
import '../../css/adminexclusivestrip.css';
// Table.jsx lives at src/components/Table.jsx
import { Table } from '../../components/Table';

const AdminExclusiveBannersPage = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image: '',
    link: '',
    order: 0,
    isActive: true
  });

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const { data } = await api.get('/exclusive-banners');
      setBanners(data);
    } catch (err) {
      setError('Failed to load banners');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBanner) {
        await api.put(`/exclusive-banners/${editingBanner._id}`, formData);
      } else {
        await api.post('/exclusive-banners', formData);
      }
      await loadBanners();
      setShowModal(false);
      resetForm();
    } catch (err) {
      setError('Failed to save banner');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    try {
      await api.delete(`/exclusive-banners/${id}`);
      await loadBanners();
    } catch (err) {
      setError('Failed to delete banner');
      console.error(err);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/exclusive-banners/${id}`, { isActive: !currentStatus });
      await loadBanners();
    } catch (err) {
      setError('Failed to update banner status');
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      image: '',
      link: '',
      ctaPrimaryLabel: '',
      ctaPrimaryLink: '',
      ctaSecondaryLabel: '',
      ctaSecondaryLink: '',
      order: 0,
      isActive: true
    });
    setEditingBanner(null);
  };

  const openModal = (banner = null) => {
    if (banner) {
      setFormData({
        title: banner.title,
        subtitle: banner.subtitle,
        image: banner.image,
        link: banner.link,
        order: banner.order,
        isActive: banner.isActive
      });
      setEditingBanner(banner);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const columns = useMemo(
    () => [
      { Header: 'Order', accessor: 'order' },
      { Header: 'Title', accessor: 'title' },
      { Header: 'Subtitle', accessor: 'subtitle' },
      {
        Header: 'Image',
        id: 'image',
        disableSortBy: true,
        Cell: ({ row }) => (
          <img src={row.original.image} alt={row.original.title} className="aeb-thumb" />
        )
      },
      {
        Header: 'Status',
        id: 'status',
        Cell: ({ row }) => {
          const banner = row.original;
          return (
            <button
              className={`aeb-status-btn ${banner.isActive ? 'active' : 'inactive'}`}
              onClick={() => toggleStatus(banner._id, banner.isActive)}
            >
              {banner.isActive ? 'Active' : 'Inactive'}
            </button>
          );
        }
      },
      {
        Header: 'Actions',
        id: 'actions',
        disableSortBy: true,
        Cell: ({ row }) => (
          <div className="aeb-actions">
            <button className="aeb-btn-edit" onClick={() => openModal(row.original)}>Edit</button>
            <button className="aeb-btn-danger" onClick={() => handleDelete(row.original._id)}>Delete</button>
          </div>
        )
      }
    ],
    []
  );

  if (loading) return <div className="admin-layout"><AdminSidebar /><div className="admin-content">Loading...</div></div>;

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div className="aeb-header">
          <h1>Exclusive Banners</h1>
          <button className="aeb-btn-primary" onClick={() => openModal()}>Add New Banner</button>
        </div>

        {error && <div className="aeb-error-message">{error}</div>}

        <Table columns={columns} data={banners} show />

        {showModal && (
          <div className="aeb-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="aeb-modal" onClick={(e) => e.stopPropagation()}>
              <h2>{editingBanner ? 'Edit Banner' : 'Add New Banner'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="aeb-form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="aeb-form-group">
                  <label>Subtitle</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  />
                </div>
                <div className="aeb-form-group">
                  <label>Image URL</label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    required
                  />
                </div>
                <div className="aeb-form-group">
                  <label>Link</label>
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  />
                </div>
                <div className="aeb-form-group">
                  <label>Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    min="0"
                  />
                </div>
                <div className="aeb-checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    Active
                  </label>
                </div>
                <div className="aeb-modal-actions">
                  <button type="submit" className="aeb-btn-primary">Save</button>
                  <button type="button" className="aeb-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminExclusiveBannersPage;
