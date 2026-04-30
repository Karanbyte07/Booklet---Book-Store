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

export const matchAreaByCustomerLocation = (areas = [], customerLocation = {}) => {
  if (!Array.isArray(areas) || areas.length === 0) return null;

  const normalizedPincode = normalizePincode(customerLocation?.pincode);
  if (normalizedPincode) {
    const byPincode = areas.find(
      (area) => normalizePincode(area?.pincode) === normalizedPincode
    );
    if (byPincode) {
      return {
        area: byPincode,
        matchedBy: "pincode",
        distanceKm: 0,
      };
    }
  }

  const latitude = toNumberOrNull(customerLocation?.latitude);
  const longitude = toNumberOrNull(customerLocation?.longitude);
  if (latitude === null || longitude === null) return null;

  let bestMatch = null;
  areas.forEach((area) => {
    const distanceKm = getDistanceInKm(
      latitude,
      longitude,
      area?.latitude,
      area?.longitude
    );
    if (distanceKm === null) return;

    const radiusKm = toNumberOrNull(area?.radiusKm) ?? 0;
    if (distanceKm > radiusKm) return;

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

const normalizeProductLocations = (serviceLocations = []) => {
  if (!Array.isArray(serviceLocations)) return ["all"];
  const normalized = serviceLocations
    .map((item) => normalizeLocationKey(item))
    .filter(Boolean);

  if (!normalized.length) return ["all"];
  if (normalized.includes("all")) return ["all"];
  return Array.from(new Set(normalized));
};

export const isProductAvailableInLocation = (product, selectedLocation) => {
  const normalizedSelected = normalizeLocationKey(selectedLocation);
  if (!normalizedSelected) return true;

  const locations = normalizeProductLocations(product?.serviceLocations || []);
  return locations.includes("all") || locations.includes(normalizedSelected);
};
