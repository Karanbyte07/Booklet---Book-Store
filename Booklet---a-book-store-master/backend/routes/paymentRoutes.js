import express from "express";
import {
  createRazorpayOrderController,
  verifyRazorpayPaymentController,
} from "../controllers/paymentController.js";
import { requireSignIn } from "../middlewares/authMiddleware.js";

const router = express.Router();

// razorpay
router.post("/razorpay/create-order", requireSignIn, createRazorpayOrderController);

router.post("/razorpay/verify-payment", requireSignIn, verifyRazorpayPaymentController);

export default router;
