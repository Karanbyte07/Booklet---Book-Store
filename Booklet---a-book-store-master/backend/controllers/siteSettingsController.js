import siteSettingsModel from "../models/siteSettingsModel.js";

const GLOBAL_SETTINGS_KEY = "global";

const DEFAULT_SITE_SETTINGS = {
  support: {
    primaryEmail: "help@booklet.com",
    secondaryEmail: "support@booklet.com",
    primaryPhone: "+1 (800) 123-4567",
    secondaryPhone: "+1 (800) 266-5538",
    officeName: "Booklet Inc.",
    address: "123 Book Street, BC 12345, Canada",
    responseTime: "Response within 24 hours",
    phoneAvailability: "Available all week",
    contactHeroTitle: "Contact Booklet",
    contactHeroDescription:
      "Questions about orders, payments, or recommendations? Reach out and our support team will help quickly.",
    quickHelpText: "For urgent order questions, phone and email support are prioritized.",
    socialLinks: {
      facebook: "https://facebook.com",
      twitter: "https://twitter.com",
      instagram: "https://instagram.com",
      linkedin: "https://linkedin.com",
    },
    businessHours: {
      weekdays: "Mon - Fri: 9:00 AM to 6:00 PM",
      saturday: "Sat: 10:00 AM to 4:00 PM",
      sunday: "Sun: Limited support",
    },
  },
};

const toPlainObject = (value) => {
  if (!value) return {};
  if (typeof value.toObject === "function") {
    return value.toObject();
  }
  return { ...value };
};

const normalizeText = (value, maxLength = 500) =>
  String(value ?? "")
    .trim()
    .slice(0, maxLength);

const normalizeLowerText = (value, maxLength = 160) =>
  normalizeText(value, maxLength).toLowerCase();

const normalizeUrl = (value) => normalizeText(value, 500);

const resolveValue = (value, fallback = "", maxLength = 500, lower = false) => {
  if (value === undefined || value === null) return fallback;
  return lower ? normalizeLowerText(value, maxLength) : normalizeText(value, maxLength);
};

const mergeSiteSettings = (source = {}) => {
  const sourceObject = toPlainObject(source);
  const supportSource = toPlainObject(sourceObject?.support);
  const socialLinks = {
    ...DEFAULT_SITE_SETTINGS.support.socialLinks,
    ...toPlainObject(supportSource?.socialLinks),
  };
  const businessHours = {
    ...DEFAULT_SITE_SETTINGS.support.businessHours,
    ...toPlainObject(supportSource?.businessHours),
  };

  return {
    support: {
      ...DEFAULT_SITE_SETTINGS.support,
      ...supportSource,
      socialLinks,
      businessHours,
    },
  };
};

const serializeSiteSettings = (doc) => {
  if (!doc) return mergeSiteSettings();
  const plainDoc = toPlainObject(doc);
  return mergeSiteSettings({
    support: plainDoc?.support || {},
  });
};

const buildSupportPayload = (payload = {}, fallbackSupport = DEFAULT_SITE_SETTINGS.support) => {
  const nextSupport = payload?.support || {};
  const fallbackSocialLinks = fallbackSupport?.socialLinks || {};
  const fallbackBusinessHours = fallbackSupport?.businessHours || {};

  return {
    primaryEmail: resolveValue(
      nextSupport.primaryEmail,
      fallbackSupport?.primaryEmail || "",
      160,
      true
    ),
    secondaryEmail: resolveValue(
      nextSupport.secondaryEmail,
      fallbackSupport?.secondaryEmail || "",
      160,
      true
    ),
    primaryPhone: resolveValue(
      nextSupport.primaryPhone,
      fallbackSupport?.primaryPhone || "",
      80
    ),
    secondaryPhone: resolveValue(
      nextSupport.secondaryPhone,
      fallbackSupport?.secondaryPhone || "",
      80
    ),
    officeName: resolveValue(
      nextSupport.officeName,
      fallbackSupport?.officeName || "",
      120
    ),
    address: resolveValue(nextSupport.address, fallbackSupport?.address || "", 260),
    responseTime: resolveValue(
      nextSupport.responseTime,
      fallbackSupport?.responseTime || "",
      120
    ),
    phoneAvailability: resolveValue(
      nextSupport.phoneAvailability,
      fallbackSupport?.phoneAvailability || "",
      120
    ),
    contactHeroTitle: resolveValue(
      nextSupport.contactHeroTitle,
      fallbackSupport?.contactHeroTitle || "",
      120
    ),
    contactHeroDescription: resolveValue(
      nextSupport.contactHeroDescription,
      fallbackSupport?.contactHeroDescription || "",
      420
    ),
    quickHelpText: resolveValue(
      nextSupport.quickHelpText,
      fallbackSupport?.quickHelpText || "",
      260
    ),
    socialLinks: {
      facebook: resolveValue(
        nextSupport?.socialLinks?.facebook,
        fallbackSocialLinks?.facebook || "",
        500
      ),
      twitter: resolveValue(
        nextSupport?.socialLinks?.twitter,
        fallbackSocialLinks?.twitter || "",
        500
      ),
      instagram: resolveValue(
        nextSupport?.socialLinks?.instagram,
        fallbackSocialLinks?.instagram || "",
        500
      ),
      linkedin: resolveValue(
        nextSupport?.socialLinks?.linkedin,
        fallbackSocialLinks?.linkedin || "",
        500
      ),
    },
    businessHours: {
      weekdays: resolveValue(
        nextSupport?.businessHours?.weekdays,
        fallbackBusinessHours?.weekdays || "",
        120
      ),
      saturday: resolveValue(
        nextSupport?.businessHours?.saturday,
        fallbackBusinessHours?.saturday || "",
        120
      ),
      sunday: resolveValue(
        nextSupport?.businessHours?.sunday,
        fallbackBusinessHours?.sunday || "",
        120
      ),
    },
  };
};

const getOrCreateSettings = async () => {
  let settings = await siteSettingsModel.findOne({ key: GLOBAL_SETTINGS_KEY });
  if (settings) return settings;

  settings = await siteSettingsModel.create({ key: GLOBAL_SETTINGS_KEY });
  return settings;
};

export const getPublicSiteSettingsController = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.status(200).send({
      success: true,
      settings: serializeSiteSettings(settings),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Unable to load site settings",
    });
  }
};

export const getAdminSiteSettingsController = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.status(200).send({
      success: true,
      settings: serializeSiteSettings(settings),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Unable to load admin site settings",
    });
  }
};

export const updateAdminSiteSettingsController = async (req, res) => {
  try {
    const existingSettings = await getOrCreateSettings();
    const existingSupport = serializeSiteSettings(existingSettings)?.support;
    const incoming = buildSupportPayload(req.body, existingSupport);
    const merged = mergeSiteSettings({ support: incoming });

    const settings = await siteSettingsModel.findOneAndUpdate(
      { key: GLOBAL_SETTINGS_KEY },
      {
        $set: {
          key: GLOBAL_SETTINGS_KEY,
          support: merged.support,
          updatedBy: req.user?._id || null,
        },
        $setOnInsert: {
          createdBy: req.user?._id || null,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).send({
      success: true,
      message: "Site settings updated",
      settings: serializeSiteSettings(settings),
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: error?.message || "Unable to update site settings",
    });
  }
};
