import orderModel from "../models/orderModel.js";
import crypto from "crypto";
import { normalizeAddressPayload } from "../utils/addressUtils.js";
import {
  createHttpError,
  validateCartForLocationInput,
} from "../services/location/locationValidationService.js";

const validateDeliveryAddress = (deliveryAddressInput = {}) => {
  const normalizedDeliveryAddress = normalizeAddressPayload(deliveryAddressInput);
  if (!normalizedDeliveryAddress.line1) {
    throw createHttpError("Please select a delivery address");
  }
  return normalizedDeliveryAddress;
};

const createRazorpayAuthHeader = () =>
  `Basic ${Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString("base64")}`;

const createRazorpayOrder = async (payload) => {
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: createRazorpayAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      data?.error?.description ||
      data?.error?.reason ||
      data?.message ||
      "Unable to create Razorpay order";
    throw new Error(message);
  }
  return data;
};

// razorpay payment order creation
export const createRazorpayOrderController = async (req, res) => {
  try {
    const {
      cart,
      selectedLocation,
      customerLocation,
      locationContextId,
      deliveryAddress,
    } = req.body;

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).send({
        success: false,
        message: "Razorpay is not configured on server",
      });
    }

    const normalizedDeliveryAddress = validateDeliveryAddress(deliveryAddress);

    const validatedCart = await validateCartForLocationInput({
      cart,
      locationContextId,
      selectedLocation,
      customerLocation,
      userId: req.user?._id || null,
    });
    const amount = Math.round(validatedCart.totalAmount * 100);

    if (!amount || amount < 100) {
      return res.status(400).send({
        success: false,
        message: "Invalid order amount",
      });
    }

    const receipt = `rcpt_${Date.now()}_${String(req.user?._id || "").slice(-6)}`;
    const order = await createRazorpayOrder({
      amount,
      currency: "INR",
      receipt,
      notes: {
        buyerId: String(req.user?._id || ""),
        items: String(validatedCart.orderItems.length),
        locationContextId: validatedCart.locationContextId || "",
        deliveryLocation: validatedCart.locationKey,
        deliveryPincode: validatedCart.locationPincode,
        deliveryAddressLine1: normalizedDeliveryAddress.line1,
        deliveryAddressPincode: normalizedDeliveryAddress.pincode || "",
      },
    });

    return res.status(200).send({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID,
      order,
    });
  } catch (error) {
    console.log("Razorpay create order error:", error);
    const statusCode = Number(error?.statusCode) || 500;
    return res.status(statusCode).send({
      success: false,
      message: error.message || "Unable to create payment order",
    });
  }
};

// razorpay payment verification + order save
export const verifyRazorpayPaymentController = async (req, res) => {
  try {
    const {
      cart,
      selectedLocation,
      customerLocation,
      locationContextId,
      deliveryAddress,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).send({
        success: false,
        message: "Missing payment verification fields",
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).send({
        success: false,
        message: "Razorpay secret is not configured",
      });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    const receivedSignature = String(razorpay_signature);
    const isValidSignature =
      expectedSignature.length === receivedSignature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(receivedSignature)
      );

    if (!isValidSignature) {
      return res.status(400).send({
        success: false,
        message: "Payment signature verification failed",
      });
    }

    const validatedCart = await validateCartForLocationInput({
      cart,
      locationContextId,
      selectedLocation,
      customerLocation,
      userId: req.user?._id || null,
    });
    const normalizedDeliveryAddress = validateDeliveryAddress(deliveryAddress);

    const order = await new orderModel({
      products: validatedCart.productIds,
      payment: {
        success: true,
        provider: "razorpay",
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        amount: validatedCart.totalAmount,
        currency: "INR",
        items: validatedCart.orderItems,
        deliveryLocation: validatedCart.locationKey,
        deliveryLocationLabel: validatedCart.locationLabel,
        deliveryPincode: validatedCart.locationPincode,
        deliveryDistanceKm: validatedCart.distanceKm,
        deliveryAddress: normalizedDeliveryAddress,
      },
      buyer: req.user._id,
      deliveryLocation: validatedCart.locationKey,
      deliveryLocationLabel: validatedCart.locationLabel,
      deliveryPincode: validatedCart.locationPincode,
      deliveryDistanceKm: validatedCart.distanceKm,
      shippingAddress: normalizedDeliveryAddress,
    }).save();

    return res.status(200).send({
      success: true,
      message: "Payment verified successfully",
      orderId: order._id,
    });
  } catch (error) {
    console.log("Razorpay verify payment error:", error);
    const statusCode = Number(error?.statusCode) || 500;
    return res.status(statusCode).send({
      success: false,
      message: error.message || "Unable to verify payment",
    });
  }
};
