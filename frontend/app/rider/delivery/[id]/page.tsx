"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { RiderHeader } from "@/app/rider/dashboard/page";
import { api } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type DeliveryStatus = "ASSIGNED" | "PICKED_UP" | "ON_THE_WAY" | "DELIVERED";

interface DeliveryItem {
  menuItem: { name: string };
  quantity: number;
  priceSnapshot: number;
}

interface ActiveAssignment {
  id: string;
  status: DeliveryStatus;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  order: {
    id: string;
    deliveryAddress: string;
    totalPrice: number;
    totalCalories: number;
    restaurant: { name: string; address: string };
    customer: { name: string; phone?: string };
    items: DeliveryItem[];
  };
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<DeliveryStatus, string> = {
  ASSIGNED: "Assigned",
  PICKED_UP: "Picked up",
  ON_THE_WAY: "On the way",
  DELIVERED: "Delivered",
};

const STATUS_COLOR: Record<DeliveryStatus, "blue" | "orange" | "green" | "gray"> = {
  ASSIGNED: "blue",
  PICKED_UP: "orange",
  ON_THE_WAY: "orange",
  DELIVERED: "green",
};

// Next logical status for the action button
const NEXT_STATUS: Partial<Record<DeliveryStatus, DeliveryStatus>> = {
  ASSIGNED: "PICKED_UP",
  PICKED_UP: "ON_THE_WAY",
  ON_THE_WAY: "DELIVERED",
};

const NEXT_STATUS_LABEL: Partial<Record<DeliveryStatus, string>> = {
  ASSIGNED: "Mark as Picked Up",
  PICKED_UP: "Mark as On the Way",
  ON_THE_WAY: "Mark as Delivered",
};

// ─── Progress stepper ─────────────────────────────────────────────────────────

function StatusStepper({ status }: { status: DeliveryStatus }) {
  const steps: DeliveryStatus[] = ["ASSIGNED", "PICKED_UP", "ON_THE_WAY", "DELIVERED"];
  const currentIdx = steps.indexOf(status);

  return (
    <nav aria-label="Delivery progress" className="flex items-center gap-0 w-full">
      {steps.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                aria-current={active ? "step" : undefined}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  done
                    ? "bg-green-600 text-white"
                    : active
                    ? "bg-green-500 text-white ring-2 ring-green-300"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {done ? "✓" : idx + 1}
              </div>
              <span
                className={`mt-1 text-[10px] font-medium text-center leading-tight ${
                  active ? "text-green-700" : done ? "text-gray-500" : "text-gray-300"
                }`}
              >
                {STATUS_LABEL[step]}
              </span>
            </div>
            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 mb-4 rounded transition-colors ${
                  idx < currentIdx ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}

// ─── Address block ────────────────────────────────────────────────────────────

function AddressBlock({
  label,
  name,
  address,
  emoji,
}: {
  label: string;
  name: string;
  address: string;
  emoji: string;
}) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <div className="flex items-start gap-2">
        <span className="text-lg leading-none mt-0.5">{emoji}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{name}</p>
          <p className="text-sm text-gray-600 break-words">{address}</p>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-green-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
          >
            Open in Google Maps ↗
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

function DeliveryContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [assignment, setAssignment] = useState<ActiveAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  const load = useCallback(async () => {
    try {
      // Load active assignment and find the one matching our id
      const data = await api.get<ActiveAssignment | null>("/rider/assignments/active");
      if (data && data.id === id) {
        setAssignment(data);
      } else {
        // Maybe it's already delivered — try to show a delivered state
        setAssignment(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load delivery.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleStatusUpdate() {
    if (!assignment) return;
    const nextStatus = NEXT_STATUS[assignment.status];
    if (!nextStatus) return;

    setUpdating(true);
    setUpdateError("");
    try {
      const updated = await api.patch<{ status: DeliveryStatus }>(
        `/rider/assignments/${assignment.id}/status`,
        { status: nextStatus }
      );
      setAssignment((prev) =>
        prev ? { ...prev, status: updated.status } : prev
      );
      // If delivered, redirect to dashboard after a short delay
      if (updated.status === "DELIVERED") {
        setTimeout(() => router.push("/rider/dashboard"), 2000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status.";
      setUpdateError(msg);
    } finally {
      setUpdating(false);
    }
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <RiderHeader />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </main>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <RiderHeader />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm">
            {error}
          </div>
        </main>
      </div>
    );
  }

  // ── Not found / already completed ──
  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <RiderHeader />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <div className="text-center py-20">
            <p className="text-5xl mb-3">✅</p>
            <p className="text-lg font-semibold text-gray-700">Delivery complete</p>
            <p className="text-sm text-gray-500 mt-1 mb-6">This order has been delivered.</p>
            <Button onClick={() => router.push("/rider/dashboard")} className="mx-auto">
              Back to dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const { order, status } = assignment;
  const nextStatus = NEXT_STATUS[status];
  const isDelivered = status === "DELIVERED";

  return (
    <div className="min-h-screen bg-gray-50">
      <RiderHeader />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        {/* Page title */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Active delivery</h1>
          <Badge color={STATUS_COLOR[status]} size="md">
            {STATUS_LABEL[status]}
          </Badge>
        </div>

        {/* Progress stepper */}
        <Card className="p-5">
          <StatusStepper status={status} />
        </Card>

        {/* Route: restaurant → customer */}
        <Card className="p-5 space-y-4">
          <AddressBlock
            label="Pick up from"
            name={order.restaurant.name}
            address={order.restaurant.address}
            emoji="🏪"
          />
          <div className="border-t border-gray-100" />
          <AddressBlock
            label="Deliver to"
            name={order.customer.name}
            address={order.deliveryAddress}
            emoji="📍"
          />
        </Card>

        {/* Customer contact */}
        <Card className="p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Customer
          </p>
          <p className="text-sm font-semibold text-gray-900">{order.customer.name}</p>
          {order.customer.phone ? (
            <a
              href={`tel:${order.customer.phone}`}
              className="inline-flex items-center gap-1.5 mt-1 text-sm text-green-600 font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
              aria-label={`Call ${order.customer.name}`}
            >
              📞 {order.customer.phone}
            </a>
          ) : (
            <p className="text-sm text-gray-400 mt-1">No phone number</p>
          )}
        </Card>

        {/* Order items */}
        <Card className="p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Order summary
          </p>
          <ul className="space-y-2" aria-label="Order items">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between text-sm text-gray-700">
                <span>
                  {item.menuItem.name}
                  {item.quantity > 1 && (
                    <span className="text-gray-400 ml-1">×{item.quantity}</span>
                  )}
                </span>
                <span className="font-semibold text-gray-900">
                  ₹{(item.priceSnapshot * item.quantity).toFixed(0)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm font-bold text-gray-900">
            <span>Total</span>
            <span>₹{order.totalPrice.toFixed(0)}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">
            {Math.round(order.totalCalories)} kcal
          </p>
        </Card>

        {/* Status action */}
        {!isDelivered && nextStatus && (
          <div>
            {updateError && (
              <p role="alert" className="text-sm text-red-600 mb-2 text-center">
                {updateError}
              </p>
            )}
            <Button
              onClick={handleStatusUpdate}
              disabled={updating}
              className="w-full text-base py-4"
            >
              {updating ? "Updating…" : NEXT_STATUS_LABEL[status]}
            </Button>
          </div>
        )}

        {/* Delivered confirmation */}
        {isDelivered && (
          <Card className="p-6 text-center bg-green-50 border-green-200">
            <p className="text-3xl mb-2">🎉</p>
            <p className="text-base font-bold text-green-700">Order delivered successfully</p>
            <p className="text-sm text-gray-500 mt-1 mb-4">Redirecting to dashboard…</p>
            <Button onClick={() => router.push("/rider/dashboard")} className="mx-auto text-sm">
              Back to dashboard
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}

export default function RiderDeliveryPage() {
  return (
    <ProtectedRoute allowedRoles={["RIDER"]}>
      <DeliveryContent />
    </ProtectedRoute>
  );
}
