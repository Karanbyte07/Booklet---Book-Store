import crypto from "crypto";
import locationContextModel from "../../models/locationContextModel.js";
import userModel from "../../models/userModel.js";
import {
  normalizeLocationKey,
  normalizePincode,
  toNumberOrNull,
} from "../../utils/locationUtils.js";

const LOCATION_CONTEXT_TTL_DAYS = 30;

const createContextId = () => {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return crypto.randomBytes(16).toString("hex");
};

const getExpiryDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + LOCATION_CONTEXT_TTL_DAYS);
  return date;
};

const sanitizeCoordinates = (coordinates = {}) => {
  const latitude = toNumberOrNull(
    coordinates?.latitude ?? coordinates?.lat ?? coordinates?.coords?.latitude
  );
  const longitude = toNumberOrNull(
    coordinates?.longitude ?? coordinates?.lng ?? coordinates?.coords?.longitude
  );

  if (latitude === null || longitude === null) {
    return { latitude: null, longitude: null };
  }

  return { latitude, longitude };
};

const sanitizeAddress = (address = {}) => ({
  label: String(address?.label || address?.displayName || "").trim(),
  line1: String(address?.line1 || "").trim(),
  city: String(address?.city || "").trim(),
  state: String(address?.state || "").trim(),
  country: String(address?.country || "India").trim(),
  pincode: normalizePincode(address?.pincode || ""),
});

const sanitizeAssignedArea = (assignedArea = null) => {
  if (!assignedArea) return null;
  const key = normalizeLocationKey(assignedArea?.key || assignedArea?.id || "");
  if (!key) return null;

  return {
    key,
    label: String(assignedArea?.label || "").trim(),
    pincode: normalizePincode(assignedArea?.pincode || ""),
    latitude: toNumberOrNull(assignedArea?.latitude),
    longitude: toNumberOrNull(assignedArea?.longitude),
    radiusKm: toNumberOrNull(assignedArea?.radiusKm),
    type: String(assignedArea?.type || "urban").trim(),
  };
};

const sanitizeServiceability = (serviceability = {}) => ({
  isServiceable: Boolean(serviceability?.isServiceable),
  reasonCode: String(serviceability?.reasonCode || "UNKNOWN").trim() || "UNKNOWN",
  distanceKm: toNumberOrNull(serviceability?.distanceKm),
  etaMinMinutes: toNumberOrNull(serviceability?.etaMinMinutes),
  etaMaxMinutes: toNumberOrNull(serviceability?.etaMaxMinutes),
});

const toPublicContext = (context = null) => {
  if (!context) return null;

  const assignedArea = sanitizeAssignedArea(context.assignedArea);
  const serviceability = sanitizeServiceability(context.serviceability);
  const coordinates = sanitizeCoordinates(context.coordinates);
  const address = sanitizeAddress(context.address);
  const displayLabel =
    address?.label ||
    [address?.line1, address?.city].filter(Boolean).join(", ") ||
    assignedArea?.label ||
    "Select Location";

  return {
    contextId: String(context.contextId || ""),
    source: String(context.source || "unknown"),
    coordinates,
    address,
    serviceability,
    assignedWarehouse: assignedArea,
    selectedLocation: assignedArea?.key || "",
    selectedLocationLabel: displayLabel,
    selectedLocationPincode: address?.pincode || assignedArea?.pincode || "",
    deliveryEta:
      serviceability.etaMinMinutes !== null && serviceability.etaMaxMinutes !== null
        ? `${serviceability.etaMinMinutes}-${serviceability.etaMaxMinutes} min`
        : "",
    updatedAt: context.updatedAt || null,
  };
};

export const saveLocationContext = async ({
  contextId = "",
  userId = null,
  source = "unknown",
  coordinates = {},
  address = {},
  assignedArea = null,
  serviceability = {},
} = {}) => {
  const nextContextId = String(contextId || "").trim() || createContextId();
  const payload = {
    user: userId || null,
    source: ["gps", "manual", "saved"].includes(source) ? source : "unknown",
    coordinates: sanitizeCoordinates(coordinates),
    address: sanitizeAddress(address),
    assignedArea: sanitizeAssignedArea(assignedArea) || {},
    serviceability: sanitizeServiceability(serviceability),
    expiresAt: getExpiryDate(),
  };

  const persisted = await locationContextModel.findOneAndUpdate(
    { contextId: nextContextId },
    { $set: payload, $setOnInsert: { contextId: nextContextId } },
    { new: true, upsert: true }
  );

  const publicContext = toPublicContext(persisted);

  if (userId) {
    await userModel.findByIdAndUpdate(userId, {
      $set: {
        currentDeliveryLocation: {
          ...publicContext,
          updatedAt: new Date(),
        },
        currentWarehouseId: payload.assignedArea?.key || "",
        deliveryLocationUpdatedAt: new Date(),
      },
    });
  }

  return publicContext;
};

export const getLocationContextById = async (contextId = "") => {
  const normalized = String(contextId || "").trim();
  if (!normalized) return null;

  const context = await locationContextModel.findOne({
    contextId: normalized,
    expiresAt: { $gt: new Date() },
  });
  return toPublicContext(context);
};

export const getLatestLocationContextForUser = async (userId = "") => {
  if (!userId) return null;
  const context = await locationContextModel
    .findOne({
      user: userId,
      expiresAt: { $gt: new Date() },
    })
    .sort({ updatedAt: -1 });
  if (context) return toPublicContext(context);

  const user = await userModel
    .findById(userId)
    .select("currentDeliveryLocation")
    .lean();
  if (user?.currentDeliveryLocation?.contextId) {
    const fallbackContext = user.currentDeliveryLocation;
    const selectedLocation = normalizeLocationKey(
      fallbackContext?.selectedLocation || fallbackContext?.assignedWarehouse?.key || ""
    );
    const fallbackLabel =
      String(fallbackContext?.address?.label || "").trim() ||
      String(fallbackContext?.selectedLocationLabel || "").trim() ||
      String(fallbackContext?.assignedWarehouse?.label || "").trim() ||
      "Select Location";
    return {
      ...fallbackContext,
      selectedLocation,
      selectedLocationLabel: fallbackLabel,
      selectedLocationPincode: normalizePincode(
        fallbackContext?.address?.pincode ||
          fallbackContext?.selectedLocationPincode ||
          fallbackContext?.assignedWarehouse?.pincode ||
          ""
      ),
    };
  }

  return null;
};

export const resolveExistingLocationContext = async ({
  contextId = "",
  userId = null,
} = {}) => {
  const byContext = await getLocationContextById(contextId);
  if (byContext) return byContext;
  if (userId) {
    return getLatestLocationContextForUser(userId);
  }
  return null;
};
