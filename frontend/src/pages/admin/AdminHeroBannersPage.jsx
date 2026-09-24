import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../../services/api';
import { AdminSidebar } from './AdminDashboardPage';
import '../../css/adminherobanners.css';
// Table.jsx lives at src/components/Table.jsx
import { Table } from '../../components/Table';

// resolve stored /uploads/... paths against the API's origin
const API_ORIGIN = (
  process.env.REACT_APP_API_URL ||
  (api?.defaults?.baseURL || '').replace(/\/api\/?$/, '')
).replace(/\/$/, '');

const resolveMediaUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path) || path.startsWith('blob:')) return path;
  return `${API_ORIGIN}${path}`;
};

const emptyForm = {
  title: '',
  subtitle: '',
  ctaPrimaryLabel: '',
  order: 0,
  isActive: true
};

const AdminHeroBannersPage = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const imageInputRef = useRef(null);

  useEffect(() => {
    loadBanners();
  }, []);

  // clean up any local object URL so we don't leak memory
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/hero-banners');
      setBanners(data);
    } catch (err) {
      setError('Failed to load banners');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editingBanner && !imageFile) {
      setError('Please select a banner image to upload');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const body = new FormData();
      body.append('title', formData.title);
      body.append('subtitle', formData.subtitle);
      body.append('ctaPrimaryLabel', formData.ctaPrimaryLabel);
      body.append('order', formData.order);
      body.append('isActive', formData.isActive);
      if (imageFile) body.append('image', imageFile);

      if (editingBanner) {
        await api.put(`/hero-banners/${editingBanner._id}`, body, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/hero-banners', body, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      await loadBanners();
      closeModal();
    } catch (err) {
      setError('Failed to save banner');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    try {
      await api.delete(`/hero-banners/${id}`);
      await loadBanners();
    } catch (err) {
      setError('Failed to delete banner');
      console.error(err);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/hero-banners/${id}`, { isActive: !currentStatus });
      await loadBanners();
    } catch (err) {
      setError('Failed to update banner status');
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setImageFile(null);
    setImagePreview('');
    setEditingBanner(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const openModal = (banner = null) => {
    setError('');
    if (banner) {
      setFormData({
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        ctaPrimaryLabel: banner.ctaPrimaryLabel || '',
        order: banner.order || 0,
        isActive: banner.isActive
      });
      setImagePreview(resolveMediaUrl(banner.image));
      setImageFile(null);
      setEditingBanner(banner);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
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
          <img
            src={resolveMediaUrl(row.original.image)}
            alt={row.original.title}
            className="ahb-thumb"
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
              className={`ahb-status-btn ${banner.isActive ? 'active' : 'inactive'}`}
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
          <div className="ahb-actions">
            <button className="ahb-btn-edit" onClick={() => openModal(row.original)}>Edit</button>
            <button className="ahb-btn-danger" onClick={() => handleDelete(row.original._id)}>Delete</button>
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
        <div className="ahb-header">
          <h1>Hero Banners</h1>
          <button className="ahb-btn-primary" onClick={() => openModal()}>Add New Banner</button>
        </div>

        {error && <div className="ahb-error-message">{error}</div>}

        <Table columns={columns} data={banners} show />

        {showModal && (
          <div className="ahb-modal-overlay" onClick={closeModal}>
            <div className="ahb-modal" onClick={(e) => e.stopPropagation()}>
              <h2>{editingBanner ? 'Edit Banner' : 'Add New Banner'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="ahb-form-group">
                  <label>Title (big headline on the banner)</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="ahb-form-group">
                  <label>Subtitle (text inside the white button strip)</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  />
                </div>

                <div className="ahb-form-group">
                  <label>Banner Image {editingBanner ? '(leave empty to keep current)' : ''}</label>
                  <input
                    type="file"
                    accept="image/*"
                    ref={imageInputRef}
                    onChange={handleImageChange}
                    required={!editingBanner}
                  />

                  {imagePreview && (
                    <div className="ahb-image-preview">
                      <img
                        src={imagePreview}
                        alt="Banner preview"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                        onLoad={(e) => {
                          e.currentTarget.style.display = 'block';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="ahb-form-group">
                  <label>View All</label>
                  <input
                    type="text"
                    value={formData.ctaPrimaryLabel}
                    onChange={(e) => setFormData({ ...formData, ctaPrimaryLabel: e.target.value })}
                    required
                  />
                </div>

                <div className="ahb-form-group">
                  <label>S.Order in List</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) })}
                    min="0"
                  />
                </div>
                <div className="ahb-checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    Active
                  </label>
                </div>
                <div className="ahb-modal-actions">
                  <button type="submit" className="ahb-btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" className="ahb-btn-cancel" onClick={closeModal}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHeroBannersPage;
