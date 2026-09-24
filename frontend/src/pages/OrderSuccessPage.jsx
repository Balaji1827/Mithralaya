import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrderByOrderId } from '../services/orderService';
import { createReview } from '../services/reviewService';
import '../css/orderSuccess.css';

const OrderSuccessPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---------- review modal state ----------
  const [reviewItem, setReviewItem] = useState(null); // item being reviewed
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewedIds, setReviewedIds] = useState([]); // products already reviewed in this session

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderData = await getOrderByOrderId(orderId);
        setOrder(orderData);
      } catch (error) {
        console.error('Failed to fetch order details:', error);
      } finally {
        setLoading(false);
      }
    };

    
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const openReview = (item) => {
    setReviewItem(item);
    setRating(0);
    setHoverRating(0);
    setTitle('');
    setComment('');
    setReviewError('');
  };

  const closeReview = () => {
    setReviewItem(null);
    setReviewError('');
  };

  const submitReview = async () => {
    if (rating === 0) {
      setReviewError('Please select a star rating');
      return;
    }
    if (!comment.trim()) {
      setReviewError('Please write a short review');
      return;
    }

    setSubmitting(true);
    setReviewError('');
    try {
      await createReview({
        product: reviewItem.product, // product ObjectId from order item
        rating,
        title: title.trim(),
        comment: comment.trim(),
      });
      setReviewedIds((prev) => [...prev, reviewItem.product]);
      closeReview();
    } catch (err) {
      setReviewError(
        err.response?.data?.message || 'Failed to submit review. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="order-success-page">
        <p>Loading order details...</p>
      </div>
    );
  }

  return (
    <div className="order-success-page">
      <img
        src="https://assets-v2.lottiefiles.com/a/6192c96c-1184-11ee-94d6-87985660cc3b/eKofKHrW1u.gif"
        alt="Order Success"
        className="success-image"
      />
      <h1>Order Placed</h1>
      <p>Your order ID is {orderId}</p>

      <div className="success-actions">
        <Link to="/account" state={{ activeTab: 'orders' }} className="btn-view-orders">
          View Orders
        </Link>
      </div>

      {/* ---------- review your items ---------- */}
      {order?.orderItems?.length > 0 && (
        <div className="review-items-section">
          <h2>Rate your items</h2>
          <p className="review-items-hint">Share your experience with other shoppers</p>

          <div className="review-items-list">
            {order.orderItems.map((item) => {
              const productId = item.product?._id || item.product; // handle populated or plain id
              const alreadyReviewed = reviewedIds.includes(productId);
              return (
                <div className="review-item-card" key={productId + (item.size || '')}>
                  {item.image && (
                    <img src={item.image} alt={item.name} className="review-item-img" />
                  )}
                  <div className="review-item-info">
                    <span className="review-item-name">{item.name}</span>
                    {item.size && <span className="review-item-meta">Size: {item.size}</span>}
                  </div>
                  <button
                    className="btn-write-review"
                    disabled={alreadyReviewed}
                    onClick={() => openReview({ ...item, product: productId })}
                  >
                    {alreadyReviewed ? '✓ Reviewed' : '⭐ Write Review'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------- review modal ---------- */}
      {reviewItem && (
        <div className="review-modal-overlay" onClick={closeReview}>
          <div className="review-modal" onClick={(e) => e.stopPropagation()}>
            <button className="review-modal-close" onClick={closeReview} aria-label="Close">
              ×
            </button>

            <h3>Review: {reviewItem.name}</h3>

            {/* star rating */}
            <div className="star-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${star <= (hoverRating || rating) ? 'filled' : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`${star} star`}
                >
                  ★
                </button>
              ))}
              <span className="star-label">
                {rating > 0 ? `${rating}/5` : 'Tap to rate'}
              </span>
            </div>

            <input
              type="text"
              className="review-input"
              placeholder="Title (optional)"
              value={title}
              maxLength={80}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              className="review-textarea"
              placeholder="How was the product? Fit, quality, colour..."
              value={comment}
              rows={4}
              maxLength={500}
              onChange={(e) => setComment(e.target.value)}
            />

            {reviewError && <div className="review-error">{reviewError}</div>}

            <button className="btn-submit-review" disabled={submitting} onClick={submitReview}>
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
            <p className="review-moderation-note">
              Your review will appear after admin approval.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSuccessPage;