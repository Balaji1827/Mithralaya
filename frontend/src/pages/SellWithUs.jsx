
import React from "react";
import "../css/SellWithUs.css";

const SellWithUs = () => {
  return (
    <div className="mithralaya-sell-page">

      {/* =========================
          HERO SECTION
      ========================= */}
      <section className="mithralaya-sell-hero">

        <div className="mithralaya-hero-overlay"></div>

        <div className="mithralaya-hero-content">

          <span className="mithralaya-badge">
            JOIN THE MITHRALAYA FAMILY
          </span>

          <h1>
            Grow Your Fashion Business
            <br />
            <span>With Mithralaya</span>
          </h1>

          <p className="hero-description">
            Bring your fashion collection to Mithralaya and connect with
            customers looking for beautiful styles for women and kids.
            Showcase your products, grow your brand and become part of
            our growing fashion community.
          </p>

          <div className="mithralaya-hero-buttons">
            <button
              className="mithralaya-primary-btn"
              onClick={() =>
                window.location.href = "mailto:sales@mithralaya.com"
              }
            >
              Become a Seller
            </button>

            <a
              href="#sell-benefits"
              className="mithralaya-secondary-btn"
            >
              Explore Benefits
            </a>
          </div>

        </div>

      </section>


      {/* =========================
          INTRO SECTION
      ========================= */}
      <section className="mithralaya-intro">

        <div className="intro-container">

          <div className="intro-content">

            <span className="section-label">
              SELL WITH MITHRALAYA
            </span>

            <h2>
              Your Collection.
              <br />
              <span>Our Platform.</span>
            </h2>

            <p>
              Mithralaya is a fashion destination created for modern women
              and little ones. We bring together carefully selected
              collections from fashion sellers, boutiques, manufacturers
              and brands.
            </p>

            <p>
              Whether you specialise in women's ethnic wear, western wear,
              kids fashion, accessories or everyday essentials, Mithralaya
              gives you an opportunity to showcase your products to a wider
              audience.
            </p>

          </div>

          <div className="intro-highlight">

            <div className="highlight-card">
              <span>01</span>
              <h3>Showcase</h3>
              <p>
                Present your latest collections beautifully to fashion
                shoppers.
              </p>
            </div>

            <div className="highlight-card">
              <span>02</span>
              <h3>Connect</h3>
              <p>
                Reach customers searching for women's and kids' fashion.
              </p>
            </div>

            <div className="highlight-card">
              <span>03</span>
              <h3>Grow</h3>
              <p>
                Build your brand and expand your online sales.
              </p>
            </div>

          </div>

        </div>

      </section>


      {/* =========================
          CATEGORIES
      ========================= */}
      <section className="mithralaya-categories">

        <div className="section-heading">

          <span className="section-label">
            WHAT YOU CAN SELL
          </span>

          <h2>
            Fashion For
            <span> Every Moment</span>
          </h2>

          <p>
            Bring your unique products and collections to Mithralaya.
          </p>

        </div>

        <div className="category-grid">

          <div className="category-card women-card">
            <div className="category-overlay"></div>

            <div className="category-content">
              <span>01</span>
              <h3>Women's Fashion</h3>
              <p>
                Sarees, kurtis, dresses, tops, ethnic wear, western wear,
                nightwear and more.
              </p>
            </div>
          </div>


          <div className="category-card kids-card">
            <div className="category-overlay"></div>

            <div className="category-content">
              <span>02</span>
              <h3>Kids Fashion</h3>
              <p>
                Stylish and comfortable clothing collections for babies,
                girls and boys.
              </p>
            </div>
          </div>


          <div className="category-card accessories-card">
            <div className="category-overlay"></div>

            <div className="category-content">
              <span>03</span>
              <h3>Accessories</h3>
              <p>
                Fashion accessories, bags, jewellery, hair accessories and
                everyday essentials.
              </p>
            </div>
          </div>

        </div>

      </section>


      {/* =========================
          BENEFITS
      ========================= */}
      <section
        className="mithralaya-benefits"
        id="sell-benefits"
      >

        <div className="section-heading">

          <span className="section-label">
            WHY SELL WITH US
          </span>

          <h2>
            More Than Just
            <span> A Marketplace</span>
          </h2>

          <p>
            Everything you need to take your fashion business forward.
          </p>

        </div>


        <div className="benefits-grid">

          <div className="benefit-card">
            <div className="benefit-number">01</div>

            <h3>Reach More Customers</h3>

            <p>
              Showcase your products to a growing audience of women,
              families and fashion-conscious shoppers.
            </p>
          </div>


          <div className="benefit-card">
            <div className="benefit-number">02</div>

            <h3>Grow Your Brand</h3>

            <p>
              Build visibility for your brand and create a stronger online
              presence with Mithralaya.
            </p>
          </div>


          <div className="benefit-card">
            <div className="benefit-number">03</div>

            <h3>Easy Product Management</h3>

            <p>
              Manage your products, pricing, inventory and collections
              through a simple seller experience.
            </p>
          </div>


          <div className="benefit-card">
            <div className="benefit-number">04</div>

            <h3>Secure Payments</h3>

            <p>
              Enjoy a reliable selling experience with secure payment and
              order processing.
            </p>
          </div>


          <div className="benefit-card">
            <div className="benefit-number">05</div>

            <h3>Dedicated Support</h3>

            <p>
              Get assistance whenever you need help managing your seller
              journey.
            </p>
          </div>


          <div className="benefit-card">
            <div className="benefit-number">06</div>

            <h3>Built For Fashion</h3>

            <p>
              Be part of a platform designed around women's and kids'
              fashion and lifestyle.
            </p>
          </div>

        </div>

      </section>


      {/* =========================
          HOW IT WORKS
      ========================= */}
      <section className="mithralaya-how">

        <div className="section-heading">

          <span className="section-label">
            HOW IT WORKS
          </span>

          <h2>
            Start Selling In
            <span> Simple Steps</span>
          </h2>

        </div>


        <div className="steps-container">

          <div className="step-item">
            <div className="step-circle">01</div>

            <h3>Register</h3>

            <p>
              Submit your seller details and tell us about your business.
            </p>
          </div>


          <div className="step-line"></div>


          <div className="step-item">
            <div className="step-circle">02</div>

            <h3>Get Verified</h3>

            <p>
              Our team will review your details and verify your seller
              account.
            </p>
          </div>


          <div className="step-line"></div>


          <div className="step-item">
            <div className="step-circle">03</div>

            <h3>List Products</h3>

            <p>
              Upload your products, images, prices, sizes and available
              stock.
            </p>
          </div>


          <div className="step-line"></div>


          <div className="step-item">
            <div className="step-circle">04</div>

            <h3>Start Selling</h3>

            <p>
              Your products are ready to reach Mithralaya customers.
            </p>
          </div>

        </div>

      </section>


      {/* =========================
          SELLER TYPES
      ========================= */}
      <section className="mithralaya-seller-types">

        <div className="seller-types-container">

          <div className="seller-types-content">

            <span className="section-label">
              WHO CAN SELL
            </span>

            <h2>
              Built For
              <br />
              <span>Fashion Businesses</span>
            </h2>

            <p>
              Mithralaya welcomes fashion businesses of different sizes.
              Whether you are an established brand or a growing boutique,
              there is a place for your collection.
            </p>

          </div>


          <div className="seller-types-list">

            <div className="seller-type">
              <span>01</span>
              <strong>Fashion Brands</strong>
            </div>

            <div className="seller-type">
              <span>02</span>
              <strong>Boutiques</strong>
            </div>

            <div className="seller-type">
              <span>03</span>
              <strong>Manufacturers</strong>
            </div>

            <div className="seller-type">
              <span>04</span>
              <strong>Wholesalers</strong>
            </div>

            <div className="seller-type">
              <span>05</span>
              <strong>Independent Designers</strong>
            </div>

            <div className="seller-type">
              <span>06</span>
              <strong>Kidswear Sellers</strong>
            </div>

          </div>

        </div>

      </section>


      {/* =========================
          CTA
      ========================= */}
      <section className="mithralaya-final-cta">

        <div className="cta-content">

          <span className="section-label">
            LET'S GROW TOGETHER
          </span>

          <h2>
            Ready To Bring Your
            <br />
            <span>Collection To Mithralaya?</span>
          </h2>

          <p>
            Join our growing seller community and take your women's and
            kids' fashion business online.
          </p>

          <button
            className="mithralaya-cta-btn"
            onClick={() =>
              window.location.href = "mailto:sales@mithralaya.com"
            }
          >
            Become a Mithralaya Seller
          </button>

        </div>

      </section>

    </div>
  );
};

export default SellWithUs;

