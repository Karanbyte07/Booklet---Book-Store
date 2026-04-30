import { useCallback, useEffect, useState } from "react";
import axios from "../config/axios";

export const DEFAULT_SITE_SETTINGS = {
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

export const normalizeSiteSettings = (rawSettings = {}) => {
  const rawSupport = rawSettings?.support || {};
  return {
    support: {
      ...DEFAULT_SITE_SETTINGS.support,
      ...rawSupport,
      socialLinks: {
        ...DEFAULT_SITE_SETTINGS.support.socialLinks,
        ...(rawSupport?.socialLinks || {}),
      },
      businessHours: {
        ...DEFAULT_SITE_SETTINGS.support.businessHours,
        ...(rawSupport?.businessHours || {}),
      },
    },
  };
};

const useSiteSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/v1/site-settings/public", {
        params: { t: Date.now() },
      });
      if (data?.success) {
        setSettings(normalizeSiteSettings(data?.settings));
        return;
      }
      setSettings(DEFAULT_SITE_SETTINGS);
    } catch (error) {
      console.log(error);
      setSettings(DEFAULT_SITE_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    support: settings.support,
    loading,
    refresh: fetchSettings,
  };
};

export default useSiteSettings;
