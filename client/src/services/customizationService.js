import api from "./api";

const createCustomization = async (customizationData) => {
  const response = await api.post(
    "/customizations",
    customizationData
  );

  return response.data;
};

const getCustomizationById = async (customizationId) => {
  const response = await api.get(
    `/customizations/${customizationId}`
  );

  return response.data;
};

const updateCustomization = async (
  customizationId,
  customizationData
) => {
  const response = await api.put(
    `/customizations/${customizationId}`,
    customizationData
  );

  return response.data;
};

const deleteCustomization = async (customizationId) => {
  const response = await api.delete(
    `/customizations/${customizationId}`
  );

  return response.data;
};

const customizationService = {
  createCustomization,
  getCustomizationById,
  updateCustomization,
  deleteCustomization,
};

export default customizationService;