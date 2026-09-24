import React from "react";
import "../css/ReturnsRefunds.css";
import {
  FaUndoAlt,
  FaBoxOpen,
  FaMoneyBillWave,
  FaExchangeAlt,
  FaExclamationTriangle,
  FaShippingFast,
  FaTimesCircle,
  FaPhoneAlt,
  FaEnvelope,
} from "react-icons/fa";

const ReturnsRefunds = () => {
  return (
    <div className="returns-page">

      <div className="returns-hero">
        <div className="container">
          <h1>Return & Refund Policy</h1>
          <p>
            We want you to love every purchase from <strong>Bullrise</strong>.
            If something isn't right, we're here to help.
          </p>

          <span>Last Updated : 14 July 2026</span>
        </div>
      </div>

      <div className="container">

        <div className="policy-card">
          <h2>
            <FaUndoAlt /> 1. Return Eligibility
          </h2>

          <p>
            You may request a return within <strong>7 days</strong> of receiving
            your order if:
          </p>

          <ul>
            <li>Item is unused, unworn and unwashed.</li>
            <li>Original tags and packaging are intact.</li>
            <li>Order number or invoice is available.</li>
            <li>Item passes our quality inspection.</li>
          </ul>
        </div>

        <div className="policy-card">
          <h2>
            <FaBoxOpen /> 2. Non-Returnable Items
          </h2>

          <ul>
            <li>Sale or Clearance Items (unless defective)</li>
            <li>Customized or Made-to-Order Products</li>
            <li>Gift Cards</li>
          </ul>
        </div>

        <div className="policy-card">
          <h2>
            <FaShippingFast /> 3. How to Initiate a Return
          </h2>

          <ol>
            <li>Email us at <strong>admin@bullrise.in</strong></li>
            <li>Share your Order Number and reason for return.</li>
            <li>Our support team will verify your request.</li>
            <li>Pack the product with original tags and packaging.</li>
            <li>Ship the item or schedule pickup (where available).</li>
          </ol>
        </div>

        <div className="policy-card">
          <h2>
            <FaMoneyBillWave /> 4. Refunds
          </h2>

          <ul>
            <li>Products are inspected after receiving the return.</li>
            <li>
              Approved refunds are processed within
              <strong> 7–10 Business Days.</strong>
            </li>
            <li>
              Shipping charges are non-refundable unless the error is ours.
            </li>
            <li>
              For delayed refunds contact:
              <strong> admin@bullrise.in</strong>
            </li>
          </ul>
        </div>

        <div className="policy-card">
          <h2>
            <FaExchangeAlt /> 5. Exchanges
          </h2>

          <p>
            Need another size or color? Exchange requests are accepted based on
            stock availability and follow the same return eligibility rules.
          </p>
        </div>

        <div className="policy-card">
          <h2>
            <FaExclamationTriangle /> 6. Damaged / Defective / Incorrect Items
          </h2>

          <ul>
            <li>Report within 48 hours after delivery.</li>
            <li>Share clear product and packaging photos.</li>
            <li>
              We'll arrange a replacement, exchange, or full refund at no extra
              cost.
            </li>
          </ul>
        </div>

        <div className="policy-card">
          <h2>
            <FaShippingFast /> 7. Return Shipping Costs
          </h2>

          <ul>
            <li>Customer pays shipping for change-of-mind returns.</li>
            <li>
              Bullrise covers shipping if the product is defective, damaged, or
              incorrectly shipped.
            </li>
          </ul>
        </div>

        <div className="policy-card">
          <h2>
            <FaTimesCircle /> 8. Order Cancellations
          </h2>

          <p>
            Orders can be cancelled before dispatch. Once shipped, cancellation
            isn't possible and the standard return policy will apply.
          </p>
        </div>

        <div className="contact-card">
          <h2>Need Help?</h2>

          <p>
            Have questions regarding returns, refunds or exchanges? Contact us.
          </p>

          <div className="contact-box">
            <div>
              <FaEnvelope />
              <span>admin@bullrise.in</span>
            </div>

            <div>
              <FaPhoneAlt />
              <span>9043902239</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default ReturnsRefunds;