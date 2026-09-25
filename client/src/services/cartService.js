import api from "./api";

const getCart = async () => {
  const response = await api.get("/cart");

  return response.data;
};

const addToCart = async (cartData) => {
  const response = await api.post("/cart", cartData);

  return response.data;
};

const updateCartItem = async (itemId, cartData) => {
  const response = await api.put(
    `/cart/${itemId}`,
    cartData
  );

  return response.data;
};

const removeCartItem = async (itemId) => {
  const response = await api.delete(
    `/cart/${itemId}`
  );

  return response.data;
};

const clearCart = async () => {
  const response = await api.delete("/cart");

  return response.data;
};

const cartService = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};

export default cartService;