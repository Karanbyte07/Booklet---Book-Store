import React from "react";
import { NavLink } from "react-router-dom";
import { FiGrid, FiShoppingBag, FiUser } from "react-icons/fi";

const UserMenu = () => {
  const menuItems = [
    { to: "/dashboard/user", label: "Overview", icon: FiGrid, end: true },
    { to: "/dashboard/user/profile", label: "Profile", icon: FiUser },
    { to: "/dashboard/user/orders", label: "Orders", icon: FiShoppingBag },
  ];

  return (
    <aside className="rounded-2xl border border-primary-200 bg-white shadow-sm p-4 lg:sticky lg:top-24">
      <div className="rounded-xl border border-primary-200 bg-gradient-to-r from-primary-50 via-white to-accent-50 p-4">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-accent-200 bg-accent-50 text-accent-700">
          <FiGrid className="h-5 w-5" />
        </div>
        <h3 className="mt-3 text-lg font-semibold text-primary-900">My Dashboard</h3>
        <p className="text-sm text-primary-600">Manage profile and track orders</p>
      </div>

      <nav className="mt-4 space-y-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `no-underline h-10 px-3 rounded-lg flex items-center gap-2.5 transition-colors ${
                  isActive
                    ? "bg-accent-100 text-accent-700 border border-accent-200"
                    : "text-primary-700 hover:bg-primary-50 hover:text-accent-700"
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default UserMenu;
