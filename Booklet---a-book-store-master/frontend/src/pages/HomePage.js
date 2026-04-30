import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/cart";
import { useWishlist } from "../context/wishlist";
import { useLocationContext } from "../context/location";
import { useConfirm } from "../context/confirm";
import axios from "../config/axios";
import toast from "react-hot-toast";
import Layout from "./../components/Layout/Layout";
import {
  FiBook,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiFilter,
  FiHeart,
  FiMapPin,
  FiSearch,
  FiShoppingCart,
  FiSliders,
  FiStar,
  FiTrendingUp,
  FiX,
} from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { isProductAvailableInLocation } from "../utils/locationUtils";
import "../styles/Homepage.css";

const DEFAULT_PRICE = [0, 999999];
const SORT_OPTIONS = [
  { value: "newest", label: "Sort: Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
];
const ITEMS_PER_PAGE = 12;

const HomePage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useCart();
  const [wishlist, setWishlist] = useWishlist();
  const { selectedLocation, selectedLocationLabel } = useLocationContext();
  const confirm = useConfirm();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [heroBookIndex, setHeroBookIndex] = useState(0);
  const [pauseHeroAutoSlide, setPauseHeroAutoSlide] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState(DEFAULT_PRICE);
  const [selectedRating, setSelectedRating] = useState(0);
  const [sortBy, setSortBy] = useState("newest");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  const observerTarget = useRef(null);
  const sortMenuRef = useRef(null);

  const getProductCategoryId = (product) => {
    if (typeof product?.category === "string") return product.category;
    return product?.category?._id || "";
  };

  const getProductCategoryName = (product) => {
    if (typeof product?.category === "object" && product?.category?.name) {
      return product.category.name;
    }
    return "Uncategorized";
  };

  const getProductRating = (product) => {
    const rating = Number(product?.rating || 0);
    return Number.isFinite(rating) ? rating : 0;
  };

  const getProductReviewCount = (product) => {
    const count = Number(product?.numReviews || 0);
    return Number.isFinite(count) ? count : 0;
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count += 1;
    if (selectedCategories.length > 0) count += selectedCategories.length;
    if (
      selectedPrice[0] !== DEFAULT_PRICE[0] ||
      selectedPrice[1] !== DEFAULT_PRICE[1]
    ) {
      count += 1;
    }
    if (selectedRating > 0) count += 1;
    return count;
  }, [searchQuery, selectedCategories, selectedPrice, selectedRating]);

  const featuredProducts = useMemo(() => products.slice(0, 4), [products]);
  const rotatedHeroBooks = useMemo(() => {
    const total = featuredProducts.length;
    if (!total) return [];

    return Array.from({ length: total }, (_, index) => {
      return featuredProducts[(heroBookIndex + index) % total];
    });
  }, [featuredProducts, heroBookIndex]);
  const heroPrimaryBook = rotatedHeroBooks[0];
  const heroPreviousBook =
    rotatedHeroBooks.length > 1 ? rotatedHeroBooks[rotatedHeroBooks.length - 1] : null;
  const heroNextBook = rotatedHeroBooks.length > 1 ? rotatedHeroBooks[1] : null;

  const getAllCategory = async () => {
    try {
      const { data } = await axios.get("/api/v1/category/get-category");
      if (data?.success) {
        setCategories(data?.category || []);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getAllProducts = async (locationKey = "") => {
    try {
      const query = locationKey
        ? `?location=${encodeURIComponent(locationKey)}`
        : "";
      const { data } = await axios.get(`/api/v1/product/get-product${query}`);
      const allProducts = data?.products || [];
      setProducts(allProducts);
      setCurrentPage(1);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getAllCategory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    getAllProducts(selectedLocation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation]);

  useEffect(() => {
    if (!featuredProducts.length) {
      setHeroBookIndex(0);
      return;
    }

    setHeroBookIndex((prevIndex) => prevIndex % featuredProducts.length);
  }, [featuredProducts.length]);

  useEffect(() => {
    if (pauseHeroAutoSlide || featuredProducts.length < 2) return undefined;

    const heroSlideTimer = setInterval(() => {
      setHeroBookIndex((prevIndex) => (prevIndex + 1) % featuredProducts.length);
    }, 5000);

    return () => clearInterval(heroSlideTimer);
  }, [featuredProducts.length, pauseHeroAutoSlide]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 220);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const filteredProducts = useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const categoryId = getProductCategoryId(product);
      const rating = getProductRating(product);

      const matchesSearch =
        !query ||
        product?.name?.toLowerCase().includes(query) ||
        product?.description?.toLowerCase().includes(query) ||
        getProductCategoryName(product).toLowerCase().includes(query);

      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(categoryId);
      const matchesPrice =
        product?.price >= selectedPrice[0] && product?.price <= selectedPrice[1];
      const matchesRating = selectedRating === 0 || rating >= selectedRating;

      return matchesSearch && matchesCategory && matchesPrice && matchesRating;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "price-low") return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === "price-high") return Number(b.price || 0) - Number(a.price || 0);
      if (sortBy === "name-asc") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "name-desc") return (b.name || "").localeCompare(a.name || "");
      return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
    });
  }, [
    products,
    debouncedSearchQuery,
    selectedCategories,
    selectedPrice,
    selectedRating,
    sortBy,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, selectedCategories, selectedPrice, selectedRating, sortBy]);

  useEffect(() => {
    setIsFiltering(true);
    const filterAnimationTimer = setTimeout(() => {
      setIsFiltering(false);
    }, 420);

    return () => clearTimeout(filterAnimationTimer);
  }, [debouncedSearchQuery, selectedCategories, selectedPrice, selectedRating, sortBy]);

  const displayProducts = useMemo(() => {
    return filteredProducts.slice(0, currentPage * ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const hasMore = displayProducts.length < filteredProducts.length;

  const loadMore = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setCurrentPage((prevPage) => prevPage + 1);
      setLoading(false);
    }, 350);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const target = observerTarget.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, loading, loadMore]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedPrice(DEFAULT_PRICE);
    setSelectedRating(0);
    setSortBy("newest");
  };

  const toggleWishlist = async (product) => {
    const existingItem = wishlist.find((item) => item._id === product._id);
    if (existingItem) {
      const shouldRemove = await confirm({
        title: "Remove from wishlist?",
        message: `Remove "${product?.name || "this product"}" from your wishlist?`,
        confirmText: "Remove",
        cancelText: "Keep",
        tone: "danger",
      });
      if (!shouldRemove) return;

      setWishlist(wishlist.filter((item) => item._id !== product._id));
      toast.success("Removed from wishlist");
    } else {
      setWishlist([...wishlist, product]);
      toast.success("Added to wishlist");
    }
  };

  const addToCart = (product) => {
    if (!isProductAvailableInLocation(product, selectedLocation)) {
      toast.error(`Not available in ${selectedLocationLabel}`);
      return;
    }

    setCart([...cart, product]);
    localStorage.setItem("cart", JSON.stringify([...cart, product]));
    toast.success("Item added to cart");
  };

  const selectedCategoryMap = useMemo(() => {
    return new Map((categories || []).map((cat) => [cat._id, cat.name]));
  }, [categories]);

  const selectedPriceLabel = useMemo(() => {
    if (
      selectedPrice[0] === DEFAULT_PRICE[0] &&
      selectedPrice[1] === DEFAULT_PRICE[1]
    ) {
      return "";
    }
    const maxDisplay = selectedPrice[1] >= 999999 ? '1000+' : selectedPrice[1];
    return `₹${selectedPrice[0]} - ₹${maxDisplay}`;
  }, [selectedPrice]);

  const selectedSortLabel = useMemo(() => {
    return SORT_OPTIONS.find((option) => option.value === sortBy)?.label || "Sort: Newest";
  }, [sortBy]);

  useEffect(() => {
    if (!sortMenuOpen) return;

    const handleOutsideClick = (event) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setSortMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [sortMenuOpen]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [sidebarOpen]);

  const renderFilterPanel = (mobile = false) => {
    const chipClass = (isActive) =>
      `h-8 px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
        isActive
          ? "bg-accent-100 text-accent-700"
          : "bg-primary-100 text-primary-700 hover:bg-primary-200"
      }`;

    return (
      <div className={`space-y-5 ${mobile ? "px-5 py-4" : "px-1 py-3"}`}>
        {activeFiltersCount > 0 && (
          <div className="pb-4 border-b border-primary-200/80">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent-700 m-0">
                Active Filters
              </p>
              <span className="text-[11px] text-primary-500">
                {activeFiltersCount} applied
              </span>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className={chipClass(true)}
                >
                  Search
                  <FiX className="h-3 w-3" />
                </button>
              )}
              {selectedCategories.map((categoryId) => (
                <button
                  key={categoryId}
                  type="button"
                  onClick={() =>
                    setSelectedCategories((prev) =>
                      prev.filter((item) => item !== categoryId)
                    )
                  }
                  className={chipClass(true)}
                >
                  {selectedCategoryMap.get(categoryId) || "Category"}
                  <FiX className="h-3 w-3" />
                </button>
              ))}
              {selectedPriceLabel && (
                <button
                  type="button"
                  onClick={() => setSelectedPrice(DEFAULT_PRICE)}
                  className={chipClass(true)}
                >
                  {selectedPriceLabel}
                  <FiX className="h-3 w-3" />
                </button>
              )}
              {selectedRating > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedRating(0)}
                  className={chipClass(true)}
                >
                  {selectedRating}+ stars
                  <FiX className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="pb-4 border-b border-primary-100">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-primary-500 block">
            Search
          </label>
          <div className="relative mt-2">
            <FiSearch className="h-4 w-4 text-primary-400 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title or keyword"
              className="w-full h-10 border-b border-primary-300 bg-transparent pl-8 pr-8 text-sm text-primary-900 focus:outline-none focus:border-accent-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 text-primary-500 hover:text-primary-700 inline-flex items-center justify-center"
                aria-label="Clear search"
              >
                <FiX className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="pb-4 border-b border-primary-100">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-primary-500 m-0">
              Category
            </h4>
            {selectedCategories.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedCategories([])}
                className="text-[11px] font-semibold text-accent-700 hover:text-accent-800"
              >
                Clear
              </button>
            )}
          </div>
          <div className="mt-2.5 space-y-2 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
            <label
              className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-sm transition-colors cursor-pointer ${
                selectedCategories.length === 0
                  ? "bg-accent-50 border-accent-300 text-accent-700"
                  : "bg-white/80 border-primary-200 text-primary-700 hover:bg-primary-50"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedCategories.length === 0}
                onChange={() => setSelectedCategories([])}
                className="h-4 w-4 accent-accent-600"
              />
              <span className="font-medium">All categories</span>
            </label>
            {categories?.map((cat) => {
              const isSelected = selectedCategories.includes(cat._id);
              return (
                <label
                  key={cat._id}
                  className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-sm transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-accent-50 border-accent-300 text-accent-700"
                      : "bg-white/80 border-primary-200 text-primary-700 hover:bg-primary-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() =>
                      setSelectedCategories((prev) =>
                        prev.includes(cat._id)
                          ? prev.filter((item) => item !== cat._id)
                          : [...prev, cat._id]
                      )
                    }
                    className="h-4 w-4 accent-accent-600"
                  />
                  <span className="font-medium">{cat.name}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="pb-4 border-b border-primary-100">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-primary-500 m-0">
              Price Range
            </h4>
            {(selectedPrice[0] !== DEFAULT_PRICE[0] || selectedPrice[1] !== DEFAULT_PRICE[1]) && (
              <button
                type="button"
                onClick={() => setSelectedPrice(DEFAULT_PRICE)}
                className="text-[11px] font-semibold text-accent-700 hover:text-accent-800"
              >
                Reset
              </button>
            )}
          </div>
          
          <div className="space-y-3">
            {/* Price Range Display */}
            <div className="flex items-center justify-between text-sm font-semibold text-primary-900">
              <span>₹{selectedPrice[0]}</span>
              <span className="text-xs text-primary-600">to</span>
              <span>₹{selectedPrice[1] >= 999999 ? '1000+' : selectedPrice[1]}</span>
            </div>

            {/* Progress Bar */}
            <div className="relative h-1.5 bg-primary-100 rounded-full overflow-hidden">
              <div 
                className="absolute h-full bg-gradient-to-r from-accent-500 to-accent-600 rounded-full transition-all duration-300"
                style={{
                  left: `${(selectedPrice[0] / 10000) * 100}%`,
                  right: `${100 - (Math.min(selectedPrice[1], 10000) / 10000) * 100}%`
                }}
              />
            </div>

            {/* Dual Range Sliders */}
            <div className="relative pt-2">
              <input
                type="range"
                min="0"
                max="10000"
                step="50"
                value={selectedPrice[0]}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val < selectedPrice[1]) {
                    setSelectedPrice([val, selectedPrice[1]]);
                  }
                }}
                className="absolute w-full h-1.5 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-accent-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-accent-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md"
              />
              <input
                type="range"
                min="0"
                max="10000"
                step="50"
                value={selectedPrice[1] >= 999999 ? 10000 : selectedPrice[1]}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val > selectedPrice[0]) {
                    setSelectedPrice([selectedPrice[0], val >= 10000 ? 999999 : val]);
                  }
                }}
                className="absolute w-full h-1.5 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-accent-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-accent-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md"
              />
            </div>

            {/* Quick Price Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setSelectedPrice([0, 200])}
                className="px-2 py-1 text-[10px] font-medium rounded-full bg-primary-50 hover:bg-accent-50 text-primary-700 hover:text-accent-700 border border-primary-200 hover:border-accent-300 transition-colors"
              >
                Under ₹200
              </button>
              <button
                type="button"
                onClick={() => setSelectedPrice([200, 500])}
                className="px-2 py-1 text-[10px] font-medium rounded-full bg-primary-50 hover:bg-accent-50 text-primary-700 hover:text-accent-700 border border-primary-200 hover:border-accent-300 transition-colors"
              >
                ₹200-500
              </button>
              <button
                type="button"
                onClick={() => setSelectedPrice([500, 1000])}
                className="px-2 py-1 text-[10px] font-medium rounded-full bg-primary-50 hover:bg-accent-50 text-primary-700 hover:text-accent-700 border border-primary-200 hover:border-accent-300 transition-colors"
              >
                ₹500-1000
              </button>
              <button
                type="button"
                onClick={() => setSelectedPrice([1000, 999999])}
                className="px-2 py-1 text-[10px] font-medium rounded-full bg-primary-50 hover:bg-accent-50 text-primary-700 hover:text-accent-700 border border-primary-200 hover:border-accent-300 transition-colors"
              >
                Over ₹1000
              </button>
            </div>
          </div>
        </div>

        <div className="pb-1">
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-primary-500 m-0">
            Rating
          </h4>
          <div className="mt-2 rounded-xl border border-primary-200 bg-white/85 p-3">
            <p className="text-xs text-primary-500 m-0">Tap stars to filter by rating</p>
            <div className="mt-2.5 flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((rating) => {
                const isActive = selectedRating >= rating;
                return (
                  <button
                    key={rating}
                    type="button"
                    aria-label={`${rating} stars and up`}
                    aria-pressed={selectedRating === rating}
                    onClick={() =>
                      setSelectedRating((prevRating) => (prevRating === rating ? 0 : rating))
                    }
                    className={`h-9 w-9 rounded-full border inline-flex items-center justify-center transition-all ${
                      isActive
                        ? "bg-amber-50 border-amber-200 shadow-[0_8px_16px_-12px_rgba(245,158,11,0.8)]"
                        : "bg-primary-50 border-primary-200 hover:bg-primary-100"
                    }`}
                  >
                    <FaStar
                      className={`h-4 w-4 ${
                        isActive ? "text-amber-400" : "text-primary-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-primary-700">
                {selectedRating > 0 ? `${selectedRating} stars & up` : "Any rating"}
              </span>
              {selectedRating > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedRating(0)}
                  className="text-[11px] font-semibold text-accent-700 hover:text-accent-800"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {!mobile && (
          <div className="pt-1">
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full h-10 rounded-full bg-primary-900 hover:bg-primary-800 text-white text-sm font-semibold transition-colors"
            >
              Clear All
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile floating filter button - rendered outside Layout for true fixed positioning */}
      {!sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed bottom-20 right-4 z-[9999] h-12 pl-3.5 pr-4 rounded-full bg-accent-500 hover:bg-accent-600 active:scale-[0.98] text-white shadow-[0_12px_32px_-12px_rgba(249,115,22,0.72)] inline-flex items-center gap-2 border border-accent-400 transition-all"
          style={{ position: 'fixed', bottom: '5rem', right: '1rem' }}
        >
          <FiFilter className="h-4.5 w-4.5" />
          <span className="text-sm font-semibold">Filter</span>
          {activeFiltersCount > 0 && (
            <span className="h-5 min-w-[1.25rem] px-1 rounded-full bg-white text-accent-700 text-[11px] font-bold inline-flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      )}

      {/* Mobile filter drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[9998] lg:hidden animate-fadeIn">
          <div
            className="absolute inset-0 bg-black/45"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[86vh] rounded-t-3xl bg-white shadow-2xl overflow-hidden animate-slideUp">
            <div className="pt-2 pb-1 flex justify-center">
              <span className="h-1 w-10 rounded-full bg-primary-200" />
            </div>
            <div className="px-5 py-3 border-b border-primary-200/80">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="py-0.5">
                  <h3 className="text-sm font-semibold text-primary-900">Filter Results</h3>
                  <p className="text-xs text-primary-500">
                    {activeFiltersCount} filter{activeFiltersCount === 1 ? "" : "s"} applied
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="h-9 w-9 rounded-full bg-primary-100 hover:bg-primary-200 text-primary-700 inline-flex items-center justify-center transition-colors"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleResetFilters();
                    setSidebarOpen(false);
                  }}
                  className="flex-1 h-8 rounded-full bg-primary-900 hover:bg-primary-800 text-white text-xs font-semibold transition-colors"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="flex-1 h-8 rounded-full bg-accent-500 hover:bg-accent-600 text-white text-xs font-semibold transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
            <div className="max-h-[calc(86vh-9rem)] overflow-y-auto">
              {renderFilterPanel(true)}
            </div>
          </div>
        </div>
      )}

      <Layout>
        {/* Hero Section */}
        <section
          className="relative overflow-hidden bg-gradient-to-br from-[#fff9f2] via-[#fffdfa] to-[#fef2e4]"
          data-fx="reveal"
        >
        <div className="absolute -top-28 -left-24 h-80 w-80 rounded-full bg-primary-100/80 blur-3xl" />
        <div className="absolute -bottom-20 -right-24 h-80 w-80 rounded-full bg-accent-100/80 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-white/70 blur-3xl" />

        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-12 md:py-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/55 px-3.5 py-1.5 text-xs font-semibold text-accent-700 shadow-[0_10px_24px_-18px_rgba(71,52,31,0.75)] ring-1 ring-white/80 backdrop-blur-md">
                <FiTrendingUp className="h-3.5 w-3.5" />
                Bestsellers and new arrivals this week
              </div>

              {selectedLocationLabel && (
                <div className="inline-flex items-center gap-2 rounded-full bg-white/60 px-3.5 py-1.5 text-xs font-semibold text-primary-700 shadow-[0_10px_24px_-18px_rgba(71,52,31,0.75)] ring-1 ring-white/80 backdrop-blur-md">
                  <FiMapPin className="h-3.5 w-3.5 text-accent-700" />
                  Delivering to {selectedLocationLabel}
                </div>
              )}

              <h1 className="text-3xl md:text-4xl xl:text-5xl font-bold text-primary-900 leading-tight">
                Shop books that match
                <span className="block text-accent-600">your goals and your mood</span>
              </h1>

              <p className="text-base md:text-lg text-primary-700 max-w-2xl">
                Compare genres, check ratings, and order in minutes with dependable
                delivery to your selected location.
              </p>

              <div className="max-w-2xl rounded-[1.35rem] bg-gradient-to-r from-white/70 via-primary-50/55 to-accent-50/60 px-2.5 py-2 shadow-[0_22px_44px_-30px_rgba(75,56,34,0.68)] ring-1 ring-white/80 backdrop-blur-md flex items-center gap-2">
                <div className="relative flex-1">
                  <FiSearch className="h-4.5 w-4.5 text-primary-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search books, descriptions or categories..."
                    className="w-full h-10 rounded-full border border-primary-200/90 bg-transparent pl-10 pr-3 text-sm text-primary-900 placeholder:text-primary-500 focus:outline-none focus:border-accent-400"
                  />
                </div>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="h-9 px-3 rounded-full bg-white/75 text-primary-700 text-sm font-medium hover:bg-white transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate("/categories")}
                  className="h-9 px-4 rounded-full bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white text-sm font-semibold transition-colors"
                >
                  Browse
                </button>
              </div>

              <div className="pt-1.5 sm:pt-2 max-w-2xl">
                <div className="relative overflow-hidden rounded-[1.55rem] bg-gradient-to-r from-white/58 via-white/36 to-accent-50/52 px-4 py-4 sm:px-5 sm:py-4.5 shadow-[0_26px_56px_-36px_rgba(75,56,34,0.75)] ring-1 ring-white/75 backdrop-blur-md">
                  <div className="pointer-events-none absolute -top-8 right-6 h-20 w-20 rounded-full bg-accent-100/70 blur-2xl" />
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-primary-900 inline-flex items-center gap-1.5">
                        <FiTrendingUp className="h-4 w-4 text-accent-700" />
                        Shop by Collection
                      </p>
                      <p className="text-xs text-primary-600 mt-0.5 pr-2">
                        Start with curated categories, trending picks, and exam-focused reads.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[auto_auto] gap-2 w-full md:w-auto">
                      <button
                        onClick={() => navigate("/categories")}
                        className="h-10 px-4 rounded-full bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
                      >
                        <FiBook className="h-4 w-4" />
                        Explore
                        <FiChevronRight className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          handleResetFilters();
                          window.scrollTo({ top: 460, behavior: "smooth" });
                        }}
                        className="hidden md:inline-flex h-10 px-4 min-w-[8.75rem] whitespace-nowrap rounded-full bg-white/70 hover:bg-white text-primary-700 text-sm font-semibold items-center justify-center gap-2 transition-colors"
                      >
                        <FiSliders className="h-4 w-4" />
                        Quick Filters
                      </button>
                    </div>
                  </div>

                  <p className="md:hidden mt-2 text-[11px] text-primary-500">
                    Use the floating filter button to refine results.
                  </p>

                  {categories?.length > 0 && (
                    <div className="mt-3.5 -mx-1 px-1 flex gap-2 overflow-x-auto snap-x snap-mandatory sm:flex-wrap sm:overflow-visible pb-0.5">
                      {categories.slice(0, 5).map((cat) => (
                        <button
                          key={cat._id}
                          type="button"
                          onClick={() => navigate(`/category/${cat.slug}`)}
                          className="h-7 px-2.5 shrink-0 snap-start rounded-full bg-white/75 hover:bg-white text-accent-700 text-xs font-medium transition-colors"
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="lg:col-span-5">
              <div
                className="mx-auto w-full max-w-[700px]"
                onMouseEnter={() => setPauseHeroAutoSlide(true)}
                onMouseLeave={() => setPauseHeroAutoSlide(false)}
              >
                {heroPrimaryBook ? (
                  <div className="space-y-3">
                    <div className="relative h-[360px] sm:h-[440px] overflow-hidden">
                      <div className="absolute inset-x-8 sm:inset-x-10 inset-y-3 rounded-[2.2rem] bg-gradient-to-br from-white/54 via-primary-50/34 to-accent-100/44 ring-1 ring-white/70 backdrop-blur-md" />
                      <div className="absolute inset-x-20 top-8 h-32 rounded-full bg-accent-200/48 blur-3xl" />
                      <div className="absolute inset-x-24 bottom-8 h-24 rounded-full bg-white/75 blur-3xl" />

                      {heroPreviousBook && (
                        <button
                          type="button"
                          onClick={() => setHeroBookIndex((prevIndex) => (prevIndex - 1 + featuredProducts.length) % featuredProducts.length)}
                          aria-label="Show previous featured book"
                          className="absolute left-3 sm:left-5 top-1/2 z-10 w-[30%] max-w-[160px] -translate-y-1/2 text-left opacity-70 transition-opacity hover:opacity-95"
                        >
                          <div className="hero-side-frame rounded-2xl bg-gradient-to-br from-white/58 via-white/34 to-primary-100/30 p-1.5 shadow-[0_16px_30px_-24px_rgba(37,31,23,0.9)] ring-1 ring-white/70 backdrop-blur-[7px]">
                            <div className="aspect-[2/3] overflow-hidden rounded-xl bg-gradient-to-b from-white/72 to-primary-50/58">
                              <img
                                src={heroPreviousBook.imageUrl || heroPreviousBook.imageUrls?.[0] || "https://placehold.co/280x420/f5f0e8/826b4d?text=Book"}
                                alt={heroPreviousBook.name}
                                className="h-full w-full object-contain p-2"
                              />
                            </div>
                          </div>
                        </button>
                      )}

                      {heroNextBook && (
                        <button
                          type="button"
                          onClick={() => setHeroBookIndex((prevIndex) => (prevIndex + 1) % featuredProducts.length)}
                          aria-label="Show next featured book"
                          className="absolute right-3 sm:right-5 top-1/2 z-10 w-[30%] max-w-[160px] -translate-y-1/2 text-left opacity-70 transition-opacity hover:opacity-95"
                        >
                          <div className="hero-side-frame rounded-2xl bg-gradient-to-br from-white/58 via-white/34 to-primary-100/30 p-1.5 shadow-[0_16px_30px_-24px_rgba(37,31,23,0.9)] ring-1 ring-white/70 backdrop-blur-[7px]">
                            <div className="aspect-[2/3] overflow-hidden rounded-xl bg-gradient-to-b from-white/72 to-primary-50/58">
                              <img
                                src={heroNextBook.imageUrl || heroNextBook.imageUrls?.[0] || "https://placehold.co/280x420/f5f0e8/826b4d?text=Book"}
                                alt={heroNextBook.name}
                                className="h-full w-full object-contain p-2"
                              />
                            </div>
                          </div>
                        </button>
                      )}

                      <button
                        key={`hero-primary-${heroPrimaryBook._id}-${heroBookIndex}`}
                        onClick={() => navigate(`/product/${heroPrimaryBook.slug}`)}
                        className="group absolute left-1/2 top-1/2 z-20 w-[48%] min-w-[180px] max-w-[270px] -translate-x-1/2 -translate-y-1/2 text-center"
                      >
                        <div className="hero-main-frame rounded-[1.7rem] bg-gradient-to-br from-white/66 via-primary-50/44 to-accent-100/42 p-2.5 shadow-[0_24px_50px_-32px_rgba(37,31,23,0.9)] ring-1 ring-white/80 backdrop-blur-lg">
                          <div className="aspect-[2/3] overflow-hidden rounded-[1.4rem] bg-gradient-to-b from-white/85 to-primary-50/58">
                            <img
                              src={heroPrimaryBook.imageUrl || heroPrimaryBook.imageUrls?.[0] || "https://placehold.co/320x420/f5f0e8/826b4d?text=Book"}
                              alt={heroPrimaryBook.name}
                              className="h-full w-full object-contain p-3.5 sm:p-4"
                            />
                          </div>
                        </div>
                      </button>

                      {featuredProducts.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setHeroBookIndex(
                                (prevIndex) =>
                                  (prevIndex - 1 + featuredProducts.length) % featuredProducts.length
                              )
                            }
                            aria-label="Show previous featured book"
                            className="absolute left-2 sm:left-3 top-1/2 z-30 -translate-y-1/2 h-10 w-10 rounded-full bg-white/68 text-primary-700 shadow-[0_12px_28px_-16px_rgba(37,31,23,0.9)] ring-1 ring-white/75 backdrop-blur-sm transition-colors hover:bg-white"
                          >
                            <FiChevronLeft className="mx-auto h-4.5 w-4.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setHeroBookIndex(
                                (prevIndex) => (prevIndex + 1) % featuredProducts.length
                              )
                            }
                            aria-label="Show next featured book"
                            className="absolute right-2 sm:right-3 top-1/2 z-30 -translate-y-1/2 h-10 w-10 rounded-full bg-white/68 text-primary-700 shadow-[0_12px_28px_-16px_rgba(37,31,23,0.9)] ring-1 ring-white/75 backdrop-blur-sm transition-colors hover:bg-white"
                          >
                            <FiChevronRight className="mx-auto h-4.5 w-4.5" />
                          </button>
                        </>
                      )}
                    </div>

                    <div className="mt-3 px-0.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-500">
                        {getProductCategoryName(heroPrimaryBook)}
                      </p>
                      <p className="mt-1 text-sm sm:text-base font-semibold text-primary-900 line-clamp-2">
                        {heroPrimaryBook.name}
                      </p>
                    </div>

                    {featuredProducts.length > 1 && (
                      <>
                        <div className="mt-3 grid grid-cols-4 gap-2.5">
                          {featuredProducts.map((book, index) => {
                            const isActive = index === heroBookIndex;
                            return (
                              <button
                                key={`hero-thumb-${book._id}`}
                                type="button"
                                onClick={() => setHeroBookIndex(index)}
                                aria-label={`Show featured book ${index + 1}`}
                                className={`h-[82px] rounded-xl overflow-hidden transition-all ${
                                  isActive
                                    ? "ring-2 ring-accent-500 shadow-[0_16px_28px_-20px_rgba(249,115,22,0.75)] bg-gradient-to-br from-white/70 to-accent-50/60"
                                    : "opacity-80 hover:opacity-100 ring-1 ring-white/75 bg-gradient-to-br from-white/58 to-primary-50/50"
                                }`}
                              >
                                <img
                                  src={book.imageUrl || book.imageUrls?.[0] || "https://placehold.co/180x240/f5f0e8/826b4d?text=Book"}
                                  alt={book.name}
                                  className="h-full w-full object-contain p-1.5"
                                />
                              </button>
                            );
                          })}
                        </div>

                        <div className="mt-3 flex items-center justify-center gap-2">
                          {featuredProducts.map((book, index) => {
                            const isActive = index === heroBookIndex;
                            return (
                              <button
                                key={`hero-dot-${book._id}`}
                                type="button"
                                onClick={() => setHeroBookIndex(index)}
                                aria-label={`Show featured book ${index + 1}`}
                                className={`h-2.5 rounded-full transition-all ${
                                  isActive
                                    ? "w-7 bg-accent-500"
                                    : "w-2.5 bg-primary-300 hover:bg-primary-400"
                                }`}
                              />
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-gradient-to-br from-white/60 via-primary-50/40 to-accent-100/45 p-8 text-center text-sm text-primary-600 ring-1 ring-white/75 backdrop-blur-md">
                    Featured books will appear here.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-primary-50 pt-8 pb-24 md:pt-10 md:pb-10 min-h-screen" data-fx="reveal">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="flex gap-5">
            {/* Desktop sidebar */}
            <aside
              className={`hidden lg:block transition-all duration-300 ${
                sidebarCollapsed ? "w-[90px]" : "w-[18.5rem] xl:w-[19.5rem]"
              }`}
            >
              <div className="sticky top-20 max-h-[calc(100vh-6rem)] pr-3 xl:pr-4 flex flex-col">
                <div className={`h-14 border-b border-primary-200/80 px-1 ${sidebarCollapsed ? "justify-center" : "justify-between"} flex items-center`}>
                  {!sidebarCollapsed && (
                    <div className="min-w-0 py-0.5">
                      <h3 className="text-base font-semibold text-primary-900">Filters</h3>
                      <p className="text-xs text-primary-500">
                        {activeFiltersCount > 0 ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
                            {activeFiltersCount} filter{activeFiltersCount === 1 ? "" : "s"} applied
                          </span>
                        ) : (
                          "No filters applied"
                        )}
                      </p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setSidebarCollapsed((prev) => !prev)}
                    className="h-8 w-8 rounded-full bg-primary-100 hover:bg-primary-200 text-primary-700 inline-flex items-center justify-center transition-colors"
                  >
                    {sidebarCollapsed ? (
                      <FiFilter className="h-4 w-4" />
                    ) : (
                      <FiX className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {sidebarCollapsed ? (
                  <div className="pt-3 space-y-2 px-1">
                    <button
                      type="button"
                      onClick={() => setSidebarCollapsed(false)}
                      className="w-full h-10 rounded-full bg-accent-100 text-accent-700 hover:bg-accent-200 inline-flex items-center justify-center transition-colors"
                      title="Expand filters"
                    >
                      <FiSliders className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="w-full h-10 rounded-full bg-primary-100 text-primary-800 hover:bg-primary-200 text-sm font-semibold transition-colors"
                      title="Reset filters"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto scrollbar-thin mt-2">
                    {renderFilterPanel()}
                  </div>
                )}
              </div>
            </aside>

            {/* Content column */}
            <div className="flex-1 min-w-0">
              <div className={`mb-5 pb-3 border-b border-primary-200 ${isFiltering ? "fx-filter-pulse" : ""}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                  <p className="text-sm text-primary-700">
                    Showing <span className="font-semibold text-primary-900">{displayProducts.length}</span> of <span className="font-semibold text-primary-900">{filteredProducts.length}</span> matching titles
                  </p>

                  <div className="flex items-center gap-2">
                    <div ref={sortMenuRef} className="relative sm:hidden">
                      <button
                        type="button"
                        onClick={() => setSortMenuOpen((prev) => !prev)}
                        className="h-10 min-w-[10.5rem] rounded-full bg-primary-100 px-3 text-sm text-primary-800 inline-flex items-center justify-between gap-2"
                      >
                        <span>{selectedSortLabel}</span>
                        <FiChevronDown
                          className={`h-4 w-4 text-primary-500 transition-transform ${
                            sortMenuOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {sortMenuOpen && (
                        <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-primary-200 bg-white shadow-lg py-1.5 z-30">
                          {SORT_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setSortBy(option.value);
                                setSortMenuOpen(false);
                              }}
                              className={`w-full h-9 px-3 text-left text-sm ${
                                sortBy === option.value
                                  ? "bg-accent-50 text-accent-700 font-semibold"
                                  : "text-primary-700 hover:bg-primary-50"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="hidden sm:block h-10 rounded-full bg-primary-100 px-3 text-sm text-primary-800 focus:outline-none focus:ring-2 focus:ring-accent-300"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {displayProducts.length > 0 ? (
                <>
                  <div className={`catalog-grid ${isFiltering ? "fx-grid-filtering" : ""}`}>
                    {displayProducts.map((p, index) => {
                      const rating = getProductRating(p);
                      const reviewCount = getProductReviewCount(p);
                      return (
                        <div
                          key={p._id}
                          className="fx-product-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group border border-primary-100 flex flex-col"
                          style={{ "--fx-stagger": `${Math.min((index % ITEMS_PER_PAGE) * 30, 330)}ms` }}
                        >
                          <div className="relative h-56 overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100">
                            <img
                              src={p.imageUrl || p.imageUrls?.[0] || "https://placehold.co/300x400/f5f0e8/826b4d?text=No+Image"}
                              alt={p.name}
                              className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.05]"
                              loading="lazy"
                            />
                            <div className="absolute top-2 left-2 rounded-full bg-white/95 border border-primary-200 px-2 py-0.5 text-[11px] font-semibold text-primary-700">
                              {getProductCategoryName(p)}
                            </div>
                          </div>

                          <div className="p-3.5 flex-grow flex flex-col">
                            <h3 className="text-sm font-semibold text-primary-900 line-clamp-2 mb-1.5 min-h-[2.5rem]">
                              {p.name}
                            </h3>
                            <p className="text-xs text-primary-600 line-clamp-2 mb-2.5 flex-grow">
                              {p.description}
                            </p>

                            <div className="flex items-center gap-1 mb-2.5">
                              {[...Array(5)].map((_, i) => (
                                <FiStar
                                  key={i}
                                  className={`w-3 h-3 ${i < Math.round(rating)
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                    }`}
                                />
                              ))}
                              <span className="text-xs text-primary-600 ml-1">
                                {reviewCount > 0
                                  ? `${rating.toFixed(1)} (${reviewCount})`
                                  : "New"}
                              </span>
                            </div>

                            <div className="mb-3">
                              <span className="text-lg font-bold text-accent-600">
                                ₹{Number(p.price || 0).toLocaleString("en-IN")}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mt-auto">
                              <button
                                onClick={() => navigate(`/product/${p.slug}`)}
                                className="h-9 rounded-lg bg-primary-100 text-primary-800 hover:bg-primary-200 transition-all text-xs font-medium flex items-center justify-center gap-1"
                              >
                                <FiEye className="w-4 h-4" />
                                View
                              </button>
                              <button
                                onClick={() => toggleWishlist(p)}
                                className={`h-9 rounded-lg transition-all font-medium border flex items-center justify-center ${
                                  wishlist.find((item) => item._id === p._id)
                                    ? "bg-red-100 text-red-700 border-red-300"
                                    : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                                }`}
                                title="Add to wishlist"
                              >
                                <FiHeart className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => addToCart(p)}
                                className="h-9 rounded-lg bg-accent-100 text-accent-700 hover:bg-accent-200 transition-all text-xs font-medium border border-accent-200 flex items-center justify-center gap-1"
                              >
                                <FiShoppingCart className="w-4 h-4" />
                                Cart
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {loading && (
                    <div className="flex justify-center items-center py-8 mt-6">
                      <div className="flex gap-2 fx-loading-bubbles">
                        <div
                          className="w-3 h-3 bg-accent-600 rounded-full animate-bounce"
                          style={{ animationDelay: "0s" }}
                        />
                        <div
                          className="w-3 h-3 bg-accent-600 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <div
                          className="w-3 h-3 bg-accent-600 rounded-full animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        />
                      </div>
                    </div>
                  )}

                  {hasMore && (
                    <div ref={observerTarget} className="h-10 mt-8 flex items-center justify-center">
                      <p className="text-sm text-primary-600">Scroll to load more books...</p>
                    </div>
                  )}

                  {!hasMore && displayProducts.length > 0 && (
                    <div className="text-center py-8 mt-8 bg-white border border-primary-200 rounded-xl">
                      <p className="text-sm text-primary-600 font-medium">
                        You&apos;ve reached the end • {filteredProducts.length} books found
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16 bg-white rounded-xl border border-primary-200 shadow-sm" data-fx="reveal">
                  <div className="bg-accent-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-accent-200">
                    <FiBook className="h-8 w-8 text-accent-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-primary-900 mb-2">
                    No books found
                  </h3>
                  <p className="text-sm text-primary-600 mb-6">
                    Try adjusting your search or filters to discover more books.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="bg-accent-100 text-accent-700 px-6 py-2.5 rounded-lg hover:bg-accent-200 transition-all font-semibold border border-accent-200"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      </Layout>
    </>
  );
};

export default HomePage;
