"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingOrderItem {
  menuItem: { name: string };
  quantity: number;
}

interface PendingOrder {
  id: string;
  deliveryAddress: string;
  totalPrice: number;
  totalCalories: number;
  createdAt: string;
  restaurant: { name: string; address: string };
  items: PendingOrderItem[];
}

interface ActiveAssignment {
  id: string;
  status: "ASSIGNED" | "PICKED_UP" | "ON_THE_WAY" | "DELIVERED";
  order: {
    id: string;
    deliveryAddress: string;
    restaurant: { name: string; address: string };
    customer: { name: string; phone?: string };
    items: PendingOrderItem[];
    totalPrice: number;
  };
}

// ─── Header (exported for reuse) ─────────────────────────────────────────────

export function RiderHeader() {
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        <Link href="/rider/dashboard" className="text-xl font-bold text-green-600">
          NutriEats{" "}
          <span className="text-xs font-normal text-gray-400 ml-1">Rider</span>
        </Link>
        <Button
          variant="secondary"
          onClick={() => {
            logout();
            router.push("/rider/login");
          }}
          className="text-sm px-4 py-2"
        >
          Log out
        </Button>
      </div>
    </header>
  );
}

// ─── Accept button ────────────────────────────────────────────────────────────

function AcceptButton({
  orderId,
  onAccepted,
}: {
  orderId: string;
  onAccepted: (assignmentId: string) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAccept() {
    setLoading(true);
    setError("");
    try {
      const assignment = await api.post<{ id: string }>(
        `/rider/assignments/${orderId}/accept`,
        {}
      );
      onAccepted(assignment.id);
      router.push(`/rider/delivery/${assignment.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to accept order.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error && (
        <p role="alert" className="text-xs text-red-600 mb-2">
          {error}
        </p>
      )}
      <Button onClick={handleAccept} disabled={loading} className="w-full text-sm py-2.5">
        {loading ? "Accepting…" : "Accept delivery"}
      </Button>
    </div>
  );
}

// ─── Pending order card ───────────────────────────────────────────────────────

function PendingOrderCard({
  order,
  onAccepted,
}: {
  order: PendingOrder;
  onAccepted: (assignmentId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const itemSummary = order.items
    .slice(0, 2)
    .map((i) => `${i.menuItem.name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`)
    .join(", ");
  const extraCount = order.items.length > 2 ? ` +${order.items.length - 2} more` : "";

  return (
    <Card className="overflow-hidden">
      {/* Summary row */}
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              🏪 {order.restaurant.name}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{order.restaurant.address}</p>
          </div>
          <span className="text-sm font-extrabold text-green-700 shrink-0">
            ₹{order.totalPrice.toFixed(0)}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-500">📍</span>
          <p className="text-xs text-gray-700 truncate">{order.deliveryAddress}</p>
        </div>

        <p className="text-xs text-gray-500 mb-4 truncate">
          {itemSummary}
          {extraCount}
        </p>

        {/* Expand / collapse items */}
        {order.items.length > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="text-xs text-green-600 font-medium hover:underline mb-4 focus:outline-none"
          >
            {expanded ? "Hide items ▲" : `Show all ${order.items.length} items ▼`}
          </button>
        )}

        {expanded && (
          <ul className="space-y-1 mb-4 bg-gray-50 rounded-xl p-3">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between text-xs text-gray-700">
                <span>{item.menuItem.name}</span>
                {item.quantity > 1 && (
                  <span className="text-gray-400">×{item.quantity}</span>
                )}
              </li>
            ))}
          </ul>
        )}

        <AcceptButton orderId={order.id} onAccepted={onAccepted} />
      </div>
    </Card>
  );
}

// ─── Active delivery banner ───────────────────────────────────────────────────

function ActiveDeliveryBanner({ assignment }: { assignment: ActiveAssignment }) {
  const statusLabel: Record<string, string> = {
    ASSIGNED: "Assigned",
    PICKED_UP: "Picked up",
    ON_THE_WAY: "On the way",
    DELIVERED: "Delivered",
  };

  const statusColor: Record<string, "green" | "orange" | "blue" | "gray"> = {
    ASSIGNED: "blue",
    PICKED_UP: "orange",
    ON_THE_WAY: "orange",
    DELIVERED: "green",
  };

  return (
    <Link href={`/rider/delivery/${assignment.id}`}>
      <Card className="p-4 mb-6 border-2 border-green-300 bg-green-50 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
              Active delivery
            </p>
            <p className="text-sm font-bold text-gray-900 truncate">
              {assignment.order.restaurant.name} → {assignment.order.customer.name}
            </p>
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {assignment.order.deliveryAddress}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge color={statusColor[assignment.status] ?? "gray"} size="sm">
              {statusLabel[assignment.status] ?? assignment.status}
            </Badge>
            <span className="text-xs text-green-600 font-semibold">Tap to open →</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

function DashboardContent() {
  const [pending, setPending] = useState<PendingOrder[]>([]);
  const [active, setActive] = useState<ActiveAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [pendingData, activeData] = await Promise.all([
        api.get<PendingOrder[]>("/rider/assignments/pending"),
        api.get<ActiveAssignment | null>("/rider/assignments/active"),
      ]);
      setPending(pendingData);
      setActive(activeData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load assignments.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Poll every 30 seconds for new assignments
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div className="min-h-screen bg-gray-50">
      <RiderHeader />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Available deliveries</h1>
          <button
            onClick={() => { setLoading(true); load(); }}
            aria-label="Refresh"
            className="text-sm text-green-600 font-medium hover:underline focus:outline-none"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Active delivery banner */}
        {active && <ActiveDeliveryBanner assignment={active} />}

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-4" aria-busy="true" aria-label="Loading assignments">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && pending.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-3">📭</p>
            <p className="text-lg font-semibold text-gray-600">No deliveries available</p>
            <p className="text-sm mt-1">New orders will appear here automatically.</p>
          </div>
        )}

        {/* Pending orders list */}
        {!loading && !error && pending.length > 0 && (
          <div className="space-y-4" role="list" aria-label="Available deliveries">
            {pending.map((order) => (
              <div key={order.id} role="listitem">
                <PendingOrderCard
                  order={order}
                  onAccepted={() => load()}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function RiderDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["RIDER"]}>
      <DashboardContent />
    </ProtectedRoute>
  );
}
