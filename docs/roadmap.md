# NutriEats — MVP Roadmap

## Milestones at a Glance

| Phase | Focus | Outcome |
|---|---|---|
| 0 | Project Setup | Monorepo, DB, tooling ready |
| 1 | Auth + Onboarding | Users can register, log in, set body stats |
| 2 | Restaurant & Menu | Browse restaurants, view item details with nutrition |
| 3 | Cart & Checkout | Full order flow with health summary |
| 4 | Merchant Dashboard | Owners add/manage items with auto Health Score |
| 5 | Rider App | Delivery partner accepts and fulfils orders |
| 6 | Health Engine | BMR/RDA calc, daily log, hazard alerts |
| 7 | Home & Deals | Deals-first home screen with RDA Hazard Box |
| 8 | Polish & Seed | Dummy data, cross-cutting UX, smoke testing |

---

## Phase 0 — Project Setup

**Goal**: Both apps run locally, connected to a Postgres database.

### Backend (`/backend`)
- [ ] Init Express + TypeScript project
- [ ] Add dependencies: `express`, `cors`, `helmet`, `dotenv`, `jsonwebtoken`, `bcryptjs`, `zod`
- [ ] Add Prisma: `prisma init`, configure `DATABASE_URL` in `.env`
- [ ] Write full Prisma schema (all models from spec)
- [ ] Run `prisma migrate dev --name init`
- [ ] Add seed script with dummy data (3 restaurants, 10 menu items each, 5 customers, 3 riders)
- [ ] Basic Express app structure: `src/routes`, `src/controllers`, `src/middleware`, `src/lib`

### Frontend (`/frontend`)
- [ ] Install UI dependencies: `lucide-react`, `clsx`, `tailwind-merge`
- [ ] Set up global CSS variables (green `#22C55E`, orange `#F97316`, neutral grays)
- [ ] Create reusable components: `Button`, `Badge`, `Card`, `ProgressBar`, `HazardBox`
- [ ] Configure `next.config.ts` for API proxy to backend

---

## Phase 1 — Auth & Onboarding

### Backend
- [ ] `POST /api/auth/register` — create user, hash password, return JWT
- [ ] `POST /api/auth/login` — validate credentials, return JWT
- [ ] Auth middleware (verify JWT on protected routes)
- [ ] `POST /api/users/body-stats` — save age, weight, height, gender, activity level; calculate and store BMR + RDA
- [ ] `POST /api/users/allergies` — bulk save allergen list
- [ ] `GET /api/users/profile` — return user + body stats + allergies

### Frontend
- [ ] `/login` page — email/password form
- [ ] `/register` page — name, email, phone, password
- [ ] `/onboarding/body-stats` — age, weight, height, gender, activity level picker; show live BMR preview
- [ ] `/onboarding/allergies` — checkbox grid of common allergens + custom input
- [ ] `/onboarding/notifications` — per-nutrient toggle list
- [ ] Auth context / token storage (httpOnly cookie or localStorage)
- [ ] Protected route wrapper

---

## Phase 2 — Restaurant & Menu Browsing

### Backend
- [ ] `GET /api/restaurants` — list all open restaurants, include healthScore and active deals
- [ ] `GET /api/restaurants/:id` — single restaurant with menu items
- [ ] `GET /api/menu-items/:id` — full item detail (nutrition, ingredients, allergens, cooking method)
- [ ] Allergen matching: endpoint accepts `userId` header, flags items that match user allergies

### Frontend
- [ ] `/` home skeleton (placeholder deals + hazard box, wired in Phase 7)
- [ ] `/restaurants` listing page
  - Restaurant card: name, location, cuisine tags, health score badge, delivery time, deal badge
  - Allergy hazard badge overlay
  - Filter bar: All / Healthy / Indulgent; Sort dropdown
- [ ] `/restaurants/[id]` menu page
  - Restaurant header: name, address, health score, hours
  - Menu items grouped by category
  - Item card: photo, name, calorie count, health/indulgent badge, price, allergen warning
- [ ] `/menu-items/[id]` item detail page
  - Full nutrition panel
  - Macros progress bars showing RDA impact
  - "How it's made" section
  - Ingredients list with health tags
  - Allergen hazard red box (if applicable)
  - Add to Cart button

---

## Phase 3 — Cart & Checkout

### Backend
- [ ] `POST /api/orders` — create order from cart payload; record price + calorie snapshots
- [ ] `GET /api/orders/:id` — order detail
- [ ] `GET /api/orders/my` — customer order history
- [ ] `PATCH /api/orders/:id/status` — update status (used by rider + restaurant)
- [ ] On order completion: update `DailyLog` for the customer

### Frontend
- [ ] Cart state management (React context or Zustand)
- [ ] Cart drawer / `/cart` page
  - Items grouped by restaurant
  - Quantity controls
  - Per-item calorie contribution
- [ ] `/checkout` page
  - Delivery address card (editable)
  - Meal Health Summary: total calories, macro breakdown, overall Health Score
  - Payment method selector (COD + Mock Card — no real gateway)
  - Proceed to Pay button
- [ ] Order confirmation page: order ID, estimated time, link to tracker

---

## Phase 4 — Merchant Dashboard

### Backend
- [ ] Merchant auth (role check middleware)
- [ ] `GET /api/merchant/restaurant` — own restaurant details
- [ ] `POST /api/merchant/menu-items` — create item; auto-calculate Health Score server-side
- [ ] `PUT /api/merchant/menu-items/:id` — update item
- [ ] `PATCH /api/merchant/menu-items/:id/availability` — toggle active
- [ ] `GET /api/merchant/orders` — incoming orders for the restaurant

### Frontend (`/merchant` route group)
- [ ] `/merchant/login` — separate login page
- [ ] `/merchant/dashboard` — overview cards: active items, today's orders, revenue
- [ ] `/merchant/items` — list of menu items with availability toggles
- [ ] `/merchant/items/new` and `/merchant/items/[id]/edit` — item form
  - All nutrition fields
  - Cooking method text input
  - Ingredients builder
  - Allergen checkboxes
  - Live Health Score preview (calculated client-side, confirmed server-side on save)
- [ ] `/merchant/settings` — store profile editor

---

## Phase 5 — Rider App

### Backend
- [x] Rider auth (role check)
- [x] `GET /api/rider/assignments/pending` — orders ready for pickup in the rider's area
- [x] `POST /api/rider/assignments/:orderId/accept` — assign order to rider
- [x] `PATCH /api/rider/assignments/:id/status` — Picked Up / On the Way / Delivered
- [x] `GET /api/rider/assignments/active` — current active delivery

### Frontend (`/rider` route group)
- [x] `/rider/login`
- [x] `/rider/dashboard` — pending assignments list
- [x] `/rider/delivery/[id]` — active delivery screen
  - Order summary (restaurant → customer address)
  - Items list
  - Status update buttons
  - Google Maps link for navigation

---

## Phase 6 — Health Engine

### Backend
- [x] BMR calculation utility (Mifflin-St Jeor)
- [x] RDA defaults derived from BMR (protein = 0.8g × weight, carbs = 50% calories, fat = 30% calories, fiber = 25g)
- [x] `GET /api/users/daily-log` — return today's consumed nutrients vs RDA
- [x] `GET /api/users/rda` — return current RDA targets
- [x] `PUT /api/users/rda` — override individual nutrient targets
- [x] Low-nutrient alert logic: compare daily log to targets, return list of deficient nutrients

### Frontend
- [x] `/profile/health` — Nutrient Status Dashboard
  - BMR and RDA summary cards
  - Per-nutrient progress bars with color coding (green = on track, orange = low, red = critical)
  - Smart meal suggestions when a nutrient is low (e.g. "Add a protein-rich item")
- [x] `/profile/settings` — Body Stats editor (re-calculates BMR on save)
- [x] `/profile/rda` — manual RDA override sliders
- [x] `/profile/allergies` — allergy manager
- [x] `/profile/notifications` — per-nutrient notification toggles

---

## Phase 7 — Home Screen & Deals

### Backend
- [ ] `GET /api/deals` — items and restaurants with active discounts, sorted by deal value
- [ ] `GET /api/offers/flash` — time-limited flash deals

### Frontend
- [ ] Full home page `/`
  - RDA Hazard Box (top): lists today's deficient nutrients with dismiss buttons
  - Best Deals section (70%): deal cards with discount %, item photo, health badge, restaurant name
  - Flash Offers strip (10%): horizontal scroll, countdown timers
  - Category Quick Filters: Healthy / Indulgent / All
- [ ] Deal card component with health/indulgent badge

---

## Phase 8 — Polish, Seed Data & Smoke Test

- [ ] Seed script: 3 restaurants, 30 menu items (mix of healthy/indulgent), 5 customers with body stats and allergies, 3 riders, 2 merchants, sample orders and daily logs
- [ ] Loading skeletons for all listing pages
- [ ] Error boundary + generic error page
- [ ] Empty state illustrations (no results, empty cart, no orders yet)
- [ ] Mobile-responsive audit (all pages)
- [ ] End-to-end smoke test: Register → Onboard → Browse → Order → Track → Rider fulfils

---

## Dummy Data Plan

### Restaurants
1. **Green Leaf Kitchen** — Salads, wraps, smoothies (high health scores)
2. **Spice Garden** — Indian curries, biryanis (mixed scores)
3. **Crunch Burgers** — Burgers, fries, shakes (low health scores)

### Sample Items (per restaurant, 10 each)
Each item includes calories, protein, carbs, fat, fiber, cooking method, ingredients, and allergens.

### Sample Customers
- User with no allergies, active lifestyle
- User with gluten + nut allergy, sedentary
- User with dairy allergy, moderately active

---

## Color Tokens

| Token | Hex | Usage |
|---|---|---|
| `green-500` | `#22C55E` | Healthy badge, on-track nutrients |
| `orange-500` | `#F97316` | Indulgent badge, low nutrient warning |
| `red-600` | `#DC2626` | Allergen hazard, critical nutrient |
| `gray-900` | `#111827` | Primary text |
| `gray-50` | `#F9FAFB` | Page background |

---

## Folder Structure

```
nutrieats/
├── frontend/                  # Next.js app
│   ├── app/
│   │   ├── (customer)/        # Customer-facing pages
│   │   │   ├── page.tsx       # Home
│   │   │   ├── restaurants/
│   │   │   ├── menu-items/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── orders/
│   │   │   └── profile/
│   │   ├── (merchant)/        # Merchant dashboard
│   │   │   └── merchant/
│   │   ├── (rider)/           # Rider app
│   │   │   └── rider/
│   │   ├── login/
│   │   ├── register/
│   │   └── onboarding/
│   ├── components/
│   │   ├── ui/                # Button, Badge, Card, ProgressBar, etc.
│   │   ├── home/              # HazardBox, DealCard, FlashOffer
│   │   ├── restaurant/        # RestaurantCard, MenuItemCard
│   │   ├── item/              # NutritionPanel, IngredientsList
│   │   ├── cart/              # CartDrawer, CartItem
│   │   └── health/            # NutrientBar, RdaDashboard
│   ├── lib/
│   │   ├── api.ts             # Fetch wrapper
│   │   ├── auth.ts            # Token helpers
│   │   ├── bmr.ts             # BMR calc (client-side preview)
│   │   └── health-score.ts    # Health score calc (client preview)
│   └── context/
│       ├── AuthContext.tsx
│       └── CartContext.tsx
│
└── backend/                   # Express app
    ├── prisma/
    │   ├── schema.prisma
    │   └── seed.ts
    └── src/
        ├── index.ts
        ├── routes/
        ├── controllers/
        ├── middleware/
        │   ├── auth.ts
        │   └── role.ts
        └── lib/
            ├── bmr.ts
            ├── health-score.ts
            └── prisma.ts
```
