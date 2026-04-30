import React, { useState } from "react";
import Layout from "./../../components/Layout/Layout";
import axios from "../../config/axios";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../../utils/errorUtils";
import {
  FiArrowRight,
  FiHelpCircle,
  FiKey,
  FiLock,
  FiMail,
} from "react-icons/fi";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [answer, setAnswer] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/v1/auth/forgot-password", {
        email,
        newPassword,
        answer,
      });
      if (res?.data?.success) {
        toast.success(res?.data?.message || "Password reset successful");
        navigate("/login");
      } else {
        toast.error(res?.data?.message || "Unable to reset password");
      }
    } catch (error) {
      console.log(error);
      toast.error(getApiErrorMessage(error, "Unable to reset password"));
    }
  };

  return (
    <Layout title={"Forgot Password - Booklet"}>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 py-10 px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 flex items-center justify-center">
        <div className="w-full rounded-3xl border border-primary-200 bg-white shadow-xl p-6 sm:p-8 lg:p-10">
          <div className="text-center mb-6">
            <div className="mx-auto h-12 w-12 rounded-xl bg-accent-100 text-accent-700 border border-accent-200 flex items-center justify-center mb-3">
              <FiKey className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-primary-900">Reset Password</h1>
            <p className="mt-1 text-sm text-primary-600">
              Verify your identity and set a new password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary-500">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="h-4 w-4 text-primary-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 rounded-lg border border-primary-200 bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                  placeholder="you@example.com"
                  required
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
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full h-11 rounded-lg border border-primary-200 bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                  placeholder="Enter your answer"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary-500">
                New Password
              </label>
              <div className="relative">
                <FiLock className="h-4 w-4 text-primary-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-11 rounded-lg border border-primary-200 bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                  placeholder="Enter new password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-11 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              Reset Password
              <FiArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-primary-100 text-center text-sm text-primary-600">
            Remembered your password?{" "}
            <Link to="/login" className="font-semibold text-accent-700 hover:text-accent-800">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ForgotPassword;
