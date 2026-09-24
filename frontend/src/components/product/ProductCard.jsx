import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import formatPrice from '../../utils/formatPrice';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useWishlist } from '../../contexts/WishlistContext';
import '../../css/productCard.css';

const ProductCard = ({ product }) => {
  const img = product.images?.[0] || '';
  const [imgError, setImgError] = useState(false);
  const subLabel = product.subCategory || product.category?.name || '';

  // Textile catalog products don't carry mrp/price at the top level —
  // only each variant does. Fall back to the first variant so the
  // discount badge actually shows up for textile items too.
  const firstVariant = product.variants?.[0];
  const price = product.price ?? product.retailPriceMin ?? firstVariant?.retailPrice ?? 0;
  const mrp = product.mrp ?? firstVariant?.mrp ?? null;

  const hasDiscount = mrp && mrp > price;
  const discountPercent = hasDiscount
    ? Math.round(((mrp - price) / mrp) * 100)
    : null;

  // Color comes as either a single "color" string or a "colors" array
  // depending on catalog type.
  const colorLabel = product.colors?.length
    ? product.colors.join(', ')
    : product.color || '';
  const swatchColor = (product.colors?.[0] || product.color || '')
    .toLowerCase()
    .replace(/\s+/g, '');

  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { isInWishlist, toggleWishlist, loadingIds } = useWishlist();

  const wishActive = isInWishlist(product._id);
  const wishLoading = loadingIds.includes(product._id.toString());

  // badge logic
  let badgeLabel = null;
  let badgeClass = null;

  if (product.isNewArrival) {
    badgeLabel = 'New Arrival';
    badgeClass = 'pc-badge-new';
  } else if (product.isBestSeller) {
    badgeLabel = 'Best Seller';
    badgeClass = 'pc-badge-best';
  } else if (product.isTrending) {
    badgeLabel = 'Trending';
    badgeClass = 'pc-badge-trending';
  }

  const handleWishlistClick = async (e) => {
    e.preventDefault();

    if (!user) {
      addToast('Please log in to add product to wishlist', 'error');
      navigate('/auth');
      return;
    }

    if (wishLoading) return;

    try {
      const nowInWishlist = await toggleWishlist(product._id);

      if (nowInWishlist) {
        addToast('❤️ Your favourite product has been added to wishlist!', 'success');
      } else {
        addToast('Removed from wishlist.', 'info');
      }
    } catch (err) {
      addToast('Failed to update wishlist', 'error');
    }
  };

  const showImage = img && !imgError;

  return (
    <Link
      to={`/product/${product._id}${product.sleeveOrStyle || product.subCategory || product.catalogType === "textile" ? "?textile=true" : ""}`}
      className="pc-card"
    >
      <div className="pc-card-inner">
        <div className="pc-image-wrapper">
          <div className="pc-top">
            <div className="pc-badge-container">
              {badgeLabel && (
                <span className={`pc-badge ${badgeClass}`}>{badgeLabel}</span>
              )}
            </div>

            <div className="pc-wishlist-container">
              <button
                type="button"
                aria-label={wishActive ? 'Remove from wishlist' : 'Add to wishlist'}
                aria-pressed={wishActive}
                className={`pc-wishlist-btn ${
                  wishActive ? 'pc-wishlist-active' : ''
                }`}
                onClick={handleWishlistClick}
                disabled={wishLoading}
              >
                ♥
              </button>
            </div>
          </div>

          {showImage ? (
            <img
              src={img}
              alt={product.name}
              className="pc-image"
              loading="lazy"
              decoding="async"
              width={400}
              height={500}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="pc-image pc-placeholder">Image</div>
          )}
        </div>

        <div className="pc-info">
          <div className="pc-name" title={product.name}>
            {product.name}
          </div>

          {(subLabel || colorLabel) && (
            <div className="pc-meta-row">
              {subLabel && <span className="pc-subcategory">{subLabel}</span>}
              {colorLabel && (
                <span className="pc-color">
                  <span
                    className="pc-color-swatch"
                    style={{ backgroundColor: swatchColor }}
                  />
                  {colorLabel}
                </span>
              )}
            </div>
          )}

          <div className="pc-price-row">
            <span className="pc-price">{formatPrice(price)}</span>
            {mrp && (
              <span className="pc-mrp">{formatPrice(mrp)}</span>
            )}
            {discountPercent && (
              <span className="pc-discount">{discountPercent}% off</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
