import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";

import { comparePassword, hashPassword } from "./../helpers/authHelper.js";
import JWT from "jsonwebtoken";
import { ROLE, normalizeRoleInput } from "../utils/roleUtils.js";
import { buildUserAddressState } from "../utils/addressUtils.js";

const withNormalizedUserAddresses = (userInput) => {
  const normalizedUser =
    userInput && typeof userInput.toObject === "function"
      ? userInput.toObject()
      : { ...(userInput || {}) };

  const addressState = buildUserAddressState({
    fullName: normalizedUser?.name || "",
    phone: normalizedUser?.phone || "",
    profileAddress: normalizedUser?.profileAddress,
    legacyAddress: normalizedUser?.address,
    addresses: normalizedUser?.addresses,
    existingProfileAddress: normalizedUser?.profileAddress,
    existingLegacyAddress: normalizedUser?.address,
    existingAddresses: normalizedUser?.addresses,
  });

  normalizedUser.profileAddress = addressState.profileAddress;
  normalizedUser.address = addressState.address;
  normalizedUser.addresses = addressState.addresses;

  return normalizedUser;
};

export const registerController = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      address,
      profileAddress,
      addresses,
      answer,
    } = req.body;
    const addressState = buildUserAddressState({
      fullName: name,
      phone,
      profileAddress: profileAddress !== undefined ? profileAddress : address,
      legacyAddress: address,
      addresses,
    });
    //validations
    if (!name) {
      return res.send({ error: "Name is Required" });
    }
    if (!email) {
      return res.send({ message: "Email is Required" });
    }
    if (!password) {
      return res.send({ message: "Password is Required" });
    }
    if (!phone) {
      return res.send({ message: "Phone no is Required" });
    }
    if (!addressState.profileAddress.line1) {
      return res.send({ message: "Address is Required" });
    }
    if (!answer) {
      return res.send({ message: "Answer is Required" });
    }
    //check user
    const exisitingUser = await userModel.findOne({ email });
    //exisiting user
    if (exisitingUser) {
      return res.status(200).send({
        success: false,
        message: "Already Register please login",
      });
    }
    //register user
    const hashedPassword = await hashPassword(password);
    //save
    const user = await new userModel({
      name,
      email,
      phone,
      profileAddress: addressState.profileAddress,
      addresses: addressState.addresses,
      address: addressState.address,
      password: hashedPassword,
      answer,
      role: ROLE.CUSTOMER,
    }).save();

    res.status(201).send({
      success: true,
      message: "User Register Successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Errro in Registeration",
      error,
    });
  }
};

// admin create user with role
export const createUserByAdminController = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      address,
      profileAddress,
      addresses,
      answer,
      role,
    } = req.body;
    const addressState = buildUserAddressState({
      fullName: name,
      phone,
      profileAddress: profileAddress !== undefined ? profileAddress : address,
      legacyAddress: address,
      addresses,
    });

    if (!name) return res.status(400).send({ message: "Name is Required" });
    if (!email) return res.status(400).send({ message: "Email is Required" });
    if (!password)
      return res.status(400).send({ message: "Password is Required" });
    if (password.length < 6) {
      return res
        .status(400)
        .send({ message: "Password should be at least 6 characters" });
    }
    if (!phone) return res.status(400).send({ message: "Phone is Required" });
    if (!addressState.profileAddress.line1)
      return res.status(400).send({ message: "Address is Required" });
    if (!answer)
      return res.status(400).send({ message: "Answer is Required" });

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).send({
        success: false,
        message: "User already exists with this email",
      });
    }

    const normalizedRole = normalizeRoleInput(role, ROLE.CUSTOMER);
    const hashedPassword = await hashPassword(password);

    const user = await new userModel({
      name,
      email,
      phone,
      profileAddress: addressState.profileAddress,
      addresses: addressState.addresses,
      address: addressState.address,
      password: hashedPassword,
      answer,
      role: normalizedRole,
    }).save();

    return res.status(201).send({
      success: true,
      message: "User created successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileAddress: user.profileAddress,
        addresses: user.addresses,
        address: user.address,
        role: user.role,
        currentDeliveryLocation: user.currentDeliveryLocation || null,
        currentWarehouseId: user.currentWarehouseId || "",
        deliveryLocationUpdatedAt: user.deliveryLocationUpdatedAt || null,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error while creating user",
      error,
    });
  }
};

//POST LOGIN
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    //validation
    if (!email || !password) {
      return res.status(404).send({
        success: false,
        message: "invalid inputs",
      });
    }
    //check user
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Email is not registerd",
      });
    }
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(200).send({
        success: false,
        message: "Invalid Password",
      });
    }
    const normalizedUser = withNormalizedUserAddresses(user);

    //token
    const token = await JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(200).send({
      success: true,
      message: "login successfully",
      user: {
        _id: user._id,
        name: normalizedUser.name,
        email: normalizedUser.email,
        phone: normalizedUser.phone,
        profileAddress: normalizedUser.profileAddress,
        addresses: normalizedUser.addresses,
        address: normalizedUser.address,
        role: normalizedUser.role,
        currentDeliveryLocation: normalizedUser.currentDeliveryLocation || null,
        currentWarehouseId: normalizedUser.currentWarehouseId || "",
        deliveryLocationUpdatedAt: normalizedUser.deliveryLocationUpdatedAt || null,
      },
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in login",
      error,
    });
  }
};

//forgotPasswordController

export const forgotPasswordController = async (req, res) => {
  try {
    const { email, answer, newPassword } = req.body;
    if (!email) {
      res.status(400).send({ message: "Emai is required" });
    }
    if (!answer) {
      res.status(400).send({ message: "answer is required" });
    }
    if (!newPassword) {
      res.status(400).send({ message: "New Password is required" });
    }
    //check
    const user = await userModel.findOne({ email, answer });
    //validation
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Wrong Email Or Answer",
      });
    }
    const hashed = await hashPassword(newPassword);
    await userModel.findByIdAndUpdate(user._id, { password: hashed });
    res.status(200).send({
      success: true,
      message: "Password Reset Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

//test controller
export const testController = (req, res) => {
  try {
    res.send("Protected Routes");
  } catch (error) {
    console.log(error);
    res.send({ error });
  }
};

//update prfole
export const updateProfileController = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      address,
      profileAddress,
      addresses,
    } = req.body;
    const user = await userModel.findById(req.user._id);
    //password
    if (password && password.length < 6) {
      return res.json({ error: "Passsword is required and 6 character long" });
    }
    const nextName = name || user.name;
    const nextPhone = phone || user.phone;
    const isAddressUpdateRequest =
      address !== undefined ||
      profileAddress !== undefined ||
      addresses !== undefined;
    const addressState = buildUserAddressState({
      fullName: nextName,
      phone: nextPhone,
      profileAddress:
        profileAddress !== undefined
          ? profileAddress
          : address !== undefined
            ? address
            : user.profileAddress,
      legacyAddress: address !== undefined ? address : user.address,
      addresses: addresses !== undefined ? addresses : user.addresses,
      existingProfileAddress: user.profileAddress,
      existingLegacyAddress: user.address,
      existingAddresses: user.addresses,
    });

    if (isAddressUpdateRequest && !addressState.profileAddress.line1) {
      return res.status(400).send({
        success: false,
        message: "Profile address line is required",
      });
    }

    const hashedPassword = password ? await hashPassword(password) : undefined;
    const updatedUser = await userModel.findByIdAndUpdate(
      req.user._id,
      {
        name: nextName,
        password: hashedPassword || user.password,
        phone: nextPhone,
        profileAddress: addressState.profileAddress,
        addresses: addressState.addresses,
        address: addressState.address,
      },
      { new: true }
    );
    const normalizedUpdatedUser = withNormalizedUserAddresses(updatedUser);
    res.status(200).send({
      success: true,
      message: "Profile Updated SUccessfully",
      updatedUser: normalizedUpdatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error WHile Update profile",
      error,
    });
  }
};

//get current profile
export const getProfileController = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id).select("-password -answer");
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    const normalizedUser = withNormalizedUserAddresses(user);

    return res.status(200).send({
      success: true,
      user: normalizedUser,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error while fetching profile",
      error,
    });
  }
};

//orders
export const getOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ buyer: req.user._id })
      .populate("products")
      .populate("buyer", "name");
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error WHile Geting Orders",
      error,
    });
  }
};
//orders
export const getAllOrdersController = async (req, res) => {
  try {
    console.log("🔍 Fetching all orders...");

    const orders = await orderModel
      .find({})
      .populate("products")
      .populate("buyer", "name")
      .sort({ createdAt: -1 });

    console.log("✅ Orders found:", orders.length);
    console.log(
      "📦 Sample order:",
      orders[0]
        ? {
            id: orders[0]._id,
            buyer: orders[0].buyer?.name,
            products: orders[0].products?.length,
            status: orders[0].status,
          }
        : "No orders"
    );

    res.json(orders);
  } catch (error) {
    console.log("❌ Error in getAllOrdersController:", error);
    console.log("Error details:", error.message);
    res.status(500).send({
      success: false,
      message: "Error While Getting Orders",
      error: error.message,
    });
  }
};

//order status
export const orderStatusController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const orders = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While Updateing Order",
      error,
    });
  }
};

//get all users
export const getAllUsersController = async (req, res) => {
  try {
    const users = await userModel
      .find({})
      .select("-password")
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      message: "All Users List",
      users,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While Getting Users",
      error,
    });
  }
};

// update user by superadmin
export const updateUserByAdminController = async (req, res) => {
  try {
    const { uid } = req.params;
    const {
      name,
      email,
      phone,
      address,
      profileAddress,
      addresses,
      answer,
      role,
      password,
    } = req.body;

    const user = await userModel.findById(uid);
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    if (email && email !== user.email) {
      const existingUser = await userModel.findOne({ email });
      if (existingUser) {
        return res.status(409).send({
          success: false,
          message: "Another user already exists with this email",
        });
      }
    }

    if (password && password.length < 6) {
      return res.status(400).send({
        success: false,
        message: "Password should be at least 6 characters",
      });
    }

    const nextName = name ?? user.name;
    const nextPhone = phone ?? user.phone;
    const isAddressUpdateRequest =
      address !== undefined ||
      profileAddress !== undefined ||
      addresses !== undefined;
    const addressState = buildUserAddressState({
      fullName: nextName,
      phone: nextPhone,
      profileAddress:
        profileAddress !== undefined
          ? profileAddress
          : address !== undefined
            ? address
            : user.profileAddress,
      legacyAddress: address !== undefined ? address : user.address,
      addresses: addresses !== undefined ? addresses : user.addresses,
      existingProfileAddress: user.profileAddress,
      existingLegacyAddress: user.address,
      existingAddresses: user.addresses,
    });

    if (isAddressUpdateRequest && !addressState.profileAddress.line1) {
      return res.status(400).send({
        success: false,
        message: "Profile address line is required",
      });
    }

    const hashedPassword = password ? await hashPassword(password) : undefined;
    const normalizedRole = normalizeRoleInput(role, user.role);

    const updatedUser = await userModel
      .findByIdAndUpdate(
        uid,
        {
          name: nextName,
          email: email ?? user.email,
          phone: nextPhone,
          profileAddress: addressState.profileAddress,
          addresses: addressState.addresses,
          address: addressState.address,
          answer: answer ?? user.answer,
          role: normalizedRole,
          password: hashedPassword || user.password,
        },
        { new: true }
      )
      .select("-password");

    return res.status(200).send({
      success: true,
      message: "User updated successfully",
      user: withNormalizedUserAddresses(updatedUser),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error while updating user",
      error,
    });
  }
};

// delete user by superadmin
export const deleteUserByAdminController = async (req, res) => {
  try {
    const { uid } = req.params;

    if (String(req.user._id) === String(uid)) {
      return res.status(400).send({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const user = await userModel.findById(uid);
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    await userModel.findByIdAndDelete(uid);
    return res.status(200).send({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error while deleting user",
      error,
    });
  }
};
