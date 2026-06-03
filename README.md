# NutriEats 🥗

A health-aware food delivery platform that combines the convenience of apps like Swiggy with full nutritional transparency. Built as a monorepo with Next.js (frontend) and Express (backend).

## Overview

NutriEats lets users order food from restaurants while providing complete nutrition information for every item. The app calculates BMR, tracks daily nutrient intake, and alerts users when they're low on essential nutrients — all while letting them order whatever they want.

**Key Features:**
- 🔍 Full nutritional breakdown (calories, macros, ingredients, cooking method) for every menu item
- 🎯 Personal RDA/SDA tracking based on body stats (age, weight, height, activity level)
- ⚠️ Allergen warnings and custom allergy profiles
- 🏪 Merchant dashboard to add and manage menu items
- 🚴 Delivery partner app for order fulfilment
- 💚 Health Score system (0–10) with clear Healthy/Indulgent classification

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 + TypeScript + Tailwind CSS |
| Backend | Express.js + TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT (Bearer tokens) |

## Project Structure

```
nutrieats/
├── docs/
│   ├── ideas.txt         # Original concept and design notes
│   ├── spec.md           # Full product specification
│   └── roadmap.md        # MVP implementation roadmap
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma # Database schema
│   │   └── seed.ts       # Dummy data seeder
│   ├── src/
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/   # Auth & role checks
│   │   ├── lib/          # BMR, health score utils
│   │   ├── routes/       # API route definitions
│   │   └── index.ts      # Express app entry
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── app/              # Next.js app router
    ├── components/       # React components
    ├── lib/              # API client, auth helpers
    ├── package.json
    └── next.config.ts
```

## Getting Started

### Prerequisites

- **Node.js** 20+ and npm
- **PostgreSQL** 14+ running locally or accessible remotely
- **Git**

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd nutrieats
```

### 2. Backend Setup

```bash
cd backend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and set DATABASE_URL and JWT_SECRET

# Run Prisma migrations
npm run db:migrate

# Seed the database with dummy data
npm run db:seed

# Start the dev server
npm run dev
```

Backend will run at `http://localhost:4000`.

### 3. Frontend Setup

```bash
cd ../frontend
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local if your backend is not at localhost:4000

# Start the dev server
npm run dev
```

Frontend will run at `http://localhost:3000`.

## Test Accounts

All passwords are `password123`.

| Role | Email | Purpose |
|---|---|---|
| **Customer** | arjun@example.com | No allergies, moderately active |
| **Customer** | priya@example.com | Gluten & nut allergies |
| **Customer** | rahul@example.com | Dairy allergy, sedentary |
| **Merchant** | owner@greenleaf.com | Green Leaf Kitchen (healthy) |
| **Merchant** | owner@spicegarden.com | Spice Garden (mixed) |
| **Merchant** | owner@crunchburgers.com | Crunch Burgers (indulgent) |
| **Rider** | ravi.kumar@rider.com | Delivery partner |

## Core API Endpoints

### Auth
- `POST /api/auth/register` — Create account (customer, merchant, or rider)
- `POST /api/auth/login` — Login and receive JWT

### User (Customer)
- `GET /api/users/profile` — Get profile + body stats + allergies
- `PUT /api/users/body-stats` — Update age, weight, height, activity level; recalculates RDA
- `PUT /api/users/allergies` — Save allergen list
- `GET /api/users/daily-log` — Today's consumed nutrients vs RDA + low alerts

### Restaurants & Menu
- `GET /api/restaurants` — List all open restaurants
- `GET /api/restaurants/:id` — Single restaurant with menu
- `GET /api/menu-items/:id` — Item detail with nutrition + allergen warning
- `GET /api/deals` — Items with active discounts

### Orders
- `POST /api/orders` — Create order; updates daily log
- `GET /api/orders/my` — Customer order history
- `GET /api/orders/:id` — Single order with tracking

### Merchant
- `GET /api/merchant/dashboard` — Overview stats
- `PUT /api/merchant/restaurant` — Upsert restaurant profile
- `POST /api/merchant/items` — Add menu item (auto-calculates Health Score)
- `PUT /api/merchant/items/:id` — Edit item
- `PATCH /api/merchant/items/:id/availability` — Toggle active/inactive

### Rider
- `GET /api/rider/assignments/pending` — Orders ready for pickup
- `POST /api/rider/assignments/:orderId/accept` — Accept delivery
- `PATCH /api/rider/assignments/:id/status` — Update status (PICKED_UP, ON_THE_WAY, DELIVERED)

## Health Score Formula

```javascript
healthScore = 10
  - (calories > 600 ? 2 : 0)
  - (fat > 20g ? 2 : 0)
  - (/deep.?fri/i.test(cookingMethod) ? 2 : 0)
  + (fiber > 5g ? 1 : 0)
  + (protein > 20g ? 1 : 0)
// clamped to [0, 10]

// Score >= 6 → Healthy (green)
// Score < 6  → Indulgent (orange)
```

## BMR & RDA Calculation

**Mifflin-St Jeor BMR:**
```
Male:   10×weight + 6.25×height − 5×age + 5
Female: 10×weight + 6.25×height − 5×age − 161
```

**TDEE** = BMR × activity multiplier (1.2–1.725)

**RDA defaults:**
- Calories: TDEE
- Protein: 0.8g × weight (kg)
- Carbs: 50% of TDEE calories ÷ 4
- Fat: 30% of TDEE calories ÷ 9
- Fiber: 25g

Users can manually override these values in settings.

## Sample Restaurants & Items

| Restaurant | Cuisine | Health Score | Sample Items |
|---|---|---|---|
| Green Leaf Kitchen | Salads, Wraps, Smoothies | ~8.0 | Quinoa Power Bowl, Grilled Chicken Wrap, Green Detox Smoothie |
| Spice Garden | Indian, Curries | ~5.5 | Chicken Biryani, Palak Paneer, Dal Tadka |
| Crunch Burgers | Burgers, Fries, Shakes | ~3.0 | Classic Smash Burger, Loaded Cheese Fries, Chocolate Milkshake |

All 15 items have complete nutrition data, ingredients, allergens, and active discounts for testing.

## Development Scripts

### Backend
```bash
npm run dev        # Start dev server with tsx watch
npm run build      # Compile TypeScript
npm run start      # Run production build
npm run db:migrate # Run Prisma migrations
npm run db:seed    # Seed database
npm run db:studio  # Open Prisma Studio
```

### Frontend
```bash
npm run dev        # Start Next.js dev server
npm run build      # Build production bundle
npm run start      # Start production server
npm run lint       # Run ESLint
```

## Next Steps (Post-MVP)

See `docs/roadmap.md` for the full implementation plan. MVP focuses on:
1. Auth & onboarding (body stats, allergies)
2. Restaurant browsing & menu item detail
3. Cart & checkout with health summary
4. Merchant dashboard
5. Rider app
6. Health engine (BMR, RDA, daily log, hazard alerts)
7. Deals-first home page
8. Seed data & polish

**Out of scope for MVP:**
- Real payment gateway (COD + mock card only)
- Real-time WebSocket tracking (polling-based)
- Admin panel
- Reviews & ratings
- Push notifications

## Contributing

This is a learning/portfolio project. Feel free to fork and extend!

## License

MIT
