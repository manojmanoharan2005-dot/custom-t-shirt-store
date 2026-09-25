import api from "./api";

const getDashboard = async () => {
  const response = await api.get("/admin/dashboard");

  return response.data;
};

const getAdminProfile = async () => {
  const response = await api.get("/admin/profile");

  return response.data;
};

const getCustomers = async () => {
  const response = await api.get("/admin/customers");

  return response.data;
};

const getCustomerById = async (customerId) => {
  const response = await api.get(
    `/admin/customers/${customerId}`
  );

  return response.data;
};

const deleteCustomer = async (customerId) => {
  const response = await api.delete(
    `/admin/customers/${customerId}`
  );

  return response.data;
};

const getAllOrders = async () => {
  const response = await api.get("/admin/orders");

  return response.data;
};

const getOrderById = async (orderId) => {
  const response = await api.get(
    `/admin/orders/${orderId}`
  );

  return response.data;
};

const updateOrderStatus = async (
  orderId,
  statusData
) => {
  const response = await api.put(
    `/admin/orders/${orderId}/status`,
    statusData
  );

  return response.data;
};

const adminService = {
  getDashboard,
  getAdminProfile,

  getCustomers,
  getCustomerById,
  deleteCustomer,

  getAllOrders,
  getOrderById,
  updateOrderStatus,
};

export default adminService;