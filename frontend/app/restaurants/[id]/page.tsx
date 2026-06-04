"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { api } from "@/lib/api";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import MenuItemCard, { MenuItemSummary } from "@/components/restaurant/MenuItemCard";

interface RestaurantDetail {
  id: string;
  name: string;
  address: string;
  cuisineTags: string[];
  healthScore: number;
  isOpen: boolean;
  menuItems: MenuItemSummary[];
}

interface UserProfile {
  allergies: { allergenName: string }[];
}

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const router = useRouter();

  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [userAllergens, setUserAllergens] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeCategory, setActiveCategory] = useState<string>("All");

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await api.get<RestaurantDetail>(`/restaurants/${id}`);
        setRestaurant(data);

        if (user?.role === "CUSTOMER") {
          try {
            const profile = await api.get<UserProfile>("/users/profile");
            setUserAllergens(profile.allergies.map((a) => a.allergenName.toLowerCase()));
          } catch {
            // non-critical
          }
        }
      } catch {
        setError("Restaurant not found or could not be loaded.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, user]);

  const isHealthy = (restaurant?.healthScore ?? 0) >= 6;

  // Group items by a simple "category" based on health classification
  // Real grouping would need a category field; for now we use Healthy/Indulgent
  const categories = ["All", "Healthy", "Indulgent"];

  const filteredItems = restaurant?.menuItems.filter((item) => {
    if (activeCategory === "All") return true;
    if (activeCategory === "Healthy") return item.isHealthy;
    if (activeCategory === "Indulgent") return !item.isHealthy;
    return true;
  }) ?? [];

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link href="/restaurants" className="text-green-600 font-semibold text-sm flex items-center gap-1 hover:underline">
            ← Restaurants
          </Link>
          <Link href="/" className="text-xl font-bold text-green-600">
            NutriEats
          </Link>
          <div className="flex items-center gap-3">
            {user && totalItems > 0 && (
              <Link href="/cart">
                <button className="relative flex items-center px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-gray-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500">
                  🛒
                  <span className="absolute -top-1.5 -right-1.5 min-w-[1.1rem] h-[1.1rem] rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center px-0.5">
                    {totalItems}
                  </span>
                </button>
              </Link>
            )}
            {user ? (
              <Button variant="secondary" onClick={handleLogout} className="text-sm px-4 py-2">
                Log out
              </Button>
            ) : (
              <Link href="/login">
                <Button variant="secondary" className="text-sm px-4 py-2">Log in</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {loading && (
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
            <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
            <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
          </div>
        )}

        {!loading && error && (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && restaurant && (
          <>
            {/* Restaurant header card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
                  <p className="text-sm text-gray-500 mt-1">{restaurant.address}</p>

                  {restaurant.cuisineTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {restaurant.cuisineTags.map((tag) => (
                        <Badge key={tag} color="gray" size="sm">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="shrink-0 text-center">
                  <span
                    className={`text-3xl font-extrabold ${isHealthy ? "text-green-600" : "text-orange-500"}`}
                    aria-label={`Health score ${restaurant.healthScore.toFixed(1)} out of 10`}
                  >
                    {restaurant.healthScore.toFixed(1)}
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5">Health Score</p>
                  <Badge color={isHealthy ? "green" : "orange"} size="sm">
                    {isHealthy ? "Healthy" : "Indulgent"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <span
                  className={`w-2 h-2 rounded-full ${restaurant.isOpen ? "bg-green-500" : "bg-gray-400"}`}
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-gray-600">
                  {restaurant.isOpen ? "Open now" : "Closed"}
                </span>
              </div>
            </div>

            {/* Menu category tabs */}
            <div
              role="tablist"
              aria-label="Menu categories"
              className="flex gap-2 mb-6 overflow-x-auto pb-1"
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={activeCategory === cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500
                    ${activeCategory === cat
                      ? cat === "Healthy"
                        ? "bg-green-600 text-white"
                        : cat === "Indulgent"
                        ? "bg-orange-500 text-white"
                        : "bg-gray-900 text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Menu items */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-3xl mb-2">🍽️</p>
                <p className="text-base font-medium">No items in this category</p>
              </div>
            ) : (
              <div
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                role="list"
                aria-label="Menu items"
              >
                {filteredItems.map((item) => (
                  <div key={item.id} role="listitem">
                    <MenuItemCard item={item} userAllergens={userAllergens} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
