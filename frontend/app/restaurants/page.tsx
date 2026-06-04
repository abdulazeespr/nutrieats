"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import RestaurantCard, {
  RestaurantSummary,
} from "@/components/restaurant/RestaurantCard";
import Button from "@/components/ui/Button";

type FilterType = "ALL" | "HEALTHY" | "INDULGENT";
type SortType = "HEALTH_SCORE" | "NAME";

interface UserProfile {
  allergies: { allergenName: string }[];
}

function RestaurantListContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>([]);
  const [userAllergens, setUserAllergens] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState<FilterType>("ALL");
  const [sort, setSort] = useState<SortType>("HEALTH_SCORE");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [rList] = await Promise.all([
          api.get<RestaurantSummary[]>("/restaurants"),
        ]);
        setRestaurants(rList);

        // Load allergens if logged in as customer
        if (user?.role === "CUSTOMER") {
          try {
            const profile = await api.get<UserProfile>("/users/profile");
            setUserAllergens(
              profile.allergies.map((a) => a.allergenName.toLowerCase())
            );
          } catch {
            // non-critical; allergen matching just won't show
          }
        }
      } catch {
        setError("Failed to load restaurants. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  function hasAllergenWarning(restaurant: RestaurantSummary): boolean {
    if (userAllergens.length === 0) return false;
    // The restaurant list only has deal items; warn at the restaurant level
    // if the restaurant itself is known to have any allergens (best-effort from available data)
    return false; // Full allergen check happens per item on the detail page
  }

  const displayed = useMemo(() => {
    let list = [...restaurants];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.address.toLowerCase().includes(q) ||
          r.cuisineTags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (filter === "HEALTHY") list = list.filter((r) => r.healthScore >= 6);
    if (filter === "INDULGENT") list = list.filter((r) => r.healthScore < 6);

    if (sort === "HEALTH_SCORE") list.sort((a, b) => b.healthScore - a.healthScore);
    if (sort === "NAME") list.sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [restaurants, search, filter, sort]);

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-green-600">
            NutriEats
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-500 hidden sm:block">
                  Hi, {user.name || "there"} 👋
                </span>
                <Button variant="secondary" onClick={handleLogout} className="text-sm px-4 py-2">
                  Log out
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="secondary" className="text-sm px-4 py-2">Log in</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Restaurants</h1>

        {/* Search + controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="search"
            placeholder="Search by name, cuisine…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-green-500 focus:border-transparent"
            aria-label="Search restaurants"
          />

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 bg-white"
            aria-label="Sort restaurants"
          >
            <option value="HEALTH_SCORE">Sort: Health Score</option>
            <option value="NAME">Sort: Name A–Z</option>
          </select>
        </div>

        {/* Filter bar */}
        <div
          role="group"
          aria-label="Filter restaurants"
          className="flex gap-2 mb-6 overflow-x-auto pb-1"
        >
          {(["ALL", "HEALTHY", "INDULGENT"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500
                ${filter === f
                  ? f === "HEALTHY"
                    ? "bg-green-600 text-white"
                    : f === "INDULGENT"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-900 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
                }`}
            >
              {f === "ALL" ? "All" : f === "HEALTHY" ? "🥗 Healthy" : "🍔 Indulgent"}
            </button>
          ))}
        </div>

        {/* States */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm"
          >
            {error}
          </div>
        )}

        {!loading && !error && displayed.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-lg font-medium">No restaurants found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        )}

        {!loading && !error && displayed.length > 0 && (
          <div className="space-y-4" role="list" aria-label="Restaurant listings">
            {displayed.map((r) => (
              <div key={r.id} role="listitem">
                <RestaurantCard
                  restaurant={r}
                  hasAllergenWarning={hasAllergenWarning(r)}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function RestaurantsPage() {
  return <RestaurantListContent />;
}
