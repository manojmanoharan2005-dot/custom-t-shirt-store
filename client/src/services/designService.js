import api from "./api";

const getDesigns = async () => {
  const response = await api.get("/designs");

  return response.data;
};

const getDesignById = async (designId) => {
  const response = await api.get(
    `/designs/${designId}`
  );

  return response.data;
};

const createDesign = async (designData) => {
  const formData = new FormData();

  formData.append("name", designData.name);
  formData.append("category", designData.category || "");

  if (designData.image) {
    formData.append("image", designData.image);
  }

  const response = await api.post(
    "/designs",
    formData
  );

  return response.data;
};

const updateDesign = async (
  designId,
  designData
) => {
  const formData = new FormData();

  formData.append("name", designData.name);
  formData.append("category", designData.category || "");

  if (designData.image) {
    formData.append("image", designData.image);
  }

  const response = await api.put(
    `/designs/${designId}`,
    formData
  );

  return response.data;
};

const deleteDesign = async (designId) => {
  const response = await api.delete(
    `/designs/${designId}`
  );

  return response.data;
};

const designService = {
  getDesigns,
  getDesignById,
  createDesign,
  updateDesign,
  deleteDesign,
};

export default designService;