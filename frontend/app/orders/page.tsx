"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

interface OrderSummary {
  id: string;
  status: string;
  totalPrice: number;
  totalCalories: number;
  createdAt: string;
  restaurant: { name: string };
  items: { menuItem: { name: string }; quantity: number }[];
}

const STATUS_COLOR: Record<string, "green" | "orange" | "gray" | "red" | "blue"> = {
  PLACED: "blue",
  CONFIRMED: "blue",
  PREPARING: "orange",
  OUT_FOR_DELIVERY: "orange",
  DELIVERED: "green",
  CANCELLED: "red",
};

const STATUS_LABELS: Record<string, string> = {
  PLACED: "Placed",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

function OrdersContent() {
  const { logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<OrderSummary[]>("/orders/my")
      .then(setOrders)
      .catch(() => setError("Could not load your orders."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link href="/restaurants" className="text-green-600 font-semibold text-sm hover:underline">
            ← Restaurants
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-lg font-semibold text-gray-700 mb-2">No orders yet</p>
            <p className="text-sm text-gray-500 mb-6">Once you place an order it will appear here.</p>
            <Link href="/restaurants">
              <Button>Browse restaurants</Button>
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4" role="list" aria-label="Order history">
            {orders.map((order) => {
              const itemSummary = order.items
                .slice(0, 2)
                .map((i) => `${i.menuItem.name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`)
                .join(", ");
              const extra = order.items.length > 2 ? ` +${order.items.length - 2} more` : "";

              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}/confirmation`}
                  className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded-2xl"
                  role="listitem"
                >
                  <Card className="p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900">{order.restaurant.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {itemSummary}{extra}
                        </p>
                      </div>
                      <Badge color={STATUS_COLOR[order.status] ?? "gray"} size="sm">
                        {STATUS_LABELS[order.status] ?? order.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span className="font-semibold text-gray-800">₹{order.totalPrice.toFixed(0)}</span>
                      <span>{Math.round(order.totalCalories)} kcal</span>
                      <span className="ml-auto font-mono">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <OrdersContent />
    </ProtectedRoute>
  );
}
