import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  getProduct,
  getStorefrontTextileProduct,
  getTextileProducts
} from "../services/productService";
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import formatPrice from '../utils/formatPrice';
import "../css/productdetails.css";
import "../css/Sizepopup.css";
import { getProductReviews } from "../services/reviewService";

import { HiOutlineBuildingStorefront } from "react-icons/hi2";
import { FaUsers } from "react-icons/fa";

import ProductCard from "../components/product/ProductCard.jsx";

import {
  TbShirt,
  TbAlertTriangle,
  TbWash,
  TbRefresh,
  TbBuildingFactory2,
  TbGift
} from "react-icons/tb";


const SIZE_CHEST_MAP = {
  S: 'Chest: 38 in',
  M: 'Chest: 40 in',
  L: 'Chest: 42 in',
  XL: 'Chest: 44 in',
  // Product data uses "XXL" (see productdetails.json), not "2XL" — both
  // aliases are kept here so the chest label resolves either way.
  XXL: 'Chest: 46 in',
  '2XL': 'Chest: 46 in',
  '3XL': 'Chest: 48 in',
  '4XL': 'Chest: 50 in',
};

// Standard size display order: S M L XL XXL ...
const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL'];

const sortSizes = (sizes) =>
  [...sizes].sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(String(a).toUpperCase());
    const bi = SIZE_ORDER.indexOf(String(b).toUpperCase());
    // unknown sizes (numeric like 30/32/34 or "Free Size") go after the
    // lettered sizes, sorted naturally among themselves
    if (ai === -1 && bi === -1) {
      return String(a).localeCompare(String(b), undefined, { numeric: true });
    }
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

const ACCORDION_SECTIONS = [
  {
    key: "details",
    icon: <TbShirt />,
    title: "Product Details",
    subtitle: "Detail and Highlight",
  },
  {
    key: "disclaimer",
    icon: <TbAlertTriangle />,
    title: "Product Disclaimer",
    subtitle: "Minor variations in size (±5%) and color may occur.",
  },
  {
    key: "washcare",
    icon: <TbWash />,
    title: "Wash Care",
    subtitle: "Guidelines for washing and maintaining the product.",
  },
  {
    key: "returns",
    icon: <TbRefresh />,
    title: "Return & Refund Policy",
    subtitle: "Know about our policy",
  },
  {
    key: "manufacturing",
    icon: <TbBuildingFactory2 />,
    title: "Manufacturing Details",
    subtitle: "Marketed and manufactured by",
  },
  {
    key: "offers",
    icon: <TbGift />,
    title: "Save extra with Offers",
    subtitle: "",
  },
];

const ProductDetailsPage = () => {
  const { id } = useParams();
  const { search } = useLocation();
  const isTextileProduct = new URLSearchParams(search).get('textile') === 'true';
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [qty, setQty] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [pincode, setPincode] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [showSizePopup, setShowSizePopup] = useState(false);
  const [reviews, setReviews] = useState([]);

  const toggleAccordion = (section) => {
    setActiveAccordion(activeAccordion === section ? null : section);
  };

  useEffect(() => {

    window.scrollTo(0, 0);

    setSelectedImageIndex(0);
    setActiveAccordion(null);

    const load = async () => {
      try {
        const rawProduct = isTextileProduct
          ? await getStorefrontTextileProduct(id)
          : await getProduct(id);

        const variants = rawProduct.variants || [];
        const firstVariant = variants[0] || null;

        const p = isTextileProduct
          ? {
            ...rawProduct,
            price:
              variants.length > 0
                ? Math.min(...variants.map(v => Number(v.retailPrice)))
                : Number(rawProduct.retailPrice || 0),
            mrp:
              variants.length > 0
                ? Math.max(...variants.map(v => Number(v.mrp)))
                : Number(rawProduct.mrp || 0),
            // sizes always shown in S M L XL XXL ... order
            sizes:
              variants.length > 0
                ? sortSizes(variants.map(v => v.size))
                : sortSizes(rawProduct.sizes || []),
            // size -> stockAvailable map, so out-of-stock sizes can be
            // shown disabled instead of silently orderable
            sizeStock:
              variants.length > 0
                ? Object.fromEntries(
                  variants.map(v => [v.size, Number(v.stockAvailable) || 0])
                )
                : {},
            colors:
              rawProduct.colors?.length
                ? rawProduct.colors
                : rawProduct.color
                  ? [rawProduct.color]
                  : [],
            style: rawProduct.sleeveOrStyle,
            // NOTE: gst, sku and warehouseName live on each variant, not on
            // the product itself. Fall back to the first variant here;
            // once a size is picked, the JSX below re-resolves these from
            // the variant that actually matches the selected size.
            gst: firstVariant?.gst,
            sku: firstVariant?.sku,
            warehouseName: rawProduct.warehouseName || firstVariant?.warehouseName,
            supplierName: rawProduct.supplierName || firstVariant?.supplierName,
          }
          : {
            ...rawProduct,
            sizes: sortSizes(rawProduct.sizes || []),
          };

        setProduct(p);
        console.log("Product ID:", p._id);
        const reviewData = await getProductReviews(p._id);
        console.log("Review API Response:", reviewData);
        setReviews(reviewData);

        // Size is intentionally left unselected — the person must pick
        // one themselves. Only color gets a sensible default.
        setSize("");
        setColor(p.colors?.[0] || "");

        const response = await getTextileProducts();

        const related = response.products
          .filter(item => item._id !== p._id)
          .slice(0, 20);

        setRelatedProducts(related);
      } catch (err) {
        console.error(err);
      }
    };

    load();
  }, [id, isTextileProduct]);

  if (!product) return null;

  const discount =
    product.mrp && product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  // true only when the product has sizes and every single one is sold out
  const allOutOfStock =
    product.sizes?.length > 0 &&
    product.sizes.every((s) => (product.sizeStock?.[s] ?? 1) === 0);

  // The variant matching the currently-selected size (falls back to the
  // first variant when nothing is picked yet), used to resolve
  // per-size fields like GST, SKU and warehouse.
  const activeVariant =
    product.variants?.find((v) => v.size === size) || product.variants?.[0] || null;

  const handlePrev = () =>
    setSelectedImageIndex((i) =>
      i === 0 ? (product.images?.length || 1) - 1 : i - 1
    );
  const handleNext = () =>
    setSelectedImageIndex((i) =>
      i === (product.images?.length || 1) - 1 ? 0 : i + 1
    );

  const handleAddToCart = async () => {
    if (allOutOfStock) return;
    if (product.sizes?.length > 0 && !size) {
      setShowSizePopup(true);
      return;
    }

    // Login illa-na — product details-a save panni login-ku redirect
    if (!user) {
      localStorage.setItem('pendingCartItem', JSON.stringify({
        productId: product._id,
        qty,
        size,
        color,
        catalogType: isTextileProduct ? 'textile' : 'legacy'
      }));
      navigate('/auth', { state: { from: window.location.pathname + window.location.search } });
      return;
    }

    try {
      await addToCart({
        productId: product._id,
        qty,
        size,
        color,
        catalogType: isTextileProduct ? "textile" : "legacy",
      });
      navigate("/cart");
    } catch (err) {
      console.log(err.response);
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleBuyNow = async () => {
    if (allOutOfStock) return;
    if (product.sizes?.length > 0 && !size) {
      setShowSizePopup(true);
      return;
    }

    const payload = {
      productId: product._id,
      qty,
      size,
      color,
      catalogType: isTextileProduct ? 'textile' : 'legacy'
    };

    if (!user) {
      localStorage.setItem('pendingCartItem', JSON.stringify(payload));
      navigate('/auth', {
        state: { from: window.location.pathname + window.location.search }
      });
      return;
    }

    await addToCart(payload);
    navigate('/cart');
  };

  const chestLabel = SIZE_CHEST_MAP[String(size).toUpperCase()] || '';

  // Key highlights from product data.
  // NOTE: "Sleeve" and "Style" pull from productType / sleeveOrStyle —
  // these were previously mislabeled as "Neck" (which showed sleeve
  // length like "Half Sleeve", not an actual neck type) and "style" was
  // captured on the product object but never rendered anywhere.
  const highlights = [
    {
      key: "Fit",
      val: product.fit || "Regular Fit",
    },
    {
      key: "Occasion",
      val: product.occasion || "Casual",
    },
    {
      key: "Sleeve",
      val: product.productType || "-",
    },
    {
      key: "Style",
      val: product.style || "-",
    },
    {
      key: "Fabric",
      val: product.material || "-",
    },
    {
      key: "Pattern Coverage",
      val: product.pattern || "Plain",
    },
    {
      key: "Brand",
      val: product.brand || "-",
    },
  ];

  return (
    <div className="pdp-page">
      {/* Breadcrumb */}
      <nav className="pdp-breadcrumb">
        <Link to="/">Home</Link>
        {product.category && (
          <><span>›</span><Link to={`/category/${product.category}`}>{product.category}</Link></>
        )}
        {product.subCategory && (
          <><span>›</span><span>{product.subCategory}</span></>
        )}
        {product.name && (
          <><span>›</span><span>{product.name}</span></>
        )}
      </nav>

      <div className="pdp-wrapper">
        {/* ── LEFT: Gallery ── */}
        <div className="pdp-gallery">
          {product.images?.length > 0 && (
            <div className="pdp-thumbnails">
              {product.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`${product.name} ${i + 1}`}
                  className={`pdp-thumb ${i === selectedImageIndex ? 'active' : ''}`}
                  onClick={() => setSelectedImageIndex(i)}
                />
              ))}
            </div>
          )}

          <div className="pdp-main-image"
            onMouseMove={(e) => {
              const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty('--x', `${((e.clientX - left) / width) * 100}%`);
              e.currentTarget.style.setProperty('--y', `${((e.clientY - top) / height) * 100}%`);
            }}
          >

            {product.images?.length > 1 && (
              <button className="pdp-arrow pdp-arrow--left" onClick={handlePrev}>&#8249;</button>
            )}

            {product.images?.[selectedImageIndex] ? (
              <img
                src={product.images[selectedImageIndex]}
                alt={product.name}
                className="zoom-image"
              />
            ) : (
              <div className="pdp-img-placeholder">Image</div>
            )}

            {product.images?.length > 1 && (
              <button className="pdp-arrow pdp-arrow--right" onClick={handleNext}>&#8250;</button>
            )}

              <div className="ai-actions">
              <button className="ai-btn ai-360">
                <span className="ai-icon">🔄</span>
                <span>360° View</span>
              </button>

              <button className="ai-btn ai-tryon">
                <span className="ai-icon">✨</span>
                <span>Try On</span>
              </button>
            </div>



           
          </div>
         
        </div>

        {/* ── RIGHT: Details ── */}
        <div className="pdp-info">

          {/* Title + Share */}
          {/* Product Category */}
          <div className="pdp-product-path">
            <span className="pdp-chip">{product.category}</span>

            {product.subCategory && (
              <>
                <span className="pdp-dot">•</span>
                <span className="pdp-chip">{product.subCategory}</span>
              </>
            )}

            {product.productType && (
              <>
                <span className="pdp-dot">•</span>
                <span className="pdp-chip">{product.productType}</span>
              </>
            )}
          </div>

          {/* Product Name */}
          <div className="pdp-title-row">
            <h1 className="pdp-title">{product.name}</h1>


          </div>

          {/* Brand */}
          <div className="pdp-brand-row">
            <span className="pdp-brand-label">by</span>
            <span className="pdp-brand-name">{product.brand}</span>
          </div>

          {/* SKU (per selected variant, falls back to first variant) */}
          {activeVariant?.sku && <p className="pdp-sku">SKU: {activeVariant.sku}</p>}

          {/* Price */}
          <div className="pdp-price-row">
            <span className="pdp-price">{formatPrice(product.price)}</span>
            {product.mrp > product.price && (
              <span className="pdp-mrp">{formatPrice(product.mrp)}</span>
            )}
            {discount > 0 && (
              <span className="pdp-discount">{discount}% OFF</span>
            )}
          </div>
          <p className="pdp-tax-note">Tax included.</p>

          {/* ── Offer Cards ── */}
          {/* <OfferCoupons price={product.price} /> */}

          <hr className="pdp-divider" />

          {/* ── Color Selector ── */}
          {product.colors?.length > 0 && (
            <div className="pdp-section">
              <p className="pdp-section-label">
                Color: <span style={{ fontWeight: 400 }}>{color}</span>
              </p>
              <div className="pdp-color-options">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    title={c}
                    className={`pdp-color-swatch ${c === color ? 'active' : ''}`}
                    style={{ background: c.toLowerCase() }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          )}

          {product.colors?.length > 0 && <hr className="pdp-divider" />}

          {/* ── Size Selector ── */}
          {product.sizes?.length > 0 && (
            <div
              className={`pdp-size-section ${showSizePopup ? 'pdp-size-highlight' : ''}`}
              id="pdp-size-section"
            >
              <div className="pdp-size-header">
                <p className="pdp-size-label">
                  Size: <span>{size || '—'}</span>
                  {chestLabel && (
                    <span className="pdp-size-chest" style={{ marginLeft: 10 }}>{chestLabel}</span>
                  )}
                </p>
                <button className="pdp-size-guide">Size Guide</button>
              </div>
              <div className="pdp-size-options">
                {product.sizes.map((s) => {
                  const inStock = (product.sizeStock?.[s] ?? 1) > 0;
                  return (
                    <button
                      key={s}
                      className={`pdp-size-btn ${s === size ? 'active' : ''} ${!inStock ? 'out-of-stock' : ''}`}
                      onClick={() => inStock && setSize(s)}
                      disabled={!inStock}
                      title={inStock ? s : `${s} — Out of stock`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              {allOutOfStock && (
                <p className="pdp-oos-note">This product is currently out of stock.</p>
              )}
            </div>
          )}

          <hr className="pdp-divider" />

          {/* ── Add to Cart ── */}
          <button
            onClick={handleAddToCart}
            className="pdp-btn pdp-btn--cart"
            disabled={allOutOfStock}
          >
            {allOutOfStock ? 'Out of Stock' : 'Add to Cart 🛒'}
          </button>

          {/* Easy return note */}
          <div className="pdp-return-note">

            Easy 7-day return and exchange on this product. No questions asked.
          </div>

          {/* ── Delivery Check ── */}
          <div className="pdp-delivery-check">
            <p className="pdp-delivery-label">Check Delivery:</p>
            <div className="pdp-delivery-row">
              <input
                className="pdp-delivery-input"
                placeholder="Enter Pincode"
                value={pincode}
                onChange={e => setPincode(e.target.value)}
                maxLength={6}
              />
              <button className="pdp-delivery-btn">CHECK</button>
            </div>
          </div>

          {/* ── Trust Badges ── */}
          <div className="pdp-trust-badge">
            <HiOutlineBuildingStorefront className="pdp-trust-badge-icon" />
            <span>12+ Stores Pan India</span>
          </div>

          <div className="pdp-trust-badge">
            <FaUsers className="pdp-trust-badge-icon" />
            <span>Trusted by 2.5M+ happy customers</span>
          </div>

          <div className="pdp-trust-badge">
            <TbRefresh className="pdp-trust-badge-icon" />
            <span>Easy Return & Exchange</span>
          </div>
          {/* ── Key Highlights ── */}
          {highlights.length > 0 && (
            <>
              <p className="pdp-highlights-title">Key Highlights</p>
              <div className="pdp-highlights-grid">
                {highlights.map(h => (
                  <div className="pdp-highlight-cell" key={h.key}>
                    <span className="pdp-highlight-key">{h.key}</span>
                    <span className="pdp-highlight-val">{h.val}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Product Description Accordion ── */}
          <p className="pdp-accordion-title">Product Description</p>
          <div className="pdp-accordion">
            {ACCORDION_SECTIONS.map(({ key, icon, title, subtitle }) => (
              <div className="accordion-item" key={key}>
                <button
                  className="accordion-header"
                  onClick={() => toggleAccordion(key)}
                >
                  <div className="accordion-header-left">
                    <span className="accordion-icon">{icon}</span>
                    <div className="accordion-header-text">
                      <span className="accordion-header-title">{title}</span>
                      {subtitle && (
                        <span className="accordion-header-subtitle">{subtitle}</span>
                      )}
                    </div>
                  </div>
                  <span className="accordion-toggle">
                    {activeAccordion === key ? '−' : '+'}
                  </span>
                </button>

                {activeAccordion === key && (
                  <div className="accordion-body">
                    {key === "details" && (
                      <>
                        <p>{product.description}</p>

                        <h4>Product Details</h4>

                        <table className="pdp-spec-table">
                          <tbody>

                            <tr>
                              <td>Brand</td>
                              <td>{product.brand}</td>
                            </tr>

                            <tr>
                              <td>Category</td>
                              <td>{product.category}</td>
                            </tr>

                            <tr>
                              <td>Sub Category</td>
                              <td>{product.subCategory}</td>
                            </tr>

                            <tr>
                              <td>Product Type</td>
                              <td>{product.productType}</td>
                            </tr>

                            <tr>
                              <td>Material</td>
                              <td>{product.material}</td>
                            </tr>

                            <tr>
                              <td>Color</td>
                              <td>{color}</td>
                            </tr>

                            <tr>
                              <td>Available Sizes</td>
                              <td>
                                {product.sizes
                                  ?.filter((s) => (product.sizeStock?.[s] ?? 1) > 0)
                                  .join(", ") || "Out of stock"}
                              </td>
                            </tr>

                            {/* GST lives per-variant, not on the product itself —
                                resolve it from the variant matching the selected
                                size (or the first variant as a fallback). */}
                            <tr>
                              <td>GST</td>
                              <td>{activeVariant?.gst != null ? `${activeVariant.gst}%` : "-"}</td>
                            </tr>

                            {/* This used to show product.slug, which is not a
                                SKU — the real per-size SKU lives on the variant. */}
                            <tr>
                              <td>SKU</td>
                              <td>{activeVariant?.sku || "-"}</td>
                            </tr>

                          </tbody>
                        </table>
                      </>
                    )}
                    {key === "disclaimer" && (
                      <>
                        <p>
                          Actual product color may vary slightly because of
                          photographic lighting and screen settings.
                          Measurements may vary by ±5%.
                        </p>
                      </>
                    )}
                    {key === "washcare" && (
                      <>
                        <ul>
                          <li>Machine Wash Cold</li>
                          <li>Wash Dark Colors Separately</li>
                          <li>Do Not Bleach</li>
                          <li>Warm Iron if Needed</li>
                          <li>Do Not Dry Clean</li>
                        </ul>
                      </>
                    )}
                    {key === "returns" && (
                      <>
                        <ul>
                          <li>Easy 7 Days Return & Exchange</li>
                          <li>Unused product with tags only.</li>
                          <li>Refund to original payment method.</li>
                          <li>Replacement available for damaged products.</li>
                        </ul>
                      </>
                    )}
                    {key === "manufacturing" && (
                      <>
                        <table className="pdp-spec-table">
                          <tbody>

                            <tr>
                              <td>Brand</td>
                              <td>{product.brand}</td>
                            </tr>

                            <tr>
                              <td>Manufacturer</td>
                              <td>{product.supplierName || activeVariant?.supplierName || "-"}</td>
                            </tr>

                            {/* Warehouse also lives per-variant — resolve from
                                the active variant instead of the (always
                                undefined) top-level product.warehouseName. */}
                            <tr>
                              <td>Warehouse</td>
                              <td>{activeVariant?.warehouseName || product.warehouseName || "-"}</td>
                            </tr>

                            <tr>
                              <td>Country of Origin</td>
                              <td>India</td>
                            </tr>

                          </tbody>
                        </table>
                      </>
                    )}
                    {key === "offers" && (
                      <>
                        <p>No active offers right now. Check back soon!</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* More About / FAQ */}
          <div className="pdp-extra-accordions">
            {[
              { key: 'moreabout', label: `More About The "${product.name}"` },
              { key: 'faq', label: 'FAQ' },
            ].map(({ key, label }) => (
              <div className="accordion-item" key={key}>
                <button
                  className="accordion-header"
                  onClick={() => toggleAccordion(key)}
                >
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{label}</span>
                  <span className="accordion-toggle">
                    {activeAccordion === key ? '−' : '+'}
                  </span>
                </button>
                {activeAccordion === key && (
                  <div className="accordion-body">
                    {key === 'moreabout' && (
                      <p>{product.description || `This ${product.name} is crafted for everyday comfort and style.`}</p>
                    )}
                    {key === 'faq' && (
                      <>
                        <p><strong>Q: Is this product true to size?</strong><br />A: Yes, the product follows standard sizing. Refer to the Size Guide for measurements.</p>
                        <p><strong>Q: What is the return policy?</strong><br />A: Easy 10-day returns. Items must be unused with original tags attached.</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Customer Reviews */}


      <section className="reviews-section">
        <div className="reviews-header">

          <div>
            <h2>Customer Reviews</h2>
            <p>{reviews.length} Reviews</p>
          </div>

          <button className="write-review-btn">
            Write A Review
          </button>

        </div>

        {reviews.length === 0 ? (
          <div className="no-review">
            No reviews yet.
          </div>
        ) : (
          reviews.map((review) => (
            <div className="review-box" key={review._id}>

              <div className="review-top">

                <div className="review-user">

                  <div className="review-avatar">
                    {review.customerName?.charAt(0).toUpperCase()}
                  </div>

                  <div>

                    <h3>{review.customerName}</h3>

                    <span>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>

                  </div>

                </div>

                <div className="review-right">

                  <div className="review-stars">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </div>

                  {review.verifiedPurchase && (
                    <span className="verified">
                      ✔ Verified Purchase
                    </span>
                  )}

                </div>

              </div>

              {review.title && (
                <h4 className="review-title">
                  {review.title}
                </h4>
              )}

              <p className="review-comment">
                {review.comment}
              </p>

              {review.images?.length > 0 && (
                <div className="review-images">

                  {review.images.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt=""
                    />
                  ))}

                </div>
              )}

              {review.adminReply && (
                <div className="admin-reply-box">

                  <strong>Store Reply</strong>

                  <p>{review.adminReply}</p>

                </div>
              )}

            </div>
          ))
        )}

      </section>


      {relatedProducts.length > 0 && (
        <section className="related-products-section">
          <div className="related-header">
            <h2>Related Products</h2>
            <p>You may also like these products</p>
          </div>

          <div className="related-products-grid">
            {relatedProducts.map(product => (
              <ProductCard
                key={product._id}
                product={{
                  ...product,
                  catalogType: "textile",
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* ===== SELECT SIZE POPUP ===== */}
      {showSizePopup && (
        <div className="size-popup-overlay" onClick={() => setShowSizePopup(false)}>
          <div className="size-popup" onClick={(e) => e.stopPropagation()}>
            <button
              className="size-popup-close"
              onClick={() => setShowSizePopup(false)}
              aria-label="Close"
            >
              ×
            </button>

            <div className="size-popup-icon">📏</div>
            <h3>Please Select a Size</h3>
            <p>Pick your size below to continue adding this item to your cart.</p>

            <div className="size-popup-options">
              {product.sizes.map((s) => {
                const inStock = (product.sizeStock?.[s] ?? 1) > 0;
                return (
                  <button
                    key={s}
                    className={`size-popup-btn ${!inStock ? 'out-of-stock' : ''}`}
                    disabled={!inStock}
                    onClick={() => {
                      setSize(s);
                      setShowSizePopup(false);
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>

            <button
              className="size-popup-dismiss"
              onClick={() => setShowSizePopup(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailsPage;
