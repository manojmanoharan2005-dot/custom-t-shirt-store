const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = (
  fileBuffer,
  folder = "custom-tshirt-store"
) => {
  return new Promise((resolve, reject) => {
    let isSettled = false;

    const uploadStream =
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
        },
        (error, result) => {
          if (isSettled) return;
          isSettled = true;

          if (error) {
            console.error(
              "Cloudinary upload error:",
              error.message || error
            );

            reject(error);
            return;
          }

          resolve(result);
        }
      );

    uploadStream.on("error", (error) => {
      if (isSettled) return;
      isSettled = true;
      console.error(
        "Cloudinary stream error:",
        error.message || error
      );
      reject(error);
    });

    uploadStream.end(fileBuffer);
  });
};

module.exports = uploadToCloudinary;