import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import serviceAreaModel from "../models/serviceAreaModel.js";
import { saveLocationContext } from "../services/location/locationContextService.js";
import { normalizeLocationKey, normalizePincode, toNumberOrNull } from "../utils/locationUtils.js";

dotenv.config();

const resolveAreaByKey = async (areaMap, key = "") => {
  const normalized = normalizeLocationKey(key);
  if (!normalized) return null;
  if (areaMap.has(normalized)) return areaMap.get(normalized);

  const area = await serviceAreaModel
    .findOne({ key: normalized, isActive: true })
    .select("key label pincode latitude longitude radiusKm type isActive")
    .lean();

  if (area) {
    areaMap.set(normalized, area);
  }
  return area || null;
};

const migrateUserLocationContexts = async () => {
  await connectDB();

  const activeAreas = await serviceAreaModel
    .find({ isActive: true })
    .select("key label pincode latitude longitude radiusKm type isActive")
    .lean();
  const areaMap = new Map(
    activeAreas.map((area) => [normalizeLocationKey(area?.key), area])
  );

  const users = await userModel
    .find({})
    .select("_id email currentDeliveryLocation currentWarehouseId");

  let migrated = 0;
  let skippedAlreadySet = 0;
  let skippedNoOrder = 0;
  let skippedNoArea = 0;

  for (const user of users) {
    const hasContext = Boolean(user?.currentDeliveryLocation?.contextId);
    if (hasContext) {
      skippedAlreadySet += 1;
      continue;
    }

    const latestOrder = await orderModel
      .findOne({
        buyer: user._id,
        deliveryLocation: { $exists: true, $ne: "" },
      })
      .select(
        "deliveryLocation deliveryLocationLabel deliveryPincode deliveryDistanceKm shippingAddress createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    if (!latestOrder) {
      skippedNoOrder += 1;
      continue;
    }

    const area = await resolveAreaByKey(areaMap, latestOrder.deliveryLocation);
    if (!area) {
      skippedNoArea += 1;
      continue;
    }

    await saveLocationContext({
      userId: user._id,
      source: "saved",
      coordinates: {
        latitude: toNumberOrNull(area.latitude),
        longitude: toNumberOrNull(area.longitude),
      },
      address: {
        label:
          latestOrder?.shippingAddress?.line1 ||
          latestOrder?.deliveryLocationLabel ||
          area.label ||
          "",
        line1: latestOrder?.shippingAddress?.line1 || "",
        city: latestOrder?.shippingAddress?.city || "",
        state: latestOrder?.shippingAddress?.state || "",
        country: latestOrder?.shippingAddress?.country || "India",
        pincode:
          normalizePincode(latestOrder?.shippingAddress?.pincode) ||
          normalizePincode(latestOrder?.deliveryPincode) ||
          normalizePincode(area.pincode),
      },
      assignedArea: {
        key: normalizeLocationKey(area.key),
        label: area.label,
        pincode: normalizePincode(area.pincode),
        latitude: toNumberOrNull(area.latitude),
        longitude: toNumberOrNull(area.longitude),
        radiusKm: toNumberOrNull(area.radiusKm),
        type: area.type || "urban",
      },
      serviceability: {
        isServiceable: true,
        reasonCode: "SERVICEABLE",
        distanceKm: toNumberOrNull(latestOrder?.deliveryDistanceKm),
        etaMinMinutes: null,
        etaMaxMinutes: null,
      },
    });

    migrated += 1;
  }

  console.log("Location context migration completed");
  console.log(`Total users scanned: ${users.length}`);
  console.log(`Migrated users: ${migrated}`);
  console.log(`Skipped (already has context): ${skippedAlreadySet}`);
  console.log(`Skipped (no order location): ${skippedNoOrder}`);
  console.log(`Skipped (order location not serviceable): ${skippedNoArea}`);
};

migrateUserLocationContexts()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Location context migration failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  });
