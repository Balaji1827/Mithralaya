import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../../services/api';
import { AdminSidebar } from './AdminDashboardPage';
import '../../css/adminSlider.css';
// Table.jsx lives at src/components/Table.jsx
import { Table } from '../../components/Table';

const emptyForm = {
  title: '',
  views: 0,
  order: 0,
  isActive: true,
};

// The admin panel may run on a different host/port than the API (unlike the
// storefront, which is usually proxied) — resolve relative /uploads/... paths
// against the API's origin instead of assuming they're servable as-is.
const API_ORIGIN = (
  process.env.REACT_APP_API_URL ||
  (api?.defaults?.baseURL || '').replace(/\/api\/?$/, '')
).replace(/\/$/, '');

const resolveMediaUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path) || path.startsWith('blob:')) return path;
  return `${API_ORIGIN}${path}`;
};

const AdminReels = () => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingReel, setEditingReel] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState(emptyForm);
  const [videoFile, setVideoFile] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [thumbPreview, setThumbPreview] = useState('');

  const videoInputRef = useRef(null);
  const thumbInputRef = useRef(null);

  useEffect(() => {
    loadReels();
  }, []);

  // clean up any local object URLs so we don't leak memory
  useEffect(() => {
    return () => {
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      if (thumbPreview) URL.revokeObjectURL(thumbPreview);
    };
  }, [videoPreview, thumbPreview]);

  const loadReels = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/reels');
      setReels(data);
    } catch (err) {
      setError('Failed to load reels');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file');
      return;
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleThumbChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editingReel && !videoFile) {
      setError('Please select a video to upload');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const body = new FormData();
      body.append('title', formData.title);
      body.append('order', formData.order);
      body.append('isActive', formData.isActive);
      if (videoFile) body.append('video', videoFile);
      if (thumbFile) body.append('thumbnail', thumbFile);

      if (editingReel) {
        await api.put(`/reels/${editingReel._id}`, body, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/reels', body, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      await loadReels();
      closeModal();
    } catch (err) {
      setError('Failed to save reel');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reel?')) return;
    try {
      await api.delete(`/reels/${id}`);
      await loadReels();
    } catch (err) {
      setError('Failed to delete reel');
      console.error(err);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/reels/${id}`, { isActive: !currentStatus });
      await loadReels();
    } catch (err) {
      setError('Failed to update reel status');
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setVideoFile(null);
    setThumbFile(null);
    setVideoPreview('');
    setThumbPreview('');
    setEditingReel(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (thumbInputRef.current) thumbInputRef.current.value = '';
  };

  const openModal = (reel = null) => {
    setError('');
    if (reel) {
      setFormData({
        title: reel.title || '',
        views: reel.views || 0,
        order: reel.order || 0,
        isActive: reel.isActive,
      });
      setVideoPreview(resolveMediaUrl(reel.video));
      setThumbPreview(resolveMediaUrl(reel.thumbnail));
      setVideoFile(null);
      setThumbFile(null);
      setEditingReel(reel);
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
      {
        Header: 'Title',
        id: 'title',
        accessor: (r) => r.title || '-',
      },
      {
        Header: 'Video',
        id: 'video',
        disableSortBy: true,
        Cell: ({ row }) => {
          const hasThumbnail = Boolean(row.original.thumbnail);
          return (
            <video
              src={resolveMediaUrl(row.original.video)}
              poster={hasThumbnail ? resolveMediaUrl(row.original.thumbnail) : undefined}
              className="asl-thumb-video"
              preload="metadata"
              muted
              playsInline
              onLoadedMetadata={(e) => {
                // no thumbnail? seek past a possibly-black opening frame
                if (hasThumbnail) return;
                try {
                  e.currentTarget.currentTime = Math.min(0.3, (e.currentTarget.duration || 1) / 4);
                } catch (err) {
                  /* ignore */
                }
              }}
              onError={(e) => console.warn('Reel video failed to load:', e.currentTarget.src)}
            />
          );
        },
      },
      {
        Header: 'Views',
        id: 'views',
        accessor: (r) => r.views || 0,
      },
      {
        Header: 'Status',
        id: 'status',
        Cell: ({ row }) => {
          const reel = row.original;
          return (
            <button
              className={`asl-status-btn ${reel.isActive ? 'active' : 'inactive'}`}
              onClick={() => toggleStatus(reel._id, reel.isActive)}
            >
              {reel.isActive ? 'Active' : 'Inactive'}
            </button>
          );
        },
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
        ),
      },
    ],
    []
  );

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div className="asl-header">
          <h1>Reels slider</h1>
          <button className="asl-btn-primary" onClick={() => openModal()}>Add new reel</button>
        </div>

        {error && <div className="asl-error-message">{error}</div>}

        <Table columns={columns} data={reels} show />

        {showModal && (
          <div className="asl-modal-overlay" onClick={closeModal}>
            <div className="asl-modal" onClick={(e) => e.stopPropagation()}>
              <h2>{editingReel ? 'Edit Reel' : 'Add New Reel'}</h2>

              <form onSubmit={handleSubmit} className="asl-form">
                <div className="asl-form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Reel title"
                  />
                </div>

                <div className="asl-form-group">
                  <label>Video {editingReel ? '(leave empty to keep current)' : ''}</label>
                  <input
                    type="file"
                    accept="video/*"
                    ref={videoInputRef}
                    onChange={handleVideoChange}
                  />
                  {videoPreview && (
                    <video
                      src={videoPreview}
                      className="asl-preview-video"
                      controls
                      muted
                    />
                  )}
                </div>

                <div className="asl-form-group">
                  <label>Thumbnail (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    ref={thumbInputRef}
                    onChange={handleThumbChange}
                  />
                  {thumbPreview && (
                    <img src={thumbPreview} alt="Thumbnail preview" className="asl-preview-thumb" />
                  )}
                </div>

                <div className="asl-form-row">
                  <div className="asl-form-group">
                    <label>Order</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    />
                  </div>

                  <div className="asl-form-group asl-checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                      Active
                    </label>
                  </div>
                </div>

                <div className="asl-modal-actions">
                  <button type="button" className="asl-btn-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="asl-btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : editingReel ? 'Update Reel' : 'Add Reel'}
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

export default AdminReels;
