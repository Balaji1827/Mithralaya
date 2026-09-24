import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getWishlist } from '../services/wishlistService';
import ProductCard from '../components/product/ProductCard';
import '../../src/css/Wishlist.css';

const Wishlistpage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getWishlist();
        setItems(data || []);
      } catch (err) {
        console.error('Failed to load wishlist', err);
        setError('Could not load your wishlist. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="wl-page">
      <h1 className="wl-title">My Wishlist</h1>

      {loading ? (
        <div className="wl-status">Loading your wishlist...</div>
      ) : error ? (
        <div className="wl-status wl-error">{error}</div>
      ) : items.length === 0 ? (
        <div className="wl-empty">
          <p>Your wishlist is empty.</p>
          <Link to="/all-product" className="wl-browse-link">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="wl-grid">
          {items.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlistpage;
