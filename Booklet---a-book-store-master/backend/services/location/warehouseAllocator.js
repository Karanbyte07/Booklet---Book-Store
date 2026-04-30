import serviceAreaModel from "../../models/serviceAreaModel.js";
import {
  getDistanceInKm,
  normalizeLocationKey,
  normalizePincode,
  toNumberOrNull,
} from "../../utils/locationUtils.js";

const DEFAULT_ETA_MINUTES = { min: 20, max: 45 };

const serializeArea = (area) => ({
  key: normalizeLocationKey(area?.key || ""),
  label: String(area?.label || "").trim(),
  pincode: normalizePincode(area?.pincode || ""),
  latitude: toNumberOrNull(area?.latitude),
  longitude: toNumberOrNull(area?.longitude),
  radiusKm: toNumberOrNull(area?.radiusKm) ?? 0,
  type: String(area?.type || "urban").trim(),
});

const estimateEtaForDistance = (distanceKm) => {
  if (typeof distanceKm !== "number" || distanceKm < 0) return DEFAULT_ETA_MINUTES;
  if (distanceKm <= 2) return { min: 12, max: 20 };
  if (distanceKm <= 5) return { min: 18, max: 30 };
  if (distanceKm <= 8) return { min: 24, max: 40 };
  return { min: 35, max: 55 };
};

const selectByAreaKey = (areas = [], areaKey = "") => {
  const normalized = normalizeLocationKey(areaKey);
  if (!normalized) return null;
  const matched = areas.find((area) => area.key === normalized);
  if (!matched) return null;

  return {
    matchedBy: "manual-area",
    area: matched,
    distanceKm: 0,
    inServiceRadius: true,
    eta: estimateEtaForDistance(0),
  };
};

const selectByPincode = (areas = [], pincode = "") => {
  const normalized = normalizePincode(pincode);
  if (!normalized) return null;
  const matched = areas.find((area) => normalizePincode(area?.pincode) === normalized);
  if (!matched) return null;
  return {
    matchedBy: "pincode",
    area: matched,
    distanceKm: 0,
    inServiceRadius: true,
    eta: estimateEtaForDistance(0),
  };
};

const selectByDistance = (areas = [], latitude, longitude) => {
  const lat = toNumberOrNull(latitude);
  const lng = toNumberOrNull(longitude);
  if (lat === null || lng === null) return null;

  let nearest = null;
  areas.forEach((area) => {
    const distanceKm = getDistanceInKm(lat, lng, area.latitude, area.longitude);
    if (distanceKm === null) return;
    const inServiceRadius = distanceKm <= (toNumberOrNull(area.radiusKm) ?? 0);
    if (!nearest || distanceKm < nearest.distanceKm) {
      nearest = { area, distanceKm, inServiceRadius };
    }
  });

  if (!nearest) return null;
  return {
    matchedBy: "distance",
    area: nearest.area,
    distanceKm: nearest.distanceKm,
    inServiceRadius: nearest.inServiceRadius,
    eta: estimateEtaForDistance(nearest.distanceKm),
  };
};

export const getActiveWarehouses = async () => {
  const areas = await serviceAreaModel
    .find({ isActive: true })
    .select("key label pincode latitude longitude radiusKm type")
    .lean();
  return areas.map(serializeArea).filter((area) => area.key);
};

export const allocateWarehouseForLocation = async ({
  areaKey = "",
  pincode = "",
  latitude = null,
  longitude = null,
} = {}) => {
  const areas = await getActiveWarehouses();
  if (!areas.length) {
    return {
      serviceability: {
        isServiceable: false,
        reasonCode: "NO_WAREHOUSE",
        distanceKm: null,
        etaMinMinutes: null,
        etaMaxMinutes: null,
      },
      assignedArea: null,
      matchedBy: "none",
    };
  }

  const hasCoordinates =
    toNumberOrNull(latitude) !== null && toNumberOrNull(longitude) !== null;

  // Strict radius enforcement path:
  // If coordinates are present, always allocate by geo-distance and radius.
  if (hasCoordinates) {
    const byDistance = selectByDistance(areas, latitude, longitude);
    if (!byDistance) {
      return {
        serviceability: {
          isServiceable: false,
          reasonCode: "INSUFFICIENT_LOCATION_DATA",
          distanceKm: null,
          etaMinMinutes: null,
          etaMaxMinutes: null,
        },
        assignedArea: null,
        matchedBy: "none",
      };
    }

    if (!byDistance.inServiceRadius) {
      return {
        serviceability: {
          isServiceable: false,
          reasonCode: "OUT_OF_RADIUS",
          distanceKm: byDistance.distanceKm,
          etaMinMinutes: null,
          etaMaxMinutes: null,
        },
        assignedArea: byDistance.area,
        matchedBy: byDistance.matchedBy,
      };
    }

    return {
      serviceability: {
        isServiceable: true,
        reasonCode: "SERVICEABLE",
        distanceKm: byDistance.distanceKm,
        etaMinMinutes: byDistance.eta.min,
        etaMaxMinutes: byDistance.eta.max,
      },
      assignedArea: byDistance.area,
      matchedBy: byDistance.matchedBy,
    };
  }

  const byAreaKey = selectByAreaKey(areas, areaKey);
  if (byAreaKey) {
    return {
      serviceability: {
        isServiceable: true,
        reasonCode: "SERVICEABLE",
        distanceKm: byAreaKey.distanceKm,
        etaMinMinutes: byAreaKey.eta.min,
        etaMaxMinutes: byAreaKey.eta.max,
      },
      assignedArea: byAreaKey.area,
      matchedBy: byAreaKey.matchedBy,
    };
  }

  const byPincode = selectByPincode(areas, pincode);
  if (byPincode) {
    return {
      serviceability: {
        isServiceable: true,
        reasonCode: "SERVICEABLE",
        distanceKm: byPincode.distanceKm,
        etaMinMinutes: byPincode.eta.min,
        etaMaxMinutes: byPincode.eta.max,
      },
      assignedArea: byPincode.area,
      matchedBy: byPincode.matchedBy,
    };
  }

  return {
    serviceability: {
      isServiceable: false,
      reasonCode: "INSUFFICIENT_LOCATION_DATA",
      distanceKm: null,
      etaMinMinutes: null,
      etaMaxMinutes: null,
    },
    assignedArea: null,
    matchedBy: "none",
  };
};
