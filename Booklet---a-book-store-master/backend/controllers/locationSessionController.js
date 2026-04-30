import serviceAreaModel from "../models/serviceAreaModel.js";
import {
  reverseLookupAddressFromCoordinates,
  searchAddressSuggestions,
} from "../services/location/geoService.js";
import { saveLocationContext, resolveExistingLocationContext } from "../services/location/locationContextService.js";
import { validateCartForLocationInput } from "../services/location/locationValidationService.js";
import { allocateWarehouseForLocation } from "../services/location/warehouseAllocator.js";
import { normalizeLocationKey, normalizePincode, toNumberOrNull } from "../utils/locationUtils.js";

const normalizeCoordinates = (coordinates = {}) => ({
  latitude: toNumberOrNull(coordinates?.latitude ?? coordinates?.lat),
  longitude: toNumberOrNull(coordinates?.longitude ?? coordinates?.lng),
});

const normalizeAddress = (address = {}) => ({
  label: String(address?.label || address?.displayName || "").trim(),
  line1: String(address?.line1 || "").trim(),
  city: String(address?.city || "").trim(),
  state: String(address?.state || "").trim(),
  country: String(address?.country || "India").trim(),
  pincode: normalizePincode(address?.pincode || ""),
});

const buildResolvePayload = async (body = {}) => {
  const source = ["gps", "manual"].includes(body?.source) ? body.source : "manual";
  const contextId = String(body?.contextId || "").trim();
  const serviceAreaId = normalizeLocationKey(
    body?.serviceAreaId || body?.selectedLocation || body?.areaKey
  );

  const coordinates = normalizeCoordinates(body?.coordinates || body || {});
  let address = normalizeAddress(body?.address || {});

  if (
    (!address.pincode || !address.label) &&
    coordinates.latitude !== null &&
    coordinates.longitude !== null
  ) {
    const reverse = await reverseLookupAddressFromCoordinates(
      coordinates.latitude,
      coordinates.longitude
    );
    if (reverse) {
      address = normalizeAddress({
        ...address,
        label: address.label || reverse.label,
        line1: address.line1 || reverse.address?.line1,
        city: address.city || reverse.address?.city,
        state: address.state || reverse.address?.state,
        country: address.country || reverse.address?.country,
        pincode: address.pincode || reverse.address?.pincode,
      });
    }
  }

  return {
    source,
    contextId,
    serviceAreaId,
    coordinates,
    address,
  };
};

export const resolveLocationContextController = async (req, res) => {
  try {
    const payload = await buildResolvePayload(req.body || {});
    if (
      !payload.serviceAreaId &&
      payload.coordinates.latitude === null &&
      payload.coordinates.longitude === null &&
      !payload.address.pincode
    ) {
      return res.status(400).send({
        success: false,
        message: "Location data is required",
      });
    }

    const allocation = await allocateWarehouseForLocation({
      areaKey: payload.serviceAreaId,
      pincode: payload.address.pincode,
      latitude: payload.coordinates.latitude,
      longitude: payload.coordinates.longitude,
    });

    const context = await saveLocationContext({
      contextId: payload.contextId,
      userId: req.user?._id || null,
      source: payload.source,
      coordinates: payload.coordinates,
      address: payload.address,
      assignedArea: allocation.assignedArea,
      serviceability: allocation.serviceability,
    });

    return res.status(200).send({
      success: true,
      context,
    });
  } catch (error) {
    console.log("resolveLocationContextController error:", error);
    return res.status(500).send({
      success: false,
      message: "Unable to resolve delivery location",
    });
  }
};

export const getLocationContextController = async (req, res) => {
  try {
    const contextId =
      String(req.query?.contextId || "").trim() ||
      String(req.headers["x-location-context-id"] || "").trim();

    const context = await resolveExistingLocationContext({
      contextId,
      userId: req.user?._id || null,
    });

    return res.status(200).send({
      success: true,
      context: context || null,
    });
  } catch (error) {
    console.log("getLocationContextController error:", error);
    return res.status(500).send({
      success: false,
      message: "Unable to fetch location context",
    });
  }
};

export const autocompleteLocationController = async (req, res) => {
  try {
    const query = String(req.body?.query || req.query?.query || "").trim();
    if (!query || query.length < 2) {
      return res.status(200).send({
        success: true,
        suggestions: [],
      });
    }

    let suggestions = await searchAddressSuggestions(query, 6);

    if (!suggestions.length) {
      const localAreas = await serviceAreaModel
        .find({
          isActive: true,
          $or: [
            { label: { $regex: query, $options: "i" } },
            { pincode: { $regex: query.replace(/\D/g, ""), $options: "i" } },
          ],
        })
        .select("key label pincode latitude longitude")
        .limit(6)
        .lean();

      suggestions = localAreas.map((area) => ({
        placeId: `service-area:${area.key}`,
        label: area.label,
        coordinates: {
          latitude: toNumberOrNull(area.latitude),
          longitude: toNumberOrNull(area.longitude),
        },
        address: {
          line1: area.label,
          city: "",
          state: "",
          country: "India",
          pincode: normalizePincode(area.pincode || ""),
        },
      }));
    }

    return res.status(200).send({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.log("autocompleteLocationController error:", error);
    return res.status(500).send({
      success: false,
      message: "Unable to search locations",
    });
  }
};

export const selectLocationController = async (req, res) => {
  return resolveLocationContextController(req, res);
};

export const validateLocationCartController = async (req, res) => {
  try {
    const result = await validateCartForLocationInput({
      cart: req.body?.cart || [],
      locationContextId: req.body?.locationContextId || "",
      selectedLocation: req.body?.selectedLocation || "",
      customerLocation: req.body?.customerLocation || {},
      userId: req.user?._id || null,
    });

    return res.status(200).send({
      success: true,
      allowed: true,
      reasonCode: "SERVICEABLE",
      locationContextId: result.locationContextId || "",
      locationKey: result.locationKey,
      locationLabel: result.locationLabel,
      locationPincode: result.locationPincode,
      distanceKm: result.distanceKm,
      etaMinMinutes: result.etaMinMinutes,
      etaMaxMinutes: result.etaMaxMinutes,
      unavailableItems: [],
    });
  } catch (error) {
    const statusCode = Number(error?.statusCode) || 500;
    if (statusCode >= 500) {
      return res.status(statusCode).send({
        success: false,
        allowed: false,
        reasonCode: "SERVER_ERROR",
        message: error.message || "Unable to validate cart for location",
      });
    }

    return res.status(200).send({
      success: true,
      allowed: false,
      reasonCode: error?.reasonCode || "VALIDATION_ERROR",
      message: error.message || "Cart is not serviceable for selected location",
      unavailableItems: [],
    });
  }
};
