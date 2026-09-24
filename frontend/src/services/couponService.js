import api from "./api";

/* =========================
   ADMIN
========================= */

export const createCoupon = (data) =>
  api.post("/coupons", data).then((res) => res.data);

export const getCoupons = () =>
  api.get("/coupons").then((res) => res.data);

export const updateCoupon = (id, data) =>
  api.put(`/coupons/${id}`, data).then((res) => res.data);

export const deleteCoupon = (id) =>
  api.delete(`/coupons/${id}`).then((res) => res.data);

/* =========================
   USER
========================= */

// Get all active coupons
export const getActiveCoupons = () =>
  api.get("/coupons/active").then((res) => res.data);

// Apply coupon
export const applyCoupon = (code, orderAmount) =>
  api
    .post("/coupons/apply", {
      code,
      orderAmount,
    })
    .then((res) => res.data);