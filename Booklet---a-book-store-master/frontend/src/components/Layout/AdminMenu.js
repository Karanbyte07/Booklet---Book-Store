import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FiGrid,
  FiTag,
  FiPackage,
  FiPlus,
  FiShoppingBag,
  FiUsers,
  FiChevronLeft,
  FiChevronRight,
  FiHeadphones,
  FiMapPin,
} from "react-icons/fi";

const AdminMenu = () => {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("admin-menu-collapsed") === "true";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("admin-menu-collapsed", String(collapsed));
    }
  }, [collapsed]);

  const menuItems = [
    { to: "/dashboard/admin", label: "Dashboard", icon: FiGrid, end: true },
    {
      to: "/dashboard/admin/create-category",
      label: "Create Category",
      icon: FiTag,
    },
    {
      to: "/dashboard/admin/create-product",
      label: "Create Product",
      icon: FiPlus,
    },
    {
      to: "/dashboard/admin/service-locations",
      label: "Service Locations",
      icon: FiMapPin,
    },
    {
      to: "/dashboard/admin/site-settings",
      label: "Support Settings",
      icon: FiHeadphones,
    },
    { to: "/dashboard/admin/products", label: "Products", icon: FiPackage },
    { to: "/dashboard/admin/orders", label: "Orders", icon: FiShoppingBag },
    { to: "/dashboard/admin/users", label: "Users", icon: FiUsers },
  ];

  const rowBaseClass = collapsed
    ? "h-10 w-full justify-center px-2"
    : "h-10 w-full gap-2.5 px-3";

  return (
    <aside
      className={`relative lg:sticky lg:top-24 transition-all duration-300 ${
        collapsed ? "lg:w-[72px]" : "lg:w-64"
      }`}
    >
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        className="hidden lg:inline-flex absolute top-1 right-0 translate-x-1/2 z-20 h-8 w-8 items-center justify-center rounded-full border border-primary-300 bg-white text-primary-600 shadow-sm hover:text-accent-700 hover:border-accent-300"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <FiChevronRight className="h-4 w-4" />
        ) : (
          <FiChevronLeft className="h-4 w-4" />
        )}
      </button>

      <div className="border-r-2 border-primary-300 lg:pr-3">
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `group no-underline flex items-center rounded-lg transition-all ${rowBaseClass} ${
                    isActive
                      ? "bg-accent-50 text-accent-700"
                      : "text-primary-700 hover:bg-primary-50 hover:text-accent-700"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
                        isActive
                          ? "bg-accent-100 text-accent-700"
                          : "text-primary-700 group-hover:text-accent-700"
                      } shrink-0`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    {!collapsed && (
                      <span className="text-sm font-medium leading-none">
                        {item.label}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default AdminMenu;
