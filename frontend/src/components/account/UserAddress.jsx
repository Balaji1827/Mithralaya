// frontend/src/components/account/UserAddress.jsx
import React, { useEffect, useState } from 'react';
import { getMyProfile } from '../../services/userService';
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} from '../../services/addressService';
import { ThreeDot } from 'react-loading-indicators';
import "../../css/userDashboard.css";
const INDIAN_STATES = [
  'Andhra Pradesh', 'Delhi', 'Gujarat', 'Karnataka', 'Maharashtra',
  'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'
];

const SUGGESTED_PLACES = [
  'Home', 'Office', 'Hostel', 'PG', 'Parents Home'
];

const UserAddress = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addresses, setAddresses] = useState([]);

  const [addressId, setAddressId] = useState(null); // if not null → update mode
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    altPhone: '',
    address: '',
    pincode: '',
    landmark: '',
    city: '',
    locality: '',
    state: '',
    suggestedName: '',
    isDefault: false
  });

  const [showForm, setShowForm] = useState(false);

  // Load profile + existing addresses
  useEffect(() => {
    const load = async () => {
      try {
        const [profile, addrs] = await Promise.all([
          getMyProfile(),
          getAddresses()
        ]);

        setAddresses(addrs || []);
      } catch (err) {
        console.error('Failed to load', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      fullName: '',
      phone: '',
      altPhone: '',
      address: '',
      pincode: '',
      landmark: '',
      city: '',
      locality: '',
      state: '',
      suggestedName: '',
      isDefault: false
    });
    setAddressId(null);
  };

  const handleEdit = (addr) => {
    setForm({
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      altPhone: addr.altPhone || '',
      address: addr.address || '',
      pincode: addr.pincode || '',
      landmark: addr.landmark || '',
      city: addr.city || '',
      locality: addr.locality || '',
      state: addr.state || '',
      suggestedName: addr.suggestedName || '',
      isDefault: addr.isDefault ?? false
    });
    setAddressId(addr._id);
    setShowForm(true);
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let updated;
      if (addressId) {
        updated = await updateAddress(addressId, form);
      } else {
        updated = await createAddress(form);
      }
      setAddresses(updated || []);
      setShowForm(false);
      resetForm();
      alert(addressId ? 'Address updated successfully' : 'Address added successfully');
    } catch (err) {
      console.error('Failed to save address', err);
      alert('Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this address?')) return;

    try {
      const updated = await deleteAddress(id);
      setAddresses(updated || []);
      alert('Address deleted successfully');
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete address');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const updated = await setDefaultAddress(id);
      setAddresses(updated || []);
      alert('Default address updated');
    } catch (err) {
      console.error('Set default failed', err);
      alert('Failed to set default address');
    }
  };

  if (loading) {
    return <div className="user-section-loading"><center><ThreeDot color={["#32cd32", "#327fcd", "#cd32cd", "#cd8032"]} /></center></div>;
  }

  return (
    <div className="user-address-wrapper">
      {/* LIST OF ADDRESSES */}
      <div className="address-list-section">
        <h3 style={{ marginBottom: '1rem' }}>My Addresses</h3>

        {addresses.length === 0 ? (
          <p style={{ color: '#888', marginBottom: '1rem' }}>No addresses yet.</p>
        ) : (
          <div className="address-list">
            {addresses.map((addr) => (
              <div key={addr._id} className="address-item">
                <div className="address-item-header">
                  <strong>{addr.fullName}</strong>
                  {addr.suggestedName && (
                    <span className="address-badge">{addr.suggestedName}</span>
                  )}
                  {addr.isDefault && (
                    <span className="address-default-badge">Default</span>
                  )}
                </div>

                <div className="address-item-body">
                  <p className="address-line">{addr.address}</p>
                  {addr.locality && <p className="address-line">{addr.locality}</p>}
                  <p className="address-line">{addr.city} - {addr.pincode}</p>
                  <p className="address-line">{addr.state}</p>
                  <p className="address-line">Phone: {addr.phone}</p>
                </div>

                <div className="address-item-actions">
                  <button
                    className="btn-link"
                    onClick={() => handleEdit(addr)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-link"
                    onClick={() => handleDelete(addr._id)}
                  >
                    Delete
                  </button>
                  {!addr.isDefault && (
                    <button
                      className="btn-link"
                      onClick={() => handleSetDefault(addr._id)}
                    >
                      Set as Default
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!showForm && (
          <button
            className="btn-add-address"
            onClick={handleAddNew}
          >
            + Add New Address
          </button>
        )}
      </div>

      {/* ADD/EDIT FORM */}
      {showForm && (
        <div className="address-form-section">
          <h3>{addressId ? 'Edit Address' : 'Add New Address'}</h3>

          <form onSubmit={handleSubmit} className="user-form address-form">
            {/* Full Name */}
            <div className="user-form-row">
              <label>
                Full Name<span className="required">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter Your Name"
                value={form.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                required
              />
            </div>

            {/* Mobile Number */}
            <div className="user-form-row">
              <label>
                Mobile number<span className="required">*</span>
              </label>
              <div className="user-phone-wrapper">
                <div className="user-phone-flag">+91</div>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Alternate Number */}
            <div className="user-form-row">
              <label>Alternate number (Optional)</label>
              <div className="user-phone-wrapper">
                <div className="user-phone-flag">+91</div>
                <input
                  type="tel"
                  placeholder="Alternate Number"
                  value={form.altPhone}
                  onChange={(e) => handleChange('altPhone', e.target.value)}
                />
              </div>
            </div>

            {/* Full address */}
            <div className="user-form-row">
              <label>
                Full address<span className="required">*</span>
              </label>
              <input
                type="text"
                placeholder="Address"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                required
              />
            </div>

            {/* Pincode + Landmark */}
            <div className="user-form-row address-two-col">
              <div>
                <label>
                  Pincode<span className="required">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Pincode"
                  value={form.pincode}
                  onChange={(e) => handleChange('pincode', e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Landmark (Optional)</label>
                <input
                  type="text"
                  placeholder="Landmark"
                  value={form.landmark}
                  onChange={(e) => handleChange('landmark', e.target.value)}
                />
              </div>
            </div>

            {/* City + Locality */}
            <div className="user-form-row address-two-col">
              <div>
                <label>
                  City<span className="required">*</span>
                </label>
                <input
                  type="text"
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Locality</label>
                <input
                  type="text"
                  placeholder="Locality/Town"
                  value={form.locality}
                  onChange={(e) => handleChange('locality', e.target.value)}
                />
              </div>
            </div>

            {/* State dropdown */}
            <div className="user-form-row">
              <label>
                State<span className="required">*</span>
              </label>
              <div className="select-wrapper">
                <select
                  value={form.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  required
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Address Type / Suggested name dropdown */}
            <div className="user-form-row">
              <label>Address Type (Optional)</label>
              <div className="select-wrapper">
                <select
                  value={form.suggestedName}
                  onChange={(e) =>
                    handleChange('suggestedName', e.target.value)
                  }
                >
                  <option value="">Select Type</option>
                  {SUGGESTED_PLACES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Make default */}
            <div className="user-form-row user-checkbox-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) =>
                    handleChange('isDefault', e.target.checked)
                  }
                />
                <span>Set as Default Address</span>
              </label>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                className="user-save-btn"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              
            </div>
            <button
                type="button"
                className="user-cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserAddress;
