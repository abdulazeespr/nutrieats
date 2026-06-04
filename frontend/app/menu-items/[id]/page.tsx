"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { api } from "@/lib/api";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import NutritionPanel from "@/components/item/NutritionPanel";
import IngredientsList, { Ingredient } from "@/components/item/IngredientsList";

interface MenuItemDetail {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  cookingMethod: string;
  ingredients: Ingredient[] | string[];
  allergens: string[];
  healthScore: number;
  isHealthy: boolean;
  discount: number;
  allergenWarning: boolean;
  restaurant: {
    name: string;
    address: string;
  };
}

interface RdaTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface DailyLogResponse {
  rda: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

export default function MenuItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuth();
  const { addItem, items: cartItems, totalItems } = useCart();
  const router = useRouter();

  const [item, setItem] = useState<MenuItemDetail | null>(null);
  const [rda, setRda] = useState<RdaTargets | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await api.get<MenuItemDetail>(`/menu-items/${id}`);
        setItem(data);

        // Fetch RDA for the progress bars if user is a logged-in customer
        if (user?.role === "CUSTOMER") {
          try {
            const log = await api.get<DailyLogResponse>("/users/daily-log");
            setRda(log.rda);
          } catch {
            // non-critical — show nutrition without RDA context
          }
        }
      } catch {
        setError("Item not found or could not be loaded.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, user]);

  function handleLogout() {
    logout();
    router.push("/");
  }

  function handleAddToCart() {
    if (!item) return;
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      discountedPrice: discountedPrice ?? item.price,
      calories: item.calories,
      imageUrl: item.imageUrl,
      restaurantId: item.restaurantId,
      restaurantName: item.restaurant.name,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  const cartQty = item
    ? (cartItems.find((c) => c.menuItemId === item.id)?.quantity ?? 0)
    : 0;

  const discountedPrice =
    item && item.discount > 0 ? item.price * (1 - item.discount / 100) : null;

  const restaurantHref = item ? `/restaurants` : "/restaurants";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link
            href={restaurantHref}
            className="text-green-600 font-semibold text-sm flex items-center gap-1 hover:underline"
          >
            ← Back
          </Link>
          <Link href="/" className="text-xl font-bold text-green-600">
            NutriEats
          </Link>
          <div className="flex items-center gap-3">
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            <div className="h-56 bg-gray-200 rounded-2xl animate-pulse" />
            <div className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
            <div className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
          </div>
        )}

        {!loading && error && (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && item && (
          <div className="space-y-5">
            {/* Hero image */}
            {item.imageUrl && (
              <div className="rounded-2xl overflow-hidden bg-gray-100 w-full h-56 sm:h-72 relative">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 672px"
                  priority
                />
              </div>
            )}

            {/* Title card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                    {item.name}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.restaurant.name} · {item.restaurant.address}
                  </p>
                </div>

                {/* Health / Indulgent badge */}
                <Badge
                  color={item.isHealthy ? "green" : "orange"}
                  size="md"
                >
                  {item.isHealthy ? "Healthy" : "Indulgent"}
                </Badge>
              </div>

              {item.description && (
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                  {item.description}
                </p>
              )}

              {/* Price row */}
              <div className="flex items-center gap-3 mt-4">
                {discountedPrice != null ? (
                  <>
                    <span className="text-2xl font-extrabold text-green-700">
                      ₹{discountedPrice.toFixed(0)}
                    </span>
                    <span className="text-base text-gray-400 line-through">
                      ₹{item.price.toFixed(0)}
                    </span>
                    <Badge color="blue" size="md">{item.discount}% off</Badge>
                  </>
                ) : (
                  <span className="text-2xl font-extrabold text-gray-900">
                    ₹{item.price.toFixed(0)}
                  </span>
                )}
              </div>

              {/* Health score */}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-sm text-gray-500">Health Score:</span>
                <span
                  className={`text-sm font-bold ${item.isHealthy ? "text-green-600" : "text-orange-500"}`}
                >
                  {item.healthScore.toFixed(1)} / 10
                </span>
              </div>

              {/* Calorie count */}
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-semibold">{Math.round(item.calories)} kcal</span> per serving
              </p>
            </div>

            {/* Allergen hazard box */}
            {item.allergenWarning && (
              <div
                role="alert"
                className="bg-red-50 border-2 border-red-500 rounded-2xl p-5"
                aria-label="Allergen warning"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-red-600 text-lg" aria-hidden="true">⚠</span>
                  <h2 className="text-base font-bold text-red-700">Allergen Warning</h2>
                </div>
                <p className="text-sm text-red-700">
                  This item contains allergens that match your profile:
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {item.allergens.map((a) => (
                    <li key={a}>
                      <span className="bg-red-100 text-red-800 text-xs font-semibold px-3 py-1 rounded-full">
                        {a}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* RDA Impact / Nutrition panel */}
            <section
              aria-labelledby="nutrition-heading"
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <h2 id="nutrition-heading" className="text-base font-bold text-gray-900 mb-4">
                {rda ? "RDA Impact" : "Nutrition Info"}
              </h2>
              <NutritionPanel
                calories={item.calories}
                protein={item.protein}
                carbs={item.carbs}
                fat={item.fat}
                fiber={item.fiber}
                rda={rda ?? undefined}
              />
            </section>

            {/* How it's made */}
            {item.cookingMethod && (
              <section
                aria-labelledby="cooking-heading"
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
              >
                <h2 id="cooking-heading" className="text-base font-bold text-gray-900 mb-2">
                  How it&apos;s made
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">{item.cookingMethod}</p>
              </section>
            )}

            {/* Ingredients */}
            {item.ingredients && (item.ingredients as (Ingredient | string)[]).length > 0 && (
              <section
                aria-labelledby="ingredients-heading"
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
              >
                <h2 id="ingredients-heading" className="text-base font-bold text-gray-900 mb-4">
                  Ingredients
                </h2>
                <IngredientsList ingredients={item.ingredients} />
                <div className="flex gap-4 mt-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-200 border border-green-400" />
                    Beneficial
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-200 border border-gray-300" />
                    Neutral
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-200 border border-orange-400" />
                    Watch out
                  </span>
                </div>
              </section>
            )}

            {/* All allergens list (non-warning context) */}
            {item.allergens.length > 0 && !item.allergenWarning && (
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-bold text-gray-900 mb-3">Contains allergens</h2>
                <ul className="flex flex-wrap gap-2">
                  {item.allergens.map((a) => (
                    <li key={a}>
                      <Badge color="gray" size="sm">{a}</Badge>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Add to Cart CTA */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              {user ? (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {discountedPrice != null
                        ? `₹${discountedPrice.toFixed(0)}`
                        : `₹${item.price.toFixed(0)}`}
                    </p>
                    {cartQty > 0 && (
                      <p className="text-xs text-green-600 mt-0.5">
                        {cartQty} in cart
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {totalItems > 0 && (
                      <Link href="/cart">
                        <Button variant="secondary" className="text-sm px-4 py-2">
                          View cart ({totalItems})
                        </Button>
                      </Link>
                    )}
                    <Button
                      onClick={handleAddToCart}
                      className="text-sm px-6 py-2"
                    >
                      {added ? "Added ✓" : cartQty > 0 ? "Add another" : "Add to cart"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-4">
                    Log in to add items to your cart.
                  </p>
                  <Link href="/login">
                    <Button className="w-full sm:w-auto px-10">Log in to order</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
