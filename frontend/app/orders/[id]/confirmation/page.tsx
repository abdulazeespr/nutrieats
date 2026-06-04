"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { api } from "@/lib/api";

interface OrderDetail {
  id: string;
  status: string;
  totalPrice: number;
  totalCalories: number;
  deliveryAddress: string;
  createdAt: string;
  restaurant: { name: string; address: string };
  items: {
    id: string;
    quantity: number;
    priceSnapshot: number;
    caloriesSnapshot: number;
    menuItem: { name: string; imageUrl: string };
  }[];
  assignment?: {
    rider: { name: string; phone: string };
    status: string;
  } | null;
}

const STATUS_STEPS = ["PLACED", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];

const STATUS_LABELS: Record<string, string> = {
  PLACED: "Order placed",
  CONFIRMED: "Confirmed",
  PREPARING: "Being prepared",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
};

function ConfirmationContent() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<OrderDetail>(`/orders/${id}`)
      .then(setOrder)
      .catch(() => setError("Could not load order details."))
      .finally(() => setLoading(false));
  }, [id]);

  const currentStepIndex = order
    ? STATUS_STEPS.indexOf(order.status)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-green-600">NutriEats</Link>
          <Link href="/orders">
            <Button variant="secondary" className="text-sm px-4 py-2">My Orders</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {loading && (
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
            <div className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
          </div>
        )}

        {!loading && error && (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && order && (
          <div className="space-y-5">
            {/* Success header */}
            <div className="text-center py-6">
              <div className="text-5xl mb-3" aria-hidden="true">🎉</div>
              <h1 className="text-2xl font-bold text-gray-900">Order placed!</h1>
              <p className="text-sm text-gray-500 mt-1">
                Order <span className="font-mono font-semibold">{order.id.slice(-8).toUpperCase()}</span>
              </p>
            </div>

            {/* Order status tracker */}
            <Card className="p-6">
              <h2 className="text-base font-bold text-gray-900 mb-5">Order status</h2>
              <ol className="relative" aria-label="Order progress">
                {STATUS_STEPS.filter(s => s !== "CANCELLED").map((step, i) => {
                  const done = i <= currentStepIndex;
                  const active = i === currentStepIndex;
                  const isLast = i === STATUS_STEPS.filter(s => s !== "CANCELLED").length - 1;

                  return (
                    <li key={step} className={`flex items-start gap-4 ${!isLast ? "pb-5" : ""}`}>
                      {/* Step indicator + line */}
                      <div className="flex flex-col items-center shrink-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                            ${done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"}`}
                          aria-current={active ? "step" : undefined}
                        >
                          {done && !active ? "✓" : i + 1}
                        </div>
                        {!isLast && (
                          <div className={`w-0.5 flex-1 mt-1 ${done ? "bg-green-300" : "bg-gray-200"}`} style={{ minHeight: "1.5rem" }} />
                        )}
                      </div>
                      <div className="pt-1">
                        <p className={`text-sm font-semibold ${active ? "text-green-700" : done ? "text-gray-700" : "text-gray-400"}`}>
                          {STATUS_LABELS[step]}
                        </p>
                        {active && (
                          <p className="text-xs text-green-600 mt-0.5">Current status</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>

              {/* Rider info */}
              {order.assignment?.rider && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">Your delivery partner</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {order.assignment.rider.name}
                  </p>
                  {order.assignment.rider.phone && (
                    <a
                      href={`tel:${order.assignment.rider.phone}`}
                      className="text-sm text-green-600 hover:underline"
                    >
                      {order.assignment.rider.phone}
                    </a>
                  )}
                </div>
              )}
            </Card>

            {/* Order details */}
            <Card className="p-6">
              <h2 className="text-base font-bold text-gray-900 mb-1">
                {order.restaurant.name}
              </h2>
              <p className="text-xs text-gray-500 mb-4">{order.restaurant.address}</p>

              <ul className="divide-y divide-gray-50 text-sm">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between py-2 text-gray-700">
                    <span>
                      {item.menuItem.name}
                      {item.quantity > 1 && (
                        <span className="ml-1 text-gray-400">×{item.quantity}</span>
                      )}
                    </span>
                    <span className="font-semibold">
                      ₹{(item.priceSnapshot * item.quantity).toFixed(0)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Total calories</span>
                  <span>{Math.round(order.totalCalories)} kcal</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Total paid</span>
                  <span>₹{order.totalPrice.toFixed(0)}</span>
                </div>
              </div>
            </Card>

            {/* Delivery address */}
            <Card className="p-5">
              <p className="text-xs text-gray-500 mb-1">Delivering to</p>
              <p className="text-sm text-gray-800">{order.deliveryAddress}</p>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/restaurants" className="flex-1">
                <Button variant="secondary" className="w-full">Order more</Button>
              </Link>
              <Link href="/orders" className="flex-1">
                <Button className="w-full">View all orders</Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <ConfirmationContent />
    </ProtectedRoute>
  );
}
