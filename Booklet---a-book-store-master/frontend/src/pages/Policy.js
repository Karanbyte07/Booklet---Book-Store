import React from "react";
import Layout from "./../components/Layout/Layout";

const policySections = [
  {
    title: "Information We Collect",
    points: [
      "Account details such as your name, email address, phone number, and login credentials.",
      "Order-related data including shipping address, items purchased, and transaction references.",
      "Basic device and usage analytics to improve site speed, search quality, and product discovery.",
    ],
  },
  {
    title: "How We Use Your Data",
    points: [
      "To process orders, confirm payments, and deliver updates about shipments and returns.",
      "To provide customer support for account, order, and delivery issues.",
      "To improve catalog quality, recommendations, and platform reliability.",
    ],
  },
  {
    title: "Data Sharing & Security",
    points: [
      "We share only required data with shipping partners, payment processors, and legal authorities when required.",
      "Payment credentials are processed by trusted gateways and are not stored on Booklet servers.",
      "Access controls, encryption practices, and monitoring are used to protect customer data.",
    ],
  },
  {
    title: "Your Rights",
    points: [
      "You can review, update, or correct personal details from your profile.",
      "You can request account deletion and removal of non-essential stored data.",
      "You can unsubscribe from promotional communication at any time.",
    ],
  },
  {
    title: "Policy Updates",
    points: [
      "This policy may be updated to reflect legal or operational changes.",
      "Material updates will be reflected here with a revised effective date.",
      "Continued use of the platform after updates indicates acceptance of the revised policy.",
    ],
  },
];

const Policy = () => {
  return (
    <Layout title="Privacy Policy">
      <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-primary-50 via-white to-primary-50">
        <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-accent-200/25 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-primary-300/20 blur-3xl" />

        <div className="relative w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8 sm:py-10 lg:py-12">
          <div className="max-w-6xl">
            <p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-accent-700 font-semibold">
              Booklet Policies
            </p>
            <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-primary-900">
              Privacy Policy
            </h1>
            <p className="mt-3 max-w-3xl text-sm sm:text-base text-primary-700 leading-relaxed">
              Your privacy matters to us. This page explains what we collect, why we
              collect it, how it is protected, and the choices you have for your
              personal data.
            </p>
            <p className="mt-2 text-xs sm:text-sm text-primary-500">
              Effective date: February 27, 2026
            </p>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-8 lg:gap-12">
              <aside className="lg:sticky lg:top-24 h-fit">
                <p className="text-xs uppercase tracking-[0.16em] text-primary-500 font-semibold">
                  At a glance
                </p>
                <ul className="mt-3 space-y-2 text-sm text-primary-700 m-0 p-0 list-none">
                  {policySections.map((section) => (
                    <li key={section.title} className="leading-relaxed">
                      {section.title}
                    </li>
                  ))}
                  <li className="leading-relaxed">Contact & Requests</li>
                </ul>
              </aside>

              <article className="space-y-8">
                {policySections.map((section) => (
                  <section
                    key={section.title}
                    className="pb-6 border-b border-primary-200/70 last:border-b-0"
                  >
                    <h2 className="text-xl sm:text-2xl font-bold text-primary-900">
                      {section.title}
                    </h2>
                    <ul className="mt-3 space-y-2.5 text-sm sm:text-base text-primary-700 leading-relaxed m-0 pl-5 list-disc marker:text-accent-600">
                      {section.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </section>
                ))}

                <section className="pt-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-primary-900">
                    Contact & Requests
                  </h2>
                  <p className="mt-3 text-sm sm:text-base text-primary-700 leading-relaxed">
                    For privacy-related requests such as data correction, deletion, or
                    account support, contact us at{" "}
                    <a
                      href="mailto:support@booklet.com"
                      className="text-accent-700 hover:text-accent-800 font-semibold no-underline"
                    >
                      support@booklet.com
                    </a>{" "}
                    or use the Contact page. We respond as quickly as possible based on
                    request type and verification requirements.
                  </p>
                </section>
              </article>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Policy;
