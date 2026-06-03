# NutriEats — Product Specification (MVP)

## Overview

NutriEats is a health-aware food delivery app. It works like a standard food delivery platform (think Swiggy) but adds a transparency layer — every item shows its calorie count, macros, ingredients, and preparation method. Users are never restricted from ordering what they want; the app simply ensures they always know what they are eating and how it fits their personal daily targets.

**Stack**
- Frontend: Next.js 16 + TypeScript + Tailwind CSS
- Backend: Express.js + TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Auth: JWT (access + refresh tokens)

---

## User Roles

| Role | Description |
|---|---|
| **Customer** | Browses restaurants, orders food, tracks health metrics |
| **Restaurant Owner** | Manages their store, menu, and item nutritional data |
| **Delivery Partner** | Accepts and fulfils delivery assignments |
| **Admin** | Platform management (out of MVP scope) |

---

## Core Features

### 1. Authentication & Onboarding

**Customer onboarding flow:**
1. Register (name, email, phone, password)
2. Body stats form: age, weight (kg), height (cm), gender, activity level
3. App calculates BMR (Mifflin-St Jeor) and sets default RDA/SDA targets
4. Allergy selection (common allergens + free-text custom)
5. Notification preferences

**Restaurant & Delivery Partner:**
- Separate register/login flows
- Restaurant owners get a merchant dashboard
- Delivery partners get a simplified rider app view

---

### 2. Home Screen

Layout split (approximate):
- **70%** — Best Deals section: discount cards on items and restaurants, ordered by deal value
- **10%** — Flash Offers strip: time-limited promotions
- **20%** — RDA Hazard Box + Quick Category Toggles (Healthy / Indulgent)

The RDA Hazard Box is a compact card at the top that shows any nutrient that is currently below the customer's daily target (e.g. "⚠️ Low Protein today — 18g / 60g"). Each alert can be individually silenced.

---

### 3. Restaurant Listing

- Restaurant card shows: name, location, cuisine tags, delivery time estimate, Health Score (0–10 calculated from average item scores), active deals
- Items with allergens matching the customer's profile show a red **⚠ Hazard** badge
- Filter: Healthy / Indulgent / All | Sort: Rating, Delivery Time, Health Score

---

### 4. Food Item Detail

Each food item page includes:
- Photo, name, price
- Restaurant name + location
- **Health / Indulgent** classification badge (green / orange)
- Calorie count
- Macros: Protein, Carbs, Fat, Fiber
- **RDA Impact**: shows how this one item moves the needle on today's targets (progress bars)
- **How it's made**: short description of cooking method (e.g. "Deep fried in refined oil" vs "Steamed, no added oil")
- **Ingredients list**: each ingredient tagged as beneficial, neutral, or watch-out
- Allergen warnings (red box if matches customer profile)

---

### 5. Cart & Checkout

- Items grouped by restaurant
- Each item shows: name, quantity, price, calorie contribution
- **Meal Health Summary**: total calories, macros, overall Health Score for the cart
- Delivery address (editable)
- Payment method selection (dummy in MVP: Cash on Delivery + Mock Card)
- "Proceed to Pay" button with total price embedded

---

### 6. Order Tracking (Customer)

- Real-time order status: Placed → Confirmed → Being Prepared → Out for Delivery → Delivered
- Live map showing delivery partner location (mock coordinates in MVP)
- Delivery partner name, phone (tap to call)
- ETA countdown

---

### 7. Delivery Partner App (Rider View)

Separate UI section at `/rider`:
- Login
- Incoming order assignment card: customer address, restaurant address, items summary
- Accept / Decline
- Navigation prompt (opens Google Maps link)
- Status update buttons: Picked Up → On the Way → Delivered

---

### 8. Merchant Dashboard (Restaurant Owner)

- Overview: active listings count, today's orders, revenue
- **Add / Edit Item form**:
  - Name, description, price, photo
  - Nutritional fields: calories, protein, carbs, fat, fiber (owner fills these in)
  - Cooking method description
  - Ingredients (comma-separated with health tags)
  - Allergen flags (multi-select checkboxes)
  - App auto-calculates Health Score (0–10) based on calories, fat ratio, fiber presence, and cooking method
- Toggle item availability (active / inactive)
- Store settings: name, address, opening hours, cuisine tags

---

### 9. Nutrition & Health Settings (Customer)

Accessible from profile settings:

**Body Stats**: re-edit age, weight, height, gender, activity level → BMR and RDA recalculate live

**RDA/SDA Customization**: manually override daily targets per nutrient (calories, protein, carbs, fat, fiber, sodium)

**Allergy Manager**: add/remove allergens, toggle allergy alerts on/off globally

**Notification Preferences**: per-nutrient low-alert toggles (e.g. turn off "Low Fiber" alerts)

---

## Data Models (Prisma Schema Summary)

```
User          — id, name, email, phone, passwordHash, role, createdAt
BodyStats     — userId, age, weight, height, gender, activityLevel, bmr, rdaCalories, rdaProtein, rdaCarbs, rdaFat, rdaFiber
Allergy       — id, userId, allergenName
NotifPrefs    — userId, lowCaloriesAlert, lowProteinAlert, lowCarbsAlert, lowFatAlert, lowFiberAlert
Restaurant    — id, ownerId, name, address, cuisineTags, healthScore, isOpen
MenuItem      — id, restaurantId, name, description, price, imageUrl, calories, protein, carbs, fat, fiber, cookingMethod, ingredients(JSON), allergens(JSON), healthScore, isAvailable
Order         — id, customerId, restaurantId, status, totalPrice, totalCalories, deliveryAddress, createdAt
OrderItem     — id, orderId, menuItemId, quantity, priceSnapshot, caloriesSnapshot
DeliveryAssignment — id, orderId, riderId, status, pickedUpAt, deliveredAt
DailyLog      — id, userId, date, caloriesConsumed, proteinConsumed, carbsConsumed, fatConsumed, fiberConsumed
```

---

## Health Score Formula

```
healthScore = 10
  - penalty for calories > 600 kcal per serving  (-2)
  - penalty for fat > 20g per serving             (-2)
  - penalty for "deep fried" in cooking method    (-2)
  - bonus for fiber > 5g per serving              (+1)
  - bonus for protein > 20g per serving           (+1)
  = clamp(score, 0, 10)
```

Items with score ≥ 6 are tagged **Healthy** (green). Below 6 is **Indulgent** (orange).

---

## BMR Calculation (Mifflin-St Jeor)

```
Male:   BMR = 10×weight + 6.25×height − 5×age + 5
Female: BMR = 10×weight + 6.25×height − 5×age − 161

Activity multipliers:
  Sedentary       × 1.2
  Lightly Active  × 1.375
  Moderately Active × 1.55
  Very Active     × 1.725
```

---

## Out of Scope for MVP

- Real payment gateway
- Real-time WebSocket tracking (mocked with polling)
- Admin panel
- Reviews and ratings
- Push notifications (in-app alerts only)
- Multi-language support
