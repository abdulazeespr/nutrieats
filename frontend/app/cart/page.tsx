"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

function CartPageContent() {
  const { items, increment, decrement, removeItem, totalPrice, totalCalories, totalItems, restaurantName } =
    useCart();
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link href="/restaurants" className="text-green-600 font-semibold text-sm hover:underline">
            ← Continue shopping
          </Link>
          <Link href="/" className="text-xl font-bold text-green-600">NutriEats</Link>
          <Button variant="secondary" onClick={handleLogout} className="text-sm px-4 py-2">
            Log out
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🛒</p>
            <p className="text-lg font-semibold text-gray-700 mb-2">Your cart is empty</p>
            <p className="text-sm text-gray-500 mb-6">Browse restaurants and add items to get started.</p>
            <Link href="/restaurants">
              <Button>Browse restaurants</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Restaurant label */}
            <p className="text-sm text-gray-500">
              Items from <span className="font-semibold text-gray-800">{restaurantName}</span>
            </p>

            {/* Items */}
            <Card className="divide-y divide-gray-100">
              {items.map((item) => (
                <div key={item.menuItemId} className="flex items-center gap-4 p-4">
                  {/* Image */}
                  {item.imageUrl ? (
                    <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="shrink-0 w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl" aria-hidden="true">
                      🍽️
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {Math.round(item.calories)} kcal · ₹{item.discountedPrice.toFixed(0)} each
                    </p>
                    {item.price !== item.discountedPrice && (
                      <p className="text-xs text-gray-400 line-through">₹{item.price.toFixed(0)}</p>
                    )}
                  </div>

                  {/* Qty controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => decrement(item.menuItemId)}
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                      aria-label={`Decrease ${item.name}`}
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-sm font-semibold text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => increment(item.menuItemId)}
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                      aria-label={`Increase ${item.name}`}
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.menuItemId)}
                      className="ml-1 w-7 h-7 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                      aria-label={`Remove ${item.name}`}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Line total */}
                  <div className="shrink-0 text-right w-16">
                    <p className="text-sm font-bold text-gray-900">
                      ₹{(item.discountedPrice * item.quantity).toFixed(0)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {Math.round(item.calories * item.quantity)} kcal
                    </p>
                  </div>
                </div>
              ))}
            </Card>

            {/* Order summary */}
            <Card className="p-5 space-y-3">
              <h2 className="text-base font-bold text-gray-900">Summary</h2>
              <div className="flex justify-between text-sm text-gray-700">
                <span>Items ({totalItems})</span>
                <span>₹{totalPrice.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-700">
                <span>Total calories</span>
                <span>{Math.round(totalCalories)} kcal</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span>₹{totalPrice.toFixed(0)}</span>
              </div>
            </Card>

            {/* Checkout CTA */}
            <Link href="/checkout" className="block">
              <Button className="w-full text-base py-4">
                Proceed to Checkout · ₹{totalPrice.toFixed(0)}
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CartPage() {
  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <CartPageContent />
    </ProtectedRoute>
  );
}
