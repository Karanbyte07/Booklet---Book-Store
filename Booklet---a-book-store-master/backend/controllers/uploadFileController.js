import { uploadMultipleImages as uploadImagesToCloudinary, uploadSingleImage as uploadImageToCloudinary } from "../utils/cloudinaryUtils.js";

const uploadMultipleImages = async (req, res, next) => {
    try {
        const images = await uploadImagesToCloudinary(req.files);
        res.status(200).json({
            message: "Images uploaded successfully",
            images,
        });
    } catch (error) {
        console.error("Error uploading images:", error);
        next(error);
    }
};

const uploadSingleImage = async (req, res, next) => {
    try {
        const image = await uploadImageToCloudinary(req.file);
        res.status(200).json({
            message: "Image uploaded successfully",
            image,
        });
    } catch (error) {
        console.error("Error uploading image:", error);
        next(error);
    }
};

export default { uploadMultipleImages, uploadSingleImage };