import mongoose from "mongoose";
import serviceAreaModel from "../models/serviceAreaModel.js";
import {
  reverseLookupAddressFromCoordinates,
  searchAddressSuggestions,
} from "../services/location/geoService.js";
import {
  normalizeLocationKey,
  normalizePincode,
  toNumberOrNull,
} from "../utils/locationUtils.js";

const getServiceAreaId = (serviceArea) => String(serviceArea?.key || "");

const normalizeIsActive = (value, fallback = true) => {
  if (typeof value === "boolean") return value;
  if (value === null || value === undefined) return fallback;
  if (typeof value === "number") return value === 1;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (
      ["true", "1", "yes", "y", "active", "enabled", "on"].includes(normalized)
    ) {
      return true;
    }
    if (
      ["false", "0", "no", "n", "inactive", "deactivated", "disabled", "off"].includes(
        normalized
      )
    ) {
      return false;
    }
  }

  return Boolean(value);
};

const serializeServiceArea = (serviceArea) => ({
  _id: serviceArea?._id,
  id: getServiceAreaId(serviceArea),
  key: getServiceAreaId(serviceArea),
  label: serviceArea?.label || "",
  pincode: serviceArea?.pincode || "",
  latitude: Number(serviceArea?.latitude) || 0,
  longitude: Number(serviceArea?.longitude) || 0,
  radiusKm: Number(serviceArea?.radiusKm) || 0,
  type: serviceArea?.type || "urban",
  isActive: normalizeIsActive(
    serviceArea?.isActive ??
      serviceArea?.activeForCustomer ??
      serviceArea?.isActiveForCustomer ??
      serviceArea?.active,
    true
  ),
});

const parseServiceAreaPayload = (payload = {}) => {
  const label = String(payload?.label || "").trim();
  const pincode = normalizePincode(payload?.pincode);
  const generatedKey = normalizeLocationKey(
    payload?.key || `${label}-${pincode}`
  );
  const latitude = toNumberOrNull(payload?.latitude);
  const longitude = toNumberOrNull(payload?.longitude);
  const radiusKm = toNumberOrNull(payload?.radiusKm) ?? 8;
  const type = String(payload?.type || "urban").trim().toLowerCase() || "urban";

  if (!label) {
    throw new Error("Service area name is required");
  }

  if (!generatedKey) {
    throw new Error("Valid service area key is required");
  }

  if (!pincode || pincode.length !== 6) {
    throw new Error("Valid 6-digit pincode is required");
  }

  if (latitude === null || latitude < -90 || latitude > 90) {
    throw new Error("Valid latitude is required");
  }

  if (longitude === null || longitude < -180 || longitude > 180) {
    throw new Error("Valid longitude is required");
  }

  if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
    throw new Error("Radius should be greater than 0");
  }

  const area = {
    key: generatedKey,
    label,
    pincode,
    latitude,
    longitude,
    radiusKm,
    type,
  };

  const parsedIsActive = normalizeIsActive(
    payload?.isActive ??
      payload?.activeForCustomer ??
      payload?.isActiveForCustomer ??
      payload?.active,
    null
  );

  if (parsedIsActive !== null) {
    area.isActive = parsedIsActive;
  }

  return area;
};

const findServiceAreaByIdentifier = async (identifier) => {
  const value = String(identifier || "").trim();
  if (!value) return null;

  if (mongoose.isValidObjectId(value)) {
    const byId = await serviceAreaModel.findById(value);
    if (byId) return byId;
  }

  return serviceAreaModel.findOne({ key: normalizeLocationKey(value) });
};

const normalizeIdentifierList = (identifiers = []) => {
  if (!Array.isArray(identifiers)) return [];

  const seen = new Set();
  const result = [];

  identifiers.forEach((identifier) => {
    const value = String(identifier || "").trim();
    if (!value) return;

    const hash = value.toLowerCase();
    if (seen.has(hash)) return;
    seen.add(hash);
    result.push(value);
  });

  return result;
};

const normalizeResolvedLocation = (value = {}) => {
  const latitude = toNumberOrNull(
    value?.coordinates?.latitude ?? value?.latitude ?? value?.lat
  );
  const longitude = toNumberOrNull(
    value?.coordinates?.longitude ?? value?.longitude ?? value?.lng
  );

  const address = value?.address || {};
  const line1 = String(value?.line1 || address?.line1 || "").trim();
  const city = String(value?.city || address?.city || "").trim();
  const state = String(value?.state || address?.state || "").trim();
  const country = String(value?.country || address?.country || "India").trim();
  const pincode = normalizePincode(value?.pincode || address?.pincode || "");
  const fallbackLabel = [line1, city].filter(Boolean).join(", ");

  return {
    label: String(value?.label || fallbackLabel).trim(),
    line1,
    city,
    state,
    country,
    pincode,
    latitude,
    longitude,
  };
};

export const getServiceAreasController = async (req, res) => {
  try {
    const serviceAreas = await serviceAreaModel
      .find({ isActive: true })
      .sort({ label: 1 });

    const response = serviceAreas.map(serializeServiceArea);

    return res.status(200).send({
      success: true,
      serviceAreas: response,
      defaultLocation: response[0]?.id || "",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Unable to fetch service areas",
    });
  }
};

export const getAdminServiceAreasController = async (req, res) => {
  try {
    const serviceAreas = await serviceAreaModel.find({}).sort({ createdAt: -1 });

    return res.status(200).send({
      success: true,
      serviceAreas: serviceAreas.map(serializeServiceArea),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Unable to fetch admin service areas",
    });
  }
};

export const geocodeServiceAreaController = async (req, res) => {
  try {
    const query = String(req.body?.query || "").trim();
    const pincode = normalizePincode(req.body?.pincode || "");
    const coordinates = req.body?.coordinates || {};
    const latitude = toNumberOrNull(
      req.body?.latitude ?? coordinates?.latitude ?? coordinates?.lat
    );
    const longitude = toNumberOrNull(
      req.body?.longitude ?? coordinates?.longitude ?? coordinates?.lng
    );

    if (latitude !== null && longitude !== null) {
      const reverse = await reverseLookupAddressFromCoordinates(latitude, longitude);
      const location = normalizeResolvedLocation({
        ...(reverse || {}),
        latitude,
        longitude,
      });

      return res.status(200).send({
        success: true,
        mode: "reverse",
        location,
      });
    }

    const searchTerm = query || pincode;
    if (!searchTerm || searchTerm.length < 2) {
      return res.status(400).send({
        success: false,
        message: "Search query or coordinates are required",
      });
    }

    const limit = Math.min(Math.max(Number(req.body?.limit) || 6, 1), 10);
    const suggestions = await searchAddressSuggestions(searchTerm, limit);

    return res.status(200).send({
      success: true,
      mode: "search",
      suggestions: suggestions.map(normalizeResolvedLocation),
    });
  } catch (error) {
    console.log("geocodeServiceAreaController error:", error);
    return res.status(500).send({
      success: false,
      message: "Unable to resolve location coordinates",
    });
  }
};

export const createServiceAreaController = async (req, res) => {
  try {
    const payload = parseServiceAreaPayload(req.body);

    const exists = await serviceAreaModel.findOne({ key: payload.key });
    if (exists) {
      return res.status(409).send({
        success: false,
        message: "Service area key already exists",
      });
    }

    const serviceArea = await serviceAreaModel.create({
      ...payload,
      createdBy: req.user?._id || null,
      updatedBy: req.user?._id || null,
    });

    return res.status(201).send({
      success: true,
      message: "Service area created",
      serviceArea: serializeServiceArea(serviceArea),
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: error.message || "Unable to create service area",
    });
  }
};

export const updateServiceAreaController = async (req, res) => {
  try {
    const serviceArea = await findServiceAreaByIdentifier(req.params.id);
    if (!serviceArea) {
      return res.status(404).send({
        success: false,
        message: "Service area not found",
      });
    }

    const body = req.body || {};
    const bodyKeys = Object.keys(body);
    const activeFieldKeys = [
      "isActive",
      "activeForCustomer",
      "isActiveForCustomer",
      "active",
    ];
    const statusFieldKey = activeFieldKeys.find((key) => bodyKeys.includes(key));
    const nextStatus = normalizeIsActive(
      statusFieldKey ? body?.[statusFieldKey] : undefined,
      null
    );
    const isStatusOnlyUpdate =
      bodyKeys.length === 1 && Boolean(statusFieldKey) && nextStatus !== null;

    if (isStatusOnlyUpdate) {
      const updatedStatus = await serviceAreaModel.findByIdAndUpdate(
        serviceArea._id,
        {
          isActive: nextStatus,
          updatedBy: req.user?._id || null,
        },
        { new: true }
      );

      return res.status(200).send({
        success: true,
        message: nextStatus
          ? "Service area activated"
          : "Service area disabled",
        serviceArea: serializeServiceArea(updatedStatus),
      });
    }

    const payload = parseServiceAreaPayload({
      ...serviceArea.toObject(),
      ...req.body,
    });

    const keyChanged = payload.key !== serviceArea.key;
    if (keyChanged) {
      const duplicate = await serviceAreaModel.findOne({ key: payload.key });
      if (duplicate) {
        return res.status(409).send({
          success: false,
          message: "Service area key already exists",
        });
      }
    }

    const updated = await serviceAreaModel.findByIdAndUpdate(
      serviceArea._id,
      {
        ...payload,
        updatedBy: req.user?._id || null,
      },
      { new: true }
    );

    return res.status(200).send({
      success: true,
      message: "Service area updated",
      serviceArea: serializeServiceArea(updated),
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: error.message || "Unable to update service area",
    });
  }
};

export const deleteServiceAreaController = async (req, res) => {
  try {
    const permanentDelete =
      String(req.query?.permanent || "")
        .trim()
        .toLowerCase() === "true";
    const serviceArea = await findServiceAreaByIdentifier(req.params.id);
    if (!serviceArea) {
      return res.status(404).send({
        success: false,
        message: "Service area not found",
      });
    }

    if (permanentDelete) {
      await serviceAreaModel.findByIdAndDelete(serviceArea._id);
      return res.status(200).send({
        success: true,
        message: "Service area permanently deleted",
        serviceArea: serializeServiceArea(serviceArea),
      });
    }

    const updated = await serviceAreaModel.findByIdAndUpdate(
      serviceArea._id,
      {
        isActive: false,
        updatedBy: req.user?._id || null,
      },
      { new: true }
    );

    return res.status(200).send({
      success: true,
      message: "Service area disabled",
      serviceArea: serializeServiceArea(updated),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Unable to delete service area",
    });
  }
};

export const bulkDeleteServiceAreasController = async (req, res) => {
  try {
    const identifiers = normalizeIdentifierList(req.body?.ids);
    if (!identifiers.length) {
      return res.status(400).send({
        success: false,
        message: "Please provide at least one service area identifier",
      });
    }

    const permanentDelete =
      String(req.query?.permanent ?? req.body?.permanent ?? "")
        .trim()
        .toLowerCase() === "true";

    const objectIds = [];
    const keys = new Set();

    identifiers.forEach((identifier) => {
      if (mongoose.isValidObjectId(identifier)) {
        objectIds.push(new mongoose.Types.ObjectId(identifier));
      }
      keys.add(normalizeLocationKey(identifier));
    });

    const filters = [];
    if (objectIds.length) {
      filters.push({ _id: { $in: objectIds } });
    }
    if (keys.size) {
      filters.push({ key: { $in: Array.from(keys) } });
    }

    const serviceAreas = await serviceAreaModel.find(
      filters.length > 1 ? { $or: filters } : filters[0] || {}
    );

    if (!serviceAreas.length) {
      return res.status(404).send({
        success: false,
        message: "No matching service areas found",
      });
    }

    const serviceAreaIds = serviceAreas.map((serviceArea) => serviceArea._id);

    if (permanentDelete) {
      await serviceAreaModel.deleteMany({ _id: { $in: serviceAreaIds } });
    } else {
      await serviceAreaModel.updateMany(
        { _id: { $in: serviceAreaIds } },
        {
          $set: {
            isActive: false,
            updatedBy: req.user?._id || null,
          },
        }
      );
    }

    const updatedServiceAreas = permanentDelete
      ? serviceAreas
      : await serviceAreaModel.find({ _id: { $in: serviceAreaIds } });

    const matchedIdentifierHashes = new Set();
    serviceAreas.forEach((serviceArea) => {
      matchedIdentifierHashes.add(String(serviceArea?._id || "").toLowerCase());
      matchedIdentifierHashes.add(String(serviceArea?.key || "").toLowerCase());
    });

    const missingIdentifiers = identifiers.filter((identifier) => {
      const hash = identifier.toLowerCase();
      return !matchedIdentifierHashes.has(hash) &&
        !matchedIdentifierHashes.has(normalizeLocationKey(identifier))
        ? true
        : false;
    });

    return res.status(200).send({
      success: true,
      message: permanentDelete
        ? "Selected service areas permanently deleted"
        : "Selected service areas disabled",
      count: serviceAreas.length,
      missingIdentifiers,
      serviceAreas: updatedServiceAreas.map(serializeServiceArea),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Unable to delete selected service areas",
    });
  }
};
