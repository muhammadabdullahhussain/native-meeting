const express = require("express");
const router = express.Router();
const multer = require("multer");
const { upload } = require("../../config/cloudinaryConfig");
const uploadController = require("../controllers/uploadController");
const AppError = require("../../utils/appError");

const handleSingleImageUpload = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return next(
        new AppError(
          "Image is too large. Please upload an image up to 8MB.",
          413,
        ),
      );
    }

    return next(new AppError(err.message || "Image upload failed", 400));
  });
};

// POST /api/upload
router.post("/", handleSingleImageUpload, uploadController.uploadImage);

module.exports = router;
