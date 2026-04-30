# Delivery Location Refactor Strategy (Blinkit-Style)

## 1) Current State (from your codebase)

- Frontend currently does business logic for matching location and range:
  - `frontend/src/context/location.js`
  - `frontend/src/utils/locationUtils.js`
- Backend validates location strongly only during payment:
  - `backend/controllers/paymentController.js`
- Location master data is `ServiceArea`-driven (single area abstraction), not warehouse-first:
  - `backend/models/serviceAreaModel.js`
  - `backend/controllers/locationController.js`
- Product serviceability filtering uses location key strings:
  - `backend/controllers/productController.js`
  - `backend/utils/locationUtils.js`

This is functional, but not yet ideal for multi-warehouse, backend-first serviceability, and Blinkit-like UX.

## 2) Target Architecture

### Core Principle

Frontend only captures location input and renders backend decisions.
All serviceability, warehouse allocation, ETA, and checkout blocking is backend-controlled.

### Domain Modules (Backend)

- `Location Input Module`: accepts GPS/manual input, normalizes address + coordinates.
- `Geo Validation Module`: nearest warehouse lookup + radius validation.
- `Warehouse Allocation Module`: assigns best warehouse and ETA.
- `Location Session Module`: persists selected location context for guest and logged-in users.
- `Checkout Guard Module`: final server-side re-validation before order/payment.

## 3) Unified Internal Data Shape

Use one structure for both GPS and manual search flows:

```json
{
  "source": "gps|manual",
  "coordinates": { "lat": 28.61, "lng": 77.23 },
  "address": {
    "label": "Sector 62, Noida",
    "line1": "H-Block, Sector 62",
    "city": "Noida",
    "state": "Uttar Pradesh",
    "country": "India",
    "pincode": "201309"
  },
  "serviceability": {
    "isServiceable": true,
    "reasonCode": "SERVICEABLE|OUT_OF_RADIUS|NO_WAREHOUSE",
    "warehouseId": "wh_123",
    "warehouseName": "Noida Hub",
    "distanceKm": 3.2,
    "etaMin": 18,
    "etaMax": 28
  }
}
```

## 4) Data Model Changes

### Replace/Upgrade ServiceArea -> Warehouse

Create `Warehouse` model (can migrate from existing `ServiceArea` rows):

- `name`, `code`, `city`, `state`, `isActive`
- `geoPoint: { type: "Point", coordinates: [lng, lat] }` (2dsphere index)
- `serviceRadiusKm`
- `etaMinMinutes`, `etaMaxMinutes`
- optional: `priority`, `supportedPincodes`, `capacityState`

### Persist Selected Location

Add to user model:

- `currentDeliveryLocation` (snapshot of the unified shape, minimal subset)
- `currentWarehouseId`
- `deliveryLocationUpdatedAt`

For guests:

- persist `locationContextId` in localStorage/cookie
- backend stores context in DB/Redis with TTL (recommended)

## 5) API Design (Backend-First)

### Public Location APIs

1. `POST /api/v1/location/resolve`
- Input: `{ source, coordinates? , placeId? , address? }`
- Output: normalized location + serviceability + warehouse + ETA + `locationContextId`

2. `GET /api/v1/location/context`
- Input: header/cookie with `locationContextId`
- Output: current selected location context (single source for frontend)

3. `POST /api/v1/location/autocomplete`
- Input: `{ query }`
- Output: address suggestions (provider-backed)

4. `POST /api/v1/location/select`
- Input: selected suggestion (`placeId` or structured address)
- Output: same as `resolve` response

### Checkout Guard API

5. `POST /api/v1/location/validate-cart`
- Input: `{ cart, locationContextId }`
- Output: `{ allowed, unavailableItems, reasonCode, warehouse, eta }`

### Payment APIs (refactor)

`/api/v1/payment/razorpay/create-order` and `/verify-payment` should accept `locationContextId`, not raw `selectedLocation/customerLocation` from client.
Server resolves context and re-validates serviceability internally.

## 6) Frontend Refactor Plan (Minimal Logic)

## Keep

- Browser GPS permission request
- Header display of selected location and ETA
- Manual search UI + autocomplete input

## Remove

- Frontend distance/radius calculation (`matchAreaByCustomerLocation`, `getDistanceInKm` for business checks)
- Frontend authority over serviceability decisions
- Direct service-area matching logic in `LocationProvider`

## New Frontend Flow

1. App start: call `GET /location/context`
2. If absent: attempt GPS -> send coords to `POST /location/resolve`
3. If denied/unserviceable: open manual search modal (autocomplete)
4. Save `locationContextId` locally
5. Use backend response for:
   - “Delivering to ...”
   - ETA
   - “Coming Soon” state
6. Checkout uses only backend validation result

## 7) Backend Modularization (File Structure)

Add:

- `backend/services/location/geoService.js`
- `backend/services/location/warehouseAllocator.js`
- `backend/services/location/locationContextService.js`
- `backend/services/location/autocompleteService.js`
- `backend/services/location/locationValidationService.js`
- `backend/controllers/locationSessionController.js`
- `backend/routes/locationSessionRoutes.js`

Refactor:

- `backend/controllers/locationController.js` -> admin warehouse management only
- `backend/controllers/paymentController.js` -> consume `locationContextService`
- `backend/controllers/productController.js` -> read `locationContextId` and warehouse assignment for filtering

## 8) Scalability and Security

- Geospatial index: `Warehouse.geoPoint` with `2dsphere`
- Use `$geoNear` for nearest warehouse selection
- Cache location decisions by `lat,lng` hash + TTL
- Rate-limit autocomplete and resolve endpoints
- Never trust frontend serviceability flags
- Log every serviceability decision (`warehouse`, `distance`, `reasonCode`) for observability

## 9) Migration Strategy (Safe Rollout)

1. Introduce `Warehouse` model + migration script from `ServiceArea`.
2. Implement new location context APIs behind feature flag.
3. Update frontend `LocationProvider` to new APIs.
4. Keep old `selectedLocation` support temporarily (backward compatibility).
5. Update payment and cart validation to use `locationContextId`.
6. Remove old frontend distance logic and old API dependencies.
7. Remove compatibility path after monitoring.

## 10) Acceptance Checklist

- GPS + manual flows both produce coordinates and same backend context shape.
- Backend returns `isServiceable`, `warehouse`, and ETA for every selected location.
- Checkout is blocked server-side for unserviceable location (`Coming Soon` UX on frontend).
- Logged-in users retain delivery location across sessions and devices.
- Multiple warehouses with distinct radii and ETA work correctly.
- Frontend cannot bypass service validation by tampering payload.

## 11) Concrete Refactor Targets in Your Repo

- Replace logic in `frontend/src/context/location.js` with API-driven context handling.
- Simplify/remove business methods in `frontend/src/utils/locationUtils.js`.
- Add new location session/resolve routes under `backend/routes/`.
- Move geo/radius logic from controllers into `backend/services/location/*`.
- Update `backend/controllers/paymentController.js` to consume `locationContextId`.
- Extend `backend/models/userModel.js` for persisted selected delivery location.

