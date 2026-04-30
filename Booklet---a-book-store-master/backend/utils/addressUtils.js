const ADDRESS_TYPES = new Set(["home", "work", "other"]);

const cleanString = (value) => (typeof value === "string" ? value.trim() : "");
const normalizeId = (value) => {
  if (typeof value === "string") {
    const normalized = value.trim();
    return /^[a-fA-F0-9]{24}$/.test(normalized) ? normalized : "";
  }
  if (value && typeof value.toString === "function") {
    const normalized = value.toString().trim();
    return /^[a-fA-F0-9]{24}$/.test(normalized) ? normalized : "";
  }
  return "";
};

const firstNonEmpty = (...values) => {
  for (const value of values) {
    const normalized = cleanString(value);
    if (normalized) return normalized;
  }
  return "";
};

export const normalizeAddressPayload = (addressInput, options = {}) => {
  const {
    fullName: fallbackFullName = "",
    phone: fallbackPhone = "",
    existingAddress = {},
  } = options;

  const existing =
    existingAddress && typeof existingAddress === "object" ? existingAddress : {};
  const inputObject =
    addressInput && typeof addressInput === "object" && !Array.isArray(addressInput)
      ? addressInput
      : {};
  const normalizedId = firstNonEmpty(
    normalizeId(inputObject._id),
    normalizeId(inputObject.id)
  );

  const line1 = firstNonEmpty(
    inputObject.line1,
    inputObject.addressLine1,
    inputObject.street,
    typeof addressInput === "string" ? addressInput : "",
    existing.line1
  );

  const addressTypeCandidate = firstNonEmpty(
    inputObject.addressType,
    existing.addressType,
    "home"
  ).toLowerCase();

  const normalizedAddress = {
    ...(normalizedId ? { _id: normalizedId } : {}),
    fullName: firstNonEmpty(inputObject.fullName, fallbackFullName, existing.fullName),
    phone: firstNonEmpty(inputObject.phone, fallbackPhone, existing.phone),
    line1,
    line2: firstNonEmpty(inputObject.line2, inputObject.addressLine2, existing.line2),
    city: firstNonEmpty(inputObject.city, existing.city),
    state: firstNonEmpty(inputObject.state, existing.state),
    pincode: firstNonEmpty(inputObject.pincode, existing.pincode),
    country: firstNonEmpty(inputObject.country, existing.country, "India"),
    landmark: firstNonEmpty(inputObject.landmark, existing.landmark),
    addressType: ADDRESS_TYPES.has(addressTypeCandidate)
      ? addressTypeCandidate
      : "home",
    isDefault:
      typeof inputObject.isDefault === "boolean"
        ? inputObject.isDefault
        : typeof existing.isDefault === "boolean"
          ? existing.isDefault
          : true,
  };

  return normalizedAddress;
};

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

const ensureSingleDefault = (addresses = []) => {
  if (!Array.isArray(addresses) || addresses.length === 0) return [];

  const selectedDefaultIndex = addresses.findIndex((address) => address.isDefault);
  const defaultIndex = selectedDefaultIndex >= 0 ? selectedDefaultIndex : 0;

  return addresses.map((address, index) => ({
    ...address,
    isDefault: index === defaultIndex,
  }));
};

export const normalizeAddressList = (addressListInput, options = {}) => {
  const {
    fullName: fallbackFullName = "",
    phone: fallbackPhone = "",
    existingAddresses = [],
  } = options;

  const sourceList = Array.isArray(addressListInput)
    ? addressListInput
    : Array.isArray(existingAddresses)
      ? existingAddresses
      : [];

  const dedupeMap = new Map();
  sourceList.forEach((addressEntry) => {
    const normalizedEntry = normalizeAddressPayload(addressEntry, {
      fullName: fallbackFullName,
      phone: fallbackPhone,
      existingAddress: addressEntry,
    });

    if (!normalizedEntry.line1) return;

    const key = addressFingerprint(normalizedEntry);
    if (!dedupeMap.has(key)) {
      dedupeMap.set(key, normalizedEntry);
      return;
    }

    const previous = dedupeMap.get(key);
    dedupeMap.set(key, {
      ...previous,
      ...normalizedEntry,
      _id: previous._id || normalizedEntry._id,
      isDefault: Boolean(previous.isDefault || normalizedEntry.isDefault),
    });
  });

  return ensureSingleDefault(Array.from(dedupeMap.values()));
};

export const buildUserAddressState = (input = {}) => {
  const {
    fullName = "",
    phone = "",
    profileAddress,
    legacyAddress,
    addresses,
    existingProfileAddress = {},
    existingLegacyAddress = {},
    existingAddresses = [],
  } = input;

  const profileSource =
    profileAddress !== undefined
      ? profileAddress
      : existingProfileAddress?.line1
        ? existingProfileAddress
        : legacyAddress !== undefined
          ? legacyAddress
          : existingLegacyAddress;

  let normalizedProfileAddress = normalizeAddressPayload(profileSource, {
    fullName,
    phone,
    existingAddress: existingProfileAddress || existingLegacyAddress,
  });

  let normalizedAddressBook = normalizeAddressList(
    addresses !== undefined ? addresses : existingAddresses,
    {
      fullName,
      phone,
      existingAddresses,
    }
  );

  if (normalizedAddressBook.length === 0) {
    const fallbackLegacyAddress = normalizeAddressPayload(
      legacyAddress !== undefined ? legacyAddress : existingLegacyAddress,
      {
        fullName,
        phone,
        existingAddress: existingLegacyAddress,
      }
    );
    if (fallbackLegacyAddress.line1) {
      normalizedAddressBook = [{ ...fallbackLegacyAddress, isDefault: true }];
    }
  }

  if (normalizedProfileAddress.line1) {
    const profileKey = addressFingerprint(normalizedProfileAddress);
    const existingProfileIndex = normalizedAddressBook.findIndex(
      (addressEntry) => addressFingerprint(addressEntry) === profileKey
    );

    if (existingProfileIndex === -1) {
      normalizedAddressBook.unshift({
        ...normalizedProfileAddress,
        isDefault: normalizedAddressBook.every((addressEntry) => !addressEntry.isDefault),
      });
    } else {
      normalizedAddressBook[existingProfileIndex] = {
        ...normalizedAddressBook[existingProfileIndex],
        ...normalizedProfileAddress,
        isDefault:
          normalizedAddressBook[existingProfileIndex].isDefault ||
          normalizedAddressBook.every((addressEntry) => !addressEntry.isDefault),
      };
    }
  }

  normalizedAddressBook = ensureSingleDefault(normalizedAddressBook);

  const defaultAddress =
    normalizedAddressBook.find((addressEntry) => addressEntry.isDefault) ||
    normalizedAddressBook[0] ||
    null;

  if (!normalizedProfileAddress.line1 && defaultAddress) {
    normalizedProfileAddress = normalizeAddressPayload(defaultAddress, {
      fullName,
      phone,
      existingAddress: defaultAddress,
    });
  }

  return {
    profileAddress: normalizedProfileAddress,
    address: normalizedProfileAddress,
    addresses: normalizedAddressBook,
  };
};
