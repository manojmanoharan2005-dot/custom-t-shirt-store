import api from "./api";

const createPaymentOrder = async (paymentData) => {
  const response = await api.post(
    "/payments/create",
    paymentData
  );

  return response.data;
};

const verifyPayment = async (paymentData) => {
  const response = await api.post(
    "/payments/verify",
    paymentData
  );

  return response.data;
};

const markPaymentFailed = async (paymentData) => {
  const response = await api.post(
    "/payments/failed",
    paymentData
  );

  return response.data;
};

const paymentService = {
  createPaymentOrder,
  verifyPayment,
  markPaymentFailed,
};

export default paymentService;