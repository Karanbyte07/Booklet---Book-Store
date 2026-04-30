import express from "express";
import {
  getAdminSiteSettingsController,
  getPublicSiteSettingsController,
  updateAdminSiteSettingsController,
} from "../controllers/siteSettingsController.js";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/public", getPublicSiteSettingsController);
router.get("/admin", requireSignIn, isAdmin, getAdminSiteSettingsController);
router.put("/admin", requireSignIn, isAdmin, updateAdminSiteSettingsController);

export default router;
