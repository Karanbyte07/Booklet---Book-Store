import express from "express";
import uploadFileController from "../controllers/uploadFileController.js";
import { upload } from "../utils/cloudinaryUtils.js";
const router = express.Router();

// Multiple Image Upload Route
router.post("/images-upload", upload.array("images", 10), uploadFileController.uploadMultipleImages);

// Single Image Upload Route (if needed in the future)
router.post("/single/image-upload", upload.single("image"), uploadFileController.uploadSingleImage);
 
export default router;