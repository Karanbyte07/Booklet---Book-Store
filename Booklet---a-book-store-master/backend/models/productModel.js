import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    mrp: {
      type: Number,
      default: 0,
      min: 0,
    },
    category: {
      type: mongoose.ObjectId,
      ref: "Category",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    shipping: {
      type: Boolean,
    },
    shippingCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    estimatedDeliveryMinDays: {
      type: Number,
      default: 2,
      min: 0,
    },
    estimatedDeliveryMaxDays: {
      type: Number,
      default: 5,
      min: 0,
    },
    returnWindowDays: {
      type: Number,
      default: 7,
      min: 0,
    },
    priceIncludesTax: {
      type: Boolean,
      default: true,
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    sku: {
      type: String,
      trim: true,
      default: "",
    },
    isbn: {
      type: String,
      trim: true,
      default: "",
    },
    author: {
      type: String,
      trim: true,
      default: "",
    },
    publisher: {
      type: String,
      trim: true,
      default: "",
    },
    language: {
      type: String,
      trim: true,
      default: "English",
    },
    format: {
      type: String,
      trim: true,
      default: "Paperback",
    },
    edition: {
      type: String,
      trim: true,
      default: "",
    },
    pages: {
      type: Number,
      default: 0,
      min: 0,
    },
    weightInGrams: {
      type: Number,
      default: 0,
      min: 0,
    },
    highlights: {
      type: [String],
      default: [],
    },
    perfectFor: {
      type: [String],
      default: [],
    },
    detailsAndCare: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    serviceLocations: {
      type: [String],
      default: ["all"],
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Products", productSchema);
