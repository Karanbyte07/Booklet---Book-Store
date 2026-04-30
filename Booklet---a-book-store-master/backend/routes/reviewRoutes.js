import express from "express";
import {
  createOrUpdateProductReviewController,
  getProductReviewsController,
} from "../controllers/reviewController.js";
import { requireSignIn } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/product/:pid", getProductReviewsController);
router.post("/product/:pid", requireSignIn, createOrUpdateProductReviewController);

export default router;
