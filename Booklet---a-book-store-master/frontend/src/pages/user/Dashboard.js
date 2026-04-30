import React from "react";
import Layout from "../../components/Layout/Layout";
import UserMenu from "../../components/Layout/UserMenu";
import { useAuth } from "../../context/auth";
import {
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiEdit3,
  FiMail,
  FiMapPin,
  FiShield,
  FiShoppingBag,
  FiUser,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { getRoleLabel } from "../../utils/roleUtils";
import { formatAddressText } from "../../utils/addressUtils";

const Dashboard = () => {
  const [auth] = useAuth();
  const navigate = useNavigate();

  const orderNavigation = () => {
    navigate("/dashboard/user/orders");
  };

  const browseBooks = () => {
    navigate("/");
  };

  const updateProfile = () => {
    navigate("/dashboard/user/profile");
  };

  const joinedDate = auth?.user?.createdAt
    ? new Date(auth.user.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "N/A";
  const displayAddress = formatAddressText(
    auth?.user?.profileAddress || auth?.user?.address
  );

  return (
    <Layout title={"User Dashboard - Booklet"}>
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
                    <FiShield className="h-5 w-5 text-accent-700" />
                    Welcome back, {auth?.user?.name || "User"}!
                  </h1>
                  <p className="mt-1.5 text-sm text-primary-700">
                    Keep your profile updated and manage your orders from one place.
                  </p>
                  <p className="mt-1 text-sm font-medium text-accent-700 break-all inline-flex items-center gap-1.5">
                    <FiMail className="h-4 w-4 shrink-0" />
                    {auth?.user?.email || "N/A"}
                  </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                  <div className="rounded-xl border border-primary-200 bg-white p-3">
                    <p className="text-xs text-primary-500 inline-flex items-center gap-1">
                      <FiUser className="h-3.5 w-3.5" />
                      Account Type
                    </p>
                    <p className="mt-1 text-sm font-semibold text-primary-900">
                      {getRoleLabel(auth?.user?.role)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-primary-200 bg-white p-3">
                    <p className="text-xs text-primary-500 inline-flex items-center gap-1">
                      <FiCalendar className="h-3.5 w-3.5" />
                      Member Since
                    </p>
                    <p className="mt-1 text-sm font-semibold text-primary-900">{joinedDate}</p>
                  </div>

                  <div className="rounded-xl border border-accent-200 bg-accent-50/70 p-3">
                    <p className="text-xs text-accent-700 inline-flex items-center gap-1">
                      <FiCheckCircle className="h-3.5 w-3.5" />
                      Account Status
                    </p>
                    <p className="mt-1 text-sm font-semibold text-accent-700">Active</p>
                  </div>

                  <div className="rounded-xl border border-primary-200 bg-primary-50/70 p-3">
                    <p className="text-xs text-primary-700 inline-flex items-center gap-1">
                      <FiMapPin className="h-3.5 w-3.5" />
                      Address
                    </p>
                    <p className="mt-1 text-sm font-semibold text-primary-900 truncate">
                      {displayAddress || "Not Added"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-accent-200 bg-accent-50/40 p-4">
                    <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-accent-200 bg-white text-accent-700">
                      <FiUser className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="text-base font-semibold text-primary-900 mb-3">
                      Profile Information
                    </h3>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5 text-sm">
                        <FiUser className="h-4 w-4 text-primary-500 shrink-0" />
                        <span className="text-primary-700">{auth?.user?.name || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm">
                        <FiMail className="h-4 w-4 text-primary-500 shrink-0" />
                        <span className="text-primary-700 break-all">
                          {auth?.user?.email || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 text-sm">
                        <FiMapPin className="h-4 w-4 text-primary-500 shrink-0 mt-0.5" />
                        <span className="text-primary-700">
                          {displayAddress || "No address provided"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-primary-200 bg-primary-50/40 p-4">
                    <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-primary-200 bg-white text-primary-700">
                      <FiShoppingBag className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="text-base font-semibold text-primary-900 mb-3">
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 gap-2.5">
                      <button
                        onClick={orderNavigation}
                        className="h-10 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors text-sm font-semibold inline-flex items-center justify-center gap-2"
                      >
                        <FiShoppingBag className="h-4 w-4" />
                        View Orders
                      </button>
                      <button
                        onClick={updateProfile}
                        className="h-10 border border-accent-200 bg-accent-50 text-accent-700 rounded-lg hover:bg-accent-100 transition-colors text-sm font-semibold inline-flex items-center justify-center gap-2"
                      >
                        <FiEdit3 className="h-4 w-4" />
                        Update Profile
                      </button>
                      <button
                        onClick={browseBooks}
                        className="h-10 border border-primary-200 bg-white text-primary-800 rounded-lg hover:bg-primary-100 transition-colors text-sm font-semibold inline-flex items-center justify-center gap-2"
                      >
                        <FiBookOpen className="h-4 w-4" />
                        Browse Books
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-primary-100">
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-primary-600">
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1">
                      <FiCheckCircle className="h-3.5 w-3.5 text-accent-600" />
                      Profile secure
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-white px-2.5 py-1">
                      <FiShield className="h-3.5 w-3.5 text-primary-600" />
                      Account protected
                    </span>
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

export default Dashboard;
