import React, { useState } from "react";
import Layout from "./../../components/Layout/Layout";
import axios from "../../config/axios.js";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../../utils/errorUtils";
import {
  FiArrowRight,
  FiCheckCircle,
  FiHelpCircle,
  FiLock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiUser,
} from "react-icons/fi";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [answer, setAnswer] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/v1/auth/register", {
        name,
        email,
        password,
        phone,
        address,
        answer,
      });
      if (res?.data?.success) {
        toast.success(res?.data?.message || "Account created successfully");
        navigate("/login");
      } else {
        toast.error(res?.data?.message || "Unable to create account");
      }
    } catch (error) {
      console.log(error);
      toast.error(getApiErrorMessage(error, "Unable to create account"));
    }
  };

  return (
    <Layout title="Register - Booklet">
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 py-8 px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 overflow-hidden rounded-3xl border border-primary-200 bg-white shadow-xl">
          {/* Left panel */}
          <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-accent-600 via-accent-500 to-primary-700 p-8 text-white">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                Create Account
              </div>
              <h1 className="mt-5 text-3xl font-bold leading-tight">
                Start your journey with Booklet today.
              </h1>
              <p className="mt-3 text-sm text-white/90">
                Register once and enjoy personalized recommendations, wishlist sync, and order tracking.
              </p>
            </div>

            <div className="space-y-2.5 text-sm text-white/90">
              <p className="inline-flex items-center gap-2"><FiCheckCircle className="h-4 w-4" /> Fast onboarding</p>
              <p className="inline-flex items-center gap-2"><FiCheckCircle className="h-4 w-4" /> Secure account recovery</p>
              <p className="inline-flex items-center gap-2"><FiCheckCircle className="h-4 w-4" /> Instant access to dashboard</p>
            </div>
          </div>

          {/* Form panel */}
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-primary-900">Create Account</h2>
              <p className="mt-1 text-sm text-primary-600">
                Fill your details to register on Booklet.
              </p>
            </div>

            <form className="space-y-3.5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary-500">
                  Full Name
                </label>
                <div className="relative">
                  <FiUser className="h-4 w-4 text-primary-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    autoComplete="name"
                    required
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 rounded-lg border border-primary-200 bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary-500">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="h-4 w-4 text-primary-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 rounded-lg border border-primary-200 bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Password
                  </label>
                  <div className="relative">
                    <FiLock className="h-4 w-4 text-primary-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-10 rounded-lg border border-primary-200 bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                      placeholder="Create password"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Phone Number
                  </label>
                  <div className="relative">
                    <FiPhone className="h-4 w-4 text-primary-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      autoComplete="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-10 rounded-lg border border-primary-200 bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                      placeholder="Phone"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary-500">
                  Address
                </label>
                <div className="relative">
                  <FiMapPin className="h-4 w-4 text-primary-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    autoComplete="street-address"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full h-10 rounded-lg border border-primary-200 bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    placeholder="Enter address"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary-500">
                  Security Answer (Favorite sport)
                </label>
                <div className="relative">
                  <FiHelpCircle className="h-4 w-4 text-primary-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="w-full h-10 rounded-lg border border-primary-200 bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    placeholder="Example: Cricket"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 mt-1"
              >
                Create Account
                <FiArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-primary-100 text-sm text-primary-600 text-center">
              Already registered?{" "}
              <Link
                to="/login"
                className="font-semibold text-accent-700 hover:text-accent-800"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Register;
