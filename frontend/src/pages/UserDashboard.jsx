import React, { useEffect, useState } from 'react';
import AccountWishlist from '../components/account/AccountWishlist';
import AccountOrders from '../components/account/AccountOrders';
import WalletPage from './WalletPage';
import UserAdress from '../components/account/UserAddress';
import CouponsSection from '../components/account/CouponsSection';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from "react-router-dom";
import { getMyProfile, updateMyProfile } from "../services/userService";
import '../css/userDashboard.css';
const UserDashboard = () => {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    mobile: '',
    gender: '',
    dateOfBirth: '',
    whatsappOptIn: false
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🔹 which tab is open on the right side: 'profile' or 'address'
  const [activeTab, setActiveTab] = useState('profile');

  // 🔹 mobile sidebar toggle
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Check for navigation state (e.g. redirect from Cart -> Orders)
  const location = window.location; // or useLocation from react-router
  // actually we need useLocation
  const { state } = useLocation();

  useEffect(() => {
    if (state?.activeTab) {
      setActiveTab(state.activeTab);
    }
  }, [state]);

  // ---------- LOAD PROFILE FROM BACKEND ----------
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getMyProfile();
        setProfile({
          name: data.name || user?.name || '',
          email: data.email || user?.email || '',
          mobile:
            data.mobile ||
            data.phone ||
            user?.mobile ||
            user?.phone ||
            '',
          gender: data.gender || '',
          dateOfBirth: data.dateOfBirth
            ? data.dateOfBirth.substring(0, 10)
            : '',
          whatsappOptIn: !!data.whatsappOptIn
        });
      } catch (err) {
        console.error('Failed to load profile', err);
        if (err.response?.status === 401) {
          navigate('/auth');
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate, user]);

  const initialLetter =
    profile.name?.[0]?.toUpperCase() ||
    user?.name?.[0]?.toUpperCase() ||
    'U';

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateMyProfile(profile);
      setProfile((prev) => ({
        ...prev,
        name: updated.name || prev.name,
        email: updated.email || prev.email,
        mobile: updated.mobile || updated.phone || prev.mobile
      }));
      // update auth context display name
      if (setUser) {
        setUser((prev) => ({
          ...(prev || {}),
          name: updated.name || prev?.name,
          email: updated.email || prev?.email,
          mobile: updated.mobile || updated.phone || prev?.mobile
        }));
      }
      alert('Profile updated successfully');
    } catch (err) {
      console.error('Update failed', err);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) {
    return <div className="user-dashboard-loading">Loading profile…</div>;
  }

  return (
    <div className="user-dashboard">
      {/* MOBILE OVERLAY */}
      {mobileSidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileSidebarOpen(false)}
        ></div>
      )}

      {/* LEFT SIDEBAR */}
      <aside className={`user-sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
        <div className="user-card">
          <div className="user-avatar-circle">{initialLetter}</div>
          <div className="user-card-name">{profile.name}</div>
          <div className="user-card-contact">
            <span>{profile.email}</span>
            {profile.mobile && (
              <>
                <span className="user-card-sep">|</span>
                <span>{profile.mobile}</span>
              </>
            )}
          </div>
          <button
            className="user-edit-icon"
            type="button"
            onClick={() => {
              const el = document.getElementById('fullNameField');
              if (el) el.focus();
            }}
          >
            ✏️
          </button>
        </div>

        <nav className="user-menu">
          {/* We’ll wire these others later; they’re visual for now */}
          <button
            className={
              'user-menu-item' + (activeTab === 'profile' ? ' active' : '')
            }
            type="button"
            onClick={() => {
              setActiveTab('profile');
              setMobileSidebarOpen(false);
            }}
          >
            <span className="user-menu-icon">👤</span>
            <span>My Profile</span>
          </button>

          <button
            className={
              'user-menu-item' + (activeTab === 'orders' ? ' active' : '')
            }
            type="button"
            onClick={() => {
              setActiveTab('orders');
              setMobileSidebarOpen(false);
            }}
          >
            <span className="user-menu-icon">🧾</span>
            <span>My Orders</span>
          </button>

          <button
            className={
              'user-menu-item' + (activeTab === 'address' ? ' active' : '')
            }
            type="button"
            onClick={() => {
              setActiveTab('address');
              setMobileSidebarOpen(false);
            }}
          >
            <span className="user-menu-icon">📍</span>
            <span>My Address</span>
          </button>

          <button
            className={
              'user-menu-item' + (activeTab === 'wishlist' ? ' active' : '')
            }
            type="button"
            onClick={() => {
              setActiveTab('wishlist');
              setMobileSidebarOpen(false);
            }}
          >
            <span className="user-menu-icon">❤️</span>
            <span>Wishlist</span>
          </button>

          <button
            className={
              'user-menu-item' + (activeTab === 'wallet' ? ' active' : '')
            }
            type="button"
            onClick={() => {
              setActiveTab('wallet');
              setMobileSidebarOpen(false);
            }}
          >
            <span className="user-menu-icon">💼</span>
            <span>Metro Wallet</span>
          </button>
          <button
            className={
              'user-menu-item' + (activeTab === 'coupons' ? ' active' : '')
            }
            type="button"
            onClick={() => {
              setActiveTab('coupons');
              setMobileSidebarOpen(false);
            }}
          >
            <span className="user-menu-icon">🎟️</span>
            <span>Coupons</span>
          </button>
          <button
            className={
              'user-menu-item' + (activeTab === 'contact' ? ' active' : '')
            }
            type="button"
            onClick={() => {
              navigate('/contact');
              setMobileSidebarOpen(false);
            }}
          >
            <span className="user-menu-icon">📨</span>
            <span>Contact Us</span>
          </button>
          <button
            className="user-menu-item logout"
            type="button"
            onClick={() => {
              handleLogout();
              setMobileSidebarOpen(false);
            }}
          >
            <span className="user-menu-icon">🚪</span>
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* RIGHT CONTENT */}
      <main className="user-main">
        <header className="user-main-header">
          <button
            className="hamburger-btn"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            type="button"
          >
            ☰
          </button>
          {activeTab === 'address'
            ? 'My Address'
            : activeTab === 'wishlist'
              ? 'Wishlist'
              : activeTab === 'orders'
                ? 'My Orders'
                : activeTab === 'rewards'
                  ? 'Rewards'
                  : activeTab === 'coupons'
                    ? 'Coupons'
                    : activeTab === 'contact'
                      ? 'Contact Us'
                      : 'My Profile'}
        </header>

        <div className="user-main-body">
          {activeTab === 'address' ? (
            <UserAdress />
          ) : activeTab === 'wishlist' ? (
            <AccountWishlist />
          ) : activeTab === 'orders' ? (
            <AccountOrders />
          ) : activeTab === 'wallet' ? (
            <WalletPage />
          ) : activeTab === 'coupons' ? (
            <CouponsSection />
          ) : activeTab === 'profile' ? (

            <form className="user-form" onSubmit={handleSave}>
              <div className="user-form-row">
                <label htmlFor="fullNameField">
                  Full Name<span className="required">*</span>
                </label>
                <input
                  id="fullNameField"
                  type="text"
                  value={profile.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="user-form-row">
                <label>
                  Email Id<span className="required">*</span>
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  readOnly
                />
              </div>

              <div className="user-form-row">
                <label>
                  Mobile<span className="required">*</span>
                </label>
                <div className="user-phone-wrapper">
                  <div className="user-phone-flag">+91</div>
                  <input
                    type="tel"
                    value={profile.mobile}
                    onChange={(e) =>
                      handleChange('mobile', e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div className="user-form-row">
                <label>
                  Gender<span className="required">*</span>
                </label>
                <div className="user-gender-group">
                  <button
                    type="button"
                    className={
                      'gender-pill' +
                      (profile.gender === 'male' ? ' active' : '')
                    }
                    onClick={() => handleChange('gender', 'male')}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    className={
                      'gender-pill' +
                      (profile.gender === 'female' ? ' active' : '')
                    }
                    onClick={() => handleChange('gender', 'female')}
                  >
                    Female
                  </button>
                  <button
                    type="button"
                    className={
                      'gender-pill' +
                      (profile.gender === 'other' ? ' active' : '')
                    }
                    onClick={() => handleChange('gender', 'other')}
                  >
                    Other
                  </button>
                </div>
              </div>

              <div className="user-form-row">
                <label>
                  Date of birth<span className="required">*</span>
                </label>
                <div className="user-date-wrapper">
                  <input
                    type="date"
                    value={profile.dateOfBirth}
                    onChange={(e) =>
                      handleChange('dateOfBirth', e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div className="user-form-row user-checkbox-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={profile.whatsappOptIn}
                    onChange={(e) =>
                      handleChange('whatsappOptIn', e.target.checked)
                    }
                  />
                  <span>
                    I want to receive order updates on WhatsApp
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="user-save-btn"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </form>
          ) : (
            <div className="user-card-block">
              <div className="user-empty-state">
                This section will be available soon.
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
