export const getOptimizedImageUrl = (url, options = {}) => {
  if (!url || typeof url !== "string") {
    return url;
  }

  if (!url.includes("res.cloudinary.com") && !url.includes("/image/upload/")) {
    return url;
  }

  const uploadPattern = "/image/upload/";
  const uploadIndex = url.indexOf(uploadPattern);

  if (uploadIndex === -1) {
    return url;
  }

  const afterUploadPath = url.substring(uploadIndex + uploadPattern.length);
  const containsTransformations =
    /f_auto|q_auto|w_\d+|c_fill|c_limit|g_auto/.test(afterUploadPath);

  if (containsTransformations) {
    return url;
  }

  const {
    width,
    crop,
    gravity,
    format = "auto",
    quality = "auto",
  } = options;

  const transformations = [];

  if (format) transformations.push(`f_${format}`);
  if (quality) transformations.push(`q_${quality}`);
  if (width) transformations.push(`w_${width}`);
  if (crop) transformations.push(`c_${crop}`);
  if (gravity) transformations.push(`g_${gravity}`);

  if (transformations.length === 0) {
    return url;
  }

  const transformationString = transformations.join(",");

  const prefix = url.substring(0, uploadIndex + uploadPattern.length);
  const suffix = url.substring(uploadIndex + uploadPattern.length);

  return `${prefix}${transformationString}/${suffix}`;
};

export default getOptimizedImageUrl;