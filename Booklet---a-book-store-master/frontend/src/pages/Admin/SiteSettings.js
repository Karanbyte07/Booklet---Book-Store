import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import AdminMenu from "../../components/Layout/AdminMenu";
import axios from "../../config/axios";
import toast from "react-hot-toast";
import { FiHeadphones, FiRefreshCw, FiSave } from "react-icons/fi";
import {
  DEFAULT_SITE_SETTINGS,
  normalizeSiteSettings,
} from "../../hooks/useSiteSettings";

const ensureUrlProtocol = (value = "") => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const HOURS_DEFAULTS = {
  weekdays: { label: "Mon - Fri", from: "09:00", to: "18:00", closed: false },
  saturday: { label: "Sat", from: "10:00", to: "16:00", closed: false },
  sunday: { label: "Sun", from: "10:00", to: "16:00", closed: true },
};

const toTwoDigit = (value) => String(value).padStart(2, "0");

const to24HourTime = (raw = "") => {
  const value = String(raw || "").trim();
  if (!value) return "";
  const match = value.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return "";
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = String(match[3] || "").toUpperCase();
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return "";
  if (period) {
    if (period === "AM" && hours === 12) hours = 0;
    if (period === "PM" && hours < 12) hours += 12;
  }
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return "";
  return `${toTwoDigit(hours)}:${toTwoDigit(minutes)}`;
};

const formatTime12Hour = (time24 = "") => {
  const [hRaw, mRaw] = String(time24 || "").split(":");
  const hours = Number(hRaw);
  const minutes = Number(mRaw);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return "";
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${toTwoDigit(minutes)} ${suffix}`;
};

const parseBusinessHoursToRanges = (businessHours = {}) => {
  const entries = Object.entries(HOURS_DEFAULTS);
  const ranges = {};

  entries.forEach(([key, defaults]) => {
    const sourceText = String(businessHours?.[key] || "");
    const lowered = sourceText.toLowerCase();
    const timeMatches12h = [...sourceText.matchAll(/(\d{1,2}:\d{2}\s*(?:AM|PM))/gi)];
    const timeMatches24h = [...sourceText.matchAll(/\b(\d{1,2}:\d{2})\b/g)];

    let from = defaults.from;
    let to = defaults.to;

    if (timeMatches12h.length >= 2) {
      from = to24HourTime(timeMatches12h[0][1]) || defaults.from;
      to = to24HourTime(timeMatches12h[1][1]) || defaults.to;
    } else if (timeMatches24h.length >= 2) {
      from = to24HourTime(timeMatches24h[0][1]) || defaults.from;
      to = to24HourTime(timeMatches24h[1][1]) || defaults.to;
    }

    const isClosed =
      lowered.includes("closed") ||
      (lowered.includes("limited support") && key === "sunday");

    ranges[key] = {
      ...defaults,
      from,
      to,
      closed: isClosed,
    };
  });

  return ranges;
};

const buildBusinessHoursFromRanges = (ranges = HOURS_DEFAULTS) => {
  const result = {};
  Object.entries(HOURS_DEFAULTS).forEach(([key, defaults]) => {
    const current = ranges?.[key] || defaults;
    if (current.closed) {
      result[key] =
        key === "sunday"
          ? `${defaults.label}: Limited support`
          : `${defaults.label}: Closed`;
      return;
    }

    const fromLabel = formatTime12Hour(current.from || defaults.from);
    const toLabel = formatTime12Hour(current.to || defaults.to);
    result[key] = `${defaults.label}: ${fromLabel} to ${toLabel}`;
  });

  return result;
};

const SiteSettings = () => {
  const [support, setSupport] = useState(DEFAULT_SITE_SETTINGS.support);
  const [hourRanges, setHourRanges] = useState(HOURS_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const getSettings = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/v1/site-settings/admin", {
        params: { t: Date.now() },
      });
      if (!data?.success) {
        throw new Error(data?.message || "Unable to fetch site settings");
      }
      const normalizedSupport = normalizeSiteSettings(data?.settings).support;
      setSupport(normalizedSupport);
      setHourRanges(parseBusinessHoursToRanges(normalizedSupport?.businessHours));
    } catch (error) {
      console.log(error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load support settings"
      );
      setSupport(DEFAULT_SITE_SETTINGS.support);
      setHourRanges(HOURS_DEFAULTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSettings();
  }, []);

  const handleFieldChange = (field) => (event) => {
    const nextValue = event.target.value;
    setSupport((prev) => ({
      ...prev,
      [field]: nextValue,
    }));
  };

  const handleNestedChange = (parent, field) => (event) => {
    const nextValue = event.target.value;
    setSupport((prev) => ({
      ...prev,
      [parent]: {
        ...(prev[parent] || {}),
        [field]: nextValue,
      },
    }));
  };

  const handleHoursRangeChange = (day, field) => (event) => {
    const nextValue = event.target.value;
    setHourRanges((prev) => ({
      ...prev,
      [day]: {
        ...(prev?.[day] || HOURS_DEFAULTS[day]),
        [field]: nextValue,
      },
    }));
  };

  const handleDayClosedToggle = (day) => (event) => {
    const checked = event.target.checked;
    setHourRanges((prev) => ({
      ...prev,
      [day]: {
        ...(prev?.[day] || HOURS_DEFAULTS[day]),
        closed: checked,
      },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (
      !String(support.primaryEmail || "").trim() ||
      !String(support.primaryPhone || "").trim() ||
      !String(support.officeName || "").trim() ||
      !String(support.address || "").trim()
    ) {
      toast.error("Primary email, phone, office name, and address are required");
      return;
    }

    const payload = {
      support: {
        ...support,
        businessHours: buildBusinessHoursFromRanges(hourRanges),
        socialLinks: {
          ...(support?.socialLinks || {}),
          facebook: ensureUrlProtocol(support?.socialLinks?.facebook),
          twitter: ensureUrlProtocol(support?.socialLinks?.twitter),
          instagram: ensureUrlProtocol(support?.socialLinks?.instagram),
          linkedin: ensureUrlProtocol(support?.socialLinks?.linkedin),
        },
      },
    };

    try {
      setSaving(true);
      const { data } = await axios.put("/api/v1/site-settings/admin", payload);
      if (!data?.success) {
        throw new Error(data?.message || "Unable to save support settings");
      }
      setSupport(normalizeSiteSettings(data?.settings).support);
      await getSettings();
      toast.success("Support settings updated");
    } catch (error) {
      console.log(error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save support settings"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="Admin - Support Settings">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6 lg:h-[calc(100vh-4rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-5 lg:gap-6 items-start lg:h-full">
          <div>
            <AdminMenu />
          </div>

          <div className="min-w-0 lg:h-full lg:overflow-y-auto lg:pr-1">
            <div className="rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-50 via-white to-accent-50 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-white text-accent-700 flex items-center justify-center border border-accent-200 shadow-sm">
                    <FiHeadphones className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-primary-900">
                      Support Settings
                    </h1>
                    <p className="text-sm text-primary-600">
                      Manage support phone, email, address, social links, and contact
                      content.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={getSettings}
                  disabled={loading}
                  className="h-9 px-3 rounded-lg border border-primary-200 bg-white text-primary-700 hover:bg-primary-50 text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"
                >
                  <FiRefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="mt-5 rounded-2xl border border-primary-200 bg-white p-5 shadow-sm space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Primary Email
                  </span>
                  <input
                    type="email"
                    value={support.primaryEmail}
                    onChange={handleFieldChange("primaryEmail")}
                    className="mt-1.5 w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Secondary Email
                  </span>
                  <input
                    type="email"
                    value={support.secondaryEmail}
                    onChange={handleFieldChange("secondaryEmail")}
                    className="mt-1.5 w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Primary Phone
                  </span>
                  <input
                    type="text"
                    value={support.primaryPhone}
                    onChange={handleFieldChange("primaryPhone")}
                    className="mt-1.5 w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Secondary Phone
                  </span>
                  <input
                    type="text"
                    value={support.secondaryPhone}
                    onChange={handleFieldChange("secondaryPhone")}
                    className="mt-1.5 w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Office Name
                  </span>
                  <input
                    type="text"
                    value={support.officeName}
                    onChange={handleFieldChange("officeName")}
                    className="mt-1.5 w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Address
                  </span>
                  <input
                    type="text"
                    value={support.address}
                    onChange={handleFieldChange("address")}
                    className="mt-1.5 w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Email Response Time
                  </span>
                  <input
                    type="text"
                    value={support.responseTime}
                    onChange={handleFieldChange("responseTime")}
                    className="mt-1.5 w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Phone Availability
                  </span>
                  <input
                    type="text"
                    value={support.phoneAvailability}
                    onChange={handleFieldChange("phoneAvailability")}
                    className="mt-1.5 w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Contact Hero Title
                  </span>
                  <input
                    type="text"
                    value={support.contactHeroTitle}
                    onChange={handleFieldChange("contactHeroTitle")}
                    className="mt-1.5 w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Contact Hero Description
                  </span>
                  <textarea
                    rows="3"
                    value={support.contactHeroDescription}
                    onChange={handleFieldChange("contactHeroDescription")}
                    className="mt-1.5 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Quick Help Text
                  </span>
                  <textarea
                    rows="2"
                    value={support.quickHelpText}
                    onChange={handleFieldChange("quickHelpText")}
                    className="mt-1.5 w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(HOURS_DEFAULTS).map(([dayKey, dayDefaults]) => (
                  <div
                    key={dayKey}
                    className="rounded-lg border border-primary-200 p-3 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                        {dayDefaults.label} Hours
                      </span>
                      <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary-600">
                        <input
                          type="checkbox"
                          checked={Boolean(hourRanges?.[dayKey]?.closed)}
                          onChange={handleDayClosedToggle(dayKey)}
                          className="h-3.5 w-3.5 accent-accent-600"
                        />
                        Closed
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <label className="block">
                        <span className="text-[11px] text-primary-500">From</span>
                        <input
                          type="time"
                          value={hourRanges?.[dayKey]?.from || dayDefaults.from}
                          onChange={handleHoursRangeChange(dayKey, "from")}
                          disabled={Boolean(hourRanges?.[dayKey]?.closed)}
                          className="mt-1 w-full h-9 rounded-lg border border-primary-200 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300 disabled:opacity-55"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[11px] text-primary-500">To</span>
                        <input
                          type="time"
                          value={hourRanges?.[dayKey]?.to || dayDefaults.to}
                          onChange={handleHoursRangeChange(dayKey, "to")}
                          disabled={Boolean(hourRanges?.[dayKey]?.closed)}
                          className="mt-1 w-full h-9 rounded-lg border border-primary-200 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300 disabled:opacity-55"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Facebook URL
                  </span>
                  <input
                    type="text"
                    value={support.socialLinks.facebook}
                    onChange={handleNestedChange("socialLinks", "facebook")}
                    placeholder="https://facebook.com/your-page"
                    className="mt-1.5 w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Twitter URL
                  </span>
                  <input
                    type="text"
                    value={support.socialLinks.twitter}
                    onChange={handleNestedChange("socialLinks", "twitter")}
                    placeholder="https://twitter.com/your-handle"
                    className="mt-1.5 w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Instagram URL
                  </span>
                  <input
                    type="text"
                    value={support.socialLinks.instagram}
                    onChange={handleNestedChange("socialLinks", "instagram")}
                    placeholder="https://instagram.com/your-handle"
                    className="mt-1.5 w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                    LinkedIn URL
                  </span>
                  <input
                    type="text"
                    value={support.socialLinks.linkedin}
                    onChange={handleNestedChange("socialLinks", "linkedin")}
                    placeholder="https://linkedin.com/company/your-page"
                    className="mt-1.5 w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                  />
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || saving}
                  className="h-11 px-5 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60"
                >
                  <FiSave className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SiteSettings;
