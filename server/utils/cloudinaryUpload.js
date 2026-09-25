const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = (
  fileBuffer,
  folder = "custom-tshirt-store"
) => {
  return new Promise((resolve, reject) => {
    const uploadStream =
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            console.error(
              "Cloudinary upload error:",
              error.message
            );

            reject(error);
            return;
          }

          resolve(result);
        }
      );

    uploadStream.end(fileBuffer);
  });
};

module.exports = uploadToCloudinary;