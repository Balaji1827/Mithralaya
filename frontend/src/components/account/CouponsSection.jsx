import React, { useState, useEffect } from 'react';
import { applyCoupon, getActiveCoupons } from '../../services/couponService';
import '../../css/coupon.css';

const CouponsSection = ({ cartTotal, onApply }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCoupons = async () => {
      try {
        const data = await getActiveCoupons();
        setCoupons(data);
      } catch (err) {
        console.error('Failed to load coupons:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCoupons();
  }, []);

  const handleApply = async () => {
    try {
      const data = await applyCoupon({
        code,
        orderAmount: cartTotal
      });
      onApply(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid coupon');
    }
  };

  return (
    <div className="coupon-section">
      <div className="available-coupons">
        <h3>Available Coupons</h3>
        {loading ? (
          <p>Loading coupons...</p>
        ) : coupons.length === 0 ? (
          <div className='No-coupons'>
            <center>
          <img src="https://cdn3d.iconscout.com/3d/premium/thumb/coupon-3d-icon-png-download-10660366.png" height="200px" width="200px" alt="coupon image" />
          <p>No active coupons available</p></center></div>
        ) : (
          <div className="coupon-list">
            {coupons.map((coupon) => (
              <div key={coupon._id} className="coupon-card">
                <div className="coupon-header">
                  <strong>{coupon.title}</strong>
                  <span className="coupon-code">{coupon.code}</span>
                </div>
                <p className="coupon-description">{coupon.description}</p>
                <div className="coupon-details">
                  {coupon.discountType === 'percentage' ? (
                    <span>{coupon.discountValue}% off</span>
                  ) : (
                    <span>₹{coupon.discountValue} off</span>
                  )}
                  {coupon.minOrderValue > 0 && (
                    <span>Min order: ₹{coupon.minOrderValue}</span>
                  )}
                  {coupon.maxDiscount && coupon.discountType === 'percentage' && (
                    <span>Max discount: ₹{coupon.maxDiscount}</span>
                  )}
                </div>
                {coupon.expiryDate && (
                  <p className="coupon-expiry">
                    Expires: {new Date(coupon.expiryDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="coupon-box">
        <h3>Apply Coupon</h3>

        <input
          type="text"
          placeholder="Enter coupon code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <button onClick={handleApply}>Apply</button>

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
};

export default CouponsSection;
