"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { MerchantHeader } from "@/app/merchant/dashboard/page";
import { api } from "@/lib/api";

interface OrderItem {
  menuItem: { name: string };
  quantity: number;
  priceSnapshot: number;
  caloriesSnapshot: number;
}

interface Order {
  id: string;
  status: string;
  totalPrice: number;
  totalCalories: number;
  deliveryAddress: string;
  createdAt: string;
  customer: { name: string; phone?: string };
  items: OrderItem[];
}

const MERCHANT_ACTIONS: Record<string, { label: string; targetStatus: string }[]> = {
  PLACED: [
    { label: "Confirm Order", targetStatus: "CONFIRMED" },
    { label: "Cancel Order", targetStatus: "CANCELLED" },
  ],
  CONFIRMED: [
    { label: "Start Preparing", targetStatus: "PREPARING" },
    { label: "Cancel Order", targetStatus: "CANCELLED" },
  ],
};

const STATUS_COLOR: Record<string, "green" | "orange" | "gray" | "blue" | "red"> = {
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

type FilterStatus = "ALL" | "PLACED" | "CONFIRMED" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";

function OrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<Record<string, string | null>>({});
  const [orderErrors, setOrderErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    api
      .get<Order[]>("/merchant/orders")
      .then(setOrders)
      .catch(() => setError("Failed to load orders."))
      .finally(() => setLoading(false));
  }, []);

  const displayed = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  async function handleStatusUpdate(orderId: string, targetStatus: string) {
    setUpdating((prev) => ({ ...prev, [orderId]: targetStatus }));
    setOrderErrors((prev) => {
      const next = { ...prev };
      delete next[orderId];
      return next;
    });
    try {
      const updated = await api.patch<{ status: string }>(`/orders/${orderId}/status`, { status: targetStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: updated.status } : o))
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update order status.";
      setOrderErrors((prev) => ({ ...prev, [orderId]: message }));
    } finally {
      setUpdating((prev) => ({ ...prev, [orderId]: null }));
    }
  }

  const FILTERS: { value: FilterStatus; label: string }[] = [
    { value: "ALL", label: "All" },
    { value: "PLACED", label: "Placed" },
    { value: "PREPARING", label: "Preparing" },
    { value: "OUT_FOR_DELIVERY", label: "Out for delivery" },
    { value: "DELIVERED", label: "Delivered" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <MerchantHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>

        {/* Filter bar */}
        <div
          role="group"
          aria-label="Filter by status"
          className="flex gap-2 overflow-x-auto pb-1 mb-6"
        >
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
                filter === value
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && displayed.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-lg font-medium text-gray-600">No orders</p>
            <p className="text-sm mt-1">
              {filter === "ALL" ? "You haven't received any orders yet." : `No ${STATUS_LABELS[filter]?.toLowerCase()} orders.`}
            </p>
          </div>
        )}

        {!loading && !error && displayed.length > 0 && (
          <div className="space-y-3" role="list" aria-label="Orders">
            {displayed.map((order) => {
              const isExpanded = expanded === order.id;
              return (
                <Card key={order.id} className="overflow-hidden">
                  {/* Order header row */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : order.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`order-details-${order.id}`}
                    className="w-full text-left px-5 py-4 flex items-start justify-between gap-3 hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-900">{order.customer.name}</span>
                        <Badge color={STATUS_COLOR[order.status] ?? "gray"} size="sm">
                          {STATUS_LABELS[order.status] ?? order.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""} ·{" "}
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-sm font-extrabold text-green-700">₹{order.totalPrice.toFixed(0)}</span>
                      <span className="text-xs text-gray-400">{isExpanded ? "▲ Hide" : "▼ Show"}</span>
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div
                      id={`order-details-${order.id}`}
                      className="border-t border-gray-100 px-5 py-4 bg-gray-50"
                    >
                      {/* Customer info */}
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Customer</p>
                        <p className="text-sm text-gray-800">{order.customer.name}</p>
                        {order.customer.phone && (
                          <a
                            href={`tel:${order.customer.phone}`}
                            className="text-sm text-green-600 hover:underline"
                          >
                            {order.customer.phone}
                          </a>
                        )}
                      </div>

                      {/* Delivery address */}
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Delivery address</p>
                        <p className="text-sm text-gray-800">{order.deliveryAddress}</p>
                      </div>

                      {/* Items */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items</p>
                        <ul className="space-y-1.5">
                          {order.items.map((item, i) => (
                            <li key={i} className="flex justify-between text-sm text-gray-700">
                              <span>
                                {item.menuItem.name}
                                {item.quantity > 1 && (
                                  <span className="text-gray-400 ml-1">×{item.quantity}</span>
                                )}
                              </span>
                              <span className="font-semibold">₹{(item.priceSnapshot * item.quantity).toFixed(0)}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-sm font-bold text-gray-900">
                          <span>Total</span>
                          <span>₹{order.totalPrice.toFixed(0)}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 text-right">{Math.round(order.totalCalories)} kcal total</p>
                      </div>

                      {/* Merchant action buttons */}
                      {(() => {
                        const actions = MERCHANT_ACTIONS[order.status];
                        if (!actions || actions.length === 0) return null;
                        const isUpdating = !!updating[order.id];
                        return (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            {orderErrors[order.id] && (
                              <p role="alert" className="text-sm text-red-600 mb-3">
                                {orderErrors[order.id]}
                              </p>
                            )}
                            <div className="flex gap-2 flex-wrap">
                              {actions.map((action) => (
                                <button
                                  key={action.targetStatus}
                                  onClick={() => handleStatusUpdate(order.id, action.targetStatus)}
                                  disabled={isUpdating}
                                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                                    action.targetStatus === "CANCELLED"
                                      ? "bg-white border border-red-200 text-red-600 hover:bg-red-50"
                                      : "bg-green-600 text-white hover:bg-green-700"
                                  }`}
                                >
                                  {isUpdating && updating[order.id] === action.targetStatus
                                    ? "Updating…"
                                    : action.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function MerchantOrdersPage() {
  return (
    <ProtectedRoute allowedRoles={["MERCHANT"]}>
      <OrdersContent />
    </ProtectedRoute>
  );
}
