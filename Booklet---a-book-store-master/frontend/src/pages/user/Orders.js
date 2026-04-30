import React, { useEffect, useMemo, useState } from "react";
import UserMenu from "../../components/Layout/UserMenu";
import Layout from "./../../components/Layout/Layout";
import axios from "../../config/axios";
import { useAuth } from "../../context/auth";
import moment from "moment";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiMapPin,
  FiPackage,
  FiShoppingBag,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { formatAddressText } from "../../utils/addressUtils";

const normalizeStatus = (status = "") => {
  const value = String(status).trim().toLowerCase();
  if (value === "deliverd" || value === "delivered") return "delivered";
  if (value === "cancel" || value === "cancelled") return "cancelled";
  return value;
};

const formatStatus = (status = "") => {
  const value = normalizeStatus(status);
  if (value === "not process") return "Not Process";
  if (value === "processing") return "Processing";
  if (value === "shipped") return "Shipped";
  if (value === "delivered") return "Delivered";
  if (value === "cancelled") return "Cancelled";
  return status || "Unknown";
};

const getStatusStyle = (status = "") => {
  const value = normalizeStatus(status);
  if (value === "not process") return "border-amber-200 bg-amber-50 text-amber-700";
  if (value === "processing") return "border-blue-200 bg-blue-50 text-blue-700";
  if (value === "shipped") return "border-indigo-200 bg-indigo-50 text-indigo-700";
  if (value === "delivered") return "border-green-200 bg-green-50 text-green-700";
  if (value === "cancelled") return "border-red-200 bg-red-50 text-red-700";
  return "border-primary-200 bg-primary-100 text-primary-700";
};

const getStatusIcon = (status = "") => {
  const value = normalizeStatus(status);
  if (value === "not process" || value === "processing") return FiClock;
  if (value === "shipped") return FiTruck;
  if (value === "delivered") return FiCheckCircle;
  if (value === "cancelled") return FiXCircle;
  return FiPackage;
};

const getPaymentItems = (order) =>
  Array.isArray(order?.payment?.items) ? order.payment.items : [];

const getOrderItemsCount = (order) => {
  const paymentItems = getPaymentItems(order);
  if (paymentItems.length > 0) {
    return paymentItems.reduce((sum, item) => {
      const qty = Number(item?.qty);
      return sum + (Number.isFinite(qty) && qty > 0 ? qty : 1);
    }, 0);
  }
  return (order?.products || []).length;
};

const getOrderAmount = (order) => {
  const paymentAmount = Number(order?.payment?.amount);
  if (Number.isFinite(paymentAmount) && paymentAmount > 0) {
    return paymentAmount;
  }

  const paymentItems = getPaymentItems(order);
  if (paymentItems.length > 0) {
    return paymentItems.reduce((sum, item) => {
      const price = Number(item?.price) || 0;
      const qty = Number(item?.qty);
      const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 1;
      return sum + price * safeQty;
    }, 0);
  }

  return (order?.products || []).reduce((sum, product) => {
    const price = Number(product?.price) || 0;
    const qty = Number(product?.qty) || Number(product?.quantity) || 1;
    return sum + price * (qty > 0 ? qty : 1);
  }, 0);
};

const getItemQtyForProduct = (order, productId) => {
  const paymentItems = getPaymentItems(order);
  if (paymentItems.length === 0) return 1;

  const matchedItem = paymentItems.find((item) => {
    const itemProductId = item?.productId || item?._id || item?.product;
    return String(itemProductId || "") === String(productId || "");
  });

  const qty = Number(matchedItem?.qty);
  return Number.isFinite(qty) && qty > 0 ? qty : 1;
};

const formatCurrency = (value) => `₹${(Number(value) || 0).toLocaleString("en-IN")}`;

const getDeliveryLocation = (order) =>
  order?.deliveryLocationLabel ||
  order?.payment?.deliveryLocationLabel ||
  order?.deliveryLocation ||
  order?.payment?.deliveryLocation ||
  "";

const getDeliveryAddressText = (order) =>
  formatAddressText(order?.shippingAddress || order?.payment?.deliveryAddress);

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auth] = useAuth();
  const navigate = useNavigate();

  const getOrders = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/v1/auth/orders");
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth?.token) getOrders();
  }, [auth?.token]);

  const summary = useMemo(() => {
    const totalOrders = orders.length;
    const paidOrders = orders.filter((order) => order?.payment?.success).length;
    const pendingOrders = orders.filter((order) => {
      const status = normalizeStatus(order?.status);
      return status === "not process" || status === "processing";
    }).length;
    const totalSpent = orders.reduce((sum, order) => {
      if (!order?.payment?.success) return sum;
      return sum + getOrderAmount(order);
    }, 0);

    return {
      totalOrders,
      paidOrders,
      pendingOrders,
      totalSpent,
    };
  }, [orders]);

  return (
    <Layout title={"Your Orders - Booklet"}>
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6 lg:h-[calc(100vh-4rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-5 lg:gap-6 items-start lg:h-full">
          <div>
            <UserMenu />
          </div>

          <div className="min-w-0 lg:h-full lg:overflow-y-auto lg:pr-1">
            <div className="relative overflow-hidden p-1 sm:p-2">
              <div className="absolute -top-14 -right-14 h-32 w-32 rounded-full bg-accent-100/60 blur-3xl" />
              <div className="absolute -bottom-16 -left-14 h-36 w-36 rounded-full bg-primary-100/70 blur-3xl" />

              <div className="bg-white border border-primary-200 rounded-2xl shadow-sm p-4 sm:p-5 relative z-10">
                <div className="mb-5 rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-50 via-white to-accent-50 p-4 sm:p-5">
                  <h1 className="text-xl sm:text-2xl font-bold text-primary-900 inline-flex items-center gap-2">
                    <FiShoppingBag className="h-5 w-5 text-accent-700" />
                    My Orders
                  </h1>
                  <p className="mt-1.5 text-sm text-primary-700">
                    Track your purchases, payment status, and delivery updates.
                  </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                  <div className="rounded-xl border border-primary-200 bg-white p-3">
                    <p className="text-xs text-primary-500 inline-flex items-center gap-1">
                      <FiShoppingBag className="h-3.5 w-3.5" />
                      Total Orders
                    </p>
                    <p className="mt-1 text-sm font-semibold text-primary-900">
                      {summary.totalOrders}
                    </p>
                  </div>
                  <div className="rounded-xl border border-green-200 bg-green-50 p-3">
                    <p className="text-xs text-green-700 inline-flex items-center gap-1">
                      <FiCheckCircle className="h-3.5 w-3.5" />
                      Paid Orders
                    </p>
                    <p className="mt-1 text-sm font-semibold text-green-700">
                      {summary.paidOrders}
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs text-amber-700 inline-flex items-center gap-1">
                      <FiClock className="h-3.5 w-3.5" />
                      Pending Orders
                    </p>
                    <p className="mt-1 text-sm font-semibold text-amber-700">
                      {summary.pendingOrders}
                    </p>
                  </div>
                  <div className="rounded-xl border border-accent-200 bg-accent-50/70 p-3">
                    <p className="text-xs text-accent-700 inline-flex items-center gap-1">
                      <FiCreditCard className="h-3.5 w-3.5" />
                      Total Spent
                    </p>
                    <p className="mt-1 text-sm font-semibold text-accent-700">
                      {formatCurrency(summary.totalSpent)}
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div className="rounded-xl border border-primary-200 bg-primary-50 text-center py-14">
                    <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-accent-500 mx-auto" />
                    <p className="mt-3 text-sm text-primary-600">Loading your orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="rounded-xl border border-primary-200 bg-primary-50/60 text-center py-14 px-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-primary-200 bg-white text-primary-500 mb-3">
                      <FiPackage className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-primary-900">No orders found</h3>
                    <p className="mt-1 text-sm text-primary-600">
                      You have not placed any order yet.
                    </p>
                    <button
                      onClick={() => navigate("/")}
                      className="mt-5 h-10 px-4 rounded-lg border border-accent-200 bg-accent-50 text-accent-700 hover:bg-accent-100 text-sm font-semibold"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order, index) => {
                      const StatusIcon = getStatusIcon(order?.status);
                      return (
                        <div
                          key={order._id}
                          className="rounded-xl border border-primary-200 bg-white shadow-sm overflow-hidden"
                        >
                          <div className="bg-primary-50/70 border-b border-primary-100 px-3.5 py-3">
                            <div className="grid grid-cols-1 md:grid-cols-6 gap-2.5">
                              <div>
                                <p className="text-[11px] text-primary-500 inline-flex items-center gap-1">
                                  <FiShoppingBag className="h-3.5 w-3.5" />
                                  Order
                                </p>
                                <p className="mt-1 text-sm font-semibold text-primary-900">
                                  #{index + 1}
                                </p>
                              </div>

                              <div>
                                <p className="text-[11px] text-primary-500">Status</p>
                                <span
                                  className={`mt-1 inline-flex items-center gap-1 h-6 px-2 rounded-md border text-[11px] font-semibold ${getStatusStyle(
                                    order?.status
                                  )}`}
                                >
                                  <StatusIcon className="h-3.5 w-3.5" />
                                  {formatStatus(order?.status)}
                                </span>
                              </div>

                              <div>
                                <p className="text-[11px] text-primary-500 inline-flex items-center gap-1">
                                  <FiCalendar className="h-3.5 w-3.5" />
                                  Date
                                </p>
                                <p className="mt-1 text-sm font-semibold text-primary-900">
                                  {moment(order?.createdAt).format("DD MMM YYYY")}
                                </p>
                                <p className="text-[11px] text-primary-500">
                                  {moment(order?.createdAt).fromNow()}
                                </p>
                              </div>

                              <div>
                                <p className="text-[11px] text-primary-500 inline-flex items-center gap-1">
                                  <FiCreditCard className="h-3.5 w-3.5" />
                                  Payment
                                </p>
                                <span
                                  className={`mt-1 inline-flex items-center h-6 px-2 rounded-md border text-[11px] font-semibold ${
                                    order?.payment?.success
                                      ? "border-green-200 bg-green-50 text-green-700"
                                      : "border-red-200 bg-red-50 text-red-700"
                                  }`}
                                >
                                  {order?.payment?.success ? "Paid" : "Failed"}
                                </span>
                              </div>

                              <div>
                                <p className="text-[11px] text-primary-500 inline-flex items-center gap-1">
                                  <FiPackage className="h-3.5 w-3.5" />
                                  Amount
                                </p>
                                <p className="mt-1 text-sm font-semibold text-accent-700">
                                  {formatCurrency(getOrderAmount(order))}
                                </p>
                                <p className="text-[11px] text-primary-500">
                                  {getOrderItemsCount(order)} items
                                </p>
                              </div>

                              <div>
                                <p className="text-[11px] text-primary-500 inline-flex items-center gap-1">
                                  <FiMapPin className="h-3.5 w-3.5" />
                                  Delivery
                                </p>
                                <p className="mt-1 text-xs font-semibold text-primary-900 line-clamp-2">
                                  {getDeliveryLocation(order) || "Location not captured"}
                                </p>
                                <p className="mt-1 text-[11px] text-primary-500 line-clamp-2">
                                  {getDeliveryAddressText(order) || "Address not captured"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="p-3.5">
                            <h4 className="text-sm font-semibold text-primary-900 mb-2 inline-flex items-center gap-1.5">
                              <FiPackage className="h-4 w-4 text-accent-700" />
                              Ordered Items
                            </h4>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                              {(order?.products || []).map((product) => (
                                <div
                                  key={product._id}
                                  className="rounded-lg border border-primary-200 bg-primary-50/40 p-2.5 flex items-center gap-3"
                                >
                                  <div className="h-14 w-11 rounded-md overflow-hidden border border-primary-200 bg-white shrink-0">
                                    <img
                                      src={
                                        product?.imageUrl ||
                                        "https://placehold.co/120x160?text=No+Image"
                                      }
                                      alt={product?.name}
                                      className="h-full w-full object-contain p-1"
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-primary-900 truncate">
                                      {product?.name}
                                    </p>
                                    <p className="text-[11px] text-primary-600 truncate">
                                      {product?.description || "No description"}
                                    </p>
                                    <div className="mt-0.5 flex items-center justify-between gap-2">
                                      <span className="text-[11px] text-primary-600">
                                        Qty {getItemQtyForProduct(order, product?._id)}
                                      </span>
                                      <p className="text-sm font-semibold text-accent-700">
                                        {formatCurrency(product?.price)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Orders;
