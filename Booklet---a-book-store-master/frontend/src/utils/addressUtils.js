const cleanString = (value) => (typeof value === "string" ? value.trim() : "");
const normalizeId = (value) => {
  if (typeof value === "string") return value.trim();
  if (value && typeof value.toString === "function") return value.toString().trim();
  return "";
};

export const formatAddressText = (addressValue) => {
  if (!addressValue) return "";
  if (typeof addressValue === "string") return addressValue.trim();

  if (typeof addressValue !== "object") return "";

  const line1 = cleanString(addressValue.line1 || addressValue.addressLine1 || "");
  const line2 = cleanString(addressValue.line2 || addressValue.addressLine2 || "");
  const city = cleanString(addressValue.city);
  const state = cleanString(addressValue.state);
  const pincode = cleanString(addressValue.pincode);
  const country = cleanString(addressValue.country);
  const landmark = cleanString(addressValue.landmark);
  const fallbackText = cleanString(addressValue.fullAddress);

  const firstLine = [line1, line2].filter(Boolean).join(", ");
  const secondLine = [city, state, pincode, country].filter(Boolean).join(", ");
  let formatted = [firstLine, secondLine].filter(Boolean).join(", ");

  if (landmark) {
    formatted = formatted
      ? `${formatted} (Landmark: ${landmark})`
      : `Landmark: ${landmark}`;
  }

  return formatted || fallbackText;
};

export const normalizeAddressForForm = (addressValue, fallback = {}) => {
  const fullName = cleanString(fallback.fullName);
  const phone = cleanString(fallback.phone);

  if (!addressValue || typeof addressValue === "string") {
    return {
      fullName,
      phone,
      line1: cleanString(addressValue),
      line2: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      landmark: "",
      addressType: "home",
    };
  }

  return {
    fullName: cleanString(addressValue.fullName) || fullName,
    phone: cleanString(addressValue.phone) || phone,
    line1: cleanString(addressValue.line1 || addressValue.addressLine1 || ""),
    line2: cleanString(addressValue.line2 || addressValue.addressLine2 || ""),
    city: cleanString(addressValue.city),
    state: cleanString(addressValue.state),
    pincode: cleanString(addressValue.pincode),
    country: cleanString(addressValue.country) || "India",
    landmark: cleanString(addressValue.landmark),
    addressType: cleanString(addressValue.addressType) || "home",
  };
};

export const createAddressPayload = (values = {}) => ({
  ...(normalizeId(values._id || values.id) ? { _id: normalizeId(values._id || values.id) } : {}),
  fullName: cleanString(values.fullName),
  phone: cleanString(values.phone),
  line1: cleanString(values.line1),
  line2: cleanString(values.line2),
  city: cleanString(values.city),
  state: cleanString(values.state),
  pincode: cleanString(values.pincode),
  country: cleanString(values.country) || "India",
  landmark: cleanString(values.landmark),
  addressType: cleanString(values.addressType) || "home",
  isDefault:
    typeof values.isDefault === "boolean" ? values.isDefault : true,
});

const addressFingerprint = (address = {}) =>
  [
    cleanString(address.fullName),
    cleanString(address.phone),
    cleanString(address.line1),
    cleanString(address.line2),
    cleanString(address.city),
    cleanString(address.state),
    cleanString(address.pincode),
    cleanString(address.country),
    cleanString(address.landmark),
    cleanString(address.addressType),
  ]
    .join("|")
    .toLowerCase();

export const normalizeAddressBook = (
  addressesInput,
  fallbackAddress,
  fallbackMeta = {}
) => {
  const sourceList = Array.isArray(addressesInput) ? addressesInput : [];
  const dedupeMap = new Map();

  sourceList.forEach((entry) => {
    const normalized = createAddressPayload(
      normalizeAddressForForm(entry, fallbackMeta)
    );
    const entryId = normalizeId(entry?._id || entry?.id);
    const normalizedWithMeta = {
      ...(entryId ? { _id: entryId } : {}),
      ...normalized,
      isDefault: Boolean(entry?.isDefault),
    };

    if (!normalizedWithMeta.line1) return;
    const key = addressFingerprint(normalizedWithMeta);
    normalizedWithMeta._clientKey = key;
    const existing = dedupeMap.get(key);
    if (!existing) {
      dedupeMap.set(key, normalizedWithMeta);
      return;
    }
    dedupeMap.set(key, {
      ...existing,
      ...normalizedWithMeta,
      _id: existing._id || normalizedWithMeta._id,
      _clientKey: existing._clientKey || normalizedWithMeta._clientKey || key,
      isDefault: Boolean(existing.isDefault || normalizedWithMeta.isDefault),
    });
  });

  const normalizedFallback = fallbackAddress
    ? createAddressPayload(normalizeAddressForForm(fallbackAddress, fallbackMeta))
    : null;

  if (normalizedFallback?.line1) {
    const fallbackId = normalizeId(fallbackAddress?._id || fallbackAddress?.id);
    const fallbackRecord = {
      ...(fallbackId ? { _id: fallbackId } : {}),
      ...normalizedFallback,
      isDefault: true,
    };
    const fallbackKey = addressFingerprint(fallbackRecord);
    fallbackRecord._clientKey = fallbackKey;
    const existingFallback = dedupeMap.get(fallbackKey);
    if (!existingFallback) {
      dedupeMap.set(fallbackKey, fallbackRecord);
    } else {
      dedupeMap.set(fallbackKey, {
        ...existingFallback,
        ...fallbackRecord,
        _id: existingFallback._id || fallbackRecord._id,
        _clientKey:
          existingFallback._clientKey ||
          fallbackRecord._clientKey ||
          fallbackKey,
        isDefault: true,
      });
    }
  }

  const normalizedList = Array.from(dedupeMap.values());
  if (!normalizedList.length) return [];

  const defaultIndex = normalizedList.findIndex((entry) => entry.isDefault);
  const selectedDefaultIndex = defaultIndex >= 0 ? defaultIndex : 0;

  return normalizedList.map((entry, index) => ({
    ...entry,
    isDefault: index === selectedDefaultIndex,
  }));
};

export const pickDefaultAddress = (addressesInput = []) => {
  if (!Array.isArray(addressesInput) || !addressesInput.length) return null;
  return (
    addressesInput.find((entry) => entry?.isDefault) ||
    addressesInput[0] ||
    null
  );
};

export const resolveAddressId = (addressInput = {}, fallback = "") =>
  normalizeId(
    addressInput?._id || addressInput?.id || addressInput?._clientKey || fallback
  );
