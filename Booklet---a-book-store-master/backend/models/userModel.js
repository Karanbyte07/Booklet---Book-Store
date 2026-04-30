import mongoose from "mongoose";
import { ROLE } from "../utils/roleUtils.js";

const addressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    line1: {
      type: String,
      trim: true,
      default: "",
    },
    line2: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    state: {
      type: String,
      trim: true,
      default: "",
    },
    pincode: {
      type: String,
      trim: true,
      default: "",
    },
    country: {
      type: String,
      trim: true,
      default: "India",
    },
    landmark: {
      type: String,
      trim: true,
      default: "",
    },
    addressType: {
      type: String,
      enum: ["home", "work", "other"],
      default: "home",
    },
    isDefault: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    profileAddress: {
      type: addressSchema,
      required: true,
      default: () => ({}),
    },
    addresses: {
      type: [addressSchema],
      default: [],
    },
    address: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: "",
    },
    answer: {
      type: String,
      required: true,
    },
    role: {
      type: Number,
      enum: Object.values(ROLE),
      default: ROLE.CUSTOMER,
    },
    currentDeliveryLocation: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    currentWarehouseId: {
      type: String,
      trim: true,
      default: "",
    },
    deliveryLocationUpdatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("users", userSchema);
