import api from "./api";

const register = async (userData) => {
  const response = await api.post("/auth/register", userData);

  return response.data;
};

const login = async (userData) => {
  const response = await api.post("/auth/login", userData);

  return response.data;
};

const getProfile = async () => {
  const response = await api.get("/users/profile");

  return response.data;
};

const updateProfile = async (userData) => {
  const response = await api.put("/users/profile", userData);

  return response.data;
};

const addAddress = async (addressData) => {
  const response = await api.post("/users/addresses", addressData);

  return response.data;
};

const updateAddress = async (addressId, addressData) => {
  const response = await api.put(
    `/users/addresses/${addressId}`,
    addressData
  );

  return response.data;
};

const deleteAddress = async (addressId) => {
  const response = await api.delete(
    `/users/addresses/${addressId}`
  );

  return response.data;
};

const authService = {
  register,
  login,
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
};

export default authService;