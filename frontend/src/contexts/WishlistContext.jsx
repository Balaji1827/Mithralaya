import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  getWishlist,
  addToWishlist as apiAddToWishlist,
  removeFromWishlist as apiRemoveFromWishlist
} from '../services/wishlistService';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState([]);   // store product IDs
  const [loadingIds, setLoadingIds] = useState([]);     // loading per-product

  // Load wishlist from backend whenever user changes / logs in
  useEffect(() => {
    const load = async () => {
      if (!user) {
        setWishlistIds([]);
        return;
      }
      try {
        const data = await getWishlist(); // array of Product docs
        setWishlistIds(data.map((p) => p._id));
      } catch (err) {
        console.error('Failed to load wishlist', err);
      }
    };

    load();
  }, [user]);

  const isInWishlist = (productId) =>
    wishlistIds.some((id) => id.toString() === productId.toString());

  // toggle returns true if now in wishlist, false if removed
  const toggleWishlist = async (productId) => {
    if (!user) return null;

    const idStr = productId.toString();
    const already = isInWishlist(productId);

    try {
      setLoadingIds((prev) => [...prev, idStr]);

      if (already) {
        const updated = await apiRemoveFromWishlist(productId);
        setWishlistIds(updated.map((p) => p._id));
        return false;
      } else {
        const updated = await apiAddToWishlist(productId);
        setWishlistIds(updated.map((p) => p._id));
        return true;
      }
    } catch (err) {
      console.error('Wishlist toggle error', err);
      throw err;
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== idStr));
    }
  };

  return (
    <WishlistContext.Provider
      value={{ wishlistIds, isInWishlist, toggleWishlist, loadingIds }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
