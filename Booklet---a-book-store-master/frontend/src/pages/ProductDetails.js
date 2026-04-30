import React, { useState, useEffect } from "react";
import Layout from "./../components/Layout/Layout";
import axios from "../config/axios";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../context/cart";
import { useWishlist } from "../context/wishlist";
import { useLocationContext } from "../context/location";
import { useConfirm } from "../context/confirm";
import { useAuth } from "../context/auth";
import toast from "react-hot-toast";
import { FiShoppingCart, FiTag, FiPackage, FiArrowLeft, FiHeart, FiMinus, FiPlus, FiStar, FiTruck, FiShield, FiRefreshCw, FiChevronLeft, FiChevronRight, FiCreditCard, FiClock, FiCheckCircle } from "react-icons/fi";
import { isProductAvailableInLocation } from "../utils/locationUtils";
import { setBuyNowCheckoutItem } from "../utils/checkoutUtils";
import useProductReviews from "../features/reviews/useProductReviews";
import ReviewSummary from "../features/reviews/ReviewSummary";
import ReviewForm from "../features/reviews/ReviewForm";
import ReviewList from "../features/reviews/ReviewList";

const ProductDetails = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [auth] = useAuth();
  const [cart, setCart] = useCart();
  const [wishlist, setWishlist] = useWishlist();
  const confirm = useConfirm();
  const [product, setProduct] = useState(null);
  const { selectedLocation, selectedLocationLabel } = useLocationContext();
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isDeliverable, setIsDeliverable] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeInfoTab, setActiveInfoTab] = useState("overview");
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const fallbackImage = "https://placehold.co/600x800/f5f0e8/826b4d?text=No+Image";

  const productImages = React.useMemo(() => {
    const images = [
      ...(Array.isArray(product?.imageUrls) ? product.imageUrls : []),
      product?.imageUrl,
    ]
      .filter((img) => typeof img === "string" && img.trim().length > 0)
      .map((img) => img.trim());

    const uniqueImages = [...new Set(images)];
    return uniqueImages.length ? uniqueImages : [fallbackImage];
  }, [product?.imageUrl, product?.imageUrls, fallbackImage]);

  const activeImage = productImages[activeImageIndex] || fallbackImage;

  //get similar product
  const getSimilarProduct = React.useCallback(
    async (pid, cid) => {
      try {
        const { data } = await axios.get(
          `/api/v1/product/related-product/${pid}/${cid}?location=${encodeURIComponent(
            selectedLocation || ""
          )}`
        );
        setRelatedProducts(data?.products);
      } catch (error) {
        console.log(error);
      }
    },
    [selectedLocation]
  );

  //getProduct
  const getProduct = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const { data } = await axios.get(
        `/api/v1/product/get-product/${params.slug}?location=${encodeURIComponent(
          selectedLocation || ""
        )}`
      );
      if (data?.product) {
        setProduct(data?.product);
        const deliverable = data?.isDeliverable ?? isProductAvailableInLocation(data?.product, selectedLocation);
        setIsDeliverable(Boolean(deliverable));
        getSimilarProduct(data?.product._id, data?.product.category._id);
      } else {
        setError(true);
        setProduct(null);
      }
    } catch (error) {
      console.log(error);
      setError(true);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [getSimilarProduct, params?.slug, selectedLocation]);

  //initial details
  useEffect(() => {
    if (params?.slug) getProduct();
  }, [params?.slug, getProduct]);

  useEffect(() => {
    setActiveImageIndex(0);
    setActiveInfoTab("overview");
    setShowReviewForm(false);
  }, [product?._id]);

  useEffect(() => {
    if (!product?._id) return;

    const storageKey = "recentlyViewedProducts";
    const currentProductPreview = {
      _id: product._id,
      name: product.name,
      slug: product.slug,
      imageUrl: product.imageUrl,
      price: product.price,
      rating: product.rating,
      numReviews: product.numReviews,
    };

    try {
      const storedItems = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const normalizedStoredItems = Array.isArray(storedItems)
        ? storedItems.filter((item) => item && item._id && item.slug)
        : [];

      const updatedItems = [
        currentProductPreview,
        ...normalizedStoredItems.filter((item) => item._id !== currentProductPreview._id),
      ].slice(0, 10);

      localStorage.setItem(storageKey, JSON.stringify(updatedItems));
      setRecentlyViewedProducts(
        updatedItems.filter((item) => item._id !== currentProductPreview._id).slice(0, 6)
      );
    } catch (storageError) {
      console.log(storageError);
      setRecentlyViewedProducts([]);
    }
  }, [product?._id, product?.imageUrl, product?.name, product?.numReviews, product?.price, product?.rating, product?.slug]);

  useEffect(() => {
    if (productImages.length < 2) return undefined;

    const autoScrollTimer = setInterval(() => {
      setActiveImageIndex((prevIndex) =>
        prevIndex === productImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 3200);

    return () => clearInterval(autoScrollTimer);
  }, [productImages.length]);

  const goToPreviousImage = () => {
    setActiveImageIndex((prevIndex) =>
      prevIndex === 0 ? productImages.length - 1 : prevIndex - 1
    );
  };

  const goToNextImage = () => {
    setActiveImageIndex((prevIndex) =>
      prevIndex === productImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const persistCart = (nextCart) => {
    setCart(nextCart);
    localStorage.setItem("cart", JSON.stringify(nextCart));
  };

  const addItemToCart = (productToAdd, qtyToAdd = 1) => {
    if (!productToAdd?._id) return 0;

    const safeQty = Number.isFinite(Number(qtyToAdd)) && Number(qtyToAdd) > 0
      ? Number(qtyToAdd)
      : 1;
    const maxStockQty = Math.max(0, Number(productToAdd?.quantity || 0));
    const existingItemIndex = cart.findIndex((item) => item._id === productToAdd._id);

    if (existingItemIndex !== -1) {
      const updatedCart = [...cart];
      const currentQty = Number(
        updatedCart[existingItemIndex]?.qty ||
        updatedCart[existingItemIndex]?.quantity
      );
      const safeCurrentQty = Number.isFinite(currentQty) && currentQty > 0 ? currentQty : 0;
      const nextQtyCandidate = safeCurrentQty + safeQty;
      const boundedQty =
        maxStockQty > 0 ? Math.min(nextQtyCandidate, maxStockQty) : nextQtyCandidate;
      const addedQty = Math.max(0, boundedQty - safeCurrentQty);

      if (!addedQty) return 0;

      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        qty: boundedQty,
      };
      persistCart(updatedCart);
      return addedQty;
    }

    const firstQty = maxStockQty > 0 ? Math.min(safeQty, maxStockQty) : safeQty;
    if (!firstQty) return 0;

    const nextCart = [...cart, { ...productToAdd, qty: firstQty }];
    persistCart(nextCart);
    return firstQty;
  };

  const handleAddToCart = () => {
    const stockQty = Math.max(0, Number(product?.quantity || 0));
    if (!stockQty) {
      toast.error("This book is currently out of stock");
      return;
    }

    if (!isDeliverable) {
      toast.error(`This book is not available in ${selectedLocationLabel}`);
      return;
    }

    const addedQty = addItemToCart(product, quantity);
    if (addedQty) {
      toast.success(`${addedQty} item${addedQty > 1 ? "s" : ""} added to cart`);
      return;
    }
    toast.error("Maximum available quantity is already in your cart");
  };

  const handleBuyNow = () => {
    const stockQty = Math.max(0, Number(product?.quantity || 0));
    if (!stockQty) {
      toast.error("This book is currently out of stock");
      return;
    }

    if (!isDeliverable) {
      toast.error(`This book is not available in ${selectedLocationLabel}`);
      return;
    }

    const checkoutItem = { ...product, qty: quantity };
    setBuyNowCheckoutItem(checkoutItem);
    toast.success("Redirecting to buy now checkout");
    navigate("/checkout?mode=buy-now");
  };

  const handleWishlistToggle = async (prod = product) => {
    const existingItem = wishlist.find(item => item._id === prod._id);
    if (existingItem) {
      const shouldRemove = await confirm({
        title: "Remove from wishlist?",
        message: `Remove "${prod?.name || "this product"}" from your wishlist?`,
        confirmText: "Remove",
        cancelText: "Keep",
        tone: "danger",
      });
      if (!shouldRemove) return;

      setWishlist(wishlist.filter(item => item._id !== prod._id));
      toast.success("Removed from wishlist");
    } else {
      setWishlist([...wishlist, prod]);
      toast.success("Added to wishlist");
    }
  };

  const handleQuickAddRelated = (relatedProduct) => {
    const addedQty = addItemToCart(relatedProduct, 1);
    if (addedQty) {
      toast.success("Item added to cart");
    }
  };

  const {
    reviews,
    averageRating,
    totalReviews,
    ratingDistribution,
    myReview,
    loading: reviewLoading,
    submitting: reviewSubmitting,
    loadReviews,
    submitReview,
  } = useProductReviews({
    productId: product?._id || "",
    userId: auth?.user?._id || "",
  });

  useEffect(() => {
    if (!product?._id) return;

    loadReviews().catch((loadError) => {
      console.log(loadError);
      toast.error(loadError.message || "Unable to load reviews");
    });
  }, [product?._id, loadReviews]);

  useEffect(() => {
    if (myReview) {
      setReviewRating(Number(myReview?.rating || 0));
      setReviewComment(myReview?.comment || "");
      return;
    }

    setReviewRating(0);
    setReviewComment("");
  }, [myReview, product?._id]);

  const displayAverageRating =
    totalReviews > 0 ? averageRating : Number(product?.rating || 0);
  const displayReviewCount =
    totalReviews > 0 ? totalReviews : Number(product?.numReviews || 0);

  const handleReviewButtonClick = () => {
    if (!auth?.token) {
      toast.error("Please login to write a review");
      navigate("/login", { state: `/product/${params.slug}` });
      return;
    }

    setShowReviewForm((previous) => !previous);
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();

    if (!auth?.token) {
      toast.error("Please login to write a review");
      navigate("/login", { state: `/product/${params.slug}` });
      return;
    }

    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      toast.error("Please select a rating between 1 and 5");
      return;
    }

    const trimmedComment = reviewComment.trim();
    if (!trimmedComment) {
      toast.error("Please write a review comment");
      return;
    }

    try {
      const data = await submitReview({
        rating: reviewRating,
        comment: trimmedComment,
      });
      toast.success(data?.message || "Review submitted successfully");
      await getProduct();
      setShowReviewForm(false);
    } catch (submitError) {
      console.log(submitError);
      toast.error(submitError.message || "Unable to submit review");
    }
  };

  const isWishlisted = wishlist.some((item) => item._id === product?._id);
  const availableStock = Math.max(0, Number(product?.quantity || 0));
  const isInStock = availableStock > 0;
  const canPurchase = isDeliverable && isInStock;
  const sellingPrice = Number(product?.price || 0);
  const mrpPrice = Math.max(Number(product?.mrp || 0), sellingPrice);
  const hasDiscount = mrpPrice > sellingPrice;
  const discountPercent = hasDiscount
    ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100)
    : 0;
  const shippingCharge = Number(product?.shippingCharge || 0);
  const returnWindowDays = Math.max(0, Number(product?.returnWindowDays ?? 7) || 0);
  const estimatedDeliveryMinDays = Math.max(0, Number(product?.estimatedDeliveryMinDays ?? 0) || 0);
  const estimatedDeliveryMaxDays = Math.max(
    estimatedDeliveryMinDays,
    Number(product?.estimatedDeliveryMaxDays ?? estimatedDeliveryMinDays) || estimatedDeliveryMinDays
  );
  const includesTax = product?.priceIncludesTax !== false;
  const taxRate = Number(product?.taxRate || 0);
  const totalPrice = sellingPrice * quantity;
  const productHighlights = Array.isArray(product?.highlights)
    ? product.highlights.filter((item) => typeof item === "string" && item.trim())
    : [];
  const productPerfectFor = Array.isArray(product?.perfectFor)
    ? product.perfectFor.filter((item) => typeof item === "string" && item.trim())
    : [];
  const productDetailsAndCare = Array.isArray(product?.detailsAndCare)
    ? product.detailsAndCare.filter((item) => typeof item === "string" && item.trim())
    : [];
  const descriptionPoints = String(product?.description || "")
    .split(/[\n.]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
  const overviewPoints = productHighlights.length
    ? productHighlights
    : descriptionPoints;
  const perfectForPoints = productPerfectFor.length
    ? productPerfectFor
    : [
        product?.category?.name ? `${product.category.name} readers` : "",
        product?.format ? `${product.format} collectors` : "",
      ].filter(Boolean);
  const detailsCarePoints = productDetailsAndCare.length
    ? productDetailsAndCare
    : [
        product?.format ? `${product.format} binding.` : "",
        product?.language ? `Language: ${product.language}.` : "",
        returnWindowDays > 0 ? `Returns within ${returnWindowDays} days.` : "",
      ].filter(Boolean);

  const deliveryLabel =
    estimatedDeliveryMinDays && estimatedDeliveryMaxDays
      ? estimatedDeliveryMinDays === estimatedDeliveryMaxDays
        ? `Delivery in ${estimatedDeliveryMinDays} day${estimatedDeliveryMinDays > 1 ? "s" : ""}`
        : `Delivery in ${estimatedDeliveryMinDays}-${estimatedDeliveryMaxDays} days`
      : "Delivery timeline shared at checkout";
  const infoTabs = [
    { id: "overview", label: "Overview" },
    { id: "details", label: "Reading & Handling" },
    { id: "reviews", label: `Reviews (${displayReviewCount})` },
  ];
  const productSpecs = [
    { label: "Category", value: product?.category?.name },
    { label: "SKU", value: product?.sku },
    { label: "ISBN", value: product?.isbn },
    { label: "Author", value: product?.author },
    { label: "Publisher", value: product?.publisher },
    { label: "Format", value: product?.format },
    { label: "Language", value: product?.language },
    { label: "Edition", value: product?.edition },
    {
      label: "Pages",
      value:
        Number(product?.pages) > 0 ? Number(product.pages).toLocaleString("en-IN") : "",
    },
    {
      label: "Weight",
      value:
        Number(product?.weightInGrams) > 0
          ? `${Number(product.weightInGrams).toLocaleString("en-IN")} g`
          : "",
    },
  ].filter((spec) => Boolean(spec.value));
  useEffect(() => {
    setQuantity((prev) => {
      if (!availableStock) return 1;
      const next = Number(prev) || 1;
      return Math.min(Math.max(next, 1), availableStock);
    });
  }, [availableStock]);

  if (loading) {
    return (
      <Layout title="Loading...">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <div className="bg-gray-200 rounded-lg h-[500px]"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout title="Product Not Found">
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">📚</div>
            <h1 className="text-2xl font-bold text-primary-900 mb-2">Product Not Found</h1>
            <p className="text-primary-600 mb-6">The product you're looking for doesn't exist or the link is invalid.</p>
            <button
              onClick={() => navigate('/')}
              className="bg-accent-100 text-accent-700 px-6 py-3 rounded-lg hover:bg-accent-200 transition-all font-semibold border border-accent-200"
            >
              Back to Home
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${product?.name || "Product"} - BookBuddy`}>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-primary-50 via-white to-accent-50/70">
        <div className="pointer-events-none absolute -left-36 -top-24 h-80 w-80 rounded-full bg-accent-100/90 blur-3xl"></div>
        <div className="pointer-events-none absolute top-1/3 -right-24 h-72 w-72 rounded-full bg-orange-100/70 blur-3xl"></div>
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-primary-100/80 blur-3xl"></div>

        <div className="relative w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8">
          <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-primary-600">
            <button
              onClick={() => navigate("/")}
              className="font-semibold transition-colors hover:text-accent-600"
            >
              Home
            </button>
            <FiArrowLeft className="h-3.5 w-3.5 rotate-180" />
            <button
              onClick={() => navigate("/categories")}
              className="font-semibold transition-colors hover:text-accent-600"
            >
              Categories
            </button>
            <FiArrowLeft className="h-3.5 w-3.5 rotate-180" />
            <span className="font-semibold text-primary-900">{product?.category?.name}</span>
            <FiArrowLeft className="h-3.5 w-3.5 rotate-180" />
            <span className="truncate font-semibold text-accent-600">{product?.name}</span>
          </nav>

          <button
            onClick={() => navigate(-1)}
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-primary-700 transition-colors hover:text-accent-600"
          >
            <FiArrowLeft className="h-4 w-4" />
            <span>Back to products</span>
          </button>

          <section className="grid grid-cols-1 gap-8 xl:grid-cols-[1.06fr_1fr] 2xl:gap-12">
            <div className="relative">
              <div className="pointer-events-none absolute -left-8 top-8 h-44 w-44 rounded-full bg-accent-100/60 blur-3xl" />
              <div className="pointer-events-none absolute -right-8 bottom-10 h-44 w-44 rounded-full bg-primary-100/70 blur-3xl" />

              <div className="grid gap-3 sm:grid-cols-[78px,1fr] sm:items-start">
                <div className="order-2 flex items-center gap-2.5 overflow-x-auto pb-1 sm:order-1 sm:max-h-[510px] sm:flex-col sm:overflow-y-auto sm:overflow-x-hidden sm:pr-1">
                  {productImages.map((img, index) => (
                    <button
                      key={`${img}-${index}`}
                      onClick={() => setActiveImageIndex(index)}
                      className={`h-16 w-14 shrink-0 overflow-hidden rounded-xl transition-all sm:h-20 sm:w-16 ${
                        activeImageIndex === index
                          ? "opacity-100 ring-2 ring-accent-500/70 scale-[1.02]"
                          : "opacity-70 hover:opacity-100"
                      }`}
                      aria-label={`View image ${index + 1}`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${index + 1}`}
                        className="h-full w-full object-contain bg-white/60 p-1.5 backdrop-blur-sm"
                      />
                    </button>
                  ))}
                </div>

                <div className="order-1 relative h-80 overflow-hidden rounded-[32px] bg-gradient-to-br from-white/75 via-primary-50/60 to-accent-50/60 sm:order-2 sm:h-[420px] lg:h-[490px] xl:h-[510px]">
                  <img
                    src={activeImage}
                    alt={product.name}
                    className="h-full w-full object-contain p-6 sm:p-8 transition-transform duration-500 hover:scale-[1.02] drop-shadow-[0_24px_26px_rgba(70,56,35,0.18)]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.48),transparent_48%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.08),transparent_50%)]"></div>

                  {productImages.length > 1 && (
                    <>
                      <button
                        onClick={goToPreviousImage}
                        aria-label="Previous image"
                        className="absolute left-4 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full bg-white/70 text-primary-700 backdrop-blur-md shadow-lg transition-colors hover:bg-white hover:text-accent-600"
                      >
                        <FiChevronLeft className="mx-auto h-5 w-5" />
                      </button>
                      <button
                        onClick={goToNextImage}
                        aria-label="Next image"
                        className="absolute right-4 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full bg-white/70 text-primary-700 backdrop-blur-md shadow-lg transition-colors hover:bg-white hover:text-accent-600"
                      >
                        <FiChevronRight className="mx-auto h-5 w-5" />
                      </button>
                    </>
                  )}

                  <div className="absolute left-4 top-4 flex flex-col gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold text-white ${
                        isInStock ? "bg-emerald-500" : "bg-red-500"
                      }`}
                    >
                      {isInStock
                        ? `${availableStock.toLocaleString("en-IN")} in stock`
                        : "Out of stock"}
                    </span>
                    {product?.category?.name && (
                      <span className="rounded-full bg-primary-900 px-3 py-1 text-xs font-bold text-white">
                        {product.category.name}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleWishlistToggle()}
                    className={`absolute right-4 top-4 rounded-full p-2.5 shadow-lg transition-all ${
                      isWishlisted
                        ? "bg-red-500 text-white"
                        : "bg-white/90 text-primary-600 hover:bg-white"
                    }`}
                  >
                    <FiHeart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
                  </button>

                  {productImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-primary-900/62 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                      {activeImageIndex + 1} / {productImages.length}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="xl:pt-2 xl:pl-2 2xl:pl-5">
              <div className="mb-4 flex flex-wrap items-center gap-2.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent-700">
                  {product?.category?.name || "Book"}
                </span>
                <span className="h-1 w-1 rounded-full bg-primary-300" />
                <div className="flex items-center gap-1.5 text-sm font-semibold text-primary-700">
                  <FiStar className="h-4 w-4 fill-current text-accent-500" />
                  <span>
                    {displayReviewCount > 0 ? displayAverageRating.toFixed(1) : "New"}
                  </span>
                  <span className="text-primary-500">
                    ({displayReviewCount} review{displayReviewCount === 1 ? "" : "s"})
                  </span>
                </div>
                <span className="h-1 w-1 rounded-full bg-primary-300" />
                <span className="text-xs font-semibold text-primary-500">
                  {availableStock > 0 ? `${availableStock} left in stock` : "Currently unavailable"}
                </span>
              </div>

              <h1 className="text-4xl font-bold leading-[1.06] tracking-[-0.025em] text-primary-900 sm:text-[3.25rem]">
                {product.name}
              </h1>

              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-primary-600 sm:text-base">
                {product.description}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold">
                {product?.format && (
                  <span className="rounded-full bg-primary-100/80 px-3 py-1 text-primary-700">
                    {product.format}
                  </span>
                )}
                {product?.language && (
                  <span className="rounded-full bg-accent-50 px-3 py-1 text-accent-700">
                    {product.language}
                  </span>
                )}
                {product?.edition && (
                  <span className="rounded-full bg-white/80 px-3 py-1 text-primary-600 ring-1 ring-primary-200/80">
                    {product.edition}
                  </span>
                )}
              </div>

              <div className="mt-6 max-w-xl border-b border-primary-200/80 pb-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-500">
                  Price Breakdown
                </p>
                <div className="mt-1.5 flex items-end gap-3 sm:gap-4">
                  <p className="bg-gradient-to-r from-accent-600 to-accent-700 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
                    ₹{sellingPrice.toLocaleString("en-IN")}
                  </p>
                  <p className="pb-1 text-base font-semibold text-primary-500 line-through">
                    ₹{mrpPrice.toLocaleString("en-IN")}
                  </p>
                  {hasDiscount && (
                    <span className="mb-1 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                      Save {discountPercent}%
                    </span>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-1 text-sm sm:grid-cols-3">
                  <span className="font-semibold text-primary-500">Tax:</span>
                  <span className="font-semibold text-primary-700">
                    {includesTax
                      ? "Included"
                      : taxRate > 0
                        ? `${taxRate}% extra`
                        : "Extra at checkout"}
                  </span>
                  <span className="font-semibold text-primary-500">MRP:</span>
                  <span className="font-semibold text-primary-500 line-through">
                    ₹{mrpPrice.toLocaleString("en-IN")}
                  </span>
                  <span className="font-semibold text-primary-500">Delivery:</span>
                  <span className="font-semibold text-primary-700">{deliveryLabel}</span>
                </div>

                {hasDiscount && (
                  <p className="mt-2 text-xs font-semibold text-emerald-700">
                    You save ₹{(mrpPrice - sellingPrice).toLocaleString("en-IN")}
                  </p>
                )}
              </div>

              <div className="mt-7 max-w-xl space-y-3.5">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="inline-flex items-center gap-2 border-b border-primary-300/80 pb-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-8 w-8 rounded-full border border-primary-200/80 bg-white/70 text-primary-700 transition-colors hover:bg-primary-100"
                    >
                      <FiMinus className="mx-auto h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-[2.5rem] text-center text-base font-bold text-primary-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity((current) =>
                          availableStock
                            ? Math.min(current + 1, availableStock)
                            : current
                        )
                      }
                      disabled={!isInStock || quantity >= availableStock}
                      className="h-8 w-8 rounded-full border border-primary-200/80 bg-white/70 text-primary-700 transition-colors hover:bg-primary-100 disabled:opacity-50"
                    >
                      <FiPlus className="mx-auto h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-xs font-semibold text-primary-600">
                    {canPurchase
                      ? `Total for ${quantity} item${quantity === 1 ? "" : "s"}: ₹${totalPrice.toLocaleString("en-IN")}`
                      : isInStock
                        ? `Unavailable in ${selectedLocationLabel}`
                        : "Currently out of stock"}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <button
                    onClick={handleAddToCart}
                    disabled={!canPurchase}
                    className={`h-12 rounded-2xl px-5 text-sm font-semibold transition-all ${
                      canPurchase
                        ? "bg-primary-900 text-white shadow-sm hover:bg-primary-800"
                        : "cursor-not-allowed bg-primary-200 text-primary-600"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <FiShoppingCart className="h-4 w-4" />
                      Add to Cart
                    </span>
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={!canPurchase}
                    className={`h-12 rounded-2xl px-5 text-sm font-semibold transition-all ${
                      canPurchase
                        ? "bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-200/70 hover:from-accent-600 hover:to-accent-700"
                        : "cursor-not-allowed bg-primary-200 text-primary-600"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <FiCreditCard className="h-4 w-4" />
                      Buy Now
                    </span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-1">
                    {canPurchase && (
                      <p className="text-[11px] text-primary-500">
                        Buy Now takes you directly to secure checkout.
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleWishlistToggle()}
                    className={`text-sm font-semibold transition-colors ${
                      isWishlisted
                        ? "text-red-600"
                        : "text-primary-700 hover:text-accent-600"
                    }`}
                  >
                    {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
                  </button>
                </div>
              </div>

              {!canPurchase && (
                <p className="mt-3 text-sm text-red-600">
                  {isInStock
                    ? "Select another delivery location from the header to buy this book."
                    : "This book is out of stock right now. Please check back soon."}
                </p>
              )}

              <div className="mt-7 space-y-3">
                <div className="flex items-center gap-2.5 text-sm font-medium text-primary-700">
                  <FiTruck className="h-4 w-4 text-accent-600" />
                  <span>
                    {!product?.shipping
                      ? "Shipping unavailable"
                      : shippingCharge > 0
                        ? `Shipping ₹${shippingCharge.toLocaleString("en-IN")}`
                        : "Free shipping"}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-sm font-medium text-primary-700">
                  <FiClock className="h-4 w-4 text-accent-600" />
                  <span>{deliveryLabel}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm font-medium text-primary-700">
                  <FiRefreshCw className="h-4 w-4 text-accent-600" />
                  <span>Returns in {returnWindowDays} days</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm font-medium text-primary-700">
                  <FiShield className="h-4 w-4 text-primary-700" />
                  <span>Secure payments and checkout protection</span>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-14">
            <div className="flex flex-wrap items-center gap-1 border-b border-primary-200/80 pb-2">
              {infoTabs.map((tab) => {
                const isActive = activeInfoTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveInfoTab(tab.id)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-all sm:px-5 sm:text-sm ${
                      isActive
                        ? "bg-primary-900 text-white"
                        : "text-primary-500 hover:text-primary-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {(activeInfoTab === "overview" || activeInfoTab === "details") && (
              <div className="pt-8">
                {activeInfoTab === "overview" ? (
                  <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
                    <div>
                      <h2 className="mb-4 text-xl font-bold text-primary-900">Why you'll love it</h2>
                      {overviewPoints.length ? (
                        <ul className="m-0 list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-primary-700">
                          {overviewPoints.map((point) => (
                            <li key={point}>{point}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-primary-600">
                          No highlights added for this product yet.
                        </p>
                      )}
                    </div>

                    <div>
                      <h2 className="mb-4 text-xl font-bold text-primary-900">Perfect for</h2>
                      {perfectForPoints.length ? (
                        <ul className="m-0 list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-primary-700">
                          {perfectForPoints.map((point) => (
                            <li key={point}>{point}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-primary-600">
                          No usage tags added yet.
                        </p>
                      )}
                      <div className="mt-8">
                        <h3 className="mb-4 text-base font-bold text-primary-900">Product Details</h3>
                        {productSpecs.length ? (
                          <div className="grid grid-cols-1 gap-x-10 gap-y-2 sm:grid-cols-2">
                            {productSpecs.map((spec) => (
                              <div key={spec.label} className="flex items-center justify-between gap-4 border-b border-primary-100/80 py-1.5">
                                <span className="text-sm font-semibold text-primary-700">{spec.label}</span>
                                <span className="text-right text-sm text-primary-600">{spec.value}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-primary-600">
                            Product specifications are not available yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_1fr]">
                    <div>
                      <h2 className="mb-4 text-xl font-bold text-primary-900">Reading & Handling</h2>
                      {detailsCarePoints.length ? (
                        <ul className="m-0 list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-primary-700">
                          {detailsCarePoints.map((point) => (
                            <li key={point}>{point}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-primary-600">
                          No reading and handling notes added yet.
                        </p>
                      )}
                    </div>
                    <div>
                      <h3 className="mb-4 text-base font-bold text-primary-900">Shipping & Delivery</h3>
                      <ul className="m-0 space-y-3 p-0 text-sm text-primary-700">
                        <li className="flex items-start gap-2.5">
                          <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{deliveryLabel}</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>
                            {!product?.shipping
                              ? "Shipping is currently unavailable for this item."
                              : shippingCharge > 0
                                ? `Shipping charge ₹${shippingCharge.toLocaleString("en-IN")} applies.`
                                : "Free shipping is available for this item."}
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>Returns accepted within {returnWindowDays} days of delivery.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeInfoTab === "reviews" && (
              <div className="pt-8">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="flex items-center text-xl font-bold text-primary-900">
                    <FiStar className="mr-2 h-5 w-5 text-accent-500" />
                    Customer Reviews
                  </h2>
                  <button
                    onClick={handleReviewButtonClick}
                    className="rounded-full bg-primary-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
                  >
                    {myReview ? "Edit Your Review" : "Write a Review"}
                  </button>
                </div>

                {showReviewForm && (
                  <ReviewForm
                    rating={reviewRating}
                    comment={reviewComment}
                    submitting={reviewSubmitting}
                    hasExistingReview={Boolean(myReview)}
                    onRatingChange={setReviewRating}
                    onCommentChange={(event) => setReviewComment(event.target.value)}
                    onCancel={() => setShowReviewForm(false)}
                    onSubmit={handleSubmitReview}
                  />
                )}

                <ReviewSummary
                  averageRating={displayAverageRating}
                  totalReviews={displayReviewCount}
                  distribution={ratingDistribution}
                />

                <ReviewList reviews={reviews} loading={reviewLoading} />
              </div>
            )}
          </section>

          <section className="mt-16 pb-10">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center text-2xl font-bold text-primary-900">
                <FiTag className="mr-2 h-6 w-6 text-accent-500" />
                Combine with
              </h2>
              <button
                onClick={() => navigate("/categories")}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 transition-colors hover:text-accent-600"
              >
                Browse more
                <FiArrowLeft className="h-4 w-4 rotate-180" />
              </button>
            </div>

            {relatedProducts.length < 1 ? (
              <div className="py-16 text-center">
                <FiPackage className="mx-auto mb-4 h-14 w-14 text-primary-300" />
                <p className="text-lg font-semibold text-primary-600">No similar products found</p>
                <p className="mt-1 text-sm text-primary-500">New recommendations will appear here soon.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {relatedProducts.slice(0, 4).map((p) => {
                  const relatedRating = Number(p?.rating || 0);
                  const relatedReviewCount = Number(p?.numReviews || 0);
                  const isRelatedWishlisted = wishlist.some((item) => item._id === p._id);

                  return (
                    <div
                      key={p._id}
                      className="group grid grid-cols-[70px,1fr,auto] items-center gap-4 border-b border-primary-200/70 pb-4"
                    >
                      <button
                        onClick={() => navigate(`/product/${p.slug}`)}
                        className="relative h-20 overflow-hidden rounded-xl bg-gradient-to-br from-primary-50/80 to-accent-50/70"
                      >
                        <img
                          src={p.imageUrl || "https://placehold.co/300x400/f5f0e8/826b4d?text=No+Image"}
                          alt={p.name}
                          className="h-full w-full object-contain p-2"
                        />
                      </button>

                      <div className="min-w-0">
                        <button
                          onClick={() => navigate(`/product/${p.slug}`)}
                          className="line-clamp-2 text-left text-sm font-bold leading-5 text-primary-900 transition-colors hover:text-accent-600"
                        >
                          {p.name}
                        </button>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3">
                          <span className="text-base font-bold text-accent-600">
                            ₹{Number(p.price || 0).toLocaleString("en-IN")}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600">
                            <FiStar className="h-4 w-4 fill-current text-accent-400" />
                            {relatedReviewCount > 0 ? relatedRating.toFixed(1) : "New"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          onClick={() => handleWishlistToggle(p)}
                          className={`rounded-full p-2 transition-all ${
                            isRelatedWishlisted
                              ? "bg-red-500 text-white"
                              : "bg-white/70 text-primary-600 hover:bg-white"
                          }`}
                        >
                          <FiHeart className={`h-4 w-4 ${isRelatedWishlisted ? "fill-current" : ""}`} />
                        </button>
                        <button
                          onClick={() => handleQuickAddRelated(p)}
                          className="rounded-full bg-primary-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-800"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-14">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl font-bold text-primary-900">Recently viewed</h3>
                <button
                  onClick={() => navigate("/categories")}
                  className="text-sm font-semibold text-primary-700 transition-colors hover:text-accent-600"
                >
                  View all
                </button>
              </div>

              {recentlyViewedProducts.length < 1 ? (
                <p className="text-sm text-primary-500">Products you visit will appear here.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {recentlyViewedProducts.map((item) => (
                    <button
                      key={item._id}
                      onClick={() => navigate(`/product/${item.slug}`)}
                      className="group text-left"
                    >
                      <div className="relative h-52 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-50/80 to-accent-50/70">
                        <img
                          src={item.imageUrl || "https://placehold.co/300x400/f5f0e8/826b4d?text=No+Image"}
                          alt={item.name}
                          className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                      </div>
                      <h4 className="mt-3 line-clamp-2 text-sm font-semibold leading-5 text-primary-900 group-hover:text-accent-600">
                        {item.name}
                      </h4>
                      <p className="mt-1 text-sm font-bold text-accent-600">
                        ₹{Number(item.price || 0).toLocaleString("en-IN")}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetails;
