# Phase 1 — Auth & Onboarding Tasks

## Tasks

- [x] 1. Create AuthContext with token storage and user state
  - Create `frontend/context/AuthContext.tsx`
  - Provide `user`, `token`, `login(token, user)`, `logout()` via React context
  - On mount, read token from localStorage, decode it to restore user state
  - Export `useAuth()` hook
  - Wrap `app/layout.tsx` with `<AuthProvider>`

- [x] 2. Create ProtectedRoute wrapper component
  - Create `frontend/components/auth/ProtectedRoute.tsx`
  - Reads auth state from `useAuth()`
  - If not logged in, redirects to `/login` using `useRouter`
  - Accepts optional `allowedRoles` prop; if provided, also checks `user.role`
  - If role not allowed, redirects to `/` 

- [x] 3. Build /login page
  - Create `frontend/app/login/page.tsx`
  - Email + password form with validation
  - On submit: `POST /api/auth/login`, save token via `AuthContext.login()`, redirect to `/restaurants` for CUSTOMER, `/merchant/dashboard` for MERCHANT, `/rider/dashboard` for RIDER
  - Show inline error message on failure
  - Link to `/register`

- [x] 4. Build /register page
  - Create `frontend/app/register/page.tsx`
  - Fields: name, email, phone (optional), password, confirm password
  - Role selector: Customer / Restaurant Owner / Delivery Partner
  - On submit: `POST /api/auth/register`, save token, redirect to `/onboarding/body-stats` for CUSTOMER, `/merchant/dashboard` for MERCHANT, `/rider/dashboard` for RIDER
  - Show inline error on failure
  - Link to `/login`

- [x] 5. Build /onboarding/body-stats page
  - Create `frontend/app/onboarding/body-stats/page.tsx`
  - Fields: age (number), weight in kg (number), height in cm (number), gender (MALE/FEMALE/OTHER radio), activity level (4-option selector with labels from `lib/bmr.ts`)
  - Live BMR + RDA preview: recalculate client-side on every change using `lib/bmr.ts` and display estimated daily calories
  - On submit: `PUT /api/users/body-stats`, then redirect to `/onboarding/allergies`
  - Protected: requires CUSTOMER role

- [x] 6. Build /onboarding/allergies page
  - Create `frontend/app/onboarding/allergies/page.tsx`
  - Checkbox grid of common allergens: Gluten, Dairy, Eggs, Nuts, Peanuts, Soy, Shellfish, Fish, Sesame, Mustard
  - Custom allergen text input with Add button (appends to list as removable tag)
  - On submit: `PUT /api/users/allergies` with `{ allergens: string[] }`, then redirect to `/onboarding/notifications`
  - Skip button to proceed without selecting any
  - Protected: requires CUSTOMER role

- [x] 7. Build /onboarding/notifications page
  - Create `frontend/app/onboarding/notifications/page.tsx`
  - Toggle list for per-nutrient alerts: Calories, Protein, Carbs, Fat, Fiber
  - Default all on except Fat (matches backend NotifPrefs defaults)
  - On submit: `PUT /api/users/notifications`, then redirect to `/restaurants`
  - Skip button available
  - Protected: requires CUSTOMER role
