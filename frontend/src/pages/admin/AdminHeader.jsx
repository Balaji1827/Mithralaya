import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import '../../css/adminheader.css';

/**
 * Shared top bar for every admin page.
 * Usage: <AdminHeader title="Products" />
 * Place it as the first thing inside .admin-content, above whatever
 * page-specific content (search bars, action buttons, tables) follows.
 */
const AdminHeader = ({ title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/auth');
  };

  return (
    <div className="adh-header">
      <h1 className="adh-title">{title}</h1>

      <div className="adh-profile" ref={wrapperRef}>
        <button
          type="button"
          className="adh-profile-btn"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="adh-avatar">
            <PersonOutlineIcon fontSize="small" />
          </span>
          <span className="adh-profile-name">{user?.name || 'Admin'}</span>
          <span className={`adh-caret ${open ? 'open' : ''}`} />
        </button>

        {open && (
          <div className="adh-dropdown">
            <div className="adh-dropdown-user">
              <strong>{user?.name || 'Admin'}</strong>
              {user?.email && <span>{user.email}</span>}
            </div>
            <button type="button" className="adh-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHeader;
