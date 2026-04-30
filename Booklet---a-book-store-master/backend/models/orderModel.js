import mongoose from "mongoose";

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    line1: {
      type: String,
      default: "",
    },
    line2: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      default: "",
    },
    pincode: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "India",
    },
    landmark: {
      type: String,
      default: "",
    },
    addressType: {
      type: String,
      default: "home",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    products: [
      {
        type: mongoose.ObjectId,
        ref: "Products",
      },
    ],
    payment: {},
    buyer: {
      type: mongoose.ObjectId,
      ref: "users",
    },
    deliveryLocation: {
      type: String,
      default: "",
    },
    deliveryLocationLabel: {
      type: String,
      default: "",
    },
    deliveryPincode: {
      type: String,
      default: "",
    },
    deliveryDistanceKm: {
      type: Number,
      default: null,
    },
    shippingAddress: {
      type: shippingAddressSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      default: "Not Process",
      enum: ["Not Process", "Processing", "Shipped", "deliverd", "cancel"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
