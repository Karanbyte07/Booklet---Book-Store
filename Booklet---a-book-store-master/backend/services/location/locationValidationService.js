import productModel from "../../models/productModel.js";
import serviceAreaModel from "../../models/serviceAreaModel.js";
import {
  isLocationSupportedByProduct,
  isWithinServiceRadius,
  normalizeLocationKey,
  normalizePincode,
  toNumberOrNull,
} from "../../utils/locationUtils.js";
import { resolveExistingLocationContext } from "./locationContextService.js";

export const createHttpError = (
  message,
  statusCode = 400,
  reasonCode = "VALIDATION_ERROR"
) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.reasonCode = reasonCode;
  return error;
};

const getItemQuantity = (item) => {
  const parsed = Number(item?.qty);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const getItemPrice = (item) => {
  const parsed = Number(item?.price);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const normalizeCartItems = (cart = []) =>
  cart
    .map((item) => ({
      productId: String(item?._id || ""),
      name: item?.name || "",
      qty: getItemQuantity(item),
      price: getItemPrice(item),
    }))
    .filter((item) => item.productId);

const parseCustomerLocation = (customerLocation = {}) => ({
  pincode: normalizePincode(customerLocation?.pincode || ""),
  latitude: toNumberOrNull(customerLocation?.latitude),
  longitude: toNumberOrNull(customerLocation?.longitude),
});

const resolveServiceAreaFromLegacyInput = async ({
  selectedLocation = "",
  customerLocation = {},
} = {}) => {
  const locationKey = normalizeLocationKey(selectedLocation);
  if (!locationKey || locationKey === "all") {
    throw createHttpError(
      "Please select a valid delivery location",
      400,
      "LOCATION_REQUIRED"
    );
  }

  const serviceArea = await serviceAreaModel
    .findOne({ key: locationKey, isActive: true })
    .select("key label pincode latitude longitude radiusKm")
    .lean();

  if (!serviceArea) {
    throw createHttpError(
      "Selected location is not serviceable right now",
      400,
      "LOCATION_UNSERVICEABLE"
    );
  }

  const parsedCustomerLocation = parseCustomerLocation(customerLocation);
  let distanceKm = null;

  if (
    parsedCustomerLocation.latitude !== null &&
    parsedCustomerLocation.longitude !== null
  ) {
    const rangeStatus = isWithinServiceRadius({
      customerLatitude: parsedCustomerLocation.latitude,
      customerLongitude: parsedCustomerLocation.longitude,
      areaLatitude: serviceArea.latitude,
      areaLongitude: serviceArea.longitude,
      radiusKm: serviceArea.radiusKm,
    });

    distanceKm = rangeStatus.distanceKm;
    if (!rangeStatus.inRange) {
      throw createHttpError(
        `Delivery is outside range for ${serviceArea.label}. Supported radius is ${serviceArea.radiusKm} km.`,
        400,
        "OUT_OF_RADIUS"
      );
    }
  } else if (
    parsedCustomerLocation.pincode &&
    normalizePincode(serviceArea.pincode) !== parsedCustomerLocation.pincode
  ) {
    throw createHttpError(
      `Selected location does not match your current pincode ${parsedCustomerLocation.pincode}`,
      400,
      "PINCODE_MISMATCH"
    );
  }

  return {
    locationContextId: "",
    locationKey,
    locationLabel: serviceArea.label,
    locationPincode: normalizePincode(serviceArea.pincode),
    distanceKm,
    etaMinMinutes: null,
    etaMaxMinutes: null,
  };
};

const resolveLocationDecision = async ({
  locationContextId = "",
  selectedLocation = "",
  customerLocation = {},
  userId = null,
} = {}) => {
  const resolvedContext = await resolveExistingLocationContext({
    contextId: locationContextId,
    userId,
  });

  if (resolvedContext?.selectedLocation) {
    if (!resolvedContext?.serviceability?.isServiceable) {
      throw createHttpError(
        "Selected location is not serviceable right now",
        400,
        resolvedContext?.serviceability?.reasonCode || "LOCATION_UNSERVICEABLE"
      );
    }

    const key = normalizeLocationKey(resolvedContext.selectedLocation);
    const serviceArea = await serviceAreaModel
      .findOne({ key, isActive: true })
      .select("key label pincode latitude longitude radiusKm")
      .lean();

    if (!serviceArea) {
      throw createHttpError(
        "Assigned warehouse is no longer active. Please reselect location.",
        400,
        "WAREHOUSE_INACTIVE"
      );
    }

    return {
      locationContextId: resolvedContext.contextId || "",
      locationKey: key,
      locationLabel: serviceArea.label,
      locationPincode: normalizePincode(serviceArea.pincode),
      distanceKm: toNumberOrNull(resolvedContext?.serviceability?.distanceKm),
      etaMinMinutes: toNumberOrNull(resolvedContext?.serviceability?.etaMinMinutes),
      etaMaxMinutes: toNumberOrNull(resolvedContext?.serviceability?.etaMaxMinutes),
    };
  }

  return resolveServiceAreaFromLegacyInput({
    selectedLocation,
    customerLocation,
  });
};

export const validateCartForLocationInput = async ({
  cart = [],
  locationContextId = "",
  selectedLocation = "",
  customerLocation = {},
  userId = null,
} = {}) => {
  if (!Array.isArray(cart) || cart.length === 0) {
    throw createHttpError("Cart is empty", 400, "CART_EMPTY");
  }

  const locationDecision = await resolveLocationDecision({
    locationContextId,
    selectedLocation,
    customerLocation,
    userId,
  });

  const normalizedCartItems = normalizeCartItems(cart);
  if (!normalizedCartItems.length) {
    throw createHttpError("Invalid products in cart", 400, "INVALID_CART");
  }

  const mergedQtyMap = new Map();
  normalizedCartItems.forEach((item) => {
    const existingQty = mergedQtyMap.get(item.productId) || 0;
    mergedQtyMap.set(item.productId, existingQty + item.qty);
  });

  const productIds = Array.from(mergedQtyMap.keys());
  const products = await productModel
    .find({ _id: { $in: productIds } })
    .select("_id name price quantity serviceLocations");

  const productMap = new Map(products.map((product) => [String(product._id), product]));
  const missingProductIds = productIds.filter((id) => !productMap.has(id));
  if (missingProductIds.length) {
    throw createHttpError(
      "Some products are no longer available",
      400,
      "PRODUCT_MISSING"
    );
  }

  const unavailableInLocation = [];
  const outOfStockProducts = [];
  const orderItems = [];
  let totalAmount = 0;

  mergedQtyMap.forEach((requestedQty, productId) => {
    const product = productMap.get(productId);
    if (!product) return;

    if (!isLocationSupportedByProduct(product.serviceLocations, locationDecision.locationKey)) {
      unavailableInLocation.push(product.name || "Product");
      return;
    }

    const stockQty = Number(product.quantity);
    if (Number.isFinite(stockQty) && stockQty >= 0 && requestedQty > stockQty) {
      outOfStockProducts.push(product.name || "Product");
      return;
    }

    const price = Number(product.price) || 0;
    totalAmount += price * requestedQty;
    orderItems.push({
      productId: String(product._id),
      name: product.name || "",
      qty: requestedQty,
      price,
    });
  });

  if (unavailableInLocation.length) {
    throw createHttpError(
      `These books are not available in your location: ${unavailableInLocation.join(", ")}`,
      400,
      "PRODUCT_UNAVAILABLE_IN_LOCATION"
    );
  }

  if (outOfStockProducts.length) {
    throw createHttpError(
      `These books are out of stock for requested quantity: ${outOfStockProducts.join(", ")}`,
      400,
      "OUT_OF_STOCK"
    );
  }

  if (!orderItems.length) {
    throw createHttpError(
      "No valid items available for checkout",
      400,
      "NO_VALID_ITEMS"
    );
  }

  return {
    ...locationDecision,
    totalAmount,
    productIds: orderItems.map((item) => item.productId),
    orderItems,
  };
};
