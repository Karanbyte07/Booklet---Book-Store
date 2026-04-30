import React, { useEffect, useState } from "react";
import UserMenu from "../../components/Layout/UserMenu";
import Layout from "./../../components/Layout/Layout";
import { useAuth } from "../../context/auth";
import toast from "react-hot-toast";
import axios from "../../config/axios";
import { getApiErrorMessage } from "../../utils/errorUtils";
import {
  createAddressPayload,
  normalizeAddressForForm,
} from "../../utils/addressUtils";
import {
  FiInfo,
  FiLock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSave,
  FiShield,
  FiUser,
} from "react-icons/fi";

const inputBaseClass =
  "w-full h-10 rounded-lg border border-primary-200 bg-white px-3 text-sm text-primary-900 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent-300";

const Profile = () => {
  const [auth, setAuth] = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [addressForm, setAddressForm] = useState(
    normalizeAddressForForm("", {})
  );

  useEffect(() => {
    const user = auth?.user;
    if (!user) return;

    setName(user?.name || "");
    setPhone(user?.phone || "");
    setEmail(user?.email || "");
    setAddressForm(
      normalizeAddressForForm(user?.profileAddress || user?.address, {
        fullName: user?.name || "",
        phone: user?.phone || "",
      })
    );
  }, [auth?.user]);

  const handleAddressFieldChange = (field, value) => {
    setAddressForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const profileAddressPayload = createAddressPayload({
      ...addressForm,
      fullName: name,
      phone,
    });

    if (!profileAddressPayload.line1) {
      toast.error("Address line 1 is required");
      return;
    }

    try {
      const { data } = await axios.put("/api/v1/auth/profile", {
        name,
        email,
        password,
        phone,
        profileAddress: profileAddressPayload,
      });

      if (data?.error) {
        toast.error(data?.error);
        return;
      }

      setAuth({ ...auth, user: data?.updatedUser });

      let ls = localStorage.getItem("auth");
      ls = ls ? JSON.parse(ls) : {};
      ls.user = data?.updatedUser;
      localStorage.setItem("auth", JSON.stringify(ls));

      setPassword("");
      setAddressForm(
        normalizeAddressForForm(
          data?.updatedUser?.profileAddress || data?.updatedUser?.address,
          {
            fullName: data?.updatedUser?.name || "",
            phone: data?.updatedUser?.phone || "",
          }
        )
      );
      toast.success("Profile Updated Successfully");
    } catch (error) {
      console.log(error);
      toast.error(getApiErrorMessage(error, "Unable to update profile"));
    }
  };

  return (
    <Layout title={"Your Profile - Booklet"}>
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
                    <FiUser className="h-5 w-5 text-accent-700" />
                    Profile Settings
                  </h1>
                  <p className="mt-1.5 text-sm text-primary-700">
                    Update your personal details and account security settings.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-primary-600 uppercase tracking-wide inline-flex items-center gap-1 mb-1.5">
                        <FiUser className="h-3.5 w-3.5" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={inputBaseClass}
                        placeholder="Enter your full name"
                        autoFocus
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-primary-600 uppercase tracking-wide inline-flex items-center gap-1 mb-1.5">
                        <FiPhone className="h-3.5 w-3.5" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={inputBaseClass}
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-primary-600 uppercase tracking-wide inline-flex items-center gap-1 mb-1.5">
                      <FiMail className="h-3.5 w-3.5" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-10 rounded-lg border border-primary-200 bg-primary-100 px-3 text-sm text-primary-500 cursor-not-allowed"
                      placeholder="Enter your email"
                      disabled
                    />
                    <p className="mt-1.5 text-xs text-primary-500 inline-flex items-center gap-1">
                      <FiInfo className="h-3.5 w-3.5" />
                      Email cannot be changed for security reasons.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-primary-600 uppercase tracking-wide inline-flex items-center gap-1 mb-1.5">
                      <FiLock className="h-3.5 w-3.5" />
                      New Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputBaseClass}
                      placeholder="Leave blank to keep current password"
                    />
                    <p className="mt-1.5 text-xs text-primary-500 inline-flex items-center gap-1">
                      <FiShield className="h-3.5 w-3.5" />
                      Use at least 6 characters when updating password.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-primary-600 uppercase tracking-wide inline-flex items-center gap-1 mb-1.5">
                      <FiMapPin className="h-3.5 w-3.5" />
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      value={addressForm.line1}
                      onChange={(e) =>
                        handleAddressFieldChange("line1", e.target.value)
                      }
                      className={inputBaseClass}
                      placeholder="House no, building, street"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-primary-600 uppercase tracking-wide inline-flex items-center gap-1 mb-1.5">
                      <FiMapPin className="h-3.5 w-3.5" />
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      value={addressForm.line2}
                      onChange={(e) =>
                        handleAddressFieldChange("line2", e.target.value)
                      }
                      className={inputBaseClass}
                      placeholder="Area, locality (optional)"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-primary-600 uppercase tracking-wide inline-flex items-center gap-1 mb-1.5">
                        City
                      </label>
                      <input
                        type="text"
                        value={addressForm.city}
                        onChange={(e) =>
                          handleAddressFieldChange("city", e.target.value)
                        }
                        className={inputBaseClass}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-primary-600 uppercase tracking-wide inline-flex items-center gap-1 mb-1.5">
                        State
                      </label>
                      <input
                        type="text"
                        value={addressForm.state}
                        onChange={(e) =>
                          handleAddressFieldChange("state", e.target.value)
                        }
                        className={inputBaseClass}
                        placeholder="State"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-primary-600 uppercase tracking-wide inline-flex items-center gap-1 mb-1.5">
                        Pincode
                      </label>
                      <input
                        type="text"
                        value={addressForm.pincode}
                        onChange={(e) =>
                          handleAddressFieldChange("pincode", e.target.value)
                        }
                        className={inputBaseClass}
                        placeholder="Pincode"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-primary-600 uppercase tracking-wide inline-flex items-center gap-1 mb-1.5">
                        Country
                      </label>
                      <input
                        type="text"
                        value={addressForm.country}
                        onChange={(e) =>
                          handleAddressFieldChange("country", e.target.value)
                        }
                        className={inputBaseClass}
                        placeholder="Country"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-primary-600 uppercase tracking-wide inline-flex items-center gap-1 mb-1.5">
                        Landmark
                      </label>
                      <input
                        type="text"
                        value={addressForm.landmark}
                        onChange={(e) =>
                          handleAddressFieldChange("landmark", e.target.value)
                        }
                        className={inputBaseClass}
                        placeholder="Landmark (optional)"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-primary-600 uppercase tracking-wide inline-flex items-center gap-1 mb-1.5">
                        Address Type
                      </label>
                      <select
                        value={addressForm.addressType}
                        onChange={(e) =>
                          handleAddressFieldChange("addressType", e.target.value)
                        }
                        className={inputBaseClass}
                      >
                        <option value="home">Home</option>
                        <option value="work">Work</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full h-10 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
                    >
                      <FiSave className="h-4 w-4" />
                      Update Profile
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
