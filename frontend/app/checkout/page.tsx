"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import { api } from "@/lib/api";

type PaymentMethod = "COD" | "CARD";

interface RdaTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface CartNutrition {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface DailyLogResponse {
  rda: RdaTargets;
}

interface CreateOrderResponse {
  id: string;
}

interface UserProfile {
  name: string;
  phone?: string;
}

function CheckoutContent() {
  const { items, totalPrice, totalCalories, restaurantId, restaurantName, clearCart } =
    useCart();
  const { user, logout } = useAuth();
  const router = useRouter();

  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [rda, setRda] = useState<RdaTargets | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (items.length === 0) {
      router.replace("/cart");
      return;
    }
    // Fetch RDA for health summary
    api
      .get<DailyLogResponse>("/users/daily-log")
      .then((log) => setRda(log.rda))
      .catch(() => {});
  }, [items.length, router]);

  // Aggregate cart nutrition
  const cartNutrition: CartNutrition = { protein: 0, carbs: 0, fat: 0, fiber: 0 };
  // We only have calories per item in the cart; for macro breakdown we'd need them stored.
  // The backend computes real totals on order creation. We show what we have.

  const cartHealthScore = (() => {
    // Rough aggregate: average health from items isn't stored in cart, show calorie context
    return null;
  })();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!address.trim()) {
      setError("Please enter a delivery address.");
      return;
    }
    if (!restaurantId) {
      setError("Your cart is empty.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const payload = {
        restaurantId,
        deliveryAddress: address.trim(),
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
        })),
      };

      const order = await api.post<CreateOrderResponse>("/orders", payload);
      clearCart();
      router.push(`/orders/${order.id}/confirmation`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to place order.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link href="/cart" className="text-green-600 font-semibold text-sm hover:underline">
            ← Cart
          </Link>
          <Link href="/" className="text-xl font-bold text-green-600">NutriEats</Link>
          <Button
            variant="secondary"
            onClick={() => { logout(); router.push("/"); }}
            className="text-sm px-4 py-2"
          >
            Log out
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Delivery address */}
          <Card className="p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">Delivery address</h2>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Full address <span className="text-red-500">*</span>
            </label>
            <textarea
              id="address"
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 42, Green Park, New Delhi – 110016"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              disabled={loading}
              aria-required="true"
            />
          </Card>

          {/* Meal health summary */}
          <Card className="p-6">
            <h2 className="text-base font-bold text-gray-900 mb-1">Meal health summary</h2>
            <p className="text-sm text-gray-500 mb-4">
              From <span className="font-semibold">{restaurantName}</span> · {items.length} item{items.length !== 1 ? "s" : ""}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
                <p className="text-xs text-gray-500">Total calories</p>
                <p className="text-xl font-extrabold text-gray-900 mt-0.5">
                  {Math.round(totalCalories)}
                  <span className="text-xs font-normal text-gray-400 ml-1">kcal</span>
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
                <p className="text-xs text-gray-500">Total price</p>
                <p className="text-xl font-extrabold text-green-700 mt-0.5">
                  ₹{totalPrice.toFixed(0)}
                </p>
              </div>
            </div>

            {/* RDA calorie impact bar */}
            {rda && (
              <div>
                <p className="text-xs text-gray-500 mb-2">
                  This meal is{" "}
                  <span className="font-semibold">
                    {Math.round((totalCalories / rda.calories) * 100)}%
                  </span>{" "}
                  of your daily calorie target ({rda.calories} kcal).
                </p>
                <ProgressBar
                  label="Calorie impact"
                  value={(totalCalories / rda.calories) * 100}
                  max={100}
                  unit="%"
                />
              </div>
            )}

            {/* Cart item list */}
            <ul className="mt-4 divide-y divide-gray-50 text-sm">
              {items.map((item) => (
                <li key={item.menuItemId} className="flex justify-between py-2 text-gray-700">
                  <span>
                    {item.name}
                    {item.quantity > 1 && (
                      <span className="ml-1 text-gray-400">×{item.quantity}</span>
                    )}
                  </span>
                  <span className="font-semibold">₹{(item.discountedPrice * item.quantity).toFixed(0)}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Payment method */}
          <Card className="p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">Payment method</h2>
            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Payment method">
              {(["COD", "CARD"] as PaymentMethod[]).map((method) => (
                <label
                  key={method}
                  className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 cursor-pointer transition-colors ${
                    paymentMethod === method
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={() => setPaymentMethod(method)}
                    className="accent-green-600"
                    disabled={loading}
                  />
                  <div>
                    <p className={`text-sm font-semibold ${paymentMethod === method ? "text-green-700" : "text-gray-800"}`}>
                      {method === "COD" ? "Cash on Delivery" : "Card (Mock)"}
                    </p>
                    <p className={`text-xs ${paymentMethod === method ? "text-green-600" : "text-gray-400"}`}>
                      {method === "COD" ? "Pay when it arrives" : "No real charge"}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </Card>

          {/* Error */}
          {error && (
            <p role="alert" className="text-sm text-red-600 text-center">
              {error}
            </p>
          )}

          {/* Place order */}
          <Button
            type="submit"
            className="w-full text-base py-4"
            disabled={loading || items.length === 0}
          >
            {loading ? "Placing order…" : `Place Order · ₹${totalPrice.toFixed(0)}`}
          </Button>
        </form>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <CheckoutContent />
    </ProtectedRoute>
  );
}
