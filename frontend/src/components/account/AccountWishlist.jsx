import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWishlist, removeFromWishlist } from '../../services/wishlistService';
import ProductCard from '../product/ProductCard';
import { ThreeDot } from 'react-loading-indicators';
import '../../css/product.css';

const AccountWishlist = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const navToProduct =() =>{
    navigate("/products");
  }
  const loadWishlist = async () => {
    try {
      const data = await getWishlist();
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to load wishlist', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      await removeFromWishlist(productId);
      await loadWishlist();
    } catch (err) {
      console.error('Failed to remove from wishlist', err);
      alert('Failed to update wishlist');
    }
  };

  if (loading) {
    return <div className="user-section-loading"><center><ThreeDot color={["#32cd32", "#327fcd", "#cd32cd", "#cd8032"]} /></center></div>
  }

  if (!products || products.length === 0) {
    return (
      <div className="user-card-block">
        
        <div className="user-empty-state">
          <center>
          <img src="https://static.oxinis.com/healthmug/image/healthmug/empty-wishlist.webp"
          alt="wishlist empty img" height="300px" width="300px"  className="empty-wishlist-img"/>
          <p classname="empty-cart-quote-main">Your wishlist seems to be empty !!!</p>
          <button className="browse-product" onClick={navToProduct}>Browse products</button>
          </center>
        </div>
      </div>
    );
  }

  return (
    <div className="user-card-block">
      <div className="product-grid">
        {products.map((p) => (
          <div key={p._id} className="wishlist-card-wrapper">
            <ProductCard product={p} />
            <button
              type="button"
              className="wishlist-remove"
              onClick={() => handleRemove(p._id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccountWishlist;
