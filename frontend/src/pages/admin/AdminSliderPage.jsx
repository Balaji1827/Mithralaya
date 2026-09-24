import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { AdminSidebar } from './AdminDashboardPage';
import '../../css/adminSlider.css';
// Table.jsx lives at src/components/Table.jsx
import { Table } from '../../components/Table';

const AdminSliderPage = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    image: '',
    order: 0,
    isActive: true
  });

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const { data } = await api.get('/banner-sliders');
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
        await api.put(`/banner-sliders/${editingBanner._id}`, formData);
      } else {
        await api.post('/banner-sliders', formData);
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
      await api.delete(`/banner-sliders/${id}`);
      await loadBanners();
    } catch (err) {
      setError('Failed to delete banner');
      console.error(err);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/banner-sliders/${id}`, { isActive: !currentStatus });
      await loadBanners();
    } catch (err) {
      setError('Failed to update banner status');
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      image: '',
      order: 0,
      isActive: true
    });
    setEditingBanner(null);
  };

  const openModal = (banner = null) => {
    if (banner) {
      setFormData({
        title: banner.title || '',
        image: banner.image,
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
      {
        Header: 'Title',
        id: 'title',
        accessor: (b) => b.title || '-'
      },
      {
        Header: 'Image',
        id: 'image',
        disableSortBy: true,
        Cell: ({ row }) => (
          <img
            src={row.original.image}
            alt={row.original.title || 'Slide'}
            className="asl-thumb"
          />
        )
      },
      {
        Header: 'Status',
        id: 'status',
        Cell: ({ row }) => {
          const banner = row.original;
          return (
            <button
              className={`asl-status-btn ${banner.isActive ? 'active' : 'inactive'}`}
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
          <div className="asl-actions">
            <button className="asl-btn-edit" onClick={() => openModal(row.original)}>Edit</button>
            <button className="asl-btn-danger" onClick={() => handleDelete(row.original._id)}>Delete</button>
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
        <div className="asl-header">
          <h1>Banner slider</h1>
          <button className="asl-btn-primary" onClick={() => openModal()}>Add new slide</button>
        </div>

        {error && <div className="asl-error-message">{error}</div>}

        <Table columns={columns} data={banners} show />

        {showModal && (
          <div className="asl-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="asl-modal" onClick={(e) => e.stopPropagation()}>
              <h2>{editingBanner ? 'Edit slide' : 'Add new slide'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="asl-form-group">
                  <label>Title (used as image alt text)</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="asl-form-group">
                  <label>Image URL</label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    required
                  />
                </div>
                <div className="asl-form-group">
                  <label>Order in list</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    min="0"
                  />
                </div>
                <label>Navigation Link</label>
                <div className="asl-form-group">
                  <input
                    type="text"
                    value={formData.link}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        link: e.target.value,
                      })
                    }
                    placeholder="/products/shirt"
                  />
                </div>
                <div className="asl-checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    Active
                  </label>
                </div>
                <div className="asl-modal-actions">
                  <button type="submit" className="asl-btn-primary">Save</button>
                  <button type="button" className="asl-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSliderPage;
