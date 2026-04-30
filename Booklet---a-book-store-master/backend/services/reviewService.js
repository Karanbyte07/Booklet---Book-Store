import mongoose from "mongoose";
import productModel from "../models/productModel.js";
import reviewModel from "../models/reviewModel.js";

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

const normalizeRating = (value) => Number(Number(value || 0).toFixed(1));

export const getProductReviewStats = async (productId) => {
  const [stats] = await reviewModel.aggregate([
    { $match: { product: toObjectId(productId) } },
    {
      $group: {
        _id: "$product",
        numReviews: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  return {
    numReviews: stats?.numReviews || 0,
    rating: stats?.avgRating ? normalizeRating(stats.avgRating) : 0,
  };
};

export const syncProductReviewStats = async (productId) => {
  const stats = await getProductReviewStats(productId);
  await productModel.findByIdAndUpdate(productId, stats, { new: true });
  return stats;
};

export const deleteReviewsByProductId = async (productId) =>
  reviewModel.deleteMany({ product: productId });
