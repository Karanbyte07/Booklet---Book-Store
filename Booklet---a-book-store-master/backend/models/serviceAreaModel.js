import mongoose from "mongoose";

const serviceAreaSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
    radiusKm: {
      type: Number,
      default: 8,
      min: 0.1,
    },
    type: {
      type: String,
      default: "urban",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.ObjectId,
      ref: "users",
      default: null,
    },
    updatedBy: {
      type: mongoose.ObjectId,
      ref: "users",
      default: null,
    },
  },
  { timestamps: true }
);

serviceAreaSchema.index({ isActive: 1, key: 1 });

export default mongoose.model("ServiceArea", serviceAreaSchema);
