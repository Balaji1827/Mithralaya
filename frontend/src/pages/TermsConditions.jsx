import React from "react";
import "../css/TermsConditions.css";
import {
  FaUserCheck,
  FaUserShield,
  FaTags,
  FaShoppingCart,
  FaTruck,
  FaUndoAlt,
  FaCopyright,
  FaBan,
  FaBalanceScale,
  FaExternalLinkAlt,
  FaSyncAlt,
  FaGavel,
  FaEnvelope,
  FaPhoneAlt,
} from "react-icons/fa";

const terms = [
  {
    icon: <FaUserCheck />,
    title: "1. Eligibility",
    content: (
      <>
        <p>
          By using our Services, you confirm that you are at least
          <strong> 18 years old</strong>, or are using the Services under the
          supervision of a parent or legal guardian.
        </p>
      </>
    ),
  },
  {
    icon: <FaUserShield />,
    title: "2. Account Registration",
    content: (
      <>
        <ul>
          <li>Create an account to place orders or access certain features.</li>
          <li>Maintain the confidentiality of your account credentials.</li>
          <li>Provide accurate and up-to-date registration information.</li>
          <li>
            Bullrise is not responsible for losses caused by unauthorized use of
            your account.
          </li>
        </ul>
      </>
    ),
  },
  {
    icon: <FaTags />,
    title: "3. Products & Pricing",
    content: (
      <>
        <ul>
          <li>We strive to display accurate product information.</li>
          <li>Images, descriptions and prices may occasionally contain errors.</li>
          <li>
            Bullrise reserves the right to correct pricing or product
            information without prior notice.
          </li>
          <li>Prices may change at any time.</li>
          <li>
            Product colours may vary slightly due to screen settings and
            lighting.
          </li>
        </ul>
      </>
    ),
  },
  {
    icon: <FaShoppingCart />,
    title: "4. Orders & Payment",
    content: (
      <>
        <ul>
          <li>Provide valid payment information when placing orders.</li>
          <li>
            Orders may be cancelled due to pricing errors, stock issues or
            suspected fraud.
          </li>
          <li>Order confirmation does not guarantee product availability.</li>
          <li>
            Payments are securely processed through trusted third-party payment
            gateways.
          </li>
        </ul>
      </>
    ),
  },
  {
    icon: <FaTruck />,
    title: "5. Shipping & Delivery",
    content: (
      <>
        <ul>
          <li>Delivery dates are estimated and cannot be guaranteed.</li>
          <li>
            Delays caused by courier partners, weather or unforeseen events are
            beyond Bullrise's control.
          </li>
          <li>Ownership transfers once your order has been delivered.</li>
        </ul>
      </>
    ),
  },
  {
    icon: <FaUndoAlt />,
    title: "6. Returns & Refunds",
    content: (
      <>
        <p>
          Returns, exchanges and refunds are governed by our separate Return &
          Refund Policy available on the Bullrise website.
        </p>
      </>
    ),
  },
  {
    icon: <FaCopyright />,
    title: "7. Intellectual Property",
    content: (
      <>
        <ul>
          <li>
            All logos, graphics, product images, text and designs belong to
            Bullrise.
          </li>
          <li>
            No content may be copied, reproduced or distributed without written
            permission.
          </li>
        </ul>
      </>
    ),
  },
  {
    icon: <FaBan />,
    title: "8. User Conduct",
    content: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>Use our Services for unlawful activities.</li>
          <li>Attempt unauthorized access to our systems.</li>
          <li>Disrupt the operation of the website.</li>
          <li>Provide false or misleading information.</li>
          <li>Interfere with other users' experience.</li>
        </ul>
      </>
    ),
  },
  {
    icon: <FaBalanceScale />,
    title: "9. Limitation of Liability",
    content: (
      <>
        <p>
          Bullrise shall not be liable for indirect, incidental or consequential
          damages arising from the use of our Services or products, to the
          maximum extent permitted by applicable law.
        </p>
      </>
    ),
  },
  {
    icon: <FaExternalLinkAlt />,
    title: "10. Third-Party Links",
    content: (
      <>
        <p>
          Our website may include links to third-party websites. Bullrise is not
          responsible for the content, privacy policies or practices of those
          websites.
        </p>
      </>
    ),
  },
  {
    icon: <FaSyncAlt />,
    title: "11. Changes to These Terms",
    content: (
      <>
        <p>
          Bullrise may revise these Terms at any time. Updated Terms will be
          published on this page along with the revised "Last Updated" date.
          Continued use of our Services indicates acceptance of the updated
          Terms.
        </p>
      </>
    ),
  },
  {
    icon: <FaGavel />,
    title: "12. Governing Law",
    content: (
      <>
        <p>
          These Terms shall be governed by and interpreted in accordance with
          the laws of India.
        </p>
      </>
    ),
  },
];

const TermsConditions = () => {
  return (
    <div className="terms-page">
      <section className="terms-hero">
        <div className="container">
          <span className="hero-tag">LEGAL INFORMATION</span>

          <h1>Terms & Conditions</h1>

          <p>
            Welcome to <strong>Bullrise</strong>. These Terms & Conditions
            govern your access to and use of our website, products and services.
            By using our platform, you agree to comply with these Terms.
          </p>

          <div className="updated-date">
            Last Updated : 14 July 2026
          </div>
        </div>
      </section>

      <section className="container terms-content">
        {terms.map((item, index) => (
          <div className="term-card" key={index}>
            <div className="term-icon">{item.icon}</div>

            <div className="term-body">
              <h2>{item.title}</h2>
              {item.content}
            </div>
          </div>
        ))}

        <div className="contact-card">
          <h2>Contact Us</h2>

          <p>
            If you have any questions regarding these Terms & Conditions, feel
            free to contact our support team.
          </p>

          <div className="contact-grid">
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
      </section>
    </div>
  );
};

export default TermsConditions;