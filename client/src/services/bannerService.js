import api from "./api";

const getBanners = async (params = {}) => {
  const response = await api.get("/banners", {
    params,
  });

  return response.data;
};

const getBannerById = async (bannerId) => {
  const response = await api.get(
    `/banners/${bannerId}`
  );

  return response.data;
};

const getAllBanners = async () => {
  const response = await api.get(
    "/banners/all"
  );

  return response.data;
};

const createBanner = async (bannerData) => {
  const formData = new FormData();

  formData.append(
    "title",
    bannerData.title
  );

  formData.append(
    "subtitle",
    bannerData.subtitle || ""
  );

  formData.append(
    "buttonText",
    bannerData.buttonText || ""
  );

  formData.append(
    "buttonLink",
    bannerData.buttonLink || ""
  );

  formData.append(
    "rightTitle",
    bannerData.rightTitle || ""
  );

  formData.append(
    "rightSubtitle",
    bannerData.rightSubtitle || ""
  );

  formData.append(
    "rightButtonText",
    bannerData.rightButtonText || ""
  );

  formData.append(
    "rightButtonLink",
    bannerData.rightButtonLink || ""
  );

  formData.append(
    "displayOrder",
    bannerData.displayOrder ?? 0
  );

  if (bannerData.leftImage) {
    formData.append(
      "leftImage",
      bannerData.leftImage
    );
  }

  if (bannerData.rightImage) {
    formData.append(
      "rightImage",
      bannerData.rightImage
    );
  }

  const response = await api.post(
    "/banners",
    formData
  );

  return response.data;
};

const updateBanner = async (
  bannerId,
  bannerData
) => {
  const formData = new FormData();

  formData.append(
    "title",
    bannerData.title
  );

  formData.append(
    "subtitle",
    bannerData.subtitle || ""
  );

  formData.append(
    "buttonText",
    bannerData.buttonText || ""
  );

  formData.append(
    "buttonLink",
    bannerData.buttonLink || ""
  );

  formData.append(
    "rightTitle",
    bannerData.rightTitle || ""
  );

  formData.append(
    "rightSubtitle",
    bannerData.rightSubtitle || ""
  );

  formData.append(
    "rightButtonText",
    bannerData.rightButtonText || ""
  );

  formData.append(
    "rightButtonLink",
    bannerData.rightButtonLink || ""
  );

  formData.append(
    "displayOrder",
    bannerData.displayOrder ?? 0
  );

  if (bannerData.isActive !== undefined) {
    formData.append(
      "isActive",
      bannerData.isActive
    );
  }

  if (bannerData.leftImage) {
    formData.append(
      "leftImage",
      bannerData.leftImage
    );
  }

  if (bannerData.rightImage) {
    formData.append(
      "rightImage",
      bannerData.rightImage
    );
  }

  const response = await api.put(
    `/banners/${bannerId}`,
    formData
  );

  return response.data;
};

const deleteBanner = async (bannerId) => {
  const response = await api.delete(
    `/banners/${bannerId}`
  );

  return response.data;
};

const bannerService = {
  getBanners,
  getBannerById,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
};

export default bannerService;