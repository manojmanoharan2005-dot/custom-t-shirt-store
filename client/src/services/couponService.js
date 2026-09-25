import api from "./api";

const validateCoupon = async (couponData) => {
  const response = await api.post(
    "/coupons/validate",
    couponData
  );

  return response.data;
};

const getCoupons = async () => {
  const response = await api.get("/coupons");

  return response.data;
};

const createCoupon = async (couponData) => {
  const response = await api.post(
    "/coupons",
    couponData
  );

  return response.data;
};

const updateCoupon = async (couponId, couponData) => {
  const response = await api.put(
    `/coupons/${couponId}`,
    couponData
  );

  return response.data;
};

const deleteCoupon = async (couponId) => {
  const response = await api.delete(
    `/coupons/${couponId}`
  );

  return response.data;
};

const couponService = {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};

export default couponService;