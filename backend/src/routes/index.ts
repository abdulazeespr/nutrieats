import { Router } from "express";
import { register, login } from "../controllers/authController";
import {
  getProfile,
  upsertBodyStats,
  upsertAllergies,
  updateNotifPrefs,
  getDailyLog,
} from "../controllers/userController";
import {
  listRestaurants,
  getRestaurant,
  getMenuItem,
  listDeals,
} from "../controllers/restaurantController";
import { createOrder, getOrder, getMyOrders, updateOrderStatus } from "../controllers/orderController";
import {
  getDashboard,
  getRestaurant as getMerchantRestaurant,
  createMenuItem,
  updateMenuItem,
  toggleItemAvailability,
  upsertRestaurant,
  getMerchantOrders,
} from "../controllers/merchantController";
import {
  getPendingAssignments,
  acceptAssignment,
  updateDeliveryStatus,
  getActiveDelivery,
} from "../controllers/riderController";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

// Auth
router.post("/auth/register", register);
router.post("/auth/login", login);

// User (customer)
router.get("/users/profile", authenticate, getProfile);
router.put("/users/body-stats", authenticate, upsertBodyStats);
router.put("/users/allergies", authenticate, upsertAllergies);
router.put("/users/notifications", authenticate, updateNotifPrefs);
router.get("/users/daily-log", authenticate, getDailyLog);

// Restaurants & menu (public browse, optional auth for allergy matching)
router.get("/restaurants", listRestaurants);
router.get("/restaurants/:id", getRestaurant);
router.get("/menu-items/:id", authenticate, getMenuItem);
router.get("/deals", listDeals);

// Orders (customer)
router.post("/orders", authenticate, requireRole("CUSTOMER"), createOrder);
router.get("/orders/my", authenticate, requireRole("CUSTOMER"), getMyOrders);
router.get("/orders/:id", authenticate, getOrder);
router.patch("/orders/:id/status", authenticate, updateOrderStatus);

// Merchant
router.get(
  "/merchant/dashboard",
  authenticate,
  requireRole("MERCHANT"),
  getDashboard
);
router.get(
  "/merchant/restaurant",
  authenticate,
  requireRole("MERCHANT"),
  getMerchantRestaurant
);
router.put(
  "/merchant/restaurant",
  authenticate,
  requireRole("MERCHANT"),
  upsertRestaurant
);
router.get(
  "/merchant/orders",
  authenticate,
  requireRole("MERCHANT"),
  getMerchantOrders
);
router.post(
  "/merchant/items",
  authenticate,
  requireRole("MERCHANT"),
  createMenuItem
);
router.put(
  "/merchant/items/:id",
  authenticate,
  requireRole("MERCHANT"),
  updateMenuItem
);
router.patch(
  "/merchant/items/:id/availability",
  authenticate,
  requireRole("MERCHANT"),
  toggleItemAvailability
);

// Rider
router.get(
  "/rider/assignments/pending",
  authenticate,
  requireRole("RIDER"),
  getPendingAssignments
);
router.get(
  "/rider/assignments/active",
  authenticate,
  requireRole("RIDER"),
  getActiveDelivery
);
router.post(
  "/rider/assignments/:orderId/accept",
  authenticate,
  requireRole("RIDER"),
  acceptAssignment
);
router.patch(
  "/rider/assignments/:id/status",
  authenticate,
  requireRole("RIDER"),
  updateDeliveryStatus
);

export default router;
