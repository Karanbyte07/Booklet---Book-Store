import mongoose from "mongoose";
import productModel from "../models/productModel.js";
import reviewModel from "../models/reviewModel.js";
import userModel from "../models/userModel.js";
import { syncProductReviewStats } from "../services/reviewService.js";

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const sanitizeComment = (value) =>
  typeof value === "string" ? value.trim() : "";

export const getProductReviewsController = async (req, res) => {
  try {
    const { pid } = req.params;

    if (!isValidObjectId(pid)) {
      return res.status(400).send({
        success: false,
        message: "Invalid product id",
      });
    }

    const product = await productModel.findById(pid).select("rating numReviews");
    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    const reviews = await reviewModel
      .find({ product: pid })
      .sort({ createdAt: -1 })
      .select("-__v");

    res.status(200).send({
      success: true,
      message: "Product reviews fetched successfully",
      summary: {
        rating: Number(product.rating || 0),
        numReviews: Number(product.numReviews || 0),
      },
      reviews,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting product reviews",
      error: error.message,
    });
  }
};

export const createOrUpdateProductReviewController = async (req, res) => {
  try {
    const { pid } = req.params;
    const rating = Number(req.body?.rating);
    const comment = sanitizeComment(req.body?.comment);

    if (!isValidObjectId(pid)) {
      return res.status(400).send({
        success: false,
        message: "Invalid product id",
      });
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).send({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    if (!comment) {
      return res.status(400).send({
        success: false,
        message: "Review comment is required",
      });
    }

    if (comment.length > 1200) {
      return res.status(400).send({
        success: false,
        message: "Review comment cannot exceed 1200 characters",
      });
    }

    const [product, user, existingReview] = await Promise.all([
      productModel.findById(pid).select("_id"),
      userModel.findById(req.user?._id).select("name"),
      reviewModel.findOne({ product: pid, user: req.user?._id }).select("_id"),
    ]);

    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    if (!user) {
      return res.status(401).send({
        success: false,
        message: "Unauthorized user",
      });
    }

    const review = await reviewModel.findOneAndUpdate(
      { product: pid, user: req.user._id },
      {
        product: pid,
        user: req.user._id,
        name: user.name,
        rating,
        comment,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    const summary = await syncProductReviewStats(pid);

    res.status(200).send({
      success: true,
      message: existingReview
        ? "Review updated successfully"
        : "Review added successfully",
      summary,
      review,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Unable to submit review",
      error: error.message,
    });
  }
};
