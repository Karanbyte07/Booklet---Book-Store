import express from "express";
import dotenv from "dotenv";
//configure env
dotenv.config();
console.log("Environment variables loaded");

import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoute.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import uploadFilesRoutes from "./routes/uploadFileRoute.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import siteSettingsRoutes from "./routes/siteSettingsRoutes.js";
import cors from "cors";
import errorHandler from "./middlewares/errorMiddleware.js";

//databse config
console.log("Connecting to database...");
connectDB();

//rest object
const app = express();

const parseCsvEnv = (value = "") =>
  String(value)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

const normalizeOrigin = (origin = "") => origin.replace(/\/+$/, "");

const isFullOrigin = (value = "") => /^https?:\/\//i.test(value);

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const createOriginPattern = (hostOrIp = "") => {
  const escaped = escapeRegex(hostOrIp);
  return new RegExp(`^https?:\\/\\/${escaped}(?::\\d+)?$`, "i");
};

const parseAllowedOrigins = () => {
  const envEntries = parseCsvEnv(process.env.CORS_ORIGINS);
  const envOriginEntries = envEntries.filter(isFullOrigin).map(normalizeOrigin);
  const envHostEntries = envEntries.filter((entry) => !isFullOrigin(entry));

  const baseOrigins = [
    process.env.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]
    .filter(Boolean)
    .map(normalizeOrigin);

  const exactOrigins = Array.from(new Set([...baseOrigins, ...envOriginEntries]));
  const hostPatterns = envHostEntries.map(createOriginPattern);

  return { exactOrigins, hostPatterns };
};

const { exactOrigins: allowedOrigins, hostPatterns: allowedOriginPatterns } =
  parseAllowedOrigins();
const localOriginPatterns = [
  /^https?:\/\/localhost:\d+$/i,
  /^https?:\/\/127\.0\.0\.1:\d+$/i,
];
const ngrokOriginPatterns = [
  /^https:\/\/[a-z0-9-]+\.ngrok-free\.app$/i,
  /^https:\/\/[a-z0-9-]+\.ngrok-free\.dev$/i,
  /^https:\/\/[a-z0-9-]+\.ngrok\.io$/i,
];

const isAllowedOrigin = (origin = "") => {
  if (!origin) return true;
  const normalizedOrigin = normalizeOrigin(origin);
  if (allowedOrigins.includes(normalizedOrigin)) return true;
  if (allowedOriginPatterns.some((pattern) => pattern.test(normalizedOrigin))) {
    return true;
  }
  if (localOriginPatterns.some((pattern) => pattern.test(origin))) return true;
  return ngrokOriginPatterns.some((pattern) => pattern.test(origin));
};

//middelwares
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
app.use(morgan("dev"));

//routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/review", reviewRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/location", locationRoutes);
app.use("/api/v1/uploads", uploadFilesRoutes);
app.use("/api/v1/site-settings", siteSettingsRoutes);
// Centralized error handler (should be last middleware)
app.use(errorHandler);

//rest api
app.get("/", (req, res) => {
  res.send("<h1>Welcome to Booklet - Online Bookstore</h1>");
});

//PORT
const PORT = process.env.PORT || 8080;

//run listen
app.listen(PORT, () => {
  console.log(`Server Running on mode on port ${PORT}`.bgCyan.white);
});
