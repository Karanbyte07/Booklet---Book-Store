import React, { useState } from "react";
import Layout from "./../../components/Layout/Layout";
import axios from "../../config/axios";
import { useNavigate, useLocation, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/auth";
import { getApiErrorMessage } from "../../utils/errorUtils";
import {
  FiArrowRight,
  FiEye,
  FiEyeOff,
  FiLock,
  FiLogIn,
  FiMail,
} from "react-icons/fi";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [auth, setAuth] = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/v1/auth/login", {
        email,
        password,
      });
      if (res?.data?.success) {
        toast.success(res?.data?.message || "Login successful");
        setAuth({
          ...auth,
          user: res.data.user,
          token: res.data.token,
        });
        localStorage.setItem("auth", JSON.stringify(res.data));
        navigate(location.state || "/");
      } else {
        toast.error(res?.data?.message || "Unable to login");
      }
    } catch (error) {
      console.log(error);
      toast.error(getApiErrorMessage(error, "Unable to login"));
    }
  };

  return (
    <Layout title="Login - Booklet">
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 py-10 px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 overflow-hidden rounded-3xl border border-primary-200 bg-white shadow-xl">
          {/* Left branding panel */}
          <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary-900 via-primary-800 to-accent-700 p-8 text-white">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                Booklet
              </div>
              <h1 className="mt-5 text-3xl font-bold leading-tight">
                Welcome back to your reading universe.
              </h1>
              <p className="mt-3 text-sm text-white/85">
                Sign in to continue shopping books, managing orders, and discovering your next favorite title.
              </p>
            </div>
            <div className="space-y-2 text-sm text-white/90">
              <p>• Curated titles across categories</p>
              <p>• Fast and secure checkout</p>
              <p>• Track orders and wishlist in one place</p>
            </div>
          </div>

          {/* Form panel */}
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mb-6">
              <div className="h-11 w-11 rounded-xl bg-accent-100 text-accent-700 border border-accent-200 flex items-center justify-center mb-3">
                <FiLogIn className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-primary-900">Sign In</h2>
              <p className="text-sm text-primary-600 mt-1">
                Enter your credentials to access your account.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary-500"
                >
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="h-4 w-4 text-primary-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 rounded-lg border border-primary-200 bg-white pl-10 pr-3 text-sm text-primary-900 placeholder:text-primary-400 focus:outline-none focus:ring-2 focus:ring-accent-300"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary-500"
                >
                  Password
                </label>
                <div className="relative">
                  <FiLock className="h-4 w-4 text-primary-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 rounded-lg border border-primary-200 bg-white pl-10 pr-10 text-sm text-primary-900 placeholder:text-primary-400 focus:outline-none focus:ring-2 focus:ring-accent-300"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 text-primary-400 hover:text-primary-600"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-4 w-4" />
                    ) : (
                      <FiEye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm text-accent-700 hover:text-accent-800 font-medium"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
              >
                Continue
                <FiArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-primary-100 text-sm text-primary-600 text-center">
              New to Booklet?{" "}
              <Link
                to="/register"
                className="font-semibold text-accent-700 hover:text-accent-800"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
