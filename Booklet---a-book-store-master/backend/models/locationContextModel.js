import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "" },
    line1: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "India" },
    pincode: { type: String, default: "" },
  },
  { _id: false }
);

const coordinatesSchema = new mongoose.Schema(
  {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
  },
  { _id: false }
);

const assignedAreaSchema = new mongoose.Schema(
  {
    key: { type: String, default: "" },
    label: { type: String, default: "" },
    pincode: { type: String, default: "" },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    radiusKm: { type: Number, default: null },
    type: { type: String, default: "" },
  },
  { _id: false }
);

const serviceabilitySchema = new mongoose.Schema(
  {
    isServiceable: { type: Boolean, default: false },
    reasonCode: { type: String, default: "UNKNOWN" },
    distanceKm: { type: Number, default: null },
    etaMinMinutes: { type: Number, default: null },
    etaMaxMinutes: { type: Number, default: null },
  },
  { _id: false }
);

const locationContextSchema = new mongoose.Schema(
  {
    contextId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    user: {
      type: mongoose.ObjectId,
      ref: "users",
      default: null,
      index: true,
    },
    source: {
      type: String,
      enum: ["gps", "manual", "saved", "unknown"],
      default: "unknown",
    },
    coordinates: {
      type: coordinatesSchema,
      default: () => ({}),
    },
    address: {
      type: addressSchema,
      default: () => ({}),
    },
    assignedArea: {
      type: assignedAreaSchema,
      default: () => ({}),
    },
    serviceability: {
      type: serviceabilitySchema,
      default: () => ({}),
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

locationContextSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
locationContextSchema.index({ user: 1, updatedAt: -1 });

export default mongoose.model("LocationContext", locationContextSchema);
