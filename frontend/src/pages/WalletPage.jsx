import React from 'react';
import '../css/wallet.css';

const WalletPage = () => {
  return (
    <div className="wallet-page">
      <div className="wallet-container">
        <h1 className="wallet-title">Metro Wallet</h1>
        <div className="wallet-content">
          <div className="wallet-balance">
            <img src="https://cdn3d.iconscout.com/3d/premium/thumb/wallet-3d-icon-png-download-4323761.png" alt="Wallet" className="wallet-image" height=" 150px" width="150px" />
            <h2>Wallet Balance</h2>
            <h5> This Feature will be enabled soon 🚀</h5>
            <div className="balance-amount">₹0.00</div>
          </div>
          <div className="wallet-actions">
            <button className="wallet-btn">Add Money</button>
            <button className="wallet-btn">Withdraw</button>
          </div>
          <div className="wallet-history">
            <h3>Transaction History</h3>
            <p className="coming-soon">Transaction history will be available soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
