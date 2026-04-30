import React, { useEffect, useMemo, useState } from "react";
import Layout from "./../components/Layout/Layout";
import { useCart } from "../context/cart";
import { useAuth } from "../context/auth";
import { useConfirm } from "../context/confirm";
import { useLocationContext } from "../context/location";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCheckCircle,
  FiCreditCard,
  FiGlobe,
  FiHome,
  FiLayers,
  FiMapPin,
  FiPhone,
  FiRefreshCw,
  FiShield,
  FiShoppingCart,
  FiSmartphone,
  FiTrash2,
  FiTruck,
  FiUser,
} from "react-icons/fi";
import axios from "../config/axios";
import toast from "react-hot-toast";
import { isProductAvailableInLocation } from "../utils/locationUtils";
import {
  clearBuyNowCheckoutItem,
  getBuyNowCheckoutItem,
} from "../utils/checkoutUtils";
import {
  createAddressPayload,
  formatAddressText,
  normalizeAddressBook,
  normalizeAddressForForm,
  pickDefaultAddress,
  resolveAddressId,
} from "../utils/addressUtils";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
let razorpayScriptPromise;

const PAYMENT_OPTIONS = [
  {
    id: "all",
    title: "All Methods",
    subtitle: "UPI, cards, wallets",
    icon: FiLayers,
  },
  {
    id: "upi",
    title: "UPI",
    subtitle: "GPay, PhonePe, Paytm",
    icon: FiSmartphone,
  },
  {
    id: "card",
    title: "Card",
    subtitle: "Credit / Debit cards",
    icon: FiCreditCard,
  },
  {
    id: "netbanking",
    title: "NetBanking",
    subtitle: "All major banks",
    icon: FiGlobe,
  },
  {
    id: "wallet",
    title: "Wallet",
    subtitle: "Paytm, Mobikwik",
    icon: FiShield,
  },
];

const RAZORPAY_METHOD_MAP = {
  upi: {
    upi: true,
    card: false,
    netbanking: false,
    wallet: false,
    emi: false,
    paylater: false,
  },
  card: {
    upi: false,
    card: true,
    netbanking: false,
    wallet: false,
    emi: false,
    paylater: false,
  },
  netbanking: {
    upi: false,
    card: false,
    netbanking: true,
    wallet: false,
    emi: false,
    paylater: false,
  },
  wallet: {
    upi: false,
    card: false,
    netbanking: false,
    wallet: true,
    emi: false,
    paylater: false,
  },
};

const loadRazorpayScript = () => {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = RAZORPAY_SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        razorpayScriptPromise = null;
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  return razorpayScriptPromise;
};

const formatCurrency = (value) => `₹${(Number(value) || 0).toLocaleString("en-IN")}`;
const checkoutInputClass =
  "h-10 w-full border-b border-primary-300 bg-transparent px-0 text-sm text-primary-900 placeholder:text-primary-400 focus:border-accent-500 focus:outline-none";
const createBlankAddressForm = (fallback = {}) =>
  normalizeAddressForForm("", fallback);
const normalizeCompare = (value) => String(value || "").trim().toLowerCase();
const isSameAddressRecord = (leftAddress = {}, rightAddress = {}) =>
  normalizeCompare(leftAddress.fullName) === normalizeCompare(rightAddress.fullName) &&
  normalizeCompare(leftAddress.phone) === normalizeCompare(rightAddress.phone) &&
  normalizeCompare(leftAddress.line1) === normalizeCompare(rightAddress.line1) &&
  normalizeCompare(leftAddress.line2) === normalizeCompare(rightAddress.line2) &&
  normalizeCompare(leftAddress.city) === normalizeCompare(rightAddress.city) &&
  normalizeCompare(leftAddress.state) === normalizeCompare(rightAddress.state) &&
  normalizeCompare(leftAddress.pincode) === normalizeCompare(rightAddress.pincode) &&
  normalizeCompare(leftAddress.country) === normalizeCompare(rightAddress.country) &&
  normalizeCompare(leftAddress.landmark) === normalizeCompare(rightAddress.landmark) &&
  normalizeCompare(leftAddress.addressType) === normalizeCompare(rightAddress.addressType);

const normalizedQty = (item) => {
  const qty = Number(item?.qty);
  return Number.isFinite(qty) && qty > 0 ? qty : 1;
};

const normalizedPrice = (item) => {
  const price = Number(item?.price);
  return Number.isFinite(price) && price > 0 ? price : 0;
};

const CheckoutPage = () => {
  const [auth, setAuth] = useAuth();
  const [cart, setCart] = useCart();
  const {
    selectedLocation,
    selectedLocationLabel,
    customerLocation,
    locationContextId,
    locationContext,
    isServiceable,
    deliveryEta,
    selectedAreaDistanceKm,
  } = useLocationContext();
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState("");
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState("all");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(true);
  const [editingAddressId, setEditingAddressId] = useState("");
  const [addressForm, setAddressForm] = useState(createBlankAddressForm());
  const confirm = useConfirm();
  const navigate = useNavigate();
  const location = useLocation();

  const isBuyNowMode = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("mode") === "buy-now";
  }, [location.search]);

  const buyNowItem = useMemo(
    () => (isBuyNowMode ? getBuyNowCheckoutItem() : null),
    [isBuyNowMode]
  );
  const fallbackMeta = useMemo(
    () => ({
      fullName: auth?.user?.name || "",
      phone: auth?.user?.phone || "",
    }),
    [auth?.user?.name, auth?.user?.phone]
  );

  const selectedDeliveryAddress = useMemo(() => {
    const explicitSelected = savedAddresses.find(
      (entry) => resolveAddressId(entry) === selectedAddressId
    );
    return explicitSelected || pickDefaultAddress(savedAddresses);
  }, [savedAddresses, selectedAddressId]);

  const selectedDeliveryAddressText = useMemo(
    () => formatAddressText(selectedDeliveryAddress),
    [selectedDeliveryAddress]
  );

  const hydrateAddressBook = (latestUser, preferredAddressId = "") => {
    const nextFallbackMeta = {
      fullName: latestUser?.name || "",
      phone: latestUser?.phone || "",
    };
    const normalizedBook = normalizeAddressBook(
      latestUser?.addresses,
      latestUser?.profileAddress || latestUser?.address,
      nextFallbackMeta
    );
    const preferredAddress = preferredAddressId
      ? normalizedBook.find(
          (entry) => resolveAddressId(entry) === preferredAddressId
        )
      : null;
    const defaultAddress = preferredAddress || pickDefaultAddress(normalizedBook);
    const selectedId = defaultAddress
      ? resolveAddressId(defaultAddress, formatAddressText(defaultAddress))
      : "";
    const initialForm = defaultAddress
      ? normalizeAddressForForm(defaultAddress, nextFallbackMeta)
      : createBlankAddressForm(nextFallbackMeta);

    setSavedAddresses(normalizedBook);
    setSelectedAddressId(selectedId);
    setShowAddressForm(normalizedBook.length === 0);
    setEditingAddressId("");
    setAddressForm(initialForm);
  };

  useEffect(() => {
    let active = true;
    loadRazorpayScript().then((ready) => {
      if (active) setCheckoutReady(ready);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isBuyNowMode) return;
    if (buyNowItem?._id) return;

    toast.error("Buy now session expired. Please try again.");
    navigate("/cart");
  }, [buyNowItem, isBuyNowMode, navigate]);

  useEffect(() => {
    if (!auth?.token) return;

    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        const { data } = await axios.get("/api/v1/auth/profile");
        const latestUser = data?.user;
        if (!latestUser) return;

        setAuth((previous) => ({
          ...previous,
          user: latestUser,
        }));

        const localAuth = localStorage.getItem("auth");
        const parsedAuth = localAuth ? JSON.parse(localAuth) : {};
        parsedAuth.user = latestUser;
        localStorage.setItem("auth", JSON.stringify(parsedAuth));
        hydrateAddressBook(latestUser);
      } catch (error) {
        console.log("Unable to fetch profile:", error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [auth?.token, setAuth]);

  const checkoutItems = useMemo(() => {
    const sourceItems = isBuyNowMode
      ? buyNowItem
        ? [buyNowItem]
        : []
      : cart || [];

    return sourceItems.map((item) => ({
      ...item,
      qty: normalizedQty(item),
      price: normalizedPrice(item),
    }));
  }, [buyNowItem, cart, isBuyNowMode]);

  const itemCount = useMemo(
    () => checkoutItems.reduce((sum, item) => sum + item.qty, 0),
    [checkoutItems]
  );

  const subtotal = useMemo(
    () => checkoutItems.reduce((sum, item) => sum + item.price * item.qty, 0),
    [checkoutItems]
  );

  const shipping = 0;
  const total = subtotal + shipping;

  const unavailableItems = useMemo(
    () =>
      checkoutItems.filter(
        (item) => !isProductAvailableInLocation(item, selectedLocation)
      ),
    [checkoutItems, selectedLocation]
  );
  const hasUnavailableItems = unavailableItems.length > 0;

  const hasDistanceRangeConflict =
    Boolean(selectedLocation) &&
    Boolean(locationContext?.contextId) &&
    !isServiceable;

  const paymentLocationMeta = {
    latitude: customerLocation?.latitude ?? null,
    longitude: customerLocation?.longitude ?? null,
    pincode: customerLocation?.pincode || "",
  };

  const getPaymentCartPayload = () =>
    checkoutItems.map((item) => ({
      _id: item._id,
      name: item.name,
      price: item.price,
      qty: item.qty,
    }));

  const validateCartAgainstLocation = async (paymentCart) => {
    const { data } = await axios.post("/api/v1/location/validate-cart", {
      cart: paymentCart,
      locationContextId,
      selectedLocation,
      customerLocation: paymentLocationMeta,
    });

    if (!data?.success) {
      throw new Error(data?.message || "Unable to validate cart for delivery");
    }
    if (!data?.allowed) {
      throw new Error(data?.message || "Selected location is not serviceable");
    }
    return data;
  };

  const getRazorpayMethodConfig = () => {
    if (selectedPaymentOption === "all") return undefined;
    return RAZORPAY_METHOD_MAP[selectedPaymentOption];
  };

  const checkoutPath = isBuyNowMode ? "/checkout?mode=buy-now" : "/checkout";

  const handleAddressFieldChange = (field, value) => {
    setAddressForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const selectDeliveryAddress = (addressEntry) => {
    const nextAddressId = resolveAddressId(
      addressEntry,
      formatAddressText(addressEntry)
    );
    setSelectedAddressId(nextAddressId);
    setShowAddressForm(false);
    setEditingAddressId("");
    setAddressForm(normalizeAddressForForm(addressEntry, fallbackMeta));
  };

  const openAddressForm = (mode = "add") => {
    if (mode === "edit" && selectedDeliveryAddress) {
      const selectedId = resolveAddressId(
        selectedDeliveryAddress,
        formatAddressText(selectedDeliveryAddress)
      );
      setEditingAddressId(selectedId);
      setAddressForm(normalizeAddressForForm(selectedDeliveryAddress, fallbackMeta));
      setShowAddressForm(true);
      return;
    }

    setEditingAddressId("");
    setAddressForm(createBlankAddressForm(fallbackMeta));
    setShowAddressForm(true);
  };

  const validateAddressForm = () => {
    const fullName = addressForm.fullName.trim();
    const phone = addressForm.phone.trim();
    const line1 = addressForm.line1.trim();
    const city = addressForm.city.trim();
    const state = addressForm.state.trim();
    const pincode = addressForm.pincode.trim();

    if (!fullName || !phone || !line1 || !city || !state || !pincode) {
      toast.error("Please fill all required delivery details");
      return false;
    }

    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      toast.error("Please enter a valid phone number");
      return false;
    }

    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(pincode)) {
      toast.error("Please enter a valid 6-digit pincode");
      return false;
    }

    return true;
  };

  const handleSaveAddress = async () => {
    if (!auth?.token) {
      navigate("/login", { state: checkoutPath });
      return;
    }

    if (!validateAddressForm()) return;

    try {
      setSavingAddress(true);
      const addressPayload = createAddressPayload(addressForm);
      const nextAddresses = [...savedAddresses].map((entry) => ({
        ...entry,
        isDefault: Boolean(entry.isDefault),
      }));

      if (editingAddressId) {
        const editingIndex = nextAddresses.findIndex(
          (entry) => resolveAddressId(entry) === editingAddressId
        );
        if (editingIndex >= 0) {
          nextAddresses[editingIndex] = {
            ...nextAddresses[editingIndex],
            ...addressPayload,
          };
        } else {
          nextAddresses.unshift({
            ...addressPayload,
            isDefault: nextAddresses.length === 0,
          });
        }
      } else {
        nextAddresses.unshift({
          ...addressPayload,
          isDefault: nextAddresses.length === 0,
        });
      }

      const hasDefaultAddress = nextAddresses.some((entry) => entry.isDefault);
      if (!hasDefaultAddress && nextAddresses.length) {
        nextAddresses[0].isDefault = true;
      }

      const profileAddressSource =
        auth?.user?.profileAddress || auth?.user?.address || addressPayload;
      const profileAddressPayload = createAddressPayload(
        normalizeAddressForForm(profileAddressSource, fallbackMeta)
      );

      const { data } = await axios.put("/api/v1/auth/profile", {
        addresses: nextAddresses,
        profileAddress: profileAddressPayload,
      });

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.updatedUser) {
        const matchedAddress = normalizeAddressBook(
          data.updatedUser?.addresses,
          data.updatedUser?.profileAddress || data.updatedUser?.address,
          {
            fullName: data.updatedUser?.name || "",
            phone: data.updatedUser?.phone || "",
          }
        ).find((entry) => isSameAddressRecord(entry, addressPayload));

        hydrateAddressBook(
          data.updatedUser,
          matchedAddress
            ? resolveAddressId(matchedAddress, formatAddressText(matchedAddress))
            : ""
        );

        setAuth({
          ...auth,
          user: data.updatedUser,
        });

        const localAuth = localStorage.getItem("auth");
        const parsedAuth = localAuth ? JSON.parse(localAuth) : {};
        parsedAuth.user = data.updatedUser;
        localStorage.setItem("auth", JSON.stringify(parsedAuth));
      }

      toast.success(editingAddressId ? "Delivery address updated" : "Delivery address saved");
    } catch (error) {
      console.log(error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save address"
      );
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressEntry) => {
    if (!auth?.token) {
      navigate("/login", { state: checkoutPath });
      return;
    }

    const deleteAddressId = resolveAddressId(
      addressEntry,
      formatAddressText(addressEntry)
    );
    if (!deleteAddressId) return;

    const shouldDelete = await confirm({
      title: "Delete address?",
      message: `Remove this delivery address?\n\n${formatAddressText(addressEntry)}`,
      confirmText: "Delete Address",
      cancelText: "Cancel",
      tone: "danger",
    });
    if (!shouldDelete) return;

    const remainingAddresses = savedAddresses.filter(
      (entry) =>
        resolveAddressId(entry, formatAddressText(entry)) !==
        deleteAddressId
    );

    if (!remainingAddresses.length) {
      toast.error("At least one address is required for checkout");
      return;
    }

    const currentProfileAddress = createAddressPayload(
      normalizeAddressForForm(
        auth?.user?.profileAddress || auth?.user?.address,
        fallbackMeta
      )
    );
    const deletingProfileAddress = isSameAddressRecord(
      currentProfileAddress,
      addressEntry
    );
    const fallbackProfileAddress = pickDefaultAddress(remainingAddresses);
    const nextProfileAddress = deletingProfileAddress && fallbackProfileAddress
      ? createAddressPayload(normalizeAddressForForm(fallbackProfileAddress, fallbackMeta))
      : currentProfileAddress;

    const fallbackSelectedAddress = pickDefaultAddress(remainingAddresses);
    const preferredSelectedAddressId =
      resolveAddressId(selectedDeliveryAddress, selectedDeliveryAddressText) ===
      deleteAddressId
        ? resolveAddressId(
            fallbackSelectedAddress,
            formatAddressText(fallbackSelectedAddress)
          )
        : resolveAddressId(
            selectedDeliveryAddress,
            selectedDeliveryAddressText
          );

    try {
      setDeletingAddressId(deleteAddressId);
      const { data } = await axios.put("/api/v1/auth/profile", {
        addresses: remainingAddresses,
        profileAddress: nextProfileAddress,
      });

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.updatedUser) {
        hydrateAddressBook(data.updatedUser, preferredSelectedAddressId);

        setAuth({
          ...auth,
          user: data.updatedUser,
        });

        const localAuth = localStorage.getItem("auth");
        const parsedAuth = localAuth ? JSON.parse(localAuth) : {};
        parsedAuth.user = data.updatedUser;
        localStorage.setItem("auth", JSON.stringify(parsedAuth));
      }

      toast.success("Address deleted");
    } catch (error) {
      console.log(error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to delete address"
      );
    } finally {
      setDeletingAddressId("");
    }
  };

  const handleRazorpayPayment = async () => {
    if (!auth?.token) {
      navigate("/login", { state: checkoutPath });
      return;
    }

    if (!selectedDeliveryAddress) {
      toast.error("Please select a delivery address first");
      setShowAddressForm(true);
      return;
    }

    if (!checkoutItems.length) {
      toast.error("No items available for checkout");
      navigate(isBuyNowMode ? "/" : "/cart");
      return;
    }

    if (!selectedLocation) {
      toast.error("Please select your delivery location first");
      return;
    }

    if (hasUnavailableItems) {
      toast.error("Remove unavailable books for current location to continue");
      return;
    }

    if (hasDistanceRangeConflict) {
      toast.error("Selected delivery area is outside service radius");
      return;
    }

    try {
      setLoading(true);

      const isScriptReady = await loadRazorpayScript();
      if (!isScriptReady || !window.Razorpay) {
        throw new Error("Razorpay SDK failed to load");
      }

      const paymentCart = getPaymentCartPayload();
      await validateCartAgainstLocation(paymentCart);
      const { data: orderData } = await axios.post(
        "/api/v1/payment/razorpay/create-order",
        {
          cart: paymentCart,
          locationContextId,
          selectedLocation,
          customerLocation: paymentLocationMeta,
          deliveryAddress: selectedDeliveryAddress,
        }
      );

      if (!orderData?.success || !orderData?.order?.id) {
        throw new Error(orderData?.message || "Unable to initialize payment");
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency || "INR",
        name: "Booklet",
        description: isBuyNowMode
          ? "Buy now checkout"
          : `Checkout for ${itemCount} item${itemCount === 1 ? "" : "s"}`,
        order_id: orderData.order.id,
        prefill: {
          name: selectedDeliveryAddress?.fullName || auth?.user?.name || "",
          email: auth?.user?.email || "",
          contact: selectedDeliveryAddress?.phone || auth?.user?.phone || "",
        },
        notes: {
          address:
            selectedDeliveryAddressText ||
            formatAddressText(auth?.user?.profileAddress || auth?.user?.address),
        },
        theme: {
          color: "#f97316",
        },
        handler: async (response) => {
          try {
            const { data: verifyData } = await axios.post(
              "/api/v1/payment/razorpay/verify-payment",
              {
                cart: paymentCart,
                locationContextId,
                selectedLocation,
                customerLocation: paymentLocationMeta,
                deliveryAddress: selectedDeliveryAddress,
                ...response,
              }
            );

            if (!verifyData?.success) {
              throw new Error(verifyData?.message || "Payment verification failed");
            }

            if (isBuyNowMode) {
              clearBuyNowCheckoutItem();
            } else {
              localStorage.removeItem("cart");
              setCart([]);
            }

            toast.success("Payment successful. Order placed.");
            navigate("/dashboard/user/orders");
          } catch (verifyError) {
            console.log("Verify payment error:", verifyError);
            toast.error(
              verifyError?.response?.data?.message ||
                verifyError?.message ||
                "Payment verification failed"
            );
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const methodConfig = getRazorpayMethodConfig();
      if (methodConfig) {
        options.method = methodConfig;
      }

      const paymentObject = new window.Razorpay(options);
      paymentObject.on("payment.failed", (response) => {
        setLoading(false);
        toast.error(
          response?.error?.description || "Payment failed. Please try again."
        );
      });
      paymentObject.open();
    } catch (error) {
      console.log("Razorpay checkout error:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to start payment"
      );
      setLoading(false);
    }
  };

  const isCheckoutDisabled =
    loading ||
    profileLoading ||
    savingAddress ||
    !checkoutReady ||
    !auth?.token ||
    !selectedDeliveryAddress ||
    !selectedLocation ||
    hasDistanceRangeConflict ||
    hasUnavailableItems ||
    !checkoutItems.length;

  const backPath = isBuyNowMode
    ? checkoutItems[0]?.slug
      ? `/product/${checkoutItems[0].slug}`
      : "/"
    : "/cart";

  return (
    <Layout title={isBuyNowMode ? "Buy Now Checkout - Booklet" : "Checkout - Booklet"}>
      <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-primary-50 via-white to-accent-50 pb-24 pt-4 lg:pb-10">
        <div className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-accent-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-primary-100/70 blur-3xl" />

        <div className="relative mx-auto w-full max-w-[1320px] px-4 sm:px-8 lg:px-10 xl:px-12">
          <header className="mb-8 grid gap-4 border-b border-primary-200/80 pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-700">
                {isBuyNowMode ? "Instant Purchase" : "Secure Checkout"}
              </p>
              <h1 className="mt-2 text-3xl font-bold text-primary-900 sm:text-4xl">
                {isBuyNowMode ? "Buy Now Checkout" : "Complete Your Order"}
              </h1>
              <p className="mt-2 text-sm text-primary-600 sm:text-base">
                {isBuyNowMode
                  ? "Checkout this selected product now. Your cart items stay unchanged."
                  : "Review your cart items and pay securely in one step."}
              </p>
              {selectedLocationLabel && (
                <p className="mt-1.5 text-xs font-medium text-primary-500">
                  Delivering to <span className="font-semibold text-primary-700">{selectedLocationLabel}</span>
                  {deliveryEta ? ` • ETA ${deliveryEta}` : ""}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate(backPath)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 transition-colors hover:text-accent-700"
            >
              <FiArrowLeft className="h-4 w-4" />
              {isBuyNowMode ? "Back to product" : "Back to cart"}
            </button>
          </header>

          {checkoutItems.length === 0 ? (
            <div className="py-20 text-center">
              <FiShoppingCart className="mx-auto h-10 w-10 text-primary-400" />
              <h2 className="mt-4 text-xl font-semibold text-primary-900">No items available</h2>
              <p className="mt-1.5 text-sm text-primary-600">
                {isBuyNowMode
                  ? "Please choose Buy Now from a product page again."
                  : "Your cart is empty. Add books before checkout."}
              </p>
              <button
                onClick={() => navigate(isBuyNowMode ? "/" : "/cart")}
                className="mt-6 text-sm font-semibold text-accent-700 underline underline-offset-4"
              >
                {isBuyNowMode ? "Continue Shopping" : "Go to Cart"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-14">
              <div className="space-y-10">
                <section className="border-b border-primary-200/80 pb-8">
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-primary-900">Delivery Address</h2>
                      <p className="text-xs font-medium text-primary-500 sm:text-sm">
                        {selectedDeliveryAddress && !showAddressForm
                          ? "Choose one saved address for this order"
                          : "Fill shipping details before payment"}
                      </p>
                    </div>
                    {!showAddressForm && (
                      <div className="inline-flex items-center gap-3">
                        {selectedDeliveryAddress && (
                          <button
                            type="button"
                            onClick={() => openAddressForm("edit")}
                            className="text-xs font-semibold text-primary-700 underline underline-offset-4 hover:text-accent-700"
                          >
                            Edit Selected
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openAddressForm("add")}
                          className="text-xs font-semibold text-primary-700 underline underline-offset-4 hover:text-accent-700"
                        >
                          Add New Address
                        </button>
                      </div>
                    )}
                  </div>

                  {profileLoading ? (
                    <p className="text-sm text-primary-600">Loading your saved address...</p>
                  ) : !showAddressForm && savedAddresses.length > 0 ? (
                    <div className="space-y-3">
                      <div className="divide-y divide-primary-100">
                        {savedAddresses.map((addressEntry, index) => {
                          const optionId = resolveAddressId(
                            addressEntry,
                            `${addressEntry.line1}-${addressEntry.pincode}-${index}`
                          );
                          const isSelected =
                            optionId ===
                            resolveAddressId(
                              selectedDeliveryAddress,
                              selectedDeliveryAddressText
                            );
                          return (
                            <div
                              key={optionId}
                              className="flex items-start justify-between gap-3 py-2.5"
                            >
                              <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5">
                                <input
                                  type="radio"
                                  name="delivery-address"
                                  checked={isSelected}
                                  onChange={() => selectDeliveryAddress(addressEntry)}
                                  className="mt-1 h-3.5 w-3.5 accent-accent-600"
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm leading-relaxed text-primary-700">
                                    {formatAddressText(addressEntry)}
                                  </span>
                                  <span className="mt-1 inline-flex items-center gap-2 text-[11px] font-semibold text-primary-500">
                                    {(addressEntry.addressType || "home").toUpperCase()}
                                    {isSelected ? (
                                      <span className="inline-flex items-center gap-1 text-emerald-700">
                                        <FiCheckCircle className="h-3.5 w-3.5" />
                                        Selected
                                      </span>
                                    ) : null}
                                  </span>
                                </span>
                              </label>
                              <button
                                type="button"
                                onClick={() => handleDeleteAddress(addressEntry)}
                                disabled={deletingAddressId === optionId}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:text-red-300"
                              >
                                <FiTrash2 className="h-3.5 w-3.5" />
                                {deletingAddressId === optionId ? "Deleting" : "Delete"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <form
                      className="space-y-4"
                      onSubmit={(event) => {
                        event.preventDefault();
                        handleSaveAddress();
                      }}
                    >
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-primary-600">
                            <FiUser className="h-3.5 w-3.5" />
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={addressForm.fullName}
                            onChange={(event) =>
                              handleAddressFieldChange("fullName", event.target.value)
                            }
                            className={checkoutInputClass}
                            placeholder="Enter full name"
                            required
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-primary-600">
                            <FiPhone className="h-3.5 w-3.5" />
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={addressForm.phone}
                            onChange={(event) =>
                              handleAddressFieldChange("phone", event.target.value)
                            }
                            className={checkoutInputClass}
                            placeholder="10-digit mobile number"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-primary-600">
                          <FiHome className="h-3.5 w-3.5" />
                          Address Line 1
                        </label>
                        <input
                          type="text"
                          value={addressForm.line1}
                          onChange={(event) =>
                            handleAddressFieldChange("line1", event.target.value)
                          }
                          className={checkoutInputClass}
                          placeholder="House no, building, street"
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-primary-600">
                          <FiMapPin className="h-3.5 w-3.5" />
                          Address Line 2
                        </label>
                        <input
                          type="text"
                          value={addressForm.line2}
                          onChange={(event) =>
                            handleAddressFieldChange("line2", event.target.value)
                          }
                          className={checkoutInputClass}
                          placeholder="Area, locality (optional)"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary-600">
                            City
                          </label>
                          <input
                            type="text"
                            value={addressForm.city}
                            onChange={(event) =>
                              handleAddressFieldChange("city", event.target.value)
                            }
                            className={checkoutInputClass}
                            placeholder="City"
                            required
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary-600">
                            State
                          </label>
                          <input
                            type="text"
                            value={addressForm.state}
                            onChange={(event) =>
                              handleAddressFieldChange("state", event.target.value)
                            }
                            className={checkoutInputClass}
                            placeholder="State"
                            required
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary-600">
                            Pincode
                          </label>
                          <input
                            type="text"
                            value={addressForm.pincode}
                            onChange={(event) =>
                              handleAddressFieldChange("pincode", event.target.value)
                            }
                            className={checkoutInputClass}
                            placeholder="6-digit pincode"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary-600">
                          Landmark
                        </label>
                        <input
                          type="text"
                          value={addressForm.landmark}
                          onChange={(event) =>
                            handleAddressFieldChange("landmark", event.target.value)
                          }
                          className={checkoutInputClass}
                          placeholder="Near metro, school, mall (optional)"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <p className="text-[11px] text-primary-500">
                          This address will be added to your saved delivery addresses.
                        </p>
                        <div className="inline-flex items-center gap-2">
                          {savedAddresses.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAddressId("");
                                setShowAddressForm(false);
                              }}
                              className="text-xs font-semibold text-primary-600 underline underline-offset-4"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="submit"
                            disabled={savingAddress}
                            className="inline-flex h-10 items-center justify-center rounded-md bg-primary-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:bg-primary-300"
                          >
                            {savingAddress
                              ? "Saving..."
                              : editingAddressId
                                ? "Update Address"
                                : "Save Address"}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </section>

                <section className="border-b border-primary-200/80 pb-8">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-primary-900">
                        {isBuyNowMode ? "Selected Product" : "Items in Checkout"}
                      </h2>
                      <p className="text-xs font-medium text-primary-500 sm:text-sm">
                        {itemCount} item{itemCount === 1 ? "" : "s"} ready for payment
                      </p>
                    </div>
                    {!isBuyNowMode && (
                      <button
                        type="button"
                        onClick={() => navigate("/cart")}
                        className="text-xs font-semibold text-primary-700 underline underline-offset-4 hover:text-accent-700"
                      >
                        Edit cart
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-primary-100">
                    {checkoutItems.map((item) => (
                      <article key={item._id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-4">
                        <img
                          src={
                            item.imageUrl ||
                            item.imageUrls?.[0] ||
                            "https://placehold.co/120x160/f5f0e8/826b4d?text=No+Image"
                          }
                          alt={item.name}
                          className="h-24 w-16 object-contain sm:h-28 sm:w-20"
                        />

                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-1 text-sm font-semibold text-primary-900 sm:text-base">
                            {item.name}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-xs text-primary-600 sm:text-sm">
                            {item.description || "No description available"}
                          </p>
                          <p className="mt-2 text-xs text-primary-600">
                            Qty {item.qty} · Unit {formatCurrency(item.price)} ·{" "}
                            {isProductAvailableInLocation(item, selectedLocation)
                              ? "Deliverable"
                              : "Unavailable in selected area"}
                          </p>
                        </div>

                        <div className="sm:text-right">
                          <p className="text-xs font-medium text-primary-500">Line total</p>
                          <p className="text-lg font-bold text-accent-700">
                            {formatCurrency(item.price * item.qty)}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="grid grid-cols-1 gap-2.5 text-sm font-semibold text-primary-700 sm:grid-cols-3">
                  <div className="inline-flex items-center gap-2">
                    <FiTruck className="h-4 w-4 text-accent-600" />
                    Fast Delivery
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <FiShield className="h-4 w-4 text-primary-700" />
                    Safe Payment
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <FiRefreshCw className="h-4 w-4 text-accent-600" />
                    Easy Returns
                  </div>
                </section>
              </div>

              <aside className="xl:sticky xl:top-24">
                <div className="space-y-6 border-l border-primary-200/70 pl-0 xl:pl-8">
                  <section className="border-b border-primary-200/80 pb-6">
                    <h3 className="text-base font-bold text-primary-900">Payment Method</h3>
                    <div className="mt-3 divide-y divide-primary-100">
                      {PAYMENT_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const active = selectedPaymentOption === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setSelectedPaymentOption(option.id)}
                            className="flex w-full items-center justify-between py-3 text-left"
                          >
                            <span className="inline-flex min-w-0 items-center gap-2">
                              <Icon
                                className={`h-4 w-4 ${active ? "text-accent-700" : "text-primary-500"}`}
                              />
                              <span className="min-w-0 leading-tight">
                                <span
                                  className={`block text-sm font-semibold ${active ? "text-accent-700" : "text-primary-900"}`}
                                >
                                  {option.title}
                                </span>
                                <span className="block truncate text-[11px] text-primary-500">
                                  {option.subtitle}
                                </span>
                              </span>
                            </span>
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                active ? "bg-accent-600" : "bg-primary-300"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="space-y-2.5 border-b border-primary-200/80 pb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary-600">Items</span>
                      <span className="font-semibold text-primary-900">{itemCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary-600">Subtotal</span>
                      <span className="font-semibold text-primary-900">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary-600">Shipping</span>
                      <span className="font-semibold text-emerald-700">
                        {shipping === 0 ? "FREE" : formatCurrency(shipping)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm font-semibold text-primary-900">Total</span>
                      <span className="text-2xl font-bold text-accent-700">{formatCurrency(total)}</span>
                    </div>
                  </section>

                  <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <FiCheckCircle className="h-4 w-4" />
                    Encrypted and secure checkout powered by Razorpay
                  </p>

                  {hasUnavailableItems && (
                    <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700">
                      <FiAlertTriangle className="h-4 w-4" />
                      {unavailableItems.length} item{unavailableItems.length === 1 ? "" : "s"} unavailable for {selectedLocationLabel}
                    </p>
                  )}

                  {hasDistanceRangeConflict && (
                    <p className="inline-flex items-start gap-1.5 text-xs font-semibold text-red-700">
                      <FiAlertTriangle className="mt-0.5 h-4 w-4" />
                      <span>
                        {selectedAreaDistanceKm !== null
                          ? `This location is ${selectedAreaDistanceKm.toFixed(1)} km away and currently outside delivery range. Coming Soon.`
                          : "This location is currently outside delivery range. Coming Soon."}
                      </span>
                    </p>
                  )}

                  {!selectedLocation && (
                    <p className="text-[11px] font-medium text-red-600">
                      Select delivery location from header to continue.
                    </p>
                  )}

                  {!checkoutReady && (
                    <p className="text-[11px] text-primary-600">Loading secure payment SDK...</p>
                  )}

                  <button
                    type="button"
                    onClick={handleRazorpayPayment}
                    disabled={isCheckoutDisabled}
                    className="hidden h-12 w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-accent-500 to-accent-600 text-sm font-semibold text-white transition-all hover:from-accent-600 hover:to-accent-700 disabled:cursor-not-allowed disabled:from-accent-300 disabled:to-accent-300 lg:inline-flex"
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiCreditCard className="h-4.5 w-4.5" />
                        Pay {formatCurrency(total)}
                      </>
                    )}
                  </button>
                </div>
              </aside>
            </div>
          )}
        </div>

        {checkoutItems.length > 0 && (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-primary-200 bg-white/95 px-4 py-3 shadow-[0_-8px_28px_-16px_rgba(90,74,56,0.35)] backdrop-blur lg:hidden">
            <div className="mx-auto flex w-full max-w-[1320px] items-center gap-3 px-0 sm:px-4">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-primary-500">
                  {itemCount} item{itemCount === 1 ? "" : "s"}
                  {selectedLocationLabel ? ` • ${selectedLocationLabel}` : ""}
                </p>
                <p className="text-base font-bold text-accent-700">{formatCurrency(total)}</p>
              </div>
              <button
                type="button"
                onClick={handleRazorpayPayment}
                disabled={isCheckoutDisabled}
                className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-accent-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:bg-accent-300"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FiCreditCard className="h-4.5 w-4.5" />
                    Pay Now
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </section>
    </Layout>
  );
};

export default CheckoutPage;
