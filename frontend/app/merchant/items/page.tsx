"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { MerchantHeader } from "@/app/merchant/dashboard/page";
import { api } from "@/lib/api";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  calories: number;
  healthScore: number;
  isHealthy: boolean;
  isAvailable: boolean;
  allergens: string[];
  discount: number;
}

interface RestaurantWithItems {
  id: string;
  name: string;
  menuItems: MenuItem[];
}

function ItemsContent() {
  const [restaurant, setRestaurant] = useState<RestaurantWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<RestaurantWithItems>("/merchant/restaurant")
      .then(setRestaurant)
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to load items.";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  async function toggleAvailability(item: MenuItem) {
    setToggling(item.id);
    try {
      const updated = await api.patch<MenuItem>(`/merchant/items/${item.id}/availability`, {});
      setRestaurant((prev) =>
        prev
          ? {
              ...prev,
              menuItems: prev.menuItems.map((m) => (m.id === item.id ? updated : m)),
            }
          : prev
      );
    } catch {
      // silently ignore; user can retry
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MerchantHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Menu items</h1>
          <Link href="/merchant/items/new">
            <Button className="text-sm">+ Add item</Button>
          </Link>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && restaurant && restaurant.menuItems.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-lg font-medium text-gray-600">No items yet</p>
            <p className="text-sm mt-1 mb-6">Add your first menu item to get started.</p>
            <Link href="/merchant/items/new">
              <Button>Add first item</Button>
            </Link>
          </div>
        )}

        {!loading && !error && restaurant && restaurant.menuItems.length > 0 && (
          <div className="space-y-3" role="list" aria-label="Menu items">
            {restaurant.menuItems.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{item.name}</span>
                      <Badge color={item.isHealthy ? "green" : "orange"} size="sm">
                        {item.isHealthy ? "Healthy" : "Indulgent"}
                      </Badge>
                      {!item.isAvailable && (
                        <Badge color="red" size="sm">Unavailable</Badge>
                      )}
                      {item.discount > 0 && (
                        <Badge color="blue" size="sm">{item.discount}% off</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
                      <span className="font-semibold text-gray-800">₹{item.price.toFixed(0)}</span>
                      <span>{Math.round(item.calories)} kcal</span>
                      <span>Health score: <span className="font-semibold">{item.healthScore.toFixed(1)}</span></span>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleAvailability(item)}
                      disabled={toggling === item.id}
                      aria-label={item.isAvailable ? "Mark unavailable" : "Mark available"}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:opacity-50 ${
                        item.isAvailable ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          item.isAvailable ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <Link href={`/merchant/items/${item.id}/edit`}>
                      <Button variant="secondary" className="text-xs px-3 py-1.5">Edit</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function MerchantItemsPage() {
  return (
    <ProtectedRoute allowedRoles={["MERCHANT"]}>
      <ItemsContent />
    </ProtectedRoute>
  );
}
