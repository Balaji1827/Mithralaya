import React from "react";
import "../../css/userDashboard.css";

const Sidebar = ({ user }) => {
  return (
    <div className="sidebar">
      <div className="profile-card">
        <div className="profile-avatar">{user?.name?.charAt(0)}</div>
        <h3>{user?.name}</h3>
        <p>{user?.email}</p>
        <p>{user?.mobile}</p>
      </div>

      <div className="menu-item">My Orders</div>
      <div className="menu-item">My Address</div>
      <div className="menu-item">Wishlist</div>
      <div className="menu-item">Beyoung Wallet</div>
      <div className="menu-item">Beyoung Rewards</div>
      <div className="menu-item">Coupons</div>
      <div className="menu-item">Contact Us</div>
      <div className="menu-item">Logout</div>
    </div>
  );
};

export default Sidebar;
