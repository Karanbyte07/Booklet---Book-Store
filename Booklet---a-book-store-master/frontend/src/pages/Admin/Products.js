import React, { useMemo, useState, useEffect } from "react";
import AdminMenu from "../../components/Layout/AdminMenu";
import Layout from "./../../components/Layout/Layout";
import axios from "../../config/axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../../utils/errorUtils";
import {
  FiArrowUpRight,
  FiBox,
  FiFilter,
  FiLayers,
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiSliders,
  FiX,
} from "react-icons/fi";

const FALLBACK_IMAGE = "https://placehold.co/600x400/f5f0e8/826b4d?text=No+Image";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const getAllProducts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/v1/product/get-product");
      setProducts(data?.products || []);
    } catch (error) {
      console.log(error);
      toast.error(getApiErrorMessage(error, "Unable to load products"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllProducts();
  }, []);

  const categoryOptions = useMemo(() => {
    const map = new Map();
    products.forEach((product) => {
      if (product?.category?._id && product?.category?.name) {
        map.set(product.category._id, product.category.name);
      }
    });

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const matchesSearch =
        !query ||
        product?.name?.toLowerCase().includes(query) ||
        product?.description?.toLowerCase().includes(query) ||
        product?.slug?.toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "all" || product?.category?._id === categoryFilter;

      return matchesSearch && matchesCategory;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "name-asc") return (a?.name || "").localeCompare(b?.name || "");
      if (sortBy === "name-desc") return (b?.name || "").localeCompare(a?.name || "");
      if (sortBy === "price-low") return (a?.price || 0) - (b?.price || 0);
      if (sortBy === "price-high") return (b?.price || 0) - (a?.price || 0);
      return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
    });

    return sorted;
  }, [products, searchText, categoryFilter, sortBy]);

  const totalProducts = products.length;
  const filteredCount = filteredProducts.length;
  const totalCategories = categoryOptions.length;

  const resetFilters = () => {
    setSearchText("");
    setCategoryFilter("all");
    setSortBy("newest");
  };

  return (
    <Layout title={"Admin - Products"}>
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6 lg:h-[calc(100vh-4rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-5 lg:gap-6 items-start lg:h-full">
          <div>
            <AdminMenu />
          </div>

          <div className="min-w-0 lg:h-full lg:overflow-y-auto lg:pr-1 space-y-5">
            {/* Header */}
            <div className="rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-50 via-white to-accent-50 px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-white text-accent-700 flex items-center justify-center border border-accent-200 shadow-sm">
                    <FiShoppingBag className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-primary-900">All Products</h1>
                    <p className="text-sm text-primary-600">
                      Manage catalog with quick filters, sorting, and previews.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={getAllProducts}
                  className="h-10 px-4 rounded-lg border border-primary-200 bg-white hover:bg-primary-50 text-primary-700 text-sm font-semibold inline-flex items-center gap-2"
                >
                  <FiRefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-primary-200 bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-primary-500 font-semibold">Total Products</div>
                <div className="mt-2 text-2xl font-bold text-primary-900 inline-flex items-center gap-2">
                  <FiPackage className="h-5 w-5 text-accent-600" />
                  {totalProducts}
                </div>
              </div>

              <div className="rounded-xl border border-primary-200 bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-primary-500 font-semibold">Visible Results</div>
                <div className="mt-2 text-2xl font-bold text-primary-900 inline-flex items-center gap-2">
                  <FiFilter className="h-5 w-5 text-accent-600" />
                  {filteredCount}
                </div>
              </div>

              <div className="rounded-xl border border-primary-200 bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-primary-500 font-semibold">Categories</div>
                <div className="mt-2 text-2xl font-bold text-primary-900 inline-flex items-center gap-2">
                  <FiLayers className="h-5 w-5 text-accent-600" />
                  {totalCategories}
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="rounded-2xl border border-primary-200 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <FiSliders className="h-4 w-4 text-accent-600" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-600">Filter Products</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-5 relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-400" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search by name, description or slug"
                    className="w-full h-10 rounded-lg border border-primary-200 pl-10 pr-3 text-sm text-primary-900 focus:outline-none focus:ring-2 focus:ring-accent-300"
                  />
                </div>

                <div className="md:col-span-3">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm text-primary-900 bg-white focus:outline-none focus:ring-2 focus:ring-accent-300"
                  >
                    <option value="all">All Categories</option>
                    {categoryOptions.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm text-primary-900 bg-white focus:outline-none focus:ring-2 focus:ring-accent-300"
                  >
                    <option value="newest">Sort: Newest</option>
                    <option value="name-asc">Name: A to Z</option>
                    <option value="name-desc">Name: Z to A</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>

                <div className="md:col-span-1">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="w-full h-10 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-semibold inline-flex items-center justify-center gap-1"
                    title="Clear filters"
                  >
                    <FiX className="h-4 w-4" />
                    <span className="hidden lg:inline">Clear</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            {loading ? (
              <div className="responsive-card-grid">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="h-[280px] rounded-xl border border-primary-200 bg-white p-3 animate-pulse" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-2xl border border-primary-200 bg-white py-14 text-center">
                <div className="h-14 w-14 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mx-auto mb-3">
                  <FiBox className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-primary-900">No products found</h3>
                <p className="text-sm text-primary-600 mt-1">
                  Try changing search, category, or sort filters.
                </p>
              </div>
            ) : (
              <div className="responsive-card-grid">
                {filteredProducts.map((p) => (
                  <Link
                    key={p._id}
                    to={`/dashboard/admin/product/${p.slug}`}
                    className="group no-underline"
                  >
                    <div className="h-full bg-white rounded-2xl border border-primary-200 hover:border-accent-300 hover:shadow-lg transition-all overflow-hidden">
                      <div className="relative h-48 overflow-hidden bg-primary-50">
                        <img
                          src={p.imageUrl || p.imageUrls?.[0] || FALLBACK_IMAGE}
                          className="h-full w-full object-contain p-3 transition-transform duration-300"
                          alt={p.name}
                        />
                        <div className="absolute left-3 top-3 rounded-full bg-white/95 border border-primary-200 px-2.5 py-1 text-[11px] font-semibold text-primary-700">
                          {p?.category?.name || "Uncategorized"}
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h5 className="text-base font-semibold text-primary-900 line-clamp-1">{p.name}</h5>
                          <span className="text-sm font-bold text-accent-700 whitespace-nowrap">
                            ₹{Number(p.price || 0).toLocaleString("en-IN")}
                          </span>
                        </div>

                        <p className="text-sm text-primary-600 line-clamp-2 min-h-[2.5rem]">{p.description}</p>

                        <div className="mt-4 pt-3 border-t border-primary-100 flex items-center justify-between">
                          <span className="text-xs text-primary-500">Qty: {p.quantity}</span>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-700 group-hover:translate-x-0.5 transition-transform">
                            Edit
                            <FiArrowUpRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Products;
