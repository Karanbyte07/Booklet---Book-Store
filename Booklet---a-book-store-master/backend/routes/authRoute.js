import express from "express";
import {
  registerController,
  loginController,
  testController,
  forgotPasswordController,
  updateProfileController,
  getProfileController,
  getOrdersController,
  getAllOrdersController,
  orderStatusController,
  getAllUsersController,
  createUserByAdminController,
  updateUserByAdminController,
  deleteUserByAdminController,
} from "../controllers/authController.js";
import {
  isAdmin,
  isSuperAdmin,
  requireSignIn,
} from "../middlewares/authMiddleware.js";

//router object
const router = express.Router();

//routing
//REGISTER || METHOD POST
router.post("/register", registerController);

//LOGIN || POST
router.post("/login", loginController);

//Forgot Password || POST
router.post("/forgot-password", forgotPasswordController);

//test routes
router.get("/test", requireSignIn, isAdmin, testController);

//protected User route auth
router.get("/user-auth", requireSignIn, (req, res) => {
  res.status(200).send({ ok: true });
});
//protected Admin route auth
router.get("/admin-auth", requireSignIn, isAdmin, (req, res) => {
  res.status(200).send({ ok: true });
});

//update profile
router.get("/profile", requireSignIn, getProfileController);
router.put("/profile", requireSignIn, updateProfileController);

//orders
router.get("/orders", requireSignIn, getOrdersController);

//all orders
router.get("/all-orders", requireSignIn, isAdmin, getAllOrdersController);

// order status update
router.put(
  "/order-status/:orderId",
  requireSignIn,
  isAdmin,
  orderStatusController
);

//all users
router.get("/all-users", requireSignIn, isAdmin, getAllUsersController);

//create user by admin
router.post(
  "/create-user",
  requireSignIn,
  isSuperAdmin,
  createUserByAdminController
);

//update user by superadmin
router.put("/user/:uid", requireSignIn, isSuperAdmin, updateUserByAdminController);

//delete user by superadmin
router.delete(
  "/user/:uid",
  requireSignIn,
  isSuperAdmin,
  deleteUserByAdminController
);

export default router;
