"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { MerchantHeader } from "@/app/merchant/dashboard/page";
import ItemForm, { ItemFormValues, Ingredient } from "@/components/merchant/ItemForm";
import { api } from "@/lib/api";

interface MenuItem {
  id: string;
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
  ingredients: Ingredient[];
  allergens: string[];
  discount: number;
}

interface RestaurantWithItems {
  id: string;
  menuItems: MenuItem[];
}

function EditItemContent({ id }: { id: string }) {
  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<RestaurantWithItems>("/merchant/restaurant")
      .then((restaurant) => {
        const found = restaurant.menuItems.find((m) => m.id === id);
        if (!found) {
          setError("Item not found.");
          return;
        }
        setItem(found);
      })
      .catch(() => setError("Failed to load item."))
      .finally(() => setLoading(false));
  }, [id]);

  const initialValues: Partial<ItemFormValues> | undefined = item
    ? {
        name: item.name,
        description: item.description,
        price: item.price.toString(),
        imageUrl: item.imageUrl,
        calories: item.calories.toString(),
        protein: item.protein.toString(),
        carbs: item.carbs.toString(),
        fat: item.fat.toString(),
        fiber: item.fiber.toString(),
        cookingMethod: item.cookingMethod,
        ingredients: item.ingredients,
        allergens: item.allergens,
        discount: item.discount.toString(),
      }
    : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <MerchantHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit item</h1>

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && item && (
          <ItemForm mode="edit" itemId={id} initialValues={initialValues} />
        )}
      </main>
    </div>
  );
}

export default function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProtectedRoute allowedRoles={["MERCHANT"]}>
      <EditItemContent id={id} />
    </ProtectedRoute>
  );
}
