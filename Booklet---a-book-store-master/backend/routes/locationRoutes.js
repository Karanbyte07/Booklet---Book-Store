import express from "express";
import {
  bulkDeleteServiceAreasController,
  createServiceAreaController,
  deleteServiceAreaController,
  geocodeServiceAreaController,
  getAdminServiceAreasController,
  getServiceAreasController,
  updateServiceAreaController,
} from "../controllers/locationController.js";
import {
  autocompleteLocationController,
  getLocationContextController,
  resolveLocationContextController,
  selectLocationController,
  validateLocationCartController,
} from "../controllers/locationSessionController.js";
import { isAdmin, optionalSignIn, requireSignIn } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/service-areas", getServiceAreasController);

router.get("/context", optionalSignIn, getLocationContextController);
router.post("/resolve", optionalSignIn, resolveLocationContextController);
router.post("/select", optionalSignIn, selectLocationController);
router.post("/autocomplete", autocompleteLocationController);
router.post("/validate-cart", optionalSignIn, validateLocationCartController);

router.get("/admin/service-areas", requireSignIn, isAdmin, getAdminServiceAreasController);

router.post("/admin/service-areas", requireSignIn, isAdmin, createServiceAreaController);

router.post(
  "/admin/service-areas/geocode",
  requireSignIn,
  isAdmin,
  geocodeServiceAreaController
);

router.post(
  "/admin/service-areas/bulk-delete",
  requireSignIn,
  isAdmin,
  bulkDeleteServiceAreasController
);

router.put("/admin/service-areas/:id", requireSignIn, isAdmin, updateServiceAreaController);

router.delete("/admin/service-areas/:id", requireSignIn, isAdmin, deleteServiceAreaController);

export default router;
