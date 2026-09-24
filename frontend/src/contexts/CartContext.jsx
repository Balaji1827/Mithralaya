
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getCart as getCartAPI,
  addToCart as addToCartAPI,
  updateCartItem as updateCartItemAPI,
  removeFromCart as removeFromCartAPI,
  clearCart as clearCartAPI,
} from "../services/cartService";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  // ==========================================
  // LOAD CART
  // ==========================================
  const loadCart = async () => {
    try {
      const response = await getCartAPI();

      setItems(response?.items || []);
    } catch (error) {
      console.error("Load cart failed:", error);

      setItems([]);
    }
  };

  // Load cart when application starts
  useEffect(() => {
    loadCart();
  }, []);

  // ==========================================
  // ADD TO CART
  // ==========================================
  const addToCart = async (data) => {
    try {
      const response = await addToCartAPI(data);

      setItems(response?.items || []);

      return response;
    } catch (error) {
      console.error("Add to cart failed:", error);

      // IMPORTANT:
      // Send error back to CartPage
      throw error;
    }
  };

  // ==========================================
  // UPDATE CART ITEM
  // ==========================================
  const updateCartItem = async (data) => {
    try {
      const response = await updateCartItemAPI(data);

      setItems(response?.items || []);

      return response;
    } catch (error) {
      console.error("Update cart item failed:", error);

      // IMPORTANT:
      // 400 error will reach CartPage
      // where toast can be displayed
      throw error;
    }
  };

  // ==========================================
  // REMOVE FROM CART
  // ==========================================
  const removeFromCart = async (productId, size, color) => {
    try {
      const response = await removeFromCartAPI(
        productId,
        size,
        color
      );

      setItems(response?.items || []);

      return response;
    } catch (error) {
      console.error("Remove from cart failed:", error);

      throw error;
    }
  };

  // ==========================================
  // CLEAR CART
  // ==========================================
  const clearCart = async () => {
    try {
      await clearCartAPI();

      setItems([]);
    } catch (error) {
      console.error("Clear cart failed:", error);

      throw error;
    }
  };

  // ==========================================
  // PROVIDER
  // ==========================================
  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// ==========================================
// USE CART HOOK
// ==========================================
export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
};

