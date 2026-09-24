import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../../css/footer.css";
import { appstore, exchange, footer_1, footer_10, footer_11, footer_2, footer_3, footer_4, footer_5, footer_6, footer_7, footer_8, footer_9, googleplay, rupee } from "../../assets";
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";
import { FaThreads } from "react-icons/fa6";

// ⚠️ NOTE: intha URLs innum BullRise account-oda irukku —
// Mithralaya-oda pudhu social media page URLs ready aanadhum inga maathunga
const SOCIAL_LINKS = [
  {
    name: "Facebook",
    icon: <FaFacebookF />,
    url: "https://www.facebook.com/share/14iUPok8NVp/",
  },
  {
    name: "Instagram",
    icon: <FaInstagram />,
    url: "https://www.instagram.com/bullriseclothing?igsh=MWJvaDNmeDJ0aG8yeQ==",
  },
  {
    name: "YouTube",
    icon: <FaYoutube />,
    url: "https://www.youtube.com/@bullriseclothing",
  },
  {
    name: "Threads",
    icon: <FaThreads />,
    url: "https://www.threads.com/@bullriseclothing",
  },
];

const Footer = () => {
  const [expand, setExpand] = useState(false);
  return (
    <>
      <footer className="footer">
        <div className="footer-container">

          {/* NEED HELP */}
          <div className="footer-section">
            <h3>NEED HELP</h3>
            <Link to="/contact">Contact Us</Link>
            <Link to="/track-order">Track Order</Link>
            <Link to="/return-refunds">Returns & Refunds</Link>
            <Link to="/faqs">FAQs</Link>
            <Link to="/account">My Account</Link>

            <div className="cod_01">
              <img src={exchange} alt="7 days easy returns" />
              <p>7 Days Easy Returns</p>
            </div>
          </div>

          {/* COMPANY */}
          <div className="footer-section">
            <h3>COMPANY</h3>
            <Link to="/about-us">About Us</Link>
            <Link to="/careers">Careers</Link>
            <Link to="/gift">Gift Vouchers</Link>
            <Link to="/community">Community</Link>
          </div>

          {/* MORE INFO */}
          <div className="footer-section">
            <h3>MORE INFO</h3>
            <Link to="/terms-conditions">Terms & Conditions</Link>
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/sitemap">Sitemap</Link>
            <Link to="/blogs">Blogs</Link>
          </div>

          {/* CONTACT — ⚠️ Mithralaya-oda email / phone / address confirm panni maathunga */}
          <div className="footer-section">
            <h3>CONTACT</h3>
            <p>admin@bullrise.in</p>
            <p>+91 9043902239</p>
            <p>No.72, Ground Floor, Varadharaj Flats, Thenuganapathy Nagar, 3rd Cross Street, Madambakkam,<br /> Chennai, Tamil Nadu 600119</p>
          </div>

        </div>

        {/* ===== SOCIAL MEDIA ===== */}
        <div className="social-media">
          <p>Follow Us :</p>

          <div className="social-icon">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                className={`social-link social-${social.name.toLowerCase()}`}
                title={social.name}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        <div className="who-we-are">
          <span className="label">WHO WE ARE</span>

          <div className={`input-box ${expand ? "expand" : ""}`}>
            <input type="text" placeholder="Type here..." />
          </div>

          <button
            className="plus-btn"
            onClick={() => setExpand(!expand)}
          >
            {expand ? "−" : "+"}
          </button>
        </div>

        <div className="footer_heading">
          <div className="footer_head">
            <p>100% Secure Payment :</p>
            <div className="footer_payment">
              <img src={footer_1} alt="payment" />
              <img src={footer_2} alt="payment" />
              <img src={footer_3} alt="payment" />
              <img src={footer_4} alt="payment" />
              <img src={footer_6} alt="payment" />
              <img src={footer_7} alt="payment" />
            </div>
          </div>
          <div className="footer_head">
            <p>Shipping Partners :</p>
            <div className="footer_payment">
              <img src={footer_9} alt="shipping partner" />
              <img src={footer_10} alt="shipping partner" />
              <img src={footer_11} alt="shipping partner" />
            </div>
          </div>
        </div>

        <div className="footer-copy">
          © 2026 <strong>Mithralaya — Womens & Kids</strong>. All Rights Reserved.
        </div>
      </footer>
    </>
  );
};

export default Footer;
