const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return value.split(/[,\n]/);
  return [];
};

export const normalizeLocationKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const normalizePincode = (value) =>
  String(value || "")
    .replace(/\D/g, "")
    .slice(0, 6);

export const toNumberOrNull = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const sanitizeServiceLocations = (
  locations,
  validLocationKeys = null,
  options = {}
) => {
  const fallbackToAll = options?.fallbackToAll !== false;
  const validKeySet =
    validLocationKeys instanceof Set
      ? validLocationKeys
      : Array.isArray(validLocationKeys)
        ? new Set(validLocationKeys.map((key) => normalizeLocationKey(key)))
        : null;

  const normalized = toArray(locations)
    .map((item) => normalizeLocationKey(item))
    .filter(Boolean)
    .filter((item) => {
      if (item === "all") return true;
      if (!validKeySet) return true;
      return validKeySet.has(item);
    });

  if (!normalized.length) return fallbackToAll ? ["all"] : [];
  if (normalized.includes("all")) return ["all"];

  return Array.from(new Set(normalized));
};

export const isLocationSupportedByProduct = (
  productLocations = [],
  selectedLocation = ""
) => {
  const normalizedProductLocations = sanitizeServiceLocations(productLocations);
  const normalizedSelectedLocation = normalizeLocationKey(selectedLocation);

  if (!normalizedSelectedLocation || normalizedSelectedLocation === "all") {
    return true;
  }

  return (
    normalizedProductLocations.includes("all") ||
    normalizedProductLocations.includes(normalizedSelectedLocation)
  );
};

export const getLocationFilter = (selectedLocation = "") => {
  const normalized = normalizeLocationKey(selectedLocation);
  if (!normalized || normalized === "all") return {};

  return {
    $or: [
      { serviceLocations: "all" },
      { serviceLocations: normalized },
      // Backward compatibility with legacy products
      { serviceLocations: { $exists: false } },
      { serviceLocations: { $size: 0 } },
    ],
  };
};

const toRadians = (value) => (value * Math.PI) / 180;

export const getDistanceInKm = (fromLat, fromLng, toLat, toLng) => {
  const sourceLat = toNumberOrNull(fromLat);
  const sourceLng = toNumberOrNull(fromLng);
  const targetLat = toNumberOrNull(toLat);
  const targetLng = toNumberOrNull(toLng);

  if (
    sourceLat === null ||
    sourceLng === null ||
    targetLat === null ||
    targetLng === null
  ) {
    return null;
  }

  const earthRadiusKm = 6371;
  const deltaLat = toRadians(targetLat - sourceLat);
  const deltaLng = toRadians(targetLng - sourceLng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(sourceLat)) *
      Math.cos(toRadians(targetLat)) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

export const isWithinServiceRadius = ({
  customerLatitude,
  customerLongitude,
  areaLatitude,
  areaLongitude,
  radiusKm,
}) => {
  const distanceKm = getDistanceInKm(
    customerLatitude,
    customerLongitude,
    areaLatitude,
    areaLongitude
  );

  if (distanceKm === null) {
    return { inRange: true, distanceKm: null };
  }

  const limit = toNumberOrNull(radiusKm) ?? 0;
  return {
    inRange: distanceKm <= limit,
    distanceKm,
  };
};

export const matchAreaByCustomerLocation = (areas = [], customerLocation = {}) => {
  const normalizedPincode = normalizePincode(customerLocation?.pincode || "");
  if (!areas.length) return null;

  if (normalizedPincode) {
    const matchedByPincode = areas.find(
      (area) => normalizePincode(area?.pincode) === normalizedPincode
    );
    if (matchedByPincode) {
      return {
        area: matchedByPincode,
        matchedBy: "pincode",
        distanceKm: 0,
      };
    }
  }

  const latitude = toNumberOrNull(customerLocation?.latitude);
  const longitude = toNumberOrNull(customerLocation?.longitude);
  if (latitude === null || longitude === null) {
    return null;
  }

  let bestMatch = null;
  areas.forEach((area) => {
    const distanceKm = getDistanceInKm(
      latitude,
      longitude,
      area?.latitude,
      area?.longitude
    );
    if (distanceKm === null) return;

    const allowedRadius = toNumberOrNull(area?.radiusKm) ?? 0;
    if (distanceKm > allowedRadius) return;

    if (!bestMatch || distanceKm < bestMatch.distanceKm) {
      bestMatch = {
        area,
        matchedBy: "distance",
        distanceKm,
      };
    }
  });

  return bestMatch;
};
