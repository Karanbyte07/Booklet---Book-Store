import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout/Layout";
import AdminMenu from "../../components/Layout/AdminMenu";
import axios from "../../config/axios";
import toast from "react-hot-toast";
import { useConfirm } from "../../context/confirm";
import {
  FiCheckCircle,
  FiEdit3,
  FiMapPin,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiTrash2,
  FiToggleLeft,
  FiToggleRight,
} from "react-icons/fi";

const DEFAULT_FORM = {
  label: "",
  key: "",
  pincode: "",
  latitude: "",
  longitude: "",
  radiusKm: "8",
  type: "urban",
  isActive: true,
};

const normalizePincode = (value) =>
  String(value || "")
    .replace(/\D/g, "")
    .slice(0, 6);

const getCurrentPosition = (options = {}) =>
  new Promise((resolve, reject) => {
    if (!navigator?.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });

const buildAreaLabel = (location = {}) => {
  const line1 = String(location?.line1 || "").trim();
  const city = String(location?.city || "").trim();
  const fallback = String(location?.label || "").trim();
  return [line1, city].filter(Boolean).join(", ") || fallback;
};

const isServiceAreaActive = (area = {}) => {
  const value =
    area?.isActive ??
    area?.activeForCustomer ??
    area?.isActiveForCustomer ??
    area?.active;
  if (typeof value === "boolean") return value;
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
  return value !== null && value !== undefined ? Boolean(value) : false;
};

const normalizeServiceArea = (area = {}) => ({
  ...area,
  isActive: isServiceAreaActive(area),
});

const getAreaIdentifier = (area) =>
  String(area?._id || area?.id || "").trim();

const ServiceLocations = () => {
  const [serviceAreas, setServiceAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [selectedAreaIds, setSelectedAreaIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [addressQuery, setAddressQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [searchingLocations, setSearchingLocations] = useState(false);
  const [resolvingPincode, setResolvingPincode] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const confirm = useConfirm();

  const getServiceAreas = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/v1/location/admin/service-areas");
      const areas = Array.isArray(data?.serviceAreas) ? data.serviceAreas : [];
      setServiceAreas(areas.map((area) => normalizeServiceArea(area)));
    } catch (error) {
      console.log(error);
      toast.error("Unable to load service locations");
      setServiceAreas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getServiceAreas();
  }, []);

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setEditingId("");
    setAddressQuery("");
    setLocationSuggestions([]);
  };

  const activeCount = useMemo(
    () => serviceAreas.filter((area) => isServiceAreaActive(area)).length,
    [serviceAreas]
  );

  const allAreaIds = useMemo(
    () =>
      serviceAreas
        .map((area) => getAreaIdentifier(area))
        .filter((identifier) => Boolean(identifier)),
    [serviceAreas]
  );

  const allSelected =
    allAreaIds.length > 0 && selectedAreaIds.length === allAreaIds.length;

  useEffect(() => {
    const validIdSet = new Set(allAreaIds);
    setSelectedAreaIds((prev) => {
      const filtered = prev.filter((identifier) => validIdSet.has(identifier));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [allAreaIds]);

  const applyResolvedLocationToForm = (location = {}) => {
    const latitude = Number(location?.latitude);
    const longitude = Number(location?.longitude);
    const resolvedPincode = normalizePincode(location?.pincode || "");
    const resolvedLabel = buildAreaLabel(location);

    setForm((prev) => ({
      ...prev,
      label: resolvedLabel || prev.label,
      pincode: resolvedPincode || prev.pincode,
      latitude: Number.isFinite(latitude) ? String(latitude) : prev.latitude,
      longitude: Number.isFinite(longitude) ? String(longitude) : prev.longitude,
    }));
    setLocationSuggestions([]);
  };

  useEffect(() => {
    const query = String(addressQuery || "").trim();
    if (query.length < 2) {
      setLocationSuggestions([]);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      try {
        setSearchingLocations(true);
        const { data } = await axios.post(
          "/api/v1/location/admin/service-areas/geocode",
          { query, limit: 6 }
        );
        if (!active) return;
        setLocationSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
      } catch (error) {
        if (!active) return;
        setLocationSuggestions([]);
      } finally {
        if (active) {
          setSearchingLocations(false);
        }
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [addressQuery]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);

      const payload = {
        label: form.label.trim(),
        key: form.key.trim(),
        pincode: normalizePincode(form.pincode),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        radiusKm: Number(form.radiusKm),
        type: String(form.type || "urban").trim().toLowerCase(),
        isActive: isServiceAreaActive({ isActive: form.isActive }),
      };

      if (editingId) {
        const { data } = await axios.put(
          `/api/v1/location/admin/service-areas/${editingId}`,
          payload
        );
        if (!data?.success) {
          throw new Error(data?.message || "Unable to update service area");
        }
        toast.success("Service location updated");
      } else {
        const { data } = await axios.post(
          "/api/v1/location/admin/service-areas",
          payload
        );
        if (!data?.success) {
          throw new Error(data?.message || "Unable to create service area");
        }
        toast.success("Service location created");
      }

      resetForm();
      getServiceAreas();
    } catch (error) {
      console.log(error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save service location"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (area) => {
    setEditingId(getAreaIdentifier(area));
    setForm({
      label: area?.label || "",
      key: area?.key || area?.id || "",
      pincode: area?.pincode || "",
      latitude:
        typeof area?.latitude === "number" ? String(area.latitude) : "",
      longitude:
        typeof area?.longitude === "number" ? String(area.longitude) : "",
      radiusKm:
        typeof area?.radiusKm === "number" ? String(area.radiusKm) : "8",
      type: area?.type || "urban",
      isActive: isServiceAreaActive(area),
    });
  };

  const handleSelectLocationSuggestion = (suggestion) => {
    applyResolvedLocationToForm(suggestion);
  };

  const handleResolveFromPincode = async () => {
    const pincode = normalizePincode(form.pincode);
    if (pincode.length !== 6) {
      toast.error("Please enter a valid 6-digit pincode first");
      return;
    }

    try {
      setResolvingPincode(true);
      const { data } = await axios.post(
        "/api/v1/location/admin/service-areas/geocode",
        { pincode, limit: 5 }
      );
      const suggestions = Array.isArray(data?.suggestions) ? data.suggestions : [];
      if (!suggestions.length) {
        toast.error("No location match found for this pincode");
        return;
      }

      if (suggestions.length === 1) {
        handleSelectLocationSuggestion(suggestions[0]);
        toast.success("Coordinates auto-filled from pincode");
        return;
      }

      setAddressQuery(pincode);
      setLocationSuggestions(suggestions);
      toast.success("Select one of the pincode matches to fill coordinates");
    } catch (error) {
      console.log(error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to auto-fill from pincode"
      );
    } finally {
      setResolvingPincode(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      setDetectingLocation(true);
      const position = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      });
      const latitude = Number(position?.coords?.latitude);
      const longitude = Number(position?.coords?.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error("Unable to detect valid coordinates");
      }

      const { data } = await axios.post(
        "/api/v1/location/admin/service-areas/geocode",
        {
          coordinates: { latitude, longitude },
        }
      );

      const location = data?.location || { latitude, longitude };
      applyResolvedLocationToForm({ ...location, latitude, longitude });
      toast.success("Coordinates auto-filled from current location");
    } catch (error) {
      console.log(error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to detect current location"
      );
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleToggleActive = async (area) => {
    try {
      const identifier = getAreaIdentifier(area);
      if (!identifier) return;
      const currentIsActive = isServiceAreaActive(area);
      const nextIsActive = !currentIsActive;

      const { data } = await axios.put(
        `/api/v1/location/admin/service-areas/${identifier}`,
        { isActive: nextIsActive }
      );
      if (!data?.success) {
        throw new Error(
          data?.message ||
            (nextIsActive
              ? "Unable to activate location"
              : "Unable to disable location")
        );
      }

      setServiceAreas((prev) =>
        prev.map((item) =>
          getAreaIdentifier(item) === identifier
            ? {
                ...item,
                ...(data?.serviceArea || {}),
                isActive:
                  data?.serviceArea?.isActive !== undefined
                    ? normalizeServiceArea(data.serviceArea).isActive
                    : nextIsActive,
              }
            : item
        )
      );
      toast.success(
        nextIsActive
          ? "Service location activated"
          : "Service location disabled"
      );
    } catch (error) {
      console.log(error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to change location status"
      );
    }
  };

  const handlePermanentDelete = async (area) => {
    const identifier = getAreaIdentifier(area);
    if (!identifier) return;

    const shouldDelete = await confirm({
      title: "Delete service location permanently?",
      message:
        `This will permanently remove "${area?.label || "this area"}".\n\n` +
        "Use Disable if you want to keep history and reactivate later.",
      confirmText: "Delete Permanently",
      cancelText: "Cancel",
      tone: "danger",
    });
    if (!shouldDelete) return;

    try {
      setDeletingId(identifier);
      const { data } = await axios.delete(
        `/api/v1/location/admin/service-areas/${identifier}?permanent=true`
      );
      if (!data?.success) {
        throw new Error(data?.message || "Unable to delete location permanently");
      }

      if (editingId === identifier) {
        resetForm();
      }
      setSelectedAreaIds((prev) => prev.filter((id) => id !== identifier));
      toast.success("Service location permanently deleted");
      getServiceAreas();
    } catch (error) {
      console.log(error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to permanently delete location"
      );
    } finally {
      setDeletingId("");
    }
  };

  const handleToggleAreaSelection = (area) => {
    const identifier = getAreaIdentifier(area);
    if (!identifier) return;

    setSelectedAreaIds((prev) =>
      prev.includes(identifier)
        ? prev.filter((id) => id !== identifier)
        : [...prev, identifier]
    );
  };

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedAreaIds([]);
      return;
    }
    setSelectedAreaIds(allAreaIds);
  };

  const handleDeleteSelected = async () => {
    if (!selectedAreaIds.length) return;

    const shouldDelete = await confirm({
      title: `Delete ${selectedAreaIds.length} selected location${
        selectedAreaIds.length > 1 ? "s" : ""
      } permanently?`,
      message:
        "This action is irreversible and removes selected areas from the database.",
      confirmText: "Delete Selected",
      cancelText: "Cancel",
      tone: "danger",
    });
    if (!shouldDelete) return;

    try {
      setBulkDeleting(true);
      const { data } = await axios.post(
        "/api/v1/location/admin/service-areas/bulk-delete?permanent=true",
        { ids: selectedAreaIds }
      );

      if (!data?.success) {
        throw new Error(data?.message || "Unable to delete selected locations");
      }

      if (editingId && selectedAreaIds.includes(editingId)) {
        resetForm();
      }

      const deletedCount = Number(data?.count) || selectedAreaIds.length;
      toast.success(
        `Deleted ${deletedCount} service location${deletedCount > 1 ? "s" : ""}`
      );
      setSelectedAreaIds([]);
      getServiceAreas();
    } catch (error) {
      console.log(error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to delete selected locations"
      );
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <Layout title="Admin - Service Locations">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6 lg:h-[calc(100vh-4rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-5 lg:gap-6 items-start lg:h-full">
          <div>
            <AdminMenu />
          </div>

          <div className="min-w-0 lg:h-full lg:overflow-y-auto lg:pr-1 space-y-5">
            <div className="rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-50 via-white to-accent-50 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-white text-accent-700 flex items-center justify-center border border-accent-200 shadow-sm">
                    <FiMapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-primary-900">
                      Service Locations
                    </h1>
                    <p className="text-sm text-primary-600">
                      Manage delivery zones with pincode and radius.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={getServiceAreas}
                  className="h-9 px-3 rounded-lg border border-primary-200 bg-white text-primary-700 hover:bg-primary-50 text-sm font-semibold inline-flex items-center gap-1.5"
                >
                  <FiRefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[380px,1fr] gap-5">
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-primary-200 bg-white p-4 shadow-sm space-y-3"
              >
                <h2 className="text-sm font-semibold text-primary-900">
                  {editingId ? "Update Service Area" : "Add Service Area"}
                </h2>

                <div className="rounded-xl border border-accent-200 bg-accent-50/40 p-3 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent-800">
                    Dynamic Location Assist
                  </p>
                  <p className="text-xs text-primary-600">
                    Search any area/address or use current location to auto-fill
                    pincode and coordinates. You can still edit values manually.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={addressQuery}
                      onChange={(e) => setAddressQuery(e.target.value)}
                      placeholder="Search address or pincode"
                      className="w-full min-w-0 sm:flex-1 h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    />
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={detectingLocation}
                      className="h-10 w-full sm:w-auto sm:shrink-0 whitespace-nowrap px-3 rounded-lg border border-primary-200 bg-white text-primary-700 hover:bg-primary-50 disabled:opacity-60 disabled:cursor-not-allowed text-xs font-semibold"
                    >
                      {detectingLocation ? "Detecting..." : "Use My Location"}
                    </button>
                  </div>
                  {searchingLocations && (
                    <p className="text-xs text-primary-500">Searching locations...</p>
                  )}
                  {!searchingLocations && locationSuggestions.length > 0 && (
                    <div className="max-h-40 overflow-y-auto rounded-lg border border-primary-200 bg-white divide-y divide-primary-100">
                      {locationSuggestions.map((suggestion, index) => (
                        <button
                          key={`${suggestion?.label || "location"}-${index}`}
                          type="button"
                          onClick={() => handleSelectLocationSuggestion(suggestion)}
                          className="w-full text-left px-3 py-2 hover:bg-primary-50"
                        >
                          <p className="text-sm text-primary-900 truncate">
                            {suggestion?.label || "Selected location"}
                          </p>
                          <p className="text-xs text-primary-500">
                            {suggestion?.pincode
                              ? `PIN ${suggestion.pincode}`
                              : "No pincode found"}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Area Name
                  </label>
                  <input
                    type="text"
                    value={form.label}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, label: e.target.value }))
                    }
                    placeholder="e.g. Sector 62, Noida"
                    className="mt-1 w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Key (optional)
                  </label>
                  <input
                    type="text"
                    value={form.key}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, key: e.target.value }))
                    }
                    placeholder="auto generated if empty"
                    className="mt-1 w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Pincode
                  </label>
                  <div className="mt-1 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={form.pincode}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          pincode: normalizePincode(e.target.value),
                        }))
                      }
                      placeholder="6-digit pincode"
                      className="w-full min-w-0 sm:flex-1 h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleResolveFromPincode}
                      disabled={resolvingPincode}
                      className="h-10 w-full sm:w-auto sm:shrink-0 whitespace-nowrap px-3 rounded-lg border border-primary-200 bg-white text-primary-700 hover:bg-primary-50 disabled:opacity-60 disabled:cursor-not-allowed text-xs font-semibold"
                    >
                      {resolvingPincode ? "Resolving..." : "Auto-fill"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={form.latitude}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, latitude: e.target.value }))
                      }
                      className="mt-1 w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={form.longitude}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          longitude: e.target.value,
                        }))
                      }
                      className="mt-1 w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                      required
                    />
                  </div>
                </div>
                <p className="text-xs text-primary-500">
                  Latitude and longitude are editable for manual override.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                      Radius (km)
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={form.radiusKm}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          radiusKm: e.target.value,
                        }))
                      }
                      className="mt-1 w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                      Type
                    </label>
                    <select
                      value={form.type}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, type: e.target.value }))
                      }
                      className="mt-1 w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    >
                      <option value="urban">Urban</option>
                      <option value="town">Town</option>
                      <option value="village">Village</option>
                    </select>
                  </div>
                </div>

                <label className="h-10 px-3 rounded-lg border border-primary-200 bg-primary-50 inline-flex items-center gap-2 text-sm text-primary-700 w-fit">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                    className="accent-accent-600"
                  />
                  Active for customer selection
                </label>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-10 px-4 rounded-lg bg-accent-500 hover:bg-accent-600 disabled:bg-accent-300 text-white text-sm font-semibold inline-flex items-center gap-2"
                  >
                    {editingId ? <FiSave className="h-4 w-4" /> : <FiPlus className="h-4 w-4" />}
                    {submitting
                      ? "Saving..."
                      : editingId
                        ? "Update Area"
                        : "Add Area"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="h-10 px-3 rounded-lg border border-primary-200 bg-white text-primary-700 hover:bg-primary-50 text-sm font-semibold"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>

              <div className="rounded-2xl border border-primary-200 bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-primary-100 bg-primary-50/70 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4 flex-wrap">
                    <p className="text-sm font-semibold text-primary-900">
                      Total: {serviceAreas.length} areas
                    </p>
                    <p className="text-sm font-semibold text-green-700 inline-flex items-center gap-1.5">
                      <FiCheckCircle className="h-4 w-4" />
                      Active: {activeCount}
                    </p>
                    <p className="text-sm font-semibold text-red-700">
                      Inactive: {Math.max(serviceAreas.length - activeCount, 0)}
                    </p>
                    <p className="text-sm font-semibold text-primary-700">
                      Selected: {selectedAreaIds.length}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="h-9 px-3 rounded-lg border border-primary-200 bg-white text-primary-700 text-xs font-semibold inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleToggleSelectAll}
                        disabled={loading || !allAreaIds.length || bulkDeleting}
                        className="accent-accent-600"
                      />
                      Select all
                    </label>
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      disabled={!selectedAreaIds.length || bulkDeleting}
                      className="h-9 px-3 rounded-lg border border-red-200 bg-white text-red-700 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                      {bulkDeleting ? "Deleting selected..." : "Delete Selected"}
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="py-12 text-center text-sm text-primary-600">
                    Loading service areas...
                  </div>
                ) : serviceAreas.length === 0 ? (
                  <div className="py-12 text-center text-sm text-primary-600">
                    No service locations found.
                  </div>
                ) : (
                  <div className="divide-y divide-primary-100">
                    {serviceAreas.map((area) => {
                      const identifier = getAreaIdentifier(area);
                      const isSelected = selectedAreaIds.includes(identifier);
                      const areaIsActive = isServiceAreaActive(area);

                      return (
                        <div
                          key={identifier || area.key}
                          className="px-4 py-3.5"
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleAreaSelection(area)}
                              disabled={!identifier || bulkDeleting}
                              className="mt-1 accent-accent-600"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-primary-900">
                                    {area.label}
                                  </p>
                                  <p className="text-xs text-primary-600 mt-1">
                                    {area.key} • PIN {area.pincode} • Radius{" "}
                                    {area.radiusKm} km
                                  </p>
                                  <p className="text-xs text-primary-500 mt-1">
                                    {area.latitude}, {area.longitude}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEdit(area)}
                                    disabled={bulkDeleting}
                                    className="h-9 px-3 rounded-lg border border-primary-200 bg-white text-primary-700 hover:bg-primary-50 disabled:opacity-60 disabled:cursor-not-allowed text-xs font-semibold inline-flex items-center gap-1.5"
                                  >
                                    <FiEdit3 className="h-3.5 w-3.5" />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleActive(area)}
                                    disabled={bulkDeleting}
                                    className={`h-9 px-3 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed ${
                                      areaIsActive
                                        ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                        : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                                    }`}
                                  >
                                    {areaIsActive ? (
                                      <>
                                        <FiToggleRight className="h-3.5 w-3.5" />
                                        Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <FiToggleLeft className="h-3.5 w-3.5" />
                                        Activate
                                      </>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handlePermanentDelete(area)}
                                    disabled={bulkDeleting || deletingId === identifier}
                                    className="h-9 px-3 rounded-lg border border-red-200 bg-white text-red-700 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed text-xs font-semibold inline-flex items-center gap-1.5"
                                  >
                                    <FiTrash2 className="h-3.5 w-3.5" />
                                    {deletingId === identifier
                                      ? "Deleting..."
                                      : "Delete"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ServiceLocations;
