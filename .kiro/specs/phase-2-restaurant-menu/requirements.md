# Requirements Document

## Introduction

Phase 2 adds the restaurant and menu browsing layer to NutriEats. Customers can browse all open restaurants, view each restaurant's menu, and drill into individual item detail pages that expose full nutrition data, ingredients, allergen warnings, and cooking method. The backend exposes three REST endpoints that drive this experience; allergen matching is performed server-side by cross-referencing the authenticated user's stored allergy profile. The frontend introduces three new pages (`/restaurants`, `/restaurants/[id]`, `/menu-items/[id]`) and a skeleton home page (`/`) that will be wired to live data in Phase 7.

The Health Score (0–10) formula and the Healthy / Indulgent classification (score ≥ 6 = Healthy) established in Phase 0 are the authoritative rules used throughout this phase.

## Glossary

- **RestaurantAPI**: The Express backend service that serves restaurant and menu data.
- **Restaurant**: A food-service establishment stored in the `Restaurant` model with `id`, `name`, `address`, `cuisineTags`, `healthScore`, `isOpen`, and associated `MenuItem` records.
- **MenuItem**: A food product stored in the `MenuItem` model containing nutrition fields (`calories`, `protein`, `carbs`, `fat`, `fiber`), `cookingMethod`, `ingredients` (JSON), `allergens` (string array), `healthScore`, `isHealthy`, `discount`, and `isAvailable`.
- **HealthScore**: A numeric value in the range [0, 10] calculated from a MenuItem's nutrition and cooking method using the formula: start at 10; subtract 2 if calories > 600; subtract 2 if fat > 20 g; subtract 2 if cooking method matches `/deep.?fri/i`; add 1 if fiber > 5 g; add 1 if protein > 20 g; clamp result to [0, 10].
- **Healthy**: A classification applied to a MenuItem or Restaurant whose HealthScore is ≥ 6; displayed with a green badge.
- **Indulgent**: A classification applied to a MenuItem or Restaurant whose HealthScore is < 6; displayed with an orange badge.
- **AllergenMatcher**: The server-side logic that compares a MenuItem's `allergens` array against the authenticated user's stored `Allergy` records (case-insensitive) and returns a boolean `allergenWarning` flag.
- **ActiveDeal**: A MenuItem where `discount > 0` and `isAvailable` is true.
- **RestaurantListing**: The frontend page at `/restaurants` that renders the list of open restaurants.
- **RestaurantMenuPage**: The frontend page at `/restaurants/[id]` that renders a single restaurant's header and categorised menu.
- **ItemDetailPage**: The frontend page at `/menu-items/[id]` that renders full nutrition, ingredient, and allergen information for a single MenuItem.
- **HomeSkeleton**: The frontend page at `/` that renders placeholder sections for deals and the RDA Hazard Box; these sections will be wired to live data in Phase 7.
- **RDA**: Recommended Daily Allowance — the per-nutrient daily target stored in the `BodyStats` model for an authenticated customer.
- **HazardBox**: A red UI component that surfaces an allergen warning to the user.
- **FilterBar**: A UI control on the RestaurantListing page with options: All, Healthy, Indulgent.
- **SortDropdown**: A UI control on the RestaurantListing page allowing sorting by Health Score, Delivery Time, or Name.

---

## Requirements

### Requirement 1: List Open Restaurants

**User Story:** As a customer, I want to see a list of all currently open restaurants, so that I can choose where to order from.

#### Acceptance Criteria

1. WHEN a request is made to `GET /api/restaurants`, THE RestaurantAPI SHALL return only restaurants where `isOpen` is `true`, including each restaurant's `id`, `name`, `address`, `cuisineTags`, `healthScore`, `isOpen`, and `hasAllergenWarning` fields.
2. WHEN a request is made to `GET /api/restaurants`, THE RestaurantAPI SHALL include each restaurant's `healthScore` as a numeric value in the range [0, 10].
3. WHEN a request is made to `GET /api/restaurants`, THE RestaurantAPI SHALL include up to 3 active deals per restaurant under a `deals` array, where each active deal is a MenuItem with `discount > 0` and `isAvailable` is `true`, ordered by `discount` descending, and each deal object SHALL include `id`, `name`, `discount`, `price`, `imageUrl`, `healthScore`, and `isHealthy`.
4. WHEN a request is made to `GET /api/restaurants`, THE RestaurantAPI SHALL return results ordered by `healthScore` descending.
5. WHEN a request is made to `GET /api/restaurants` and open restaurants exist, THE RestaurantAPI SHALL respond with HTTP 200 and a JSON array of restaurant objects.
6. IF no open restaurants exist when `GET /api/restaurants` is called, THE RestaurantAPI SHALL return HTTP 200 with an empty JSON array `[]`.
7. IF the database is unavailable when `GET /api/restaurants` is called, THE RestaurantAPI SHALL return HTTP 500 with `{ "error": "Internal server error" }`.

---

### Requirement 2: Get Single Restaurant with Menu

**User Story:** As a customer, I want to view a restaurant's full menu, so that I can see what dishes are available before ordering.

#### Acceptance Criteria

1. WHEN a request is made to `GET /api/restaurants/:id` with a valid restaurant ID, THE RestaurantAPI SHALL respond with HTTP 200 and return the restaurant record including `name`, `address`, `cuisineTags`, `healthScore`, and `isOpen`.
2. WHEN a request is made to `GET /api/restaurants/:id` with a valid restaurant ID, THE RestaurantAPI SHALL include all MenuItems where `isAvailable` is `true`, ordered by `healthScore` descending.
3. IF a request is made to `GET /api/restaurants/:id` with an ID that does not correspond to any restaurant, THEN THE RestaurantAPI SHALL return HTTP 404 with a JSON body `{ "error": "Restaurant not found" }`.
4. WHEN a request is made to `GET /api/restaurants/:id` with a valid restaurant ID, THE RestaurantAPI SHALL include each available MenuItem's `id`, `name`, `description`, `price`, `imageUrl`, `calories`, `protein`, `carbs`, `fat`, `fiber`, `cookingMethod`, `ingredients`, `allergens`, `healthScore`, `isHealthy`, and `discount` in the menu response.

---

### Requirement 3: Get Full Menu Item Detail

**User Story:** As a customer, I want to see detailed nutrition and ingredient information for a menu item, so that I can make an informed decision about what to order.

#### Acceptance Criteria

1. WHEN a request is made to `GET /api/menu-items/:id` with an ID that resolves to a MenuItem record, THE RestaurantAPI SHALL return the MenuItem's nutrition fields: `calories`, `protein`, `carbs`, `fat`, and `fiber`.
2. IF all five of a MenuItem's nutrition values (`calories`, `protein`, `carbs`, `fat`, `fiber`) are zero after a successful record lookup, THE RestaurantAPI SHALL return HTTP 422 with `{ "error": "Item has no nutrition data" }`.
3. WHEN a request is made to `GET /api/menu-items/:id` with a valid item ID, THE RestaurantAPI SHALL return the MenuItem's `cookingMethod`, `ingredients`, `allergens`, `healthScore`, `isHealthy`, `price`, `imageUrl`, `name`, `description`, `discount`, and `isAvailable`.
4. WHEN a request is made to `GET /api/menu-items/:id` with a valid item ID, THE RestaurantAPI SHALL include the parent restaurant's `name` and `address` in the response under a `restaurant` key.
5. IF a request is made to `GET /api/menu-items/:id` with an ID that does not resolve to a MenuItem record, THEN THE RestaurantAPI SHALL return HTTP 404 with a JSON body `{ "error": "Item not found" }`.
6. IF a request is made to `GET /api/menu-items/:id` for an item where `isAvailable` is `false`, THE RestaurantAPI SHALL still return the item data with HTTP 200, including `isAvailable: false` in the response, so that the frontend can display an "unavailable" state.

---

### Requirement 4: Allergen Matching on Item Detail

**User Story:** As a customer with food allergies, I want menu items that contain my allergens to be clearly flagged, so that I can avoid ordering unsafe food.

#### Acceptance Criteria

1. WHEN a request is made to `GET /api/menu-items/:id` with a valid `Authorization` header containing a JWT for an authenticated customer, THE AllergenMatcher SHALL compare the MenuItem's `allergens` array against the customer's stored `Allergy` records using case-insensitive string comparison.
2. IF the MenuItem's `allergens` array contains at least one allergen that matches (case-insensitively) any of the authenticated customer's stored allergen names, THEN THE RestaurantAPI SHALL include `"allergenWarning": true` and a `matchedAllergens` array of the matching allergen name strings (in lowercase) in the response body.
3. IF the MenuItem's `allergens` array contains no allergens that match the authenticated customer's stored allergen names, THEN THE RestaurantAPI SHALL include `"allergenWarning": false` and an empty `matchedAllergens` array in the response body.
4. WHEN a request is made to `GET /api/menu-items/:id` without an `Authorization` header, THE RestaurantAPI SHALL return the item data with `"allergenWarning": false`, an empty `matchedAllergens` array, and SHALL NOT return an authentication error.
5. IF a request is made to `GET /api/menu-items/:id` with an `Authorization` header containing an invalid or expired JWT, THE RestaurantAPI SHALL treat the request as unauthenticated: return the item data with `"allergenWarning": false`, an empty `matchedAllergens` array, and SHALL NOT return HTTP 401.

---

### Requirement 5: Allergen Flagging on Restaurant Listing

**User Story:** As a customer with food allergies, I want to see which restaurants have items that match my allergens while browsing, so that I can make safe choices quickly.

#### Acceptance Criteria

1. IF a request to `GET /api/restaurants` includes a `userId` header that resolves to a valid customer, THEN WHEN evaluating each restaurant, THE RestaurantAPI SHALL determine whether any available MenuItem's `allergens` list intersects (case-insensitively) with that customer's stored allergen names.
2. WHEN at least one available MenuItem in a restaurant matches the customer's allergens, THE RestaurantAPI SHALL include `"hasAllergenWarning": true` on that restaurant object in the response.
3. IF no available MenuItem in a restaurant matches the customer's allergens, or the customer has zero stored allergens, THEN THE RestaurantAPI SHALL include `"hasAllergenWarning": false` on that restaurant object.
4. WHEN no `userId` header is provided, THE RestaurantAPI SHALL set `"hasAllergenWarning": false` for all restaurants and SHALL NOT return an authentication error.
5. IF the `userId` header is provided but does not correspond to any customer record, THE RestaurantAPI SHALL treat the request as anonymous: set `"hasAllergenWarning": false` for all restaurants and SHALL NOT return an authentication error.

---

### Requirement 6: Restaurant Listing Page

**User Story:** As a customer, I want a restaurant browsing page with filter and sort controls, so that I can find restaurants that match my preferences quickly.

#### Acceptance Criteria

1. WHEN the RestaurantListing page loads and `GET /api/restaurants` returns successfully, THE RestaurantListing SHALL display a restaurant card for each restaurant in the response, showing: `name`, `address`, at least one cuisine tag from `cuisineTags`, the `healthScore` as a numeric badge, and a deal badge when the restaurant's `deals` array contains at least one entry.
2. WHEN a restaurant has `"hasAllergenWarning": true`, THE RestaurantListing SHALL display a red allergy hazard badge overlay on that restaurant's card.
3. THE RestaurantListing SHALL provide a FilterBar with three options — **All**, **Healthy**, **Indulgent** — defaulting to **All**.
4. WHEN the customer selects **Healthy** in the FilterBar, THE RestaurantListing SHALL display only restaurants whose `healthScore` is ≥ 6.
5. WHEN the customer selects **Indulgent** in the FilterBar, THE RestaurantListing SHALL display only restaurants whose `healthScore` is < 6.
6. THE RestaurantListing SHALL provide a SortDropdown with options: **Health Score** (descending, default), **Name** (ascending A→Z); selecting an option SHALL reorder the displayed restaurant cards accordingly.
7. WHEN both a FilterBar selection and a SortDropdown selection are active simultaneously, THE RestaurantListing SHALL apply the filter first and then sort the filtered results.
8. WHILE the restaurant list is loading, THE RestaurantListing SHALL display skeleton loading placeholders in place of restaurant cards.
9. IF `GET /api/restaurants` returns an empty array, THE RestaurantListing SHALL display an empty-state message indicating no restaurants are currently open.
10. IF `GET /api/restaurants` returns a non-200 HTTP status or a network error occurs, THE RestaurantListing SHALL display an error message and a retry button.

---

### Requirement 7: Restaurant Menu Page

**User Story:** As a customer, I want to view a restaurant's menu organised by category, so that I can browse dishes efficiently.

#### Acceptance Criteria

1. THE RestaurantMenuPage SHALL display a restaurant header containing `name`, `address`, `healthScore` badge, cuisine tags, and open/closed status (`isOpen`) sourced from the response of `GET /api/restaurants/:id`.
2. THE RestaurantMenuPage SHALL group MenuItem cards by their `category` field using client-side logic; WHEN no `category` field is present on a MenuItem or the field is null/empty, THE RestaurantMenuPage SHALL place that item in a default **"Menu"** group.
3. WHEN the RestaurantMenuPage renders a MenuItem card for an available item, it SHALL display: item photo (`imageUrl`), `name`, `calories`, the Healthy or Indulgent classification badge derived from `healthScore`, and `price`.
4. IF the authenticated customer's allergen data indicates a match for a MenuItem (sourced from the item detail response), THEN THE RestaurantMenuPage SHALL display an allergen warning indicator on that item's card.
5. WHILE the restaurant data is loading, THE RestaurantMenuPage SHALL display skeleton loading placeholders.
6. IF `GET /api/restaurants/:id` returns HTTP 404, THE RestaurantMenuPage SHALL display an error message indicating the restaurant was not found.
7. IF `GET /api/restaurants/:id` returns a non-404 non-200 HTTP status or a network error, THE RestaurantMenuPage SHALL display a generic error message and a retry button.

---

### Requirement 8: Item Detail Page

**User Story:** As a customer, I want a dedicated item detail page that shows me full nutritional and ingredient information, so that I understand exactly what I am eating.

#### Acceptance Criteria

1. THE ItemDetailPage SHALL display the item's `name`, `imageUrl`, `price` formatted to two decimal places, and the Healthy or Indulgent classification badge derived from the API-supplied `healthScore`.
2. THE ItemDetailPage SHALL display a full nutrition panel showing `calories`, `protein` (g), `carbs` (g), `fat` (g), and `fiber` (g) sourced from the MenuItem record.
3. WHEN the authenticated customer has a stored RDA in `BodyStats`, THE ItemDetailPage SHALL display a macros progress bar for each of the five nutrients showing the percentage of the customer's RDA that this single item represents, calculated as `(nutrientValue / rdaValue) × 100`, clamped to a maximum of 100%.
4. IF the authenticated customer does not have a stored RDA, THE ItemDetailPage SHALL display macros progress bars using default RDA values (calories: 2000 kcal, protein: 50 g, carbs: 275 g, fat: 78 g, fiber: 28 g).
5. WHEN the `cookingMethod` field on the MenuItem is a non-empty string, THE ItemDetailPage SHALL display a **"How it's made"** section containing the `cookingMethod` text.
6. THE ItemDetailPage SHALL display an ingredients list sourced from the `ingredients` JSON field; each ingredient entry SHALL include a `name` string; WHERE an ingredient entry contains a `tag` field with value `"beneficial"`, `"neutral"`, or `"watch-out"`, THE ItemDetailPage SHALL display that tag alongside the ingredient name.
7. WHEN the item detail response includes `"allergenWarning": true`, THE ItemDetailPage SHALL display a HazardBox in red listing the allergen names from the `matchedAllergens` array.
8. WHEN the item detail response includes `"allergenWarning": false`, THE ItemDetailPage SHALL NOT display the HazardBox.
9. THE ItemDetailPage SHALL display an **Add to Cart** button; WHEN the customer taps the button, THE ItemDetailPage SHALL display a visual confirmation indicator (e.g., a brief toast or button state change) and remain on the current page.
10. WHILE the item data is loading, THE ItemDetailPage SHALL display skeleton loading placeholders for the following six sections: item header, nutrition panel, macros progress bars, "How it's made" section, ingredients list, and Add to Cart button area.
11. IF `GET /api/menu-items/:id` returns HTTP 404, THE ItemDetailPage SHALL display an error message indicating the item was not found.

---

### Requirement 9: Home Skeleton Page

**User Story:** As a developer, I want a home page scaffold in place, so that Phase 7 can wire real deals and health data into an already-positioned layout without restructuring the page.

#### Acceptance Criteria

1. THE HomeSkeleton SHALL render at the `/` route and SHALL be accessible without authentication.
2. THE HomeSkeleton SHALL include a Best Deals placeholder section occupying at least 60% of the content area width, displaying exactly 3 static placeholder deal cards.
3. THE HomeSkeleton SHALL include a placeholder section representing the RDA Hazard Box, displaying exactly 1 static placeholder alert with no live data.
4. THE HomeSkeleton SHALL include a Flash Offers placeholder strip displaying exactly 2 static placeholder offer items.
5. THE HomeSkeleton SHALL include the FilterBar component with options in this order: **All**, **Healthy**, **Indulgent**; clicking any option SHALL produce no filtering action and no visible change to page content.

---

### Requirement 10: Health Score Classification Consistency

**User Story:** As a customer, I want health badges to be consistent across every page, so that a "Healthy" label always means the same thing wherever I see it.

#### Acceptance Criteria

1. WHEN THE RestaurantListing renders a health badge for a restaurant or MenuItem, it SHALL display a green **Healthy** badge if the API-supplied `healthScore` is ≥ 6, and an orange **Indulgent** badge if the API-supplied `healthScore` is < 6.
2. WHEN THE RestaurantMenuPage renders a health badge for a MenuItem, it SHALL display a green **Healthy** badge if the API-supplied `healthScore` is ≥ 6, and an orange **Indulgent** badge if the API-supplied `healthScore` is < 6.
3. WHEN THE ItemDetailPage renders a health badge for a MenuItem, it SHALL display a green **Healthy** badge if the API-supplied `healthScore` is ≥ 6, and an orange **Indulgent** badge if the API-supplied `healthScore` is < 6.
4. THE RestaurantListing, THE RestaurantMenuPage, and THE ItemDetailPage SHALL each derive their health badge solely from the `healthScore` value returned by the API and SHALL NOT recompute `healthScore` locally on the client.
5. WHEN a MenuItem record is created or updated (including any partial update that modifies `calories`, `fat`, `cookingMethod`, `fiber`, or `protein`), THE RestaurantAPI SHALL recalculate and persist `healthScore` and `isHealthy` using the canonical HealthScore formula.
6. IF the HealthScore recalculation fails during a MenuItem create or update, THE RestaurantAPI SHALL reject the operation with HTTP 500 and SHALL NOT persist the record with a stale `healthScore`.
7. THE `isHealthy` field on every MenuItem record in the database SHALL equal `true` if and only if `healthScore` ≥ 6.
