import multer from "multer";
import cloudinary from "../config/cloudinary.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) =>
    file.mimetype.startsWith("image/") || file.mimetype === "application/pdf"
      ? cb(null, true)
      : cb(new Error("Only image or PDF files are allowed")),
});

export const uploadImage = (buffer, folder) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: "auto" }, (err, result) => {
        if (err) return reject(err);
        const isPdf = result.format === "pdf";
        resolve({
          id: result.public_id,
          file: isPdf ? result.secure_url : "",
          // PDF-na first page-a JPG thumbnail-a maathum
          url: isPdf
            ? cloudinary.url(result.public_id, {
                resource_type: "image",
                format: "jpg",
                page: 1,
                width: 1200,
                crop: "limit",
                version: result.version,
                secure: true,
              })
            : result.secure_url,
        });
      })
      .end(buffer);
  });

export const deleteImage = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete failed:", err.message);
  }
};

export default upload;