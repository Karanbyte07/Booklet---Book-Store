import React, { useEffect, useMemo, useState } from "react";
import AdminMenu from "../../components/Layout/AdminMenu";
import Layout from "./../../components/Layout/Layout";
import axios from "../../config/axios";
import toast from "react-hot-toast";
import {
  FiCheckCircle,
  FiEdit2,
  FiFilter,
  FiKey,
  FiMail,
  FiMapPin,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";
import moment from "moment";
import {
  hasSuperAdminAccess,
  ROLE,
  ROLE_OPTIONS,
  getRoleLabel,
  normalizeRole,
} from "../../utils/roleUtils";
import { useAuth } from "../../context/auth";
import { useConfirm } from "../../context/confirm";
import {
  createAddressPayload,
  formatAddressText,
  normalizeAddressForForm,
} from "../../utils/addressUtils";

const roleBadgeStyles = {
  [ROLE.SUPERADMIN]:
    "bg-purple-100 text-purple-700 border border-purple-200 shadow-sm",
  [ROLE.ADMIN]: "bg-accent-100 text-accent-700 border border-accent-200",
  [ROLE.MANAGER]: "bg-blue-100 text-blue-700 border border-blue-200",
  [ROLE.CUSTOMER]: "bg-primary-100 text-primary-700 border border-primary-200",
};

const initialFormState = {
  name: "",
  email: "",
  password: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  addressCity: "",
  addressState: "",
  addressPincode: "",
  addressCountry: "India",
  addressLandmark: "",
  addressType: "home",
  answer: "",
  role: ROLE.CUSTOMER,
};

const Users = () => {
  const [auth] = useAuth();
  const confirm = useConfirm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState("");
  const [editingUserId, setEditingUserId] = useState("");

  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [formState, setFormState] = useState(initialFormState);
  const [editFormState, setEditFormState] = useState({
    name: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    addressCity: "",
    addressState: "",
    addressPincode: "",
    addressCountry: "India",
    addressLandmark: "",
    addressType: "home",
    answer: "",
    role: ROLE.CUSTOMER,
    password: "",
  });

  const isSuperAdmin = hasSuperAdminAccess(auth?.user?.role);

  const getAllUsers = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/v1/auth/all-users");
      if (data?.success) {
        setUsers(data.users || []);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.log("Error fetching users:", error);
      toast.error("Unable to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllUsers();
  }, []);

  const handleInputChange = (field, value) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      toast.error("Only superadmin can create users");
      return;
    }

    const {
      name,
      email,
      password,
      phone,
      answer,
      role,
      addressLine1,
      addressLine2,
      addressCity,
      addressState,
      addressPincode,
      addressCountry,
      addressLandmark,
      addressType,
    } = formState;
    if (!name || !email || !password || !phone || !addressLine1 || !answer) {
      toast.error("Please fill all required fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setCreating(true);
      const profileAddress = createAddressPayload({
        fullName: name,
        phone,
        line1: addressLine1,
        line2: addressLine2,
        city: addressCity,
        state: addressState,
        pincode: addressPincode,
        country: addressCountry,
        landmark: addressLandmark,
        addressType,
        isDefault: true,
      });
      const payload = {
        name,
        email,
        password,
        phone,
        answer,
        role: Number(role),
        profileAddress,
      };

      const { data } = await axios.post("/api/v1/auth/create-user", payload);

      if (data?.success) {
        toast.success(data?.message || "User created successfully");
        setFormState(initialFormState);
        setUsers((prev) => [data.user, ...prev]);
      } else {
        toast.error(data?.message || "Failed to create user");
      }
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.message || "Unable to create user");
    } finally {
      setCreating(false);
    }
  };

  const startEditUser = (user) => {
    const normalizedAddress = normalizeAddressForForm(
      user?.profileAddress || user?.address,
      {
        fullName: user?.name || "",
        phone: user?.phone || "",
      }
    );
    setEditingUserId(user._id);
      setEditFormState({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        addressLine1: normalizedAddress.line1 || "",
        addressLine2: normalizedAddress.line2 || "",
        addressCity: normalizedAddress.city || "",
        addressState: normalizedAddress.state || "",
        addressPincode: normalizedAddress.pincode || "",
        addressCountry: normalizedAddress.country || "India",
        addressLandmark: normalizedAddress.landmark || "",
        addressType: normalizedAddress.addressType || "home",
        answer: user?.answer || "",
        role: normalizeRole(user?.role),
        password: "",
      });
  };

  const cancelEditUser = () => {
    setEditingUserId("");
    setEditFormState({
      name: "",
      email: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      addressCity: "",
      addressState: "",
      addressPincode: "",
      addressCountry: "India",
      addressLandmark: "",
      addressType: "home",
      answer: "",
      role: ROLE.CUSTOMER,
      password: "",
    });
  };

  const handleEditInputChange = (field, value) => {
    setEditFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveEdit = async (uid) => {
    if (!isSuperAdmin) {
      toast.error("Only superadmin can edit users");
      return;
    }

    if (
      !editFormState.name ||
      !editFormState.email ||
      !editFormState.phone ||
      !editFormState.addressLine1
    ) {
      toast.error("Name, email, phone and address line 1 are required");
      return;
    }

    if (editFormState.password && editFormState.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setSavingEdit(true);
      const profileAddress = createAddressPayload({
        fullName: editFormState.name,
        phone: editFormState.phone,
        line1: editFormState.addressLine1,
        line2: editFormState.addressLine2,
        city: editFormState.addressCity,
        state: editFormState.addressState,
        pincode: editFormState.addressPincode,
        country: editFormState.addressCountry,
        landmark: editFormState.addressLandmark,
        addressType: editFormState.addressType,
        isDefault: true,
      });
      const payload = {
        ...editFormState,
        role: Number(editFormState.role),
        profileAddress,
      };
      delete payload.addressLine1;
      delete payload.addressLine2;
      delete payload.addressCity;
      delete payload.addressState;
      delete payload.addressPincode;
      delete payload.addressCountry;
      delete payload.addressLandmark;
      delete payload.addressType;
      const { data } = await axios.put(`/api/v1/auth/user/${uid}`, payload);
      if (data?.success) {
        toast.success(data?.message || "User updated successfully");
        setUsers((prev) =>
          prev.map((user) => (user._id === uid ? { ...user, ...data.user } : user))
        );
        cancelEditUser();
      } else {
        toast.error(data?.message || "Unable to update user");
      }
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.message || "Unable to update user");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteUser = async (uid) => {
    if (!isSuperAdmin) {
      toast.error("Only superadmin can delete users");
      return;
    }

    const userToDelete = users.find((user) => user._id === uid);
    const confirmed = await confirm({
      title: "Delete user?",
      message: `Delete "${userToDelete?.name || "this user"}"? This action cannot be undone.`,
      confirmText: "Delete User",
      cancelText: "Cancel",
      tone: "danger",
    });
    if (!confirmed) return;

    try {
      setDeletingUserId(uid);
      const { data } = await axios.delete(`/api/v1/auth/user/${uid}`);
      if (data?.success) {
        toast.success(data?.message || "User deleted successfully");
        setUsers((prev) => prev.filter((user) => user._id !== uid));
        if (editingUserId === uid) cancelEditUser();
      } else {
        toast.error(data?.message || "Unable to delete user");
      }
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.message || "Unable to delete user");
    } finally {
      setDeletingUserId("");
    }
  };

  const filteredUsers = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return users.filter((user) => {
      const roleValue = normalizeRole(user?.role);
      const matchesRole = roleFilter === "all" || Number(roleFilter) === roleValue;

      const matchesSearch =
        !query ||
        user?.name?.toLowerCase().includes(query) ||
        user?.email?.toLowerCase().includes(query) ||
        String(user?.phone || "")?.toLowerCase().includes(query);

      return matchesRole && matchesSearch;
    });
  }, [users, searchText, roleFilter]);

  const roleCounts = useMemo(() => {
    const summary = {
      [ROLE.SUPERADMIN]: 0,
      [ROLE.ADMIN]: 0,
      [ROLE.MANAGER]: 0,
      [ROLE.CUSTOMER]: 0,
    };

    users.forEach((user) => {
      const roleValue = normalizeRole(user?.role);
      summary[roleValue] += 1;
    });

    return summary;
  }, [users]);

  const totalUsers = users.length;

  return (
    <Layout title={"User Management - Booklet Admin"}>
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6 lg:h-[calc(100vh-4rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-5 lg:gap-6 items-start lg:h-full">
          <div>
            <AdminMenu />
          </div>

          <div className="min-w-0 lg:h-full lg:overflow-y-auto lg:pr-1 space-y-5">
            {/* Header */}
            <div className="rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-50 via-white to-accent-50 px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-white text-accent-700 flex items-center justify-center border border-accent-200 shadow-sm">
                    <FiUsers className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-primary-900">User Management</h1>
                    <p className="text-sm text-primary-600">
                      Superadmin can create, edit, and delete users with role-based control.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={getAllUsers}
                  className="h-10 px-4 rounded-lg border border-primary-200 bg-white hover:bg-primary-50 text-primary-700 text-sm font-semibold inline-flex items-center gap-2"
                >
                  <FiRefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="rounded-xl border border-primary-200 bg-white p-3.5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-primary-500 font-semibold">Total</p>
                <p className="mt-1 text-xl font-bold text-primary-900">{totalUsers}</p>
              </div>

              {ROLE_OPTIONS.map((role) => (
                <div key={role.value} className="rounded-xl border border-primary-200 bg-white p-3.5 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-primary-500 font-semibold">{role.label}</p>
                  <p className="mt-1 text-xl font-bold text-primary-900">{roleCounts[role.value] || 0}</p>
                </div>
              ))}
            </div>

            {/* Main Panels */}
            <div className="grid grid-cols-1 xl:grid-cols-[360px,1fr] gap-4">
              {/* Create User Form */}
              <div className="rounded-2xl border border-primary-200 bg-white p-4 sm:p-5 shadow-sm h-fit">
                <div className="flex items-center gap-2 mb-4">
                  <FiPlus className="h-4 w-4 text-accent-600" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-600">Create User</h2>
                </div>

                {!isSuperAdmin ? (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-3 text-sm text-yellow-800">
                    You have read-only access. Only <strong>superadmin</strong> can create users.
                  </div>
                ) : (
                <form className="space-y-3" onSubmit={handleCreateUser}>
                  <div>
                    <label className="mb-1 text-xs font-semibold text-primary-600 inline-flex items-center gap-1">
                      <FiUser className="h-3.5 w-3.5" />
                      Name
                    </label>
                    <input
                      type="text"
                      value={formState.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Enter full name"
                      className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    />
                  </div>

                  <div>
                    <label className="mb-1 text-xs font-semibold text-primary-600 inline-flex items-center gap-1">
                      <FiMail className="h-3.5 w-3.5" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={formState.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="Enter email address"
                      className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    />
                  </div>

                  <div>
                    <label className="mb-1 text-xs font-semibold text-primary-600 inline-flex items-center gap-1">
                      <FiKey className="h-3.5 w-3.5" />
                      Password
                    </label>
                    <input
                      type="password"
                      value={formState.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 text-xs font-semibold text-primary-600 inline-flex items-center gap-1">
                        <FiPhone className="h-3.5 w-3.5" />
                        Phone
                      </label>
                      <input
                        type="text"
                        value={formState.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="Phone"
                        className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                      />
                    </div>
                    <div>
                      <label className="mb-1 text-xs font-semibold text-primary-600 inline-flex items-center gap-1">
                        <FiShield className="h-3.5 w-3.5" />
                        Role
                      </label>
                      <select
                        value={formState.role}
                        onChange={(e) => handleInputChange("role", e.target.value)}
                        className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent-300"
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="mb-1 text-xs font-semibold text-primary-600 inline-flex items-center gap-1">
                      <FiMapPin className="h-3.5 w-3.5" />
                      Profile Address
                    </label>
                    <input
                      type="text"
                      value={formState.addressLine1}
                      onChange={(e) =>
                        handleInputChange("addressLine1", e.target.value)
                      }
                      placeholder="Address line 1 *"
                      className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    />
                    <input
                      type="text"
                      value={formState.addressLine2}
                      onChange={(e) =>
                        handleInputChange("addressLine2", e.target.value)
                      }
                      placeholder="Address line 2"
                      className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={formState.addressCity}
                        onChange={(e) =>
                          handleInputChange("addressCity", e.target.value)
                        }
                        placeholder="City"
                        className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                      />
                      <input
                        type="text"
                        value={formState.addressState}
                        onChange={(e) =>
                          handleInputChange("addressState", e.target.value)
                        }
                        placeholder="State"
                        className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={formState.addressPincode}
                        onChange={(e) =>
                          handleInputChange("addressPincode", e.target.value)
                        }
                        placeholder="Pincode"
                        className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                      />
                      <input
                        type="text"
                        value={formState.addressCountry}
                        onChange={(e) =>
                          handleInputChange("addressCountry", e.target.value)
                        }
                        placeholder="Country"
                        className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={formState.addressLandmark}
                        onChange={(e) =>
                          handleInputChange("addressLandmark", e.target.value)
                        }
                        placeholder="Landmark"
                        className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                      />
                      <select
                        value={formState.addressType}
                        onChange={(e) =>
                          handleInputChange("addressType", e.target.value)
                        }
                        className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent-300"
                      >
                        <option value="home">Home</option>
                        <option value="work">Work</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 text-xs font-semibold text-primary-600">Security Answer</label>
                    <input
                      type="text"
                      value={formState.answer}
                      onChange={(e) => handleInputChange("answer", e.target.value)}
                      placeholder="Used for password reset"
                      className="w-full h-10 rounded-lg border border-primary-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full h-10 rounded-lg bg-accent-500 hover:bg-accent-600 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
                  >
                    <FiPlus className="h-4 w-4" />
                    {creating ? "Creating..." : "Create User"}
                  </button>
                </form>
                )}
              </div>

              {/* Users List */}
              <div className="rounded-2xl border border-primary-200 bg-white p-4 sm:p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <FiFilter className="h-4 w-4 text-accent-600" />
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-600">All Users</h2>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-400" />
                      <input
                        type="text"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Search users"
                        className="w-[220px] h-10 rounded-lg border border-primary-200 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                      />
                    </div>

                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="h-10 rounded-lg border border-primary-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent-300"
                    >
                      <option value="all">All Roles</option>
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {loading ? (
                  <div className="py-12 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-500 mx-auto" />
                    <p className="mt-3 text-sm text-primary-600">Loading users...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="h-14 w-14 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mx-auto mb-3">
                      <FiUsers className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-primary-900">No users found</h3>
                    <p className="mt-1 text-sm text-primary-600">Try changing search or role filters.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredUsers.map((user) => {
                      const roleValue = normalizeRole(user?.role);
                      return (
                        <div
                          key={user._id}
                          className="rounded-xl border border-primary-200 bg-primary-50/50 px-3 py-2.5 hover:border-accent-200 hover:bg-accent-50/40 transition-all"
                        >
                          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,1.2fr,0.8fr,0.9fr,0.9fr] gap-2 items-center">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-primary-900 truncate">{user.name}</p>
                              <p className="text-xs text-primary-500 truncate">{user.email}</p>
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm text-primary-700 truncate">{user.phone || "N/A"}</p>
                              <p className="text-xs text-primary-500 truncate">
                                {formatAddressText(user.profileAddress || user.address) || "No address"}
                              </p>
                            </div>

                            <div>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  roleBadgeStyles[roleValue] || roleBadgeStyles[ROLE.CUSTOMER]
                                }`}
                              >
                                {getRoleLabel(roleValue)}
                              </span>
                            </div>

                            <div className="text-xs text-primary-600">
                              <span className="block text-primary-500">Joined</span>
                              {moment(user.createdAt).format("DD MMM YYYY")}
                            </div>

                            <div>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                                <FiCheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </span>
                            </div>
                          </div>

                          {isSuperAdmin && (
                            <div className="mt-2.5 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  editingUserId === user._id
                                    ? cancelEditUser()
                                    : startEditUser(user)
                                }
                                className="h-8 px-2.5 rounded-md border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold inline-flex items-center gap-1.5"
                              >
                                {editingUserId === user._id ? (
                                  <>
                                    <FiX className="h-3.5 w-3.5" />
                                    Cancel
                                  </>
                                ) : (
                                  <>
                                    <FiEdit2 className="h-3.5 w-3.5" />
                                    Edit
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(user._id)}
                                disabled={deletingUserId === user._id}
                                className="h-8 px-2.5 rounded-md border border-red-200 bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-700 text-xs font-semibold inline-flex items-center gap-1.5"
                              >
                                <FiTrash2 className="h-3.5 w-3.5" />
                                {deletingUserId === user._id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          )}

                          {isSuperAdmin && editingUserId === user._id && (
                            <div className="mt-3 rounded-lg border border-primary-200 bg-white p-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                <input
                                  type="text"
                                  value={editFormState.name}
                                  onChange={(e) =>
                                    handleEditInputChange("name", e.target.value)
                                  }
                                  placeholder="Name"
                                  className="h-9 rounded-md border border-primary-200 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                                />
                                <input
                                  type="email"
                                  value={editFormState.email}
                                  onChange={(e) =>
                                    handleEditInputChange("email", e.target.value)
                                  }
                                  placeholder="Email"
                                  className="h-9 rounded-md border border-primary-200 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                                />
                                <input
                                  type="text"
                                  value={editFormState.phone}
                                  onChange={(e) =>
                                    handleEditInputChange("phone", e.target.value)
                                  }
                                  placeholder="Phone"
                                  className="h-9 rounded-md border border-primary-200 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                                />
                                <select
                                  value={editFormState.role}
                                  onChange={(e) =>
                                    handleEditInputChange("role", e.target.value)
                                  }
                                  className="h-9 rounded-md border border-primary-200 px-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent-300"
                                >
                                  {ROLE_OPTIONS.map((role) => (
                                    <option key={role.value} value={role.value}>
                                      {role.label}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  value={editFormState.addressLine1}
                                  onChange={(e) =>
                                    handleEditInputChange("addressLine1", e.target.value)
                                  }
                                  placeholder="Address line 1 *"
                                  className="h-9 rounded-md border border-primary-200 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                                />
                                <input
                                  type="text"
                                  value={editFormState.addressLine2}
                                  onChange={(e) =>
                                    handleEditInputChange("addressLine2", e.target.value)
                                  }
                                  placeholder="Address line 2"
                                  className="h-9 rounded-md border border-primary-200 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                                />
                                <input
                                  type="text"
                                  value={editFormState.addressCity}
                                  onChange={(e) =>
                                    handleEditInputChange("addressCity", e.target.value)
                                  }
                                  placeholder="City"
                                  className="h-9 rounded-md border border-primary-200 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                                />
                                <input
                                  type="text"
                                  value={editFormState.addressState}
                                  onChange={(e) =>
                                    handleEditInputChange("addressState", e.target.value)
                                  }
                                  placeholder="State"
                                  className="h-9 rounded-md border border-primary-200 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                                />
                                <input
                                  type="text"
                                  value={editFormState.addressPincode}
                                  onChange={(e) =>
                                    handleEditInputChange("addressPincode", e.target.value)
                                  }
                                  placeholder="Pincode"
                                  className="h-9 rounded-md border border-primary-200 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                                />
                                <input
                                  type="text"
                                  value={editFormState.addressCountry}
                                  onChange={(e) =>
                                    handleEditInputChange("addressCountry", e.target.value)
                                  }
                                  placeholder="Country"
                                  className="h-9 rounded-md border border-primary-200 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                                />
                                <input
                                  type="text"
                                  value={editFormState.addressLandmark}
                                  onChange={(e) =>
                                    handleEditInputChange("addressLandmark", e.target.value)
                                  }
                                  placeholder="Landmark"
                                  className="h-9 rounded-md border border-primary-200 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                                />
                                <select
                                  value={editFormState.addressType}
                                  onChange={(e) =>
                                    handleEditInputChange("addressType", e.target.value)
                                  }
                                  className="h-9 rounded-md border border-primary-200 px-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent-300"
                                >
                                  <option value="home">Home</option>
                                  <option value="work">Work</option>
                                  <option value="other">Other</option>
                                </select>
                                <input
                                  type="text"
                                  value={editFormState.answer}
                                  onChange={(e) =>
                                    handleEditInputChange("answer", e.target.value)
                                  }
                                  placeholder="Security answer"
                                  className="h-9 rounded-md border border-primary-200 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                                />
                                <input
                                  type="password"
                                  value={editFormState.password}
                                  onChange={(e) =>
                                    handleEditInputChange("password", e.target.value)
                                  }
                                  placeholder="New password (optional)"
                                  className="h-9 rounded-md border border-primary-200 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-300"
                                />
                              </div>
                              <div className="mt-2.5 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(user._id)}
                                  disabled={savingEdit}
                                  className="h-8 px-3 rounded-md bg-accent-500 hover:bg-accent-600 disabled:opacity-60 text-white text-xs font-semibold"
                                >
                                  {savingEdit ? "Saving..." : "Save Changes"}
                                </button>
                              </div>
                            </div>
                          )}
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

export default Users;
