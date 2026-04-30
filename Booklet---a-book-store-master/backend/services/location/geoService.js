import { normalizePincode, toNumberOrNull } from "../../utils/locationUtils.js";

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const REQUEST_TIMEOUT_MS = 6000;

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "Booklet-LocationService/1.0",
        ...(options.headers || {}),
      },
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
};

const normalizeSuggestion = (item = {}) => {
  const latitude = toNumberOrNull(item?.lat);
  const longitude = toNumberOrNull(item?.lon);
  const address = item?.address || {};
  return {
    placeId: String(item?.place_id || ""),
    label: String(item?.display_name || "").trim(),
    coordinates:
      latitude === null || longitude === null
        ? null
        : { latitude, longitude },
    address: {
      line1: String(
        address?.road ||
          address?.suburb ||
          address?.neighbourhood ||
          address?.village ||
          ""
      ).trim(),
      city: String(
        address?.city || address?.town || address?.county || address?.state_district || ""
      ).trim(),
      state: String(address?.state || "").trim(),
      country: String(address?.country || "India").trim(),
      pincode: normalizePincode(address?.postcode || ""),
    },
  };
};

export const searchAddressSuggestions = async (query = "", limit = 6) => {
  const trimmed = String(query || "").trim();
  if (!trimmed || trimmed.length < 2) return [];

  try {
    const url =
      `${NOMINATIM_BASE_URL}/search?` +
      new URLSearchParams({
        q: trimmed,
        format: "jsonv2",
        addressdetails: "1",
        countrycodes: "in",
        limit: String(Math.min(Math.max(Number(limit) || 6, 1), 10)),
      }).toString();

    const response = await fetchWithTimeout(url);
    if (!response.ok) return [];

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map(normalizeSuggestion).filter((item) => item.label && item.coordinates);
  } catch (error) {
    return [];
  }
};

export const reverseLookupAddressFromCoordinates = async (latitude, longitude) => {
  const lat = toNumberOrNull(latitude);
  const lng = toNumberOrNull(longitude);
  if (lat === null || lng === null) return null;

  try {
    const url =
      `${NOMINATIM_BASE_URL}/reverse?` +
      new URLSearchParams({
        format: "jsonv2",
        lat: String(lat),
        lon: String(lng),
        addressdetails: "1",
      }).toString();

    const response = await fetchWithTimeout(url);
    if (!response.ok) return null;
    const data = await response.json();
    return normalizeSuggestion(data);
  } catch (error) {
    return null;
  }
};
