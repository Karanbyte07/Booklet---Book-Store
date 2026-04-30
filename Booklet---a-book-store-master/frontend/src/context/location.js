import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "../config/axios";
import { normalizeLocationKey, normalizePincode, toNumberOrNull } from "../utils/locationUtils";

const LocationContext = createContext();
const DEFAULT_LOCATION_STORAGE_KEY = "selectedLocation";
const DEFAULT_LOCATION_CONTEXT_STORAGE_KEY = "locationContextId";
const DEFAULT_CUSTOMER_LOCATION_STORAGE_KEY = "detectedCustomerLocation";

const normalizeLocationId = (value) => normalizeLocationKey(value);

const normalizeActiveStatus = (value, fallback = true) => {
  if (typeof value === "boolean") return value;
  if (value === null || value === undefined) return fallback;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y", "active", "enabled", "on"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "n", "inactive", "deactivated", "disabled", "off"].includes(normalized)) {
      return false;
    }
  }
  return Boolean(value);
};

const getCurrentCoordinates = () =>
  new Promise((resolve, reject) => {
    if (!navigator?.geolocation) {
      reject(new Error("Geolocation is not supported on this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 120000,
      }
    );
  });

const normalizeServiceArea = (area = {}) => ({
  id: normalizeLocationId(area?.id || area?.key),
  key: normalizeLocationId(area?.key || area?.id),
  label: area?.label || area?.id || "",
  pincode: normalizePincode(area?.pincode),
  latitude: toNumberOrNull(area?.latitude),
  longitude: toNumberOrNull(area?.longitude),
  radiusKm: toNumberOrNull(area?.radiusKm) ?? 0,
  type: area?.type || "urban",
  isActive: normalizeActiveStatus(
    area?.isActive ?? area?.activeForCustomer ?? area?.isActiveForCustomer ?? area?.active,
    true
  ),
  _id: area?._id,
});

const normalizeResolvedContext = (context = null) => {
  if (!context || typeof context !== "object") return null;
  const assignedWarehouse = context?.assignedWarehouse || {};
  const serviceability = context?.serviceability || {};
  const coordinates = context?.coordinates || {};
  const address = context?.address || {};

  const selectedLocation = normalizeLocationId(
    context?.selectedLocation || assignedWarehouse?.key
  );

  return {
    contextId: String(context?.contextId || "").trim(),
    source: String(context?.source || "unknown"),
    selectedLocation,
    selectedLocationLabel:
      String(context?.selectedLocationLabel || assignedWarehouse?.label || "").trim() ||
      "Select Location",
    selectedLocationPincode: normalizePincode(
      context?.selectedLocationPincode || assignedWarehouse?.pincode
    ),
    coordinates: {
      latitude: toNumberOrNull(coordinates?.latitude),
      longitude: toNumberOrNull(coordinates?.longitude),
    },
    address: {
      label: String(address?.label || "").trim(),
      line1: String(address?.line1 || "").trim(),
      city: String(address?.city || "").trim(),
      state: String(address?.state || "").trim(),
      country: String(address?.country || "India").trim(),
      pincode: normalizePincode(address?.pincode || ""),
    },
    assignedWarehouse: {
      key: normalizeLocationId(assignedWarehouse?.key),
      label: String(assignedWarehouse?.label || "").trim(),
      pincode: normalizePincode(assignedWarehouse?.pincode || ""),
      latitude: toNumberOrNull(assignedWarehouse?.latitude),
      longitude: toNumberOrNull(assignedWarehouse?.longitude),
      radiusKm: toNumberOrNull(assignedWarehouse?.radiusKm),
      type: String(assignedWarehouse?.type || "").trim(),
    },
    serviceability: {
      isServiceable: Boolean(serviceability?.isServiceable),
      reasonCode: String(serviceability?.reasonCode || "UNKNOWN").trim() || "UNKNOWN",
      distanceKm: toNumberOrNull(serviceability?.distanceKm),
      etaMinMinutes: toNumberOrNull(serviceability?.etaMinMinutes),
      etaMaxMinutes: toNumberOrNull(serviceability?.etaMaxMinutes),
    },
    deliveryEta:
      serviceability?.etaMinMinutes !== null && serviceability?.etaMaxMinutes !== null
        ? `${serviceability.etaMinMinutes}-${serviceability.etaMaxMinutes} min`
        : "",
  };
};

export const LocationProvider = ({ children }) => {
  const [serviceAreas, setServiceAreas] = useState([]);
  const [selectedLocation, setSelectedLocationState] = useState("");
  const [customerLocation, setCustomerLocationState] = useState(null);
  const [locationContextId, setLocationContextId] = useState("");
  const [locationContext, setLocationContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detectingCurrentLocation, setDetectingCurrentLocation] = useState(false);
  const [locationDetectionError, setLocationDetectionError] = useState("");
  const [searchingLocations, setSearchingLocations] = useState(false);
  const autoDetectAttemptedRef = useRef(false);

  const setCustomerLocation = useCallback((value) => {
    setCustomerLocationState(value);
    if (value && typeof value === "object") {
      localStorage.setItem(DEFAULT_CUSTOMER_LOCATION_STORAGE_KEY, JSON.stringify(value));
    } else {
      localStorage.removeItem(DEFAULT_CUSTOMER_LOCATION_STORAGE_KEY);
    }
  }, []);

  const applyLocationContext = useCallback(
    (contextPayload) => {
      const normalized = normalizeResolvedContext(contextPayload);
      setLocationContext(normalized);

      const nextLocationKey = normalized?.selectedLocation || "";
      setSelectedLocationState(nextLocationKey);

      if (nextLocationKey) {
        localStorage.setItem(DEFAULT_LOCATION_STORAGE_KEY, nextLocationKey);
      } else {
        localStorage.removeItem(DEFAULT_LOCATION_STORAGE_KEY);
      }

      const nextContextId = String(normalized?.contextId || "").trim();
      setLocationContextId(nextContextId);
      if (nextContextId) {
        localStorage.setItem(DEFAULT_LOCATION_CONTEXT_STORAGE_KEY, nextContextId);
      } else {
        localStorage.removeItem(DEFAULT_LOCATION_CONTEXT_STORAGE_KEY);
      }

      const hasCoordinateData =
        normalized?.coordinates?.latitude !== null &&
        normalized?.coordinates?.longitude !== null;
      const resolvedPincode =
        normalized?.address?.pincode || normalized?.selectedLocationPincode || "";
      const resolvedLabel =
        normalized?.address?.label || normalized?.selectedLocationLabel || "";

      if (hasCoordinateData || resolvedPincode || resolvedLabel) {
        setCustomerLocation({
          latitude: normalized?.coordinates?.latitude ?? null,
          longitude: normalized?.coordinates?.longitude ?? null,
          pincode: resolvedPincode,
          displayName: resolvedLabel,
          detectedAt: new Date().toISOString(),
          matchedBy: normalized?.serviceability?.reasonCode || "",
          matchedAreaKey: normalized?.selectedLocation || "",
          matchedDistanceKm: normalized?.serviceability?.distanceKm ?? null,
        });
      }

      return normalized;
    },
    [setCustomerLocation]
  );

  const loadServiceAreas = useCallback(async () => {
    const { data } = await axios.get("/api/v1/location/service-areas");
    const options = Array.isArray(data?.serviceAreas) ? data.serviceAreas : [];
    const normalizedOptions = options.map(normalizeServiceArea);
    setServiceAreas(normalizedOptions);
    return normalizedOptions;
  }, []);

  const loadContext = useCallback(
    async (contextId = "") => {
      const resolvedContextId =
        String(contextId || "").trim() ||
        String(localStorage.getItem(DEFAULT_LOCATION_CONTEXT_STORAGE_KEY) || "").trim();

      const requestConfig = resolvedContextId
        ? { params: { contextId: resolvedContextId } }
        : {};
      const { data } = await axios.get("/api/v1/location/context", requestConfig);
      if (data?.success && data?.context) {
        return applyLocationContext(data.context);
      }
      return null;
    },
    [applyLocationContext]
  );

  const resolveLocation = useCallback(
    async (payload = {}, options = {}) => {
      const { silent = false } = options;
      try {
        if (!silent) {
          setLocationDetectionError("");
        }
        const { data } = await axios.post("/api/v1/location/resolve", {
          ...payload,
          contextId:
            String(payload?.contextId || "").trim() ||
            localStorage.getItem(DEFAULT_LOCATION_CONTEXT_STORAGE_KEY) ||
            "",
        });

        if (!data?.success || !data?.context) {
          throw new Error(data?.message || "Unable to resolve location");
        }

        const nextContext = applyLocationContext(data.context);
        if (!nextContext?.serviceability?.isServiceable && !silent) {
          setLocationDetectionError(
            "Delivery is not available at this location yet. Coming Soon."
          );
        }

        return {
          success: true,
          context: nextContext,
          matchedArea: nextContext?.assignedWarehouse || null,
        };
      } catch (error) {
        if (!silent) {
          setLocationDetectionError(
            error?.response?.data?.message ||
              error?.message ||
              "Unable to resolve location"
          );
        }
        return { success: false, error };
      }
    },
    [applyLocationContext]
  );

  const setSelectedLocation = useCallback(
    async (locationId) => {
      const normalized = normalizeLocationId(locationId);
      setSelectedLocationState(normalized);

      if (!normalized) {
        setLocationContext(null);
        setLocationContextId("");
        setLocationDetectionError("");
        localStorage.removeItem(DEFAULT_LOCATION_STORAGE_KEY);
        localStorage.removeItem(DEFAULT_LOCATION_CONTEXT_STORAGE_KEY);
        return { success: true };
      }

      const selectedArea = serviceAreas.find((area) => area.id === normalized);
      return resolveLocation(
        {
          source: "manual",
          serviceAreaId: normalized,
          address: {
            label: selectedArea?.label || "",
            pincode: selectedArea?.pincode || "",
          },
        },
        { silent: true }
      );
    },
    [resolveLocation, serviceAreas]
  );

  const detectCurrentLocation = useCallback(async ({ autoSelect = true, silent = false } = {}) => {
    try {
      setDetectingCurrentLocation(true);
      if (!silent) {
        setLocationDetectionError("");
      }

      const coordinates = await getCurrentCoordinates();
      const response = await resolveLocation(
        {
          source: "gps",
          coordinates: {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
          },
        },
        { silent }
      );

      if (!response?.success) {
        return response;
      }

      if (!autoSelect && selectedLocation) {
        setSelectedLocationState(selectedLocation);
      }

      if (!response?.context?.serviceability?.isServiceable && !silent) {
        setLocationDetectionError(
          "Your current location is outside delivery range. Please choose a location manually."
        );
      }

      return response;
    } catch (error) {
      const fallbackMessage =
        error?.code === 1
          ? "Location access denied. Please allow location permission."
          : "Unable to detect current location.";

      if (!silent) {
        setLocationDetectionError(fallbackMessage);
      }
      return { success: false, error };
    } finally {
      setDetectingCurrentLocation(false);
    }
  }, [resolveLocation, selectedLocation]);

  const searchManualLocations = useCallback(async (query = "") => {
    const trimmed = String(query || "").trim();
    if (!trimmed || trimmed.length < 2) return [];
    try {
      setSearchingLocations(true);
      const { data } = await axios.post("/api/v1/location/autocomplete", {
        query: trimmed,
      });
      return Array.isArray(data?.suggestions) ? data.suggestions : [];
    } catch (error) {
      return [];
    } finally {
      setSearchingLocations(false);
    }
  }, []);

  const selectLocationSuggestion = useCallback(
    async (suggestion = {}) => {
      const coordinates = suggestion?.coordinates || {};
      return resolveLocation({
        source: "manual",
        coordinates: {
          latitude: coordinates?.latitude,
          longitude: coordinates?.longitude,
        },
        address: {
          label: suggestion?.label || "",
          line1: suggestion?.address?.line1 || "",
          city: suggestion?.address?.city || "",
          state: suggestion?.address?.state || "",
          country: suggestion?.address?.country || "India",
          pincode: suggestion?.address?.pincode || "",
        },
      });
    },
    [resolveLocation]
  );

  useEffect(() => {
    const fromStorage = localStorage.getItem(DEFAULT_CUSTOMER_LOCATION_STORAGE_KEY);
    if (!fromStorage) return;
    try {
      const parsed = JSON.parse(fromStorage);
      if (parsed && typeof parsed === "object") {
        setCustomerLocationState(parsed);
      }
    } catch (error) {
      localStorage.removeItem(DEFAULT_CUSTOMER_LOCATION_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      try {
        setLoading(true);
        await loadServiceAreas();
        if (!active) return;

        const context = await loadContext();
        if (!active) return;

        if (context) return;

        const storedLocation = normalizeLocationId(
          localStorage.getItem(DEFAULT_LOCATION_STORAGE_KEY) || ""
        );
        if (storedLocation) {
          await resolveLocation(
            {
              source: "manual",
              serviceAreaId: storedLocation,
            },
            { silent: true }
          );
        }
      } catch (error) {
        console.log("Error loading service areas:", error);
        if (active) {
          setServiceAreas([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    bootstrap();
    return () => {
      active = false;
    };
  }, [loadContext, loadServiceAreas, resolveLocation]);

  useEffect(() => {
    if (loading) return;
    if (locationContext?.contextId) return;
    if (autoDetectAttemptedRef.current) return;

    const hasStoredSelection = Boolean(
      localStorage.getItem(DEFAULT_LOCATION_STORAGE_KEY)
    );
    if (hasStoredSelection) return;

    autoDetectAttemptedRef.current = true;
    detectCurrentLocation({ autoSelect: true, silent: true });
  }, [detectCurrentLocation, loading, locationContext?.contextId]);

  const selectedServiceArea = useMemo(
    () => serviceAreas.find((area) => area.id === selectedLocation) || null,
    [serviceAreas, selectedLocation]
  );

  const selectedAreaDistanceKm =
    toNumberOrNull(locationContext?.serviceability?.distanceKm) ?? null;
  const isSelectedAreaInRange = locationContext
    ? Boolean(locationContext?.serviceability?.isServiceable)
    : true;

  const selectedLocationLabel = useMemo(
    () =>
      locationContext?.selectedLocationLabel ||
      selectedServiceArea?.label ||
      "Select Location",
    [locationContext?.selectedLocationLabel, selectedServiceArea?.label]
  );

  const selectedLocationPincode =
    locationContext?.selectedLocationPincode || selectedServiceArea?.pincode || "";

  const clearDetectedCustomerLocation = () => {
    setCustomerLocation(null);
    setLocationDetectionError("");
  };

  return (
    <LocationContext.Provider
      value={{
        serviceAreas,
        selectedLocation,
        selectedLocationLabel,
        selectedLocationPincode,
        selectedServiceArea,
        selectedAreaDistanceKm,
        isSelectedAreaInRange,
        customerLocation,
        setCustomerLocation,
        detectCurrentLocation,
        detectingCurrentLocation,
        locationDetectionError,
        clearDetectedCustomerLocation,
        setSelectedLocation,
        loading,
        locationContextId,
        locationContext,
        isServiceable: Boolean(locationContext?.serviceability?.isServiceable),
        deliveryEta: locationContext?.deliveryEta || "",
        searchManualLocations,
        searchingLocations,
        selectLocationSuggestion,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => useContext(LocationContext);
