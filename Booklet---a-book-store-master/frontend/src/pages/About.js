import React from "react";
import Layout from "./../components/Layout/Layout";
import {
  FiAward,
  FiBook,
  FiCheck,
  FiGlobe,
  FiHeart,
  FiTarget,
  FiTrendingUp,
  FiUsers,
  FiZap,
} from "react-icons/fi";

const highlights = [
  { value: "50K+", label: "Books curated for readers" },
  { value: "100K+", label: "Happy readers served" },
  { value: "150+", label: "Regions shipped globally" },
  { value: "4.9/5", label: "Average reader rating" },
];

const pillars = [
  {
    title: "Our Mission",
    description:
      "Help every reader discover meaningful books with fair pricing, smooth delivery, and trusted service.",
    icon: FiTarget,
  },
  {
    title: "Our Vision",
    description:
      "Build the most loved book platform where discovery, quality, and community feel effortless.",
    icon: FiGlobe,
  },
  {
    title: "Our Values",
    description:
      "Reader-first decisions, authentic catalog quality, and long-term relationships built with care.",
    icon: FiHeart,
  },
];

const reasons = [
  {
    title: "Curated Catalog",
    text: "A broad range of genres, from bestsellers to hidden gems.",
    icon: FiBook,
  },
  {
    title: "Fair Pricing",
    text: "Consistent value with frequent deals and member-only offers.",
    icon: FiTrendingUp,
  },
  {
    title: "Trusted Experience",
    text: "Secure checkout, reliable delivery timelines, and clear updates.",
    icon: FiAward,
  },
  {
    title: "Reader Community",
    text: "Insights and recommendations shaped by real reading habits.",
    icon: FiUsers,
  },
  {
    title: "Fast Support",
    text: "Quick help from a support team that understands readers.",
    icon: FiZap,
  },
  {
    title: "Quality Promise",
    text: "Book condition standards and service quality stay consistent.",
    icon: FiCheck,
  },
];

const journey = [
  {
    year: "2020",
    title: "Booklet launched",
    text: "Started with a small team and a focused mission to simplify online book buying.",
    icon: FiBook,
  },
  {
    year: "2021",
    title: "10K readers reached",
    text: "Expanded our catalog and improved recommendations for faster discovery.",
    icon: FiTrendingUp,
  },
  {
    year: "2022",
    title: "Industry recognition",
    text: "Recognized for service quality and customer satisfaction across core regions.",
    icon: FiAward,
  },
  {
    year: "2023",
    title: "100K readers milestone",
    text: "Scaled operations and strengthened delivery reliability worldwide.",
    icon: FiUsers,
  },
  {
    year: "2024+",
    title: "Building what readers need next",
    text: "Continuing to improve discovery, personalization, and customer support.",
    icon: FiZap,
  },
];

const About = () => {
  return (
    <Layout title={"About Us - Booklet"}>
      <div className="relative pt-24 pb-14 min-h-screen overflow-hidden bg-gradient-to-b from-[#fff8ef] via-white to-[#fff7ef]">
        <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-primary-100/70 blur-3xl" />
        <div className="absolute top-1/3 -right-12 h-72 w-72 rounded-full bg-accent-100/75 blur-3xl" />

        <div className="relative w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-10 items-start pb-8 border-b border-primary-200/80">
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-white/65 text-accent-700 text-xs font-semibold ring-1 ring-white/80 backdrop-blur-md">
                <FiBook className="h-3.5 w-3.5" />
                About Booklet
              </span>
              <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-primary-900 leading-tight">
                Built for readers who want great books without the noise
              </h1>
              <p className="mt-3 text-base sm:text-lg text-primary-700 leading-relaxed">
                Booklet connects readers with meaningful titles across genres through a
                clean shopping experience, transparent pricing, and dependable service.
              </p>
              <p className="mt-3 text-sm sm:text-base text-primary-600 leading-relaxed">
                Since 2020, we have focused on one thing: helping people discover books
                they actually want to read, with smooth ordering and consistent support.
              </p>
            </div>

            <div className="lg:col-span-5">
              <h2 className="text-xl sm:text-2xl font-semibold text-primary-900">Our Promise</h2>
              <p className="mt-2 text-sm sm:text-base text-primary-700 leading-relaxed">
                Curated catalog quality, fair pricing, and dependable support for every
                order.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-4">
                {highlights.map((item) => (
                  <div
                    key={item.label}
                    className="pb-3 border-b border-primary-200/80"
                  >
                    <p className="text-xl sm:text-2xl font-bold text-accent-700 m-0">
                      {item.value}
                    </p>
                    <p className="mt-1 text-xs sm:text-sm text-primary-600 m-0 leading-snug">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 pb-8 border-b border-primary-200/80">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <article key={pillar.title} className="min-w-0">
                  <div className="h-10 w-10 rounded-full bg-white/75 text-accent-700 inline-flex items-center justify-center ring-1 ring-white/80 backdrop-blur-sm">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-primary-900">{pillar.title}</h3>
                  <p className="mt-2 text-sm text-primary-600 leading-relaxed">
                    {pillar.description}
                  </p>
                </article>
              );
            })}
          </section>

          <section className="mt-10 pb-8 border-b border-primary-200/80">
            <div className="mb-4 sm:mb-5">
              <h2 className="text-2xl sm:text-3xl font-bold text-primary-900">
                Why readers choose Booklet
              </h2>
              <p className="mt-1.5 text-sm sm:text-base text-primary-600">
                A modern bookstore experience with reliable fundamentals.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reasons.map((reason) => {
                const Icon = reason.icon;
                return (
                  <article
                    key={reason.title}
                    className="py-3 border-b border-primary-200/70"
                  >
                    <div className="inline-flex items-center gap-2 text-accent-700">
                      <Icon className="h-4.5 w-4.5" />
                      <h3 className="text-base font-semibold text-primary-900 m-0">
                        {reason.title}
                      </h3>
                    </div>
                    <p className="mt-2 text-sm text-primary-600 leading-relaxed m-0">
                      {reason.text}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary-900">Our Journey</h2>
            <div className="mt-6 space-y-1">
              {journey.map((step) => {
                const Icon = step.icon;
                return (
                  <article key={step.title} className="relative pl-5 py-4 border-l-2 border-primary-200/80">
                    <span className="absolute -left-[7px] top-8 h-3 w-3 rounded-full bg-accent-500" />
                    <div className="flex gap-3">
                      <div className="h-9 w-9 rounded-full bg-white/75 text-accent-700 shrink-0 inline-flex items-center justify-center ring-1 ring-white/80">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-accent-700 mb-1">
                          {step.year}
                        </p>
                        <h3 className="text-base sm:text-lg font-semibold text-primary-900 m-0">
                          {step.title}
                        </h3>
                        <p className="mt-1.5 text-sm text-primary-600 leading-relaxed m-0">
                          {step.text}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default About;
