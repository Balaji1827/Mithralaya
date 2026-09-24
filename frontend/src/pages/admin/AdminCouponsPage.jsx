import React, { useState, useEffect, useMemo } from 'react';
import { createCoupon, getCoupons, updateCoupon, deleteCoupon } from '../../services/couponService';
import { uploadImage } from '../../services/productService';
import { toast } from 'react-toastify';
import '../../css/admincoupons.css';
import { AdminSidebar } from './AdminDashboardPage';
// Table.jsx lives at src/components/Table.jsx
import { Table } from '../../components/Table';

const AdminCouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderValue: '',
    maxDiscount: '',
    usageLimit: '',
    expiryDate: '',
    isActive: true
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      const data = await getCoupons();
      setCoupons(data);
    } catch (error) {
      toast.error('Failed to load coupons');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const imageUrl = await uploadImage(file);
        setFormData(prev => ({ ...prev, image: imageUrl }));
        toast.success('Image uploaded successfully');
      } catch (error) {
        toast.error('Failed to upload image');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCoupon) {
        await updateCoupon(editingCoupon._id, formData);
        toast.success('Coupon updated successfully');
      } else {
        await createCoupon(formData);
        toast.success('Coupon created successfully');
      }
      loadCoupons();
      resetForm();
    } catch (error) {
      toast.error('Failed to save coupon');
    }
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      title: coupon.title,
      description: coupon.description,
      image: coupon.image,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue,
      maxDiscount: coupon.maxDiscount,
      usageLimit: coupon.usageLimit,
      expiryDate: coupon.expiryDate ? coupon.expiryDate.split('T')[0] : '',
      isActive: coupon.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await deleteCoupon(id);
        toast.success('Coupon deleted successfully');
        loadCoupons();
      } catch (error) {
        toast.error('Failed to delete coupon');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image: '',
      code: '',
      discountType: 'percentage',
      discountValue: '',
      minOrderValue: '',
      maxDiscount: '',
      usageLimit: '',
      expiryDate: '',
      isActive: true
    });
    setEditingCoupon(null);
    setShowForm(false);
  };

  const columns = useMemo(
    () => [
      { Header: 'Title', accessor: 'title' },
      { Header: 'Code', accessor: 'code' },
      {
        Header: 'Discount',
        id: 'discount',
        accessor: (c) => c.discountValue,
        Cell: ({ row }) => {
          const c = row.original;
          return c.discountType === 'percentage' ? `${c.discountValue}%` : `$${c.discountValue}`;
        }
      },
      {
        Header: 'Expiry',
        id: 'expiry',
        accessor: (c) => (c.expiryDate ? new Date(c.expiryDate).getTime() : 0),
        Cell: ({ row }) =>
          row.original.expiryDate
            ? new Date(row.original.expiryDate).toLocaleDateString()
            : 'No expiry'
      },
      {
        Header: 'Status',
        id: 'status',
        Cell: ({ row }) => (
          <span
            className={`aco-status-badge ${row.original.isActive ? 'aco-status-active' : 'aco-status-inactive'}`}
          >
            {row.original.isActive ? 'Active' : 'Inactive'}
          </span>
        )
      },
      {
        Header: 'Actions',
        id: 'actions',
        disableSortBy: true,
        Cell: ({ row }) => (
          <div className="aco-actions">
            <button className="aco-btn-edit" onClick={() => handleEdit(row.original)}>Edit</button>
            <button className="aco-btn-danger" onClick={() => handleDelete(row.original._id)}>Delete</button>
          </div>
        )
      }
    ],
    []
  );

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content aco-page">
        <div className="aco-header">
          <h1>Coupon Management</h1>
          <button className="aco-btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add New Coupon'}
          </button>
        </div>

        {showForm && (
          <div className="aco-form-card">
            <h2>{editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}</h2>
            <form onSubmit={handleSubmit} className="aco-form">
              <div className="aco-grid">
                <label>
                  Title
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </label>

                <label>
                  Coupon Code
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                  />
                </label>

                <label>
                  Discount Type
                  <select name="discountType" value={formData.discountType} onChange={handleInputChange}>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </label>

                <label>
                  Discount Value
                  <input
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleInputChange}
                    required
                  />
                </label>

                <label>
                  Minimum Order Value
                  <input
                    type="number"
                    name="minOrderValue"
                    value={formData.minOrderValue}
                    onChange={handleInputChange}
                  />
                </label>

                <label>
                  Maximum Discount
                  <input
                    type="number"
                    name="maxDiscount"
                    value={formData.maxDiscount}
                    onChange={handleInputChange}
                  />
                </label>

                <label>
                  Usage Limit
                  <input
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleInputChange}
                  />
                </label>

                <label>
                  Expiry Date
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                  />
                </label>
              </div>

              <label className="aco-full-width">
                Description
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </label>

              <div className="aco-image-field">
                <label>Image</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} />
                {formData.image && (
                  <img src={formData.image} alt="Coupon" className="aco-image-preview" />
                )}
              </div>

              <label className="aco-active-toggle">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                />
                Active status
              </label>

              <div className="aco-form-actions">
                <button type="submit" className="aco-btn-primary">
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        )}

        <Table columns={columns} data={coupons} show />
      </div>
    </div>
  );
};

export default AdminCouponsPage;
