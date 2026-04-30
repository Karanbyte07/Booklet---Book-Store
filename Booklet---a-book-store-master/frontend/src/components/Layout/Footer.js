import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiArrowUp,
  FiChevronRight,
  FiFacebook,
  FiHeart,
  FiInstagram,
  FiLinkedin,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSend,
  FiTwitter,
} from "react-icons/fi";
import useSiteSettings from "../../hooks/useSiteSettings";

const supportLinks = [
  { to: "/policy", label: "Privacy Policy" },
  { to: "/contact", label: "Help Center" },
  { to: "/contact", label: "Shipping & Delivery" },
  { to: "/contact", label: "Returns & Refunds" },
];

const Footer = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const { support } = useSiteSettings();

  const socials = useMemo(
    () =>
      [
        {
          label: "Facebook",
          href: support?.socialLinks?.facebook,
          icon: FiFacebook,
        },
        {
          label: "Twitter",
          href: support?.socialLinks?.twitter,
          icon: FiTwitter,
        },
        {
          label: "Instagram",
          href: support?.socialLinks?.instagram,
          icon: FiInstagram,
        },
        {
          label: "LinkedIn",
          href: support?.socialLinks?.linkedin,
          icon: FiLinkedin,
        },
      ].filter((item) => Boolean(item.href)),
    [
      support?.socialLinks?.facebook,
      support?.socialLinks?.twitter,
      support?.socialLinks?.instagram,
      support?.socialLinks?.linkedin,
    ]
  );

  return (
    <footer className="relative mt-auto border-t border-primary-200 bg-gradient-to-b from-white via-primary-50/80 to-primary-100/60 text-primary-900 overflow-hidden">
      <div className="absolute -top-24 -left-20 h-64 w-64 rounded-full bg-primary-100/70 blur-3xl" />
      <div className="absolute -bottom-24 -right-20 h-64 w-64 rounded-full bg-accent-100/70 blur-3xl" />

      <div className="relative w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        {isHomePage && (
          <section className="pt-8 sm:pt-10">
            <div className="rounded-2xl border border-accent-200 bg-white/95 shadow-sm p-4 sm:p-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-primary-900 inline-flex items-center gap-2">
                    <FiMail className="h-4.5 w-4.5 text-accent-700" />
                    Weekly Book Picks
                  </h3>
                  <p className="mt-1 text-sm text-primary-600">
                    Get curated releases and deals delivered to your inbox.
                  </p>
                </div>
                <div className="flex gap-2.5">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 h-10 rounded-lg border border-primary-200 bg-white px-3 text-sm text-primary-900 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent-300"
                  />
                  <button
                    type="button"
                    className="h-10 px-4 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold inline-flex items-center gap-1.5"
                  >
                    <FiSend className="h-4 w-4" />
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="py-8 sm:py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 sm:gap-8">
            <div>
              <Link to="/" className="inline-flex items-center gap-2 no-underline text-primary-900">
                <span className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-white border border-accent-200 p-0.5 inline-flex items-center justify-center overflow-hidden">
                  <img
                    src={`${process.env.PUBLIC_URL}/images/logo.png`}
                    alt="Booklet logo"
                    className="h-full w-full object-contain scale-110"
                  />
                </span>
                <span>
                  <span className="block text-lg font-bold">Booklet</span>
                  <span className="block text-xs text-primary-500">Read. Learn. Grow.</span>
                </span>
              </Link>
              <p className="mt-3 text-sm text-primary-600 leading-relaxed">
                Booklet helps readers discover quality books with clean browsing,
                fair pricing, and dependable delivery support.
              </p>
              <p className="mt-3 text-sm text-primary-700 inline-flex items-center gap-1.5">
                Built with <FiHeart className="h-4 w-4 text-accent-600" /> for readers
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-accent-700 mb-3">
                Support
              </h3>
              <ul className="space-y-2.5">
                {supportLinks.map((item, idx) => (
                  <li key={`${item.label}-${idx}`}>
                    <Link
                      to={item.to}
                      className="no-underline text-sm text-primary-700 hover:text-accent-700 inline-flex items-center gap-1.5"
                    >
                      <FiChevronRight className="h-3.5 w-3.5" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-accent-700 mb-3">
                Contact
              </h3>
              <div className="space-y-2.5">
                <a
                  href={`mailto:${support?.secondaryEmail || support?.primaryEmail}`}
                  className="no-underline text-sm text-primary-700 hover:text-accent-700 inline-flex items-center gap-2"
                >
                  <FiMail className="h-4 w-4 text-accent-600" />
                  {support?.secondaryEmail || support?.primaryEmail}
                </a>
                <a
                  href={`tel:${String(support?.primaryPhone || "").replace(/[^\d+]/g, "")}`}
                  className="no-underline text-sm text-primary-700 hover:text-accent-700 inline-flex items-center gap-2"
                >
                  <FiPhone className="h-4 w-4 text-accent-600" />
                  {support?.primaryPhone}
                </a>
                <p className="text-sm text-primary-700 inline-flex items-center gap-2 m-0">
                  <FiMapPin className="h-4 w-4 text-accent-600" />
                  {support?.address}
                </p>
              </div>

              <div className="mt-4 flex gap-2">
                {socials.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={social.label}
                      className="h-9 w-9 rounded-lg border border-accent-200 bg-accent-50 text-accent-700 hover:bg-accent-100 inline-flex items-center justify-center transition-colors"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-primary-200 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs sm:text-sm text-primary-600 m-0">
              © {new Date().getFullYear()} Booklet. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/policy" className="text-xs sm:text-sm text-primary-600 hover:text-accent-700 no-underline">
                Privacy
              </Link>
              <Link to="/about" className="text-xs sm:text-sm text-primary-600 hover:text-accent-700 no-underline">
                About
              </Link>
              <Link to="/contact" className="text-xs sm:text-sm text-primary-600 hover:text-accent-700 no-underline">
                Contact
              </Link>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="h-8 px-2.5 rounded-md border border-primary-200 bg-white text-primary-700 hover:bg-primary-50 text-xs font-medium inline-flex items-center gap-1"
              >
                <FiArrowUp className="h-3.5 w-3.5" />
                Top
              </button>
            </div>
          </div>
        </section>
      </div>
    </footer>
  );
};

export default Footer;
