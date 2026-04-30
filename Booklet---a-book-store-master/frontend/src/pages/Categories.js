import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useCategory from "../hooks/useCategory";
import Layout from "../components/Layout/Layout";
import {
  FiArrowRight,
  FiAward,
  FiBook,
  FiBriefcase,
  FiCode,
  FiGrid,
  FiSearch,
  FiTrendingUp,
  FiUser,
  FiX,
} from "react-icons/fi";

const Categories = () => {
  const categories = useCategory();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const getCategoryIcon = (categoryName) => {
    const iconMap = {
      "Fiction": <FiBook className="w-6 h-6" />,
      "Non-Fiction": <FiAward className="w-6 h-6" />,
      "Science & Technology": <FiCode className="w-6 h-6" />,
      "Business & Economics": <FiBriefcase className="w-6 h-6" />,
      "Self-Help & Motivation": <FiTrendingUp className="w-6 h-6" />,
      "Mystery & Thriller": <FiSearch className="w-6 h-6" />,
      "Biography & Memoir": <FiUser className="w-6 h-6" />,
      "General": <FiBook className="w-6 h-6" />
    };
    return iconMap[categoryName] || <FiBook className="w-6 h-6" />;
  };

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((c) => c?.name?.toLowerCase().includes(query));
  }, [categories, search]);

  return (
    <Layout title={"All Categories - Booklet"}>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-50 border-b border-primary-100">
        <div className="absolute -top-16 -left-20 h-72 w-72 rounded-full bg-primary-100/70 blur-3xl" />
        <div className="absolute -bottom-20 -right-16 h-72 w-72 rounded-full bg-accent-100/70 blur-3xl" />

        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-12 md:py-16 relative z-10">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent-200 bg-accent-50 px-3 py-1.5 text-xs font-semibold text-accent-700">
              <FiGrid className="h-3.5 w-3.5" />
              Browse Categories
            </span>

            <h1 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight text-primary-900">
              Explore books by
              <span className="block text-accent-600">genre & interest</span>
            </h1>

            <p className="mt-3 text-base md:text-lg text-primary-700">
              Discover curated sections and jump straight to the stories you love.
            </p>

            <div className="mt-6 rounded-xl border border-primary-200 bg-white p-2 shadow-sm flex items-center gap-2">
              <div className="relative flex-1">
                <FiSearch className="h-4 w-4 text-primary-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search categories..."
                  className="w-full h-10 rounded-lg border border-transparent bg-transparent pl-10 pr-3 text-sm text-primary-900 focus:outline-none"
                />
              </div>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="h-9 px-3 rounded-lg border border-primary-200 bg-primary-50 hover:bg-primary-100 text-primary-700 text-sm font-medium inline-flex items-center gap-1"
                >
                  <FiX className="h-3.5 w-3.5" />
                  Clear
                </button>
              )}
            </div>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white px-3 py-1.5 text-xs text-primary-700">
              <span className="font-semibold text-primary-900">{filteredCategories.length}</span>
              {search ? "matching categories" : "total categories"}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="min-h-screen bg-primary-50/40">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-10 md:py-12">
          {categories.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-primary-200 shadow-sm">
              <FiBook className="mx-auto w-16 h-16 text-primary-300 mb-4" />
              <h3 className="text-2xl font-bold text-primary-900 mb-2">No categories found</h3>
              <p className="text-primary-600 mb-6">
                Categories will appear here once they are added.
              </p>
              <button
                onClick={() => navigate("/")}
                className="h-11 px-6 rounded-lg border border-accent-200 bg-accent-50 hover:bg-accent-100 text-accent-700 font-semibold"
              >
                Back to Home
              </button>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-primary-200 shadow-sm">
              <FiSearch className="mx-auto w-14 h-14 text-primary-300 mb-4" />
              <h3 className="text-xl font-bold text-primary-900 mb-2">No matching categories</h3>
              <p className="text-primary-600 mb-6">
                Try a different keyword or clear your search.
              </p>
              <button
                onClick={() => setSearch("")}
                className="h-11 px-6 rounded-lg border border-primary-200 bg-primary-100 hover:bg-primary-200 text-primary-800 font-semibold"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="responsive-card-grid">
              {filteredCategories.map((c) => (
                <Link
                  key={c._id}
                  to={`/category/${c.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-primary-200 bg-white p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-accent-100/60 blur-xl group-hover:bg-accent-200/70 transition-colors" />

                  <div className="relative z-10 flex h-full flex-col">
                    <div className="h-12 w-12 rounded-xl border border-accent-200 bg-accent-50 text-accent-700 inline-flex items-center justify-center group-hover:scale-105 transition-transform">
                      {getCategoryIcon(c.name)}
                    </div>

                    <h3 className="mt-4 text-base md:text-lg font-semibold text-primary-900 line-clamp-2 group-hover:text-accent-700 transition-colors">
                      {c.name}
                    </h3>

                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-accent-700">
                      View books
                      <FiArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-br from-accent-50 via-white to-primary-50 py-12 md:py-16 border-t border-primary-100">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="bg-white rounded-2xl border border-primary-200 p-7 md:p-10 text-center shadow-sm">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-3">
              Looking for something specific?
            </h2>
            <p className="text-primary-600 mb-7 text-base md:text-lg max-w-2xl mx-auto">
              Go back to the home page and use filters to find your perfect read.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-accent-500 hover:bg-accent-600 text-white font-semibold"
              >
                Browse All Books
                <FiArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="inline-flex items-center gap-2 h-11 px-6 rounded-lg border border-primary-200 bg-white hover:bg-primary-50 text-primary-700 font-semibold"
              >
                Back to Top
              </button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Categories;
