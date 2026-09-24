import React from "react";
import { useNavigate } from "react-router-dom";
import "../../css/CouponsPage.css";

// Central list of coupons — reuse this in OfferCoupons / CartPage too if you want a single source of truth
export const COUPONS = [
  {
    code: "B2G250",
    title: "Buy 2 Get ₹250 Off*",
    description: "Applies automatically when your cart has 2 or more eligible items.",
  },
  {
    code: "B3G500",
    title: "Buy 3 Get ₹500 Off*",
    description: "Applies automatically when your cart has 3 or more eligible items.",
  },
  {
    code: "FIRST10",
    title: "Flat 10% Off Above ₹1499",
    description: "Get 10% off on your first order when the cart total is above ₹1,499.",
  },
  {
    code: "FREESHIP",
    title: "Free Shipping on All Orders",
    description: "No minimum order value — free delivery applied at checkout.",
  },
];

const CouponsPage = () => {
  const navigate = useNavigate();
  const [copiedCode, setCopiedCode] = React.useState(null);

  const handleCopy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (err) {
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  return (
    <div className="coupons-page">
      <div className="coupons-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="coupons-title">Coupons &amp; Offers</h1>
        <p className="coupons-subtitle">
          Apply any of these codes at checkout to save on your order.
        </p>
      </div>

      <div className="coupons-grid">
        {COUPONS.map((c) => (
          <div className="coupon-card" key={c.code}>
            <div className="coupon-card-top">
              <div className="coupon-icon">%</div>
              <div>
                <p className="coupon-card-title">{c.title}</p>
                <p className="coupon-card-desc">{c.description}</p>
              </div>
            </div>

            <div className="coupon-card-bottom">
              <span className="coupon-card-code">{c.code}</span>
              <button
                className={`coupon-copy-btn ${copiedCode === c.code ? "copied" : ""}`}
                onClick={() => handleCopy(c.code)}
              >
                {copiedCode === c.code ? "Copied!" : "Copy Code"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CouponsPage;
