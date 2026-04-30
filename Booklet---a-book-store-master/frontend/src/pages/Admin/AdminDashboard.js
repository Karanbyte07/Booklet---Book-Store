import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "../../config/axios";
import AdminMenu from "../../components/Layout/AdminMenu";
import Layout from "./../../components/Layout/Layout";
import { useAuth } from "../../context/auth";
import {
  FiActivity,
  FiAlertCircle,
  FiAward,
  FiBarChart2,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiMail,
  FiShield,
  FiTrendingUp,
  FiTruck,
  FiUser,
  FiUsers,
  FiXCircle,
  FiPackage,
  FiRefreshCw,
  FiShoppingBag,
  FiPieChart,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { ROLE, getRoleLabel, normalizeRole } from "../../utils/roleUtils";

const formatCurrency = (value) => `₹${(Number(value) || 0).toLocaleString("en-IN")}`;

const normalizeOrderStatus = (status = "") => {
  const normalized = String(status).trim().toLowerCase();
  if (normalized === "deliverd" || normalized === "delivered") return "delivered";
  if (normalized === "cancel" || normalized === "cancelled") return "cancelled";
  return normalized;
};

const isPaidOrder = (order) => {
  const paidByFlag = Boolean(order?.payment?.success);
  const transactionStatus = String(order?.payment?.transaction?.status || "").toLowerCase();
  const paidByTransaction = ["submitted_for_settlement", "settling", "settled"].includes(
    transactionStatus
  );
  return paidByFlag || paidByTransaction;
};

const getOrderAmount = (order) => {
  const amountCandidates = [
    order?.payment?.transaction?.amount,
    order?.payment?.amount,
    order?.payment?.transaction?.total,
  ];

  for (const amount of amountCandidates) {
    const parsed = Number(amount);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return (order?.products || []).reduce((sum, product) => {
    const price = Number(product?.price) || 0;
    const qty = Number(product?.qty) || 1;
    return sum + price * (qty > 0 ? qty : 1);
  }, 0);
};

const defaultAnalytics = {
  totalSales: 0,
  todaySales: 0,
  totalOrders: 0,
  todayOrders: 0,
  paidOrders: 0,
  pendingOrders: 0,
  shippedOrders: 0,
  deliveredOrders: 0,
  cancelledOrders: 0,
  totalProducts: 0,
  lowStockProducts: 0,
  outOfStockProducts: 0,
  totalUsers: 0,
  customers: 0,
  admins: 0,
  managers: 0,
  superadmins: 0,
  averageOrderValue: 0,
};

const buildPieData = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      total: 0,
      rows: [],
      background: "conic-gradient(#e5e7eb 0% 100%)",
    };
  }

  const total = rows.reduce((sum, row) => sum + (Number(row?.value) || 0), 0);
  if (total <= 0) {
    return {
      total: 0,
      rows: rows.map((row) => ({ ...row, share: 0 })),
      background: "conic-gradient(#e5e7eb 0% 100%)",
    };
  }

  let cursor = 0;

  const normalizedRows = rows.map((row) => {
    const rawShare = ((Number(row?.value) || 0) / total) * 100;
    const segment = {
      ...row,
      share: rawShare,
      start: cursor,
      end: cursor + rawShare,
    };
    cursor += rawShare;
    return segment;
  });

  const segments = normalizedRows.map(
    (row) => `${row.hex} ${row.start}% ${row.end}%`
  );

  return {
    total,
    rows: normalizedRows,
    background: `conic-gradient(${segments.join(", ")})`,
  };
};

const AdminDashboard = () => {
  const [auth] = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(defaultAnalytics);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const currentRole = normalizeRole(auth?.user?.role);
  const canViewAnalytics = [ROLE.ADMIN, ROLE.SUPERADMIN].includes(currentRole);
  const isSuperadmin = currentRole === ROLE.SUPERADMIN;

  const viewOrders = () => {
    navigate("/dashboard/admin/orders");
  };
  const viewUsers = () => {
    navigate("/dashboard/admin/users");
  };
  const addProduct = () => {
    navigate("/dashboard/admin/create-product");
  };
  const viewCategories = () => {
    navigate("/dashboard/admin/create-category");
  };

  const quickActions = [
    {
      label: "Add Product",
      icon: FiPackage,
      onClick: addProduct,
      variant: "accent",
    },
    {
      label: "View Users",
      icon: FiUsers,
      onClick: viewUsers,
      variant: "outlined",
    },
    {
      label: "View Orders",
      icon: FiShoppingBag,
      onClick: viewOrders,
      variant: "primary",
    },
    {
      label: "Categories",
      icon: FiShield,
      onClick: viewCategories,
      variant: "neutral",
    },
  ];

  const actionButtonStyles = {
    accent:
      "bg-accent-500 text-white border-accent-500 hover:bg-accent-600 hover:border-accent-600",
    outlined:
      "bg-accent-50 text-accent-700 border-accent-200 hover:bg-accent-100 hover:border-accent-300",
    primary:
      "bg-primary-100 text-primary-800 border-primary-200 hover:bg-primary-200 hover:border-primary-300",
    neutral:
      "bg-white text-primary-800 border-primary-200 hover:bg-primary-50 hover:border-primary-300",
  };

  const fetchAnalytics = useCallback(async () => {
    if (!auth?.token || !canViewAnalytics) {
      setAnalyticsLoading(false);
      return;
    }

    try {
      setAnalyticsLoading(true);
      setAnalyticsError("");

      const [ordersRes, productsRes, usersRes] = await Promise.all([
        axios.get("/api/v1/auth/all-orders"),
        axios.get("/api/v1/product/get-product"),
        axios.get("/api/v1/auth/all-users"),
      ]);

      const orders = Array.isArray(ordersRes?.data) ? ordersRes.data : [];
      const products = Array.isArray(productsRes?.data?.products)
        ? productsRes.data.products
        : [];
      const users = Array.isArray(usersRes?.data?.users) ? usersRes.data.users : [];

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const computed = orders.reduce(
        (acc, order) => {
          const createdAt = order?.createdAt ? new Date(order.createdAt) : null;
          const isToday =
            createdAt instanceof Date &&
            !Number.isNaN(createdAt.getTime()) &&
            createdAt >= startOfToday;
          const paid = isPaidOrder(order);
          const amount = getOrderAmount(order);
          const status = normalizeOrderStatus(order?.status);

          acc.totalOrders += 1;
          if (isToday) acc.todayOrders += 1;

          if (paid) {
            acc.paidOrders += 1;
            acc.totalSales += amount;
            if (isToday) acc.todaySales += amount;
          }

          if (status === "not process" || status === "processing") acc.pendingOrders += 1;
          if (status === "shipped") acc.shippedOrders += 1;
          if (status === "delivered") acc.deliveredOrders += 1;
          if (status === "cancelled") acc.cancelledOrders += 1;

          return acc;
        },
        {
          ...defaultAnalytics,
          totalProducts: products.length,
          lowStockProducts: products.filter((item) => {
            const qty = Number(item?.quantity);
            return Number.isFinite(qty) && qty > 0 && qty <= 5;
          }).length,
          outOfStockProducts: products.filter((item) => Number(item?.quantity) <= 0).length,
          totalUsers: users.length,
        }
      );

      users.forEach((user) => {
        const role = normalizeRole(user?.role);
        if (role === ROLE.SUPERADMIN) computed.superadmins += 1;
        else if (role === ROLE.ADMIN) computed.admins += 1;
        else if (role === ROLE.MANAGER) computed.managers += 1;
        else computed.customers += 1;
      });

      computed.averageOrderValue =
        computed.paidOrders > 0 ? computed.totalSales / computed.paidOrders : 0;

      setAnalytics(computed);
      setLastUpdatedAt(new Date());
    } catch (error) {
      console.log("Error fetching dashboard analytics:", error);
      setAnalytics(defaultAnalytics);
      setAnalyticsError("Unable to load live analytics right now.");
    } finally {
      setAnalyticsLoading(false);
    }
  }, [auth?.token, canViewAnalytics]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const salesSeries = useMemo(() => {
    const rows = [
      {
        label: "Total Sales",
        value: analytics.totalSales,
        color: "bg-accent-500",
        icon: FiDollarSign,
        hex: "#f97316",
      },
      {
        label: "Today Sales",
        value: analytics.todaySales,
        color: "bg-primary-600",
        icon: FiCalendar,
        hex: "#4f46e5",
      },
      {
        label: "Avg Order Value",
        value: analytics.averageOrderValue,
        color: "bg-emerald-500",
        icon: FiTrendingUp,
        hex: "#10b981",
      },
    ];
    const max = Math.max(...rows.map((row) => row.value), 1);
    return rows.map((row) => ({
      ...row,
      percentage: Math.max(8, (row.value / max) * 100),
    }));
  }, [analytics]);

  const orderStatusSeries = useMemo(() => {
    const rows = [
      {
        label: "Pending",
        value: analytics.pendingOrders,
        color: "bg-amber-500",
        icon: FiClock,
        hex: "#f59e0b",
      },
      {
        label: "Shipped",
        value: analytics.shippedOrders,
        color: "bg-blue-500",
        icon: FiTruck,
        hex: "#3b82f6",
      },
      {
        label: "Delivered",
        value: analytics.deliveredOrders,
        color: "bg-green-500",
        icon: FiCheckCircle,
        hex: "#22c55e",
      },
      {
        label: "Cancelled",
        value: analytics.cancelledOrders,
        color: "bg-red-500",
        icon: FiXCircle,
        hex: "#ef4444",
      },
    ];
    const total = Math.max(analytics.totalOrders, 1);
    return rows.map((row) => ({
      ...row,
      percentage: Math.max(5, (row.value / total) * 100),
    }));
  }, [analytics]);

  const userDistributionSeries = useMemo(() => {
    const rows = [
      {
        label: "Customers",
        value: analytics.customers,
        color: "bg-primary-500",
        icon: FiUser,
        hex: "#6366f1",
      },
      {
        label: "Managers",
        value: analytics.managers,
        color: "bg-purple-500",
        icon: FiBriefcase,
        hex: "#a855f7",
      },
      {
        label: "Admins",
        value: analytics.admins,
        color: "bg-indigo-500",
        icon: FiShield,
        hex: "#4f46e5",
      },
      {
        label: "Superadmins",
        value: analytics.superadmins,
        color: "bg-accent-500",
        icon: FiAward,
        hex: "#f97316",
      },
    ];
    const total = Math.max(analytics.totalUsers, 1);
    return rows.map((row) => ({
      ...row,
      percentage: Math.max(5, (row.value / total) * 100),
    }));
  }, [analytics]);

  const orderStatusPie = useMemo(() => buildPieData(orderStatusSeries), [orderStatusSeries]);
  const userRolePie = useMemo(() => buildPieData(userDistributionSeries), [userDistributionSeries]);

  return (
    <Layout title={"Admin Dashboard - Booklet"}>
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6 lg:h-[calc(100vh-4rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-5 lg:gap-6 items-start lg:h-full">
          {/* Sidebar */}
          <div>
            <AdminMenu />
          </div>

          {/* Main Content */}
          <div className="min-w-0 lg:h-full lg:overflow-y-auto lg:pr-1">
            <div className="relative overflow-hidden p-1 sm:p-2">
              <div className="absolute -top-14 -right-14 h-36 w-36 rounded-full bg-accent-100/60 blur-3xl" />
              <div className="absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-primary-100/80 blur-3xl" />

              {/* Header */}
              <div className="relative mb-6 rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-50 via-white to-accent-50 p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-primary-900 mb-1.5 inline-flex items-center gap-2">
                      <FiShield className="h-5 w-5 text-accent-700" />
                      Admin Dashboard
                    </h1>
                    <p className="text-sm text-primary-700">
                      Welcome back, {auth?.user?.name}! Track store performance
                      and manage operations from one place.
                    </p>
                    <p className="mt-1.5 text-sm font-medium text-accent-700 break-all inline-flex items-center gap-1.5">
                      <FiMail className="h-4 w-4 shrink-0" />
                      {auth?.user?.email || "N/A"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full lg:w-auto lg:min-w-[320px]">
                    <div className="rounded-xl border border-primary-200 bg-white/80 px-3 py-2 min-w-[120px]">
                      <p className="text-xs text-primary-500 inline-flex items-center gap-1">
                        <FiShield className="h-3.5 w-3.5" />
                        Role
                      </p>
                      <p className="text-sm font-semibold text-primary-800">
                        {getRoleLabel(currentRole)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-accent-200 bg-accent-50/80 px-3 py-2 min-w-[120px]">
                      <p className="text-xs text-accent-500 inline-flex items-center gap-1">
                        <FiActivity className="h-3.5 w-3.5" />
                        Access
                      </p>
                      <p className="text-sm font-semibold text-accent-700">
                        {isSuperadmin ? "System Control" : "Operations"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-primary-200 bg-white/80 px-3 py-2 min-w-[120px] col-span-2">
                      <p className="text-xs text-primary-500 inline-flex items-center gap-1">
                        <FiClock className="h-3.5 w-3.5" />
                        Last Updated
                      </p>
                      <p className="text-sm font-semibold text-primary-800">
                        {lastUpdatedAt
                          ? lastUpdatedAt.toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Not synced yet"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="relative mb-6 rounded-2xl border border-primary-200 bg-white p-4 sm:p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="text-base font-semibold text-primary-900 inline-flex items-center gap-2">
                    <FiActivity className="h-4 w-4 text-accent-700" />
                    Quick Actions
                  </h3>
                  <span className="text-xs sm:text-sm text-primary-500">
                    4 shortcuts
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.label}
                        onClick={action.onClick}
                        className={`h-11 rounded-lg border px-3.5 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all ${actionButtonStyles[action.variant]}`}
                      >
                        <Icon className="h-4 w-4" />
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Analytics */}
              <div className="relative mb-6 rounded-2xl border border-primary-200 bg-white p-4 sm:p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-primary-900 inline-flex items-center gap-2">
                      <FiTrendingUp className="h-4 w-4 text-accent-700" />
                      Business Analytics
                    </h3>
                    <p className="text-xs sm:text-sm text-primary-600 mt-1">
                      Sales, order flow, inventory, and user metrics
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={fetchAnalytics}
                    disabled={analyticsLoading || !canViewAnalytics}
                    className="h-9 px-3.5 rounded-lg border border-accent-200 bg-accent-50 text-accent-700 hover:bg-accent-100 text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <FiRefreshCw className={`h-4 w-4 ${analyticsLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </div>

                {!canViewAnalytics ? (
                  <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-700">
                    Analytics are visible only to <strong>Admin</strong> and{" "}
                    <strong>Superadmin</strong>.
                  </div>
                ) : analyticsLoading ? (
                  <div className="rounded-xl border border-primary-200 bg-primary-50 p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500 mx-auto" />
                    <p className="mt-2 text-sm text-primary-600">Loading analytics...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analyticsError && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-700 text-xs sm:text-sm inline-flex items-center gap-2">
                        <FiAlertCircle className="h-4 w-4" />
                        {analyticsError}
                      </div>
                    )}

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="rounded-xl border border-accent-200 bg-accent-50/70 p-3">
                        <p className="text-xs text-accent-700 inline-flex items-center gap-1">
                          <FiDollarSign className="h-3.5 w-3.5" />
                          Total Sales
                        </p>
                        <p className="mt-1 text-lg font-bold text-accent-700">
                          {formatCurrency(analytics.totalSales)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-primary-200 bg-primary-50/70 p-3">
                        <p className="text-xs text-primary-700 inline-flex items-center gap-1">
                          <FiCalendar className="h-3.5 w-3.5" />
                          Today Sales
                        </p>
                        <p className="mt-1 text-lg font-bold text-primary-900">
                          {formatCurrency(analytics.todaySales)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-primary-200 bg-white p-3">
                        <p className="text-xs text-primary-500 inline-flex items-center gap-1">
                          <FiShoppingBag className="h-3.5 w-3.5" />
                          Total Orders
                        </p>
                        <p className="mt-1 text-lg font-semibold text-primary-900">
                          {analytics.totalOrders}
                        </p>
                      </div>
                      <div className="rounded-xl border border-primary-200 bg-white p-3">
                        <p className="text-xs text-primary-500 inline-flex items-center gap-1">
                          <FiClock className="h-3.5 w-3.5" />
                          Today Orders
                        </p>
                        <p className="mt-1 text-lg font-semibold text-primary-900">
                          {analytics.todayOrders}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="rounded-xl border border-green-200 bg-green-50 p-3">
                        <p className="text-xs text-green-700 inline-flex items-center gap-1">
                          <FiCheckCircle className="h-3.5 w-3.5" />
                          Paid Orders
                        </p>
                        <p className="mt-1 text-lg font-semibold text-green-700">
                          {analytics.paidOrders}
                        </p>
                      </div>
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                        <p className="text-xs text-amber-700 inline-flex items-center gap-1">
                          <FiClock className="h-3.5 w-3.5" />
                          Pending
                        </p>
                        <p className="mt-1 text-lg font-semibold text-amber-700">
                          {analytics.pendingOrders}
                        </p>
                      </div>
                      <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                        <p className="text-xs text-blue-700 inline-flex items-center gap-1">
                          <FiTruck className="h-3.5 w-3.5" />
                          Shipped
                        </p>
                        <p className="mt-1 text-lg font-semibold text-blue-700">
                          {analytics.shippedOrders}
                        </p>
                      </div>
                      <div className="rounded-xl border border-primary-200 bg-white p-3">
                        <p className="text-xs text-primary-500 inline-flex items-center gap-1">
                          <FiCheckCircle className="h-3.5 w-3.5" />
                          Delivered / Cancelled
                        </p>
                        <p className="mt-1 text-lg font-semibold text-primary-900">
                          {analytics.deliveredOrders} / {analytics.cancelledOrders}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="rounded-xl border border-primary-200 bg-white p-3">
                        <p className="text-xs text-primary-500 inline-flex items-center gap-1">
                          <FiPackage className="h-3.5 w-3.5" />
                          Products
                        </p>
                        <p className="mt-1 text-lg font-semibold text-primary-900">
                          {analytics.totalProducts}
                        </p>
                      </div>
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                        <p className="text-xs text-red-700 inline-flex items-center gap-1">
                          <FiAlertCircle className="h-3.5 w-3.5" />
                          Low / Out of Stock
                        </p>
                        <p className="mt-1 text-lg font-semibold text-red-700">
                          {analytics.lowStockProducts} / {analytics.outOfStockProducts}
                        </p>
                      </div>
                      <div className="rounded-xl border border-primary-200 bg-white p-3">
                        <p className="text-xs text-primary-500 inline-flex items-center gap-1">
                          <FiUsers className="h-3.5 w-3.5" />
                          Total Users
                        </p>
                        <p className="mt-1 text-lg font-semibold text-primary-900">
                          {analytics.totalUsers}
                        </p>
                      </div>
                      <div className="rounded-xl border border-primary-200 bg-white p-3">
                        <p className="text-xs text-primary-500 inline-flex items-center gap-1">
                          <FiTrendingUp className="h-3.5 w-3.5" />
                          Avg Order Value
                        </p>
                        <p className="mt-1 text-lg font-semibold text-primary-900 inline-flex items-center gap-1.5">
                          <FiDollarSign className="h-4 w-4 text-accent-700" />
                          {formatCurrency(analytics.averageOrderValue)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="rounded-xl border border-primary-200 bg-white p-3">
                        <p className="text-xs text-primary-500 inline-flex items-center gap-1">
                          <FiUser className="h-3.5 w-3.5" />
                          Customers
                        </p>
                        <p className="mt-1 text-lg font-semibold text-primary-900">
                          {analytics.customers}
                        </p>
                      </div>
                      <div className="rounded-xl border border-primary-200 bg-white p-3">
                        <p className="text-xs text-primary-500 inline-flex items-center gap-1">
                          <FiBriefcase className="h-3.5 w-3.5" />
                          Managers
                        </p>
                        <p className="mt-1 text-lg font-semibold text-primary-900">
                          {analytics.managers}
                        </p>
                      </div>
                      <div className="rounded-xl border border-primary-200 bg-white p-3">
                        <p className="text-xs text-primary-500 inline-flex items-center gap-1">
                          <FiShield className="h-3.5 w-3.5" />
                          Admins
                        </p>
                        <p className="mt-1 text-lg font-semibold text-primary-900">
                          {analytics.admins}
                        </p>
                      </div>
                      <div className="rounded-xl border border-accent-200 bg-accent-50/70 p-3">
                        <p className="text-xs text-accent-700 inline-flex items-center gap-1">
                          <FiAward className="h-3.5 w-3.5" />
                          Superadmins
                        </p>
                        <p className="mt-1 text-lg font-semibold text-accent-700">
                          {analytics.superadmins}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Graphs */}
              <div className="relative rounded-2xl border border-primary-200 bg-white p-4 sm:p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-primary-900 inline-flex items-center gap-2">
                    <FiBarChart2 className="h-4 w-4 text-accent-700" />
                    Analytics Graphs
                  </h3>
                  <p className="text-xs sm:text-sm text-primary-600 mt-1">
                    Visual breakdown of sales, orders, and user distribution
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-primary-200 bg-primary-50/40 p-3">
                    <h4 className="text-sm font-semibold text-primary-900 mb-2 inline-flex items-center gap-1.5">
                      <FiDollarSign className="h-4 w-4 text-accent-700" />
                      Sales Bar Chart
                    </h4>
                    <div className="rounded-lg border border-primary-200 bg-white px-2 py-3">
                      <div className="h-40 flex items-end justify-around gap-2">
                        {salesSeries.map((item) => (
                          <div key={item.label} className="flex-1 max-w-[88px] flex flex-col items-center gap-1">
                            <span className="text-[10px] font-semibold text-primary-700 truncate max-w-full">
                              {formatCurrency(item.value)}
                            </span>
                            <div
                              className={`w-8 sm:w-10 rounded-t-md ${item.color}`}
                              style={{
                                height: `${Math.max(24, (Math.max(8, item.percentage) / 100) * 120)}px`,
                              }}
                            />
                            <span className="text-[10px] text-primary-600 text-center leading-tight">
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-primary-200 bg-primary-50/40 p-3">
                    <h4 className="text-sm font-semibold text-primary-900 mb-2 inline-flex items-center gap-1.5">
                      <FiPieChart className="h-4 w-4 text-accent-700" />
                      Order Status Pie
                    </h4>
                    <div className="rounded-lg border border-primary-200 bg-white p-3">
                      <div className="flex items-center gap-4">
                        <div
                          className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full border border-primary-200 shrink-0"
                          style={{ background: orderStatusPie.background }}
                        >
                          <div className="absolute inset-6 rounded-full bg-white border border-primary-100 flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary-700">
                              {orderStatusPie.total}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          {orderStatusPie.rows.map((item) => (
                            <div key={item.label} className="flex items-center justify-between text-[11px] text-primary-700">
                              <span className="inline-flex items-center gap-1.5">
                                <span
                                  className="h-2.5 w-2.5 rounded-full border border-white shadow"
                                  style={{ backgroundColor: item.hex }}
                                />
                                <item.icon className="h-3.5 w-3.5" />
                                {item.label}
                              </span>
                              <span className="font-semibold">{item.share.toFixed(0)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-primary-200 bg-primary-50/40 p-3">
                    <h4 className="text-sm font-semibold text-primary-900 mb-2 inline-flex items-center gap-1.5">
                      <FiPieChart className="h-4 w-4 text-accent-700" />
                      User Role Pie
                    </h4>
                    <div className="rounded-lg border border-primary-200 bg-white p-3">
                      <div className="flex items-center gap-4">
                        <div
                          className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full border border-primary-200 shrink-0"
                          style={{ background: userRolePie.background }}
                        >
                          <div className="absolute inset-6 rounded-full bg-white border border-primary-100 flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary-700">
                              {userRolePie.total}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          {userRolePie.rows.map((item) => (
                            <div key={item.label} className="flex items-center justify-between text-[11px] text-primary-700">
                              <span className="inline-flex items-center gap-1.5">
                                <span
                                  className="h-2.5 w-2.5 rounded-full border border-white shadow"
                                  style={{ backgroundColor: item.hex }}
                                />
                                <item.icon className="h-3.5 w-3.5" />
                                {item.label}
                              </span>
                              <span className="font-semibold">{item.share.toFixed(0)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
