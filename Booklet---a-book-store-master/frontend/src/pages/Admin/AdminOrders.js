import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "../../config/axios";
import toast from "react-hot-toast";
import AdminMenu from "../../components/Layout/AdminMenu";
import Layout from "../../components/Layout/Layout";
import { useAuth } from "../../context/auth";
import moment from "moment";
import {
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiMapPin,
  FiPackage,
  FiRefreshCw,
  FiShoppingBag,
  FiUser,
} from "react-icons/fi";

const statusOptions = [
  { value: "Not Process", label: "Not Process (New)" },
  { value: "Processing", label: "Processing" },
  { value: "Shipped", label: "Shipped" },
  { value: "deliverd", label: "Delivered" },
  { value: "cancel", label: "Cancelled" },
];

const dummyOrders = [
  {
    _id: "demo-1001",
    isDemo: true,
    status: "Processing",
    buyer: { name: "Aarav Sharma", email: "aarav@example.com" },
    createdAt: "2026-02-19T10:30:00.000Z",
    payment: { success: true },
    products: [
      {
        _id: "demo-p-1",
        name: "Atomic Habits",
        description: "Build good habits and break bad ones with practical techniques.",
        price: 499,
        quantity: 1,
        imageUrl: "https://placehold.co/120x160?text=Atomic+Habits",
      },
      {
        _id: "demo-p-2",
        name: "Deep Work",
        description: "Rules for focused success in a distracted world.",
        price: 399,
        quantity: 2,
        imageUrl: "https://placehold.co/120x160?text=Deep+Work",
      },
    ],
  },
  {
    _id: "demo-1002",
    isDemo: true,
    status: "Shipped",
    buyer: { name: "Priya Mehta", email: "priya@example.com" },
    createdAt: "2026-02-18T14:20:00.000Z",
    payment: { success: true },
    products: [
      {
        _id: "demo-p-3",
        name: "The Psychology of Money",
        description: "Timeless lessons on wealth, greed, and happiness.",
        price: 599,
        quantity: 1,
        imageUrl: "https://placehold.co/120x160?text=Psychology+of+Money",
      },
    ],
  },
  {
    _id: "demo-1003",
    isDemo: true,
    status: "Not Process",
    buyer: { name: "Rahul Verma", email: "rahul@example.com" },
    createdAt: "2026-02-17T09:10:00.000Z",
    payment: { success: false },
    products: [
      {
        _id: "demo-p-4",
        name: "Clean Code",
        description: "A handbook of agile software craftsmanship.",
        price: 699,
        quantity: 1,
        imageUrl: "https://placehold.co/120x160?text=Clean+Code",
      },
      {
        _id: "demo-p-5",
        name: "Sapiens",
        description: "A brief history of humankind.",
        price: 549,
        quantity: 1,
        imageUrl: "https://placehold.co/120x160?text=Sapiens",
      },
    ],
  },
];

const normalizeOrders = (orderData = []) =>
  orderData.map((order) => ({
    ...order,
    isDemo: false,
  }));

const normalizeStatusKey = (status = "") => {
  const normalized = status.trim().toLowerCase();
  if (normalized === "deliverd" || normalized === "delivered") {
    return "delivered";
  }
  if (normalized === "cancel" || normalized === "cancelled") {
    return "cancelled";
  }
  return normalized;
};

const isNewOrder = (order) => normalizeStatusKey(order?.status) === "not process";
const getPaymentItems = (order) =>
  Array.isArray(order?.payment?.items) ? order.payment.items : [];

const getSafeQty = (value) => {
  const qty = Number(value);
  return Number.isFinite(qty) && qty > 0 ? qty : 1;
};

const getOrderItemsCount = (order) => {
  const paymentItems = getPaymentItems(order);
  if (paymentItems.length > 0) {
    return paymentItems.reduce((sum, item) => sum + getSafeQty(item?.qty), 0);
  }

  return (order?.products || []).reduce((sum, product) => {
    const quantity = Number(product?.quantity) || Number(product?.qty) || 1;
    return sum + quantity;
  }, 0);
};

const getOrderTotal = (order) => {
  const paymentAmount = Number(order?.payment?.amount);
  if (Number.isFinite(paymentAmount) && paymentAmount > 0) {
    return paymentAmount;
  }

  const paymentItems = getPaymentItems(order);
  if (paymentItems.length > 0) {
    return paymentItems.reduce((sum, item) => {
      const price = Number(item?.price) || 0;
      return sum + price * getSafeQty(item?.qty);
    }, 0);
  }

  return (order?.products || []).reduce((sum, product) => {
    const quantity = Number(product?.quantity) || Number(product?.qty) || 1;
    const price = Number(product?.price) || 0;
    return sum + price * quantity;
  }, 0);
};

const getItemQtyForProduct = (order, productId) => {
  const paymentItems = getPaymentItems(order);
  if (paymentItems.length === 0) {
    return 1;
  }

  const matchedItem = paymentItems.find((item) => {
    const itemProductId = item?.productId || item?._id || item?.product;
    return String(itemProductId || "") === String(productId || "");
  });

  return getSafeQty(matchedItem?.qty);
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingDemoOrders, setUsingDemoOrders] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOrderIds, setExpandedOrderIds] = useState(new Set());
  const [auth] = useAuth();

  const formatStatus = (status = "") => {
    const normalized = normalizeStatusKey(status);
    if (normalized === "delivered") return "Delivered";
    if (normalized === "cancelled") return "Cancelled";
    return status;
  };

  const getStatusBadgeClass = (status = "") => {
    const normalized = normalizeStatusKey(status);
    if (normalized === "not process") {
      return "border-accent-200 bg-accent-50 text-accent-700";
    }
    if (normalized === "delivered") {
      return "border-green-200 bg-green-50 text-green-700";
    }
    if (normalized === "processing") {
      return "border-blue-200 bg-blue-50 text-blue-700";
    }
    if (normalized === "shipped") {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }
    if (normalized === "cancelled") {
      return "border-red-200 bg-red-50 text-red-700";
    }
    return "border-primary-200 bg-primary-100 text-primary-700";
  };

const formatCurrency = (value) =>
  `₹${(Number(value) || 0).toLocaleString("en-IN")}`;

const getDeliveryLocation = (order) =>
  order?.deliveryLocationLabel ||
  order?.payment?.deliveryLocationLabel ||
  order?.deliveryLocation ||
  order?.payment?.deliveryLocation ||
  "";

  const orderStats = useMemo(() => {
    const totalOrders = orders.length;
    const totalItems = orders.reduce(
      (sum, currentOrder) => sum + getOrderItemsCount(currentOrder),
      0
    );
    const totalRevenue = orders.reduce(
      (sum, currentOrder) => sum + getOrderTotal(currentOrder),
      0
    );
    const paidOrders = orders.filter((order) => order?.payment?.success).length;
    const newOrders = orders.filter((order) => isNewOrder(order)).length;

    return {
      totalOrders,
      totalItems,
      totalRevenue,
      paidOrders,
      newOrders,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const list =
      statusFilter === "all"
        ? orders
        : orders.filter(
            (order) => normalizeStatusKey(order?.status) === normalizeStatusKey(statusFilter)
          );

    return [...list].sort((a, b) => {
      const aTime = new Date(a?.createdAt || 0).getTime();
      const bTime = new Date(b?.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }, [orders, statusFilter]);

  const getOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/v1/auth/all-orders");
      if (Array.isArray(data) && data.length > 0) {
        setOrders(normalizeOrders(data));
        setUsingDemoOrders(false);
      } else {
        setOrders(dummyOrders);
        setUsingDemoOrders(true);
      }
      setExpandedOrderIds(new Set());
    } catch (error) {
      console.log("Error fetching orders:", error);
      setOrders(dummyOrders);
      setUsingDemoOrders(true);
      setExpandedOrderIds(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (auth?.token) {
      getOrders();
      return;
    }
    setOrders(dummyOrders);
    setUsingDemoOrders(true);
    setExpandedOrderIds(new Set());
    setLoading(false);
  }, [auth?.token, getOrders]);

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const handleChange = async (orderId, value, isDemoOrder = false) => {
    if (isDemoOrder) {
      setOrders((prev) =>
        prev.map((order) =>
          order?._id === orderId ? { ...order, status: value } : order
        )
      );
      toast.success("Order status updated successfully");
      return;
    }

    try {
      await axios.put(`/api/v1/auth/order-status/${orderId}`, {
        status: value,
      });
      toast.success("Order status updated successfully");
      getOrders();
    } catch (error) {
      console.log("Error updating order status:", error);
      toast.error("Failed to update order status");
    }
  };
  return (
    <Layout title={"All Orders - Booklet Admin"}>
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6 lg:h-[calc(100vh-4rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-5 lg:gap-6 items-start lg:h-full">
          {/* Sidebar */}
          <div>
            <AdminMenu />
          </div>

          {/* Main Content */}
          <div className="min-w-0 lg:h-full lg:overflow-y-auto lg:pr-1">
            <div className="p-1 sm:p-2">
              <div className="mb-5 rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-50 via-white to-accent-50 p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-primary-900">
                      Order Management
                    </h1>
                    <p className="mt-1 text-sm text-primary-600">
                      Track live orders and monitor activity from one place.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`h-9 px-3 rounded-lg border text-xs font-semibold inline-flex items-center ${
                        usingDemoOrders
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-green-200 bg-green-50 text-green-700"
                      }`}
                    >
                      {usingDemoOrders ? "Demo Orders" : "Live Orders"}
                    </span>
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      className="h-9 min-w-[150px] rounded-lg border border-primary-200 bg-white px-3 text-sm text-primary-800 focus:outline-none focus:ring-2 focus:ring-accent-300"
                    >
                      <option value="all">All Status</option>
                      {statusOptions.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={getOrders}
                      className="h-9 px-4 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold transition-colors inline-flex items-center gap-2"
                    >
                      <FiRefreshCw className="h-4 w-4" />
                      Refresh
                    </button>
                    <span className="text-xs text-primary-600">
                      Showing {filteredOrders.length} of {orders.length}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 xl:grid-cols-5 gap-3">
                  <div className="rounded-xl border border-primary-200 bg-white p-3.5">
                    <p className="text-xs text-primary-500">Total Orders</p>
                    <p className="mt-1 text-lg font-semibold text-primary-900">
                      {orderStats.totalOrders}
                    </p>
                  </div>
                  <div className="rounded-xl border border-accent-200 bg-accent-50/70 p-3.5">
                    <p className="text-xs text-accent-700">New Orders</p>
                    <p className="mt-1 text-lg font-semibold text-accent-700">
                      {orderStats.newOrders}
                    </p>
                  </div>
                  <div className="rounded-xl border border-primary-200 bg-white p-3.5">
                    <p className="text-xs text-primary-500">Total Items</p>
                    <p className="mt-1 text-lg font-semibold text-primary-900">
                      {orderStats.totalItems}
                    </p>
                  </div>
                  <div className="rounded-xl border border-primary-200 bg-white p-3.5">
                    <p className="text-xs text-primary-500">Paid Orders</p>
                    <p className="mt-1 text-lg font-semibold text-primary-900">
                      {orderStats.paidOrders}
                    </p>
                  </div>
                  <div className="rounded-xl border border-primary-200 bg-white p-3.5">
                    <p className="text-xs text-primary-500">Revenue</p>
                    <p className="mt-1 text-lg font-semibold text-primary-900">
                      {formatCurrency(orderStats.totalRevenue)}
                    </p>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="rounded-2xl border border-primary-200 bg-white text-center py-14">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-500 mx-auto" />
                  <p className="mt-3 text-sm text-primary-600">
                    Loading orders...
                  </p>
                </div>
              ) : orders?.length === 0 ? (
                <div className="rounded-2xl border border-primary-200 bg-white text-center py-14">
                  <div className="text-primary-300 text-5xl mb-3">📦</div>
                  <h3 className="text-lg font-semibold text-primary-700 mb-1.5">
                    No orders found
                  </h3>
                  <p className="text-sm text-primary-500">
                    Orders will appear here when customers make purchases.
                  </p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="rounded-2xl border border-primary-200 bg-white text-center py-14">
                  <div className="text-primary-300 text-5xl mb-3">🔎</div>
                  <h3 className="text-lg font-semibold text-primary-700 mb-1.5">
                    No orders match this status
                  </h3>
                  <p className="text-sm text-primary-500">
                    Try selecting a different status filter.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredOrders?.map((o, i) => (
                    <div
                      key={o._id}
                      className="rounded-xl border border-primary-200 bg-white shadow-sm overflow-hidden"
                    >
                      <div
                        className={`bg-primary-50/70 px-3 py-2.5 ${
                          expandedOrderIds.has(o?._id)
                            ? "border-b border-primary-100"
                            : ""
                        }`}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2">
                          <div>
                            <p className="text-[11px] text-primary-500 leading-none">
                              Order
                            </p>
                            <p className="mt-1 text-xs sm:text-sm font-semibold text-primary-900 inline-flex items-center gap-1.5">
                              #{i + 1} ({o?._id})
                              {isNewOrder(o) && (
                                <span className="h-5 px-1.5 rounded border border-accent-200 bg-accent-50 text-accent-700 text-[10px] font-bold inline-flex items-center">
                                  NEW
                                </span>
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] text-primary-500 leading-none">
                              Buyer
                            </p>
                            <p className="mt-1 text-xs sm:text-sm font-semibold text-primary-900 inline-flex items-center gap-1">
                              <FiUser className="h-3.5 w-3.5" />
                              {o?.buyer?.name || "Unknown"}
                            </p>
                            <p className="text-[11px] text-primary-500 truncate">
                              {o?.buyer?.email || "No email"}
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] text-primary-500 leading-none">
                              Date
                            </p>
                            <p className="mt-1 text-xs sm:text-sm font-semibold text-primary-900 truncate">
                              {moment(o?.createdAt).format("DD MMM")} •{" "}
                              <span className="font-medium text-primary-600">
                                {moment(o?.createdAt).fromNow()}
                              </span>
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] text-primary-500 leading-none">
                              Payment
                            </p>
                            <span
                              className={`mt-1 inline-flex items-center gap-1 h-6 px-2 rounded-md border text-[11px] font-semibold ${
                                o?.payment?.success
                                  ? "border-green-200 bg-green-50 text-green-700"
                                  : "border-red-200 bg-red-50 text-red-700"
                              }`}
                            >
                              {o?.payment?.success ? (
                                <FiCheckCircle className="h-3.5 w-3.5" />
                              ) : (
                                <FiClock className="h-3.5 w-3.5" />
                              )}
                              {o?.payment?.success ? "Paid" : "Failed"}
                            </span>
                          </div>

                          <div>
                            <p className="text-[11px] text-primary-500 leading-none">
                              Summary
                            </p>
                            <p className="mt-1 text-xs sm:text-sm font-semibold text-primary-900 inline-flex items-center gap-1.5">
                              {getOrderItemsCount(o)} items
                              <span className="text-primary-400">•</span>
                              <span className="text-accent-700">
                                {formatCurrency(getOrderTotal(o))}
                              </span>
                            </p>
                            <p className="hidden text-sm font-semibold text-accent-700">
                              {formatCurrency(getOrderTotal(o))}
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] text-primary-500 leading-none inline-flex items-center gap-1">
                              <FiMapPin className="h-3.5 w-3.5" />
                              Delivery
                            </p>
                            <p className="mt-1 text-xs sm:text-sm font-semibold text-primary-900 line-clamp-2">
                              {getDeliveryLocation(o) || "Not captured"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => toggleOrderExpansion(o?._id)}
                            className="h-7 px-2.5 rounded-lg border border-primary-200 bg-white hover:bg-primary-50 text-primary-700 text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            {expandedOrderIds.has(o?._id) ? (
                              <>
                                Collapse
                                <FiChevronUp className="h-3.5 w-3.5" />
                              </>
                            ) : (
                              <>
                                Expand
                                <FiChevronDown className="h-3.5 w-3.5" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {expandedOrderIds.has(o?._id) && (
                        <div className="p-3">
                          <div className="mb-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="inline-flex items-center gap-2">
                              <span className="text-xs font-semibold text-primary-600">
                                STATUS
                              </span>
                              <span
                                className={`inline-flex items-center h-7 px-2.5 rounded-md border text-xs font-semibold ${getStatusBadgeClass(
                                  o?.status
                                )}`}
                              >
                                {formatStatus(o?.status)}
                              </span>
                            </div>
                            <div className="w-full sm:w-56">
                              <select
                                value={o?.status}
                                onChange={(event) =>
                                  handleChange(
                                    o?._id,
                                    event.target.value,
                                    Boolean(o?.isDemo)
                                  )
                                }
                                className="w-full h-8 rounded-lg border border-primary-200 bg-white px-2.5 text-xs sm:text-sm text-primary-800 focus:outline-none focus:ring-2 focus:ring-accent-300"
                              >
                                {statusOptions.map((status) => (
                                  <option key={status.value} value={status.value}>
                                    {status.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <h4 className="mb-2 text-xs sm:text-sm font-semibold text-primary-900 inline-flex items-center gap-1.5">
                            <FiShoppingBag className="h-3.5 w-3.5 text-accent-700" />
                            Order Items
                          </h4>
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                            {(o?.products || []).map((p) => (
                              <div
                                key={p._id}
                                className="rounded-lg border border-primary-200 bg-primary-50/40 p-2 flex items-center gap-2.5"
                              >
                                <div className="h-12 w-10 rounded-md overflow-hidden border border-primary-200 bg-white shrink-0">
                                  <img
                                    src={
                                      p?.imageUrl ||
                                      "https://placehold.co/120x160?text=No+Image"
                                    }
                                    alt={p?.name}
                                    className="h-full w-full object-contain p-1"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs sm:text-sm font-semibold text-primary-900 truncate">
                                    {p?.name}
                                  </p>
                                  <p className="text-[11px] text-primary-600 truncate">
                                    {p?.description || "No description"}
                                  </p>
                                  <div className="mt-0.5 flex items-center justify-between gap-2">
                                    <span className="text-[11px] text-primary-600 inline-flex items-center gap-1">
                                      <FiPackage className="h-3.5 w-3.5" /> Qty{" "}
                                      {getItemQtyForProduct(o, p?._id)}
                                    </span>
                                    <span className="text-xs sm:text-sm font-semibold text-accent-700">
                                      {formatCurrency(p?.price)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminOrders;
