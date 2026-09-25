import api from "./api";

const orderService = {
  createOrder: async (
    orderData
  ) => {
    const response =
      await api.post(
        "/orders",
        orderData
      );

    return response.data;
  },

  getMyOrders: async () => {
    const response =
      await api.get(
        "/orders/my"
      );

    return response.data;
  },

  getOrderById: async (
    orderId
  ) => {
    const response =
      await api.get(
        `/orders/${orderId}`
      );

    return response.data;
  },

  cancelOrder: async (
    orderId,
    data = {}
  ) => {
    const response =
      await api.put(
        `/orders/${orderId}/cancel`,
        data
      );

    return response.data;
  },
};

export default orderService;