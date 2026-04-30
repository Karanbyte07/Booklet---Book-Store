import React, { useMemo, useState } from "react";
import Layout from "./../components/Layout/Layout";
import toast from "react-hot-toast";
import {
  FiClock,
  FiFacebook,
  FiHeadphones,
  FiInstagram,
  FiLinkedin,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSend,
  FiTwitter,
} from "react-icons/fi";
import useSiteSettings from "../hooks/useSiteSettings";

const faqs = [
  {
    question: "How do I track my order?",
    answer:
      "You will receive a tracking link by email. You can also check order status in your dashboard.",
  },
  {
    question: "What is the return window?",
    answer:
      "Most items are eligible for return within 30 days in original condition.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "Yes, we ship to multiple countries with shipping options shown at checkout.",
  },
  {
    question: "How fast do refunds process?",
    answer:
      "Approved refunds are typically processed within 7 to 10 business days.",
  },
];

const Contact = () => {
  const { support } = useSiteSettings();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error("Please fill all fields");
      return;
    }
    toast.success("Message sent successfully! We'll get back to you soon.");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const contactCards = useMemo(
    () => [
      {
        title: "Email Support",
        subtitle: support?.responseTime || "Response within 24 hours",
        primary: support?.primaryEmail || "",
        secondary: support?.secondaryEmail || "",
        icon: FiMail,
      },
      {
        title: "Phone Support",
        subtitle: support?.phoneAvailability || "Available all week",
        primary: support?.primaryPhone || "",
        secondary: support?.secondaryPhone || "",
        icon: FiPhone,
      },
      {
        title: "Office",
        subtitle: "Headquarters",
        primary: support?.officeName || "",
        secondary: support?.address || "",
        icon: FiMapPin,
      },
    ],
    [
      support?.address,
      support?.officeName,
      support?.phoneAvailability,
      support?.primaryEmail,
      support?.primaryPhone,
      support?.responseTime,
      support?.secondaryEmail,
      support?.secondaryPhone,
    ]
  );

  const socialLinks = useMemo(
    () =>
      [
        { label: "Facebook", icon: FiFacebook, href: support?.socialLinks?.facebook },
        { label: "Twitter", icon: FiTwitter, href: support?.socialLinks?.twitter },
        { label: "Instagram", icon: FiInstagram, href: support?.socialLinks?.instagram },
        { label: "LinkedIn", icon: FiLinkedin, href: support?.socialLinks?.linkedin },
      ].filter((social) => Boolean(social.href)),
    [
      support?.socialLinks?.facebook,
      support?.socialLinks?.instagram,
      support?.socialLinks?.linkedin,
      support?.socialLinks?.twitter,
    ]
  );

  return (
    <Layout title={"Contact Us - Booklet"}>
      <div className="relative pt-24 pb-14 min-h-screen overflow-hidden bg-gradient-to-b from-[#fff8ef] via-white to-[#fff7ef]">
        <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-primary-100/70 blur-3xl" />
        <div className="absolute top-1/3 -right-12 h-72 w-72 rounded-full bg-accent-100/70 blur-3xl" />

        <section className="bg-gradient-to-r from-primary-900 via-primary-800 to-accent-700 text-white">
          <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-10 sm:py-12">
            <h1 className="text-3xl sm:text-4xl font-bold">
              {support?.contactHeroTitle || "Contact Booklet"}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-primary-100 max-w-2xl">
              {support?.contactHeroDescription ||
                "Questions about orders, payments, or recommendations? Reach out and our support team will help quickly."}
            </p>
          </div>
        </section>

        <div className="relative w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8 sm:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4">
              {contactCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article
                    key={card.title}
                    className="pb-4 border-b border-primary-200/80"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-white/70 text-accent-700 inline-flex items-center justify-center shrink-0 ring-1 ring-white/80">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-semibold text-primary-900 m-0">
                          {card.title}
                        </h2>
                        <p className="mt-1 text-xs sm:text-sm text-primary-500 m-0">
                          {card.subtitle}
                        </p>
                      </div>
                    </div>
                    {card.primary && (
                      <p className="mt-3 text-sm font-medium text-primary-800 m-0">
                        {card.primary}
                      </p>
                    )}
                    {card.secondary && (
                      <p className="mt-1 text-sm text-primary-600 m-0">{card.secondary}</p>
                    )}
                  </article>
                );
              })}

              <article className="mt-2 rounded-[1.3rem] bg-gradient-to-r from-white/58 via-primary-50/45 to-accent-50/56 p-4 sm:p-5 ring-1 ring-white/75 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <FiHeadphones className="h-4.5 w-4.5 text-accent-700" />
                  <h2 className="text-base sm:text-lg font-semibold text-primary-900 m-0">
                    Social Support
                  </h2>
                </div>
                <p className="text-sm text-primary-600 leading-relaxed">
                  For updates and quick responses, connect with us on social channels.
                </p>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {socialLinks.map((social) => {
                    const Icon = social.icon;
                    return (
                      <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={social.label}
                        className="h-10 w-10 rounded-full bg-white/75 text-accent-700 hover:bg-white inline-flex items-center justify-center transition-colors"
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </a>
                    );
                  })}
                </div>
              </article>
            </div>

            <div className="lg:col-span-7">
              <article className="pb-6 border-b border-primary-200/80">
                <h2 className="text-xl sm:text-2xl font-semibold text-primary-900">
                  Send us a message
                </h2>
                <p className="mt-1.5 text-sm text-primary-600">
                  Share your request and we will get back to you as soon as possible.
                </p>

                <form onSubmit={handleSubmit} className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm font-medium text-primary-800">Name</span>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      className="mt-1.5 w-full h-11 border-b border-primary-300 bg-transparent px-0 text-sm text-primary-900 focus:outline-none focus:border-accent-500"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-primary-800">Email</span>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="mt-1.5 w-full h-11 border-b border-primary-300 bg-transparent px-0 text-sm text-primary-900 focus:outline-none focus:border-accent-500"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="text-sm font-medium text-primary-800">Subject</span>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="How can we help?"
                      className="mt-1.5 w-full h-11 border-b border-primary-300 bg-transparent px-0 text-sm text-primary-900 focus:outline-none focus:border-accent-500"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="text-sm font-medium text-primary-800">Message</span>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows="6"
                      placeholder="Tell us more..."
                      className="mt-1.5 w-full border-b border-primary-300 bg-transparent px-0 py-2 text-sm text-primary-900 focus:outline-none focus:border-accent-500 resize-y"
                    />
                  </label>

                  <button
                    type="submit"
                    className="sm:col-span-2 h-11 rounded-full bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
                  >
                    <FiSend className="h-4 w-4" />
                    Send Message
                  </button>
                </form>
              </article>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <article className="py-3 border-b border-primary-200/80">
                  <div className="flex items-center gap-2 mb-2">
                    <FiClock className="h-4.5 w-4.5 text-accent-700" />
                    <h3 className="text-base font-semibold text-primary-900 m-0">Business Hours</h3>
                  </div>
                  <p className="text-sm text-primary-600 m-0">
                    {support?.businessHours?.weekdays}
                  </p>
                  <p className="text-sm text-primary-600 m-0">
                    {support?.businessHours?.saturday}
                  </p>
                  <p className="text-sm text-primary-600 m-0">
                    {support?.businessHours?.sunday}
                  </p>
                </article>
                <article className="py-3 border-b border-primary-200/80">
                  <div className="flex items-center gap-2 mb-2">
                    <FiHeadphones className="h-4.5 w-4.5 text-accent-700" />
                    <h3 className="text-base font-semibold text-primary-900 m-0">Quick Help</h3>
                  </div>
                  <p className="text-sm text-primary-600 m-0">
                    {support?.quickHelpText}
                  </p>
                </article>
              </div>
            </div>
          </div>

          <section className="mt-8 pt-1">
            <h2 className="text-xl sm:text-2xl font-semibold text-primary-900">
              Frequently Asked Questions
            </h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {faqs.map((faq) => (
                <article
                  key={faq.question}
                  className="py-3 border-b border-primary-200/80"
                >
                  <h3 className="text-sm sm:text-base font-semibold text-primary-900 m-0">
                    {faq.question}
                  </h3>
                  <p className="mt-1.5 text-sm text-primary-600 leading-relaxed m-0">
                    {faq.answer}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
