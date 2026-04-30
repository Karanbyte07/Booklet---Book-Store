import mongoose from "mongoose";

const socialLinksSchema = new mongoose.Schema(
  {
    facebook: { type: String, trim: true, default: "https://facebook.com" },
    twitter: { type: String, trim: true, default: "https://twitter.com" },
    instagram: { type: String, trim: true, default: "https://instagram.com" },
    linkedin: { type: String, trim: true, default: "https://linkedin.com" },
  },
  { _id: false }
);

const businessHoursSchema = new mongoose.Schema(
  {
    weekdays: {
      type: String,
      trim: true,
      default: "Mon - Fri: 9:00 AM to 6:00 PM",
    },
    saturday: {
      type: String,
      trim: true,
      default: "Sat: 10:00 AM to 4:00 PM",
    },
    sunday: {
      type: String,
      trim: true,
      default: "Sun: Limited support",
    },
  },
  { _id: false }
);

const supportSettingsSchema = new mongoose.Schema(
  {
    primaryEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "help@booklet.com",
    },
    secondaryEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "support@booklet.com",
    },
    primaryPhone: {
      type: String,
      trim: true,
      default: "+1 (800) 123-4567",
    },
    secondaryPhone: {
      type: String,
      trim: true,
      default: "+1 (800) 266-5538",
    },
    officeName: {
      type: String,
      trim: true,
      default: "Booklet Inc.",
    },
    address: {
      type: String,
      trim: true,
      default: "123 Book Street, BC 12345, Canada",
    },
    responseTime: {
      type: String,
      trim: true,
      default: "Response within 24 hours",
    },
    phoneAvailability: {
      type: String,
      trim: true,
      default: "Available all week",
    },
    contactHeroTitle: {
      type: String,
      trim: true,
      default: "Contact Booklet",
    },
    contactHeroDescription: {
      type: String,
      trim: true,
      default:
        "Questions about orders, payments, or recommendations? Reach out and our support team will help quickly.",
    },
    quickHelpText: {
      type: String,
      trim: true,
      default:
        "For urgent order questions, phone and email support are prioritized.",
    },
    socialLinks: {
      type: socialLinksSchema,
      default: () => ({}),
    },
    businessHours: {
      type: businessHoursSchema,
      default: () => ({}),
    },
  },
  { _id: false }
);

const siteSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: "global",
      trim: true,
      lowercase: true,
    },
    support: {
      type: supportSettingsSchema,
      default: () => ({}),
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

export default mongoose.model("SiteSettings", siteSettingsSchema);
