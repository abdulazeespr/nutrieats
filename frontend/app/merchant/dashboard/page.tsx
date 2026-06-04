"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

interface Restaurant {
  id: string;
  name: string;
  address: string;
  cuisineTags: string[];
  healthScore: number;
  isOpen: boolean;
}

interface DashboardStats {
  activeItems: number;
  todayOrderCount: number;
  todayRevenue: number;
}

interface DashboardResponse {
  restaurant: Restaurant;
  stats: DashboardStats;
}

interface OrderItem {
  menuItem: { name: string };
  quantity: number;
}

interface RecentOrder {
  id: string;
  status: string;
  totalPrice: number;
  totalCalories: number;
  createdAt: string;
  customer: { name: string; phone?: string };
  items: OrderItem[];
}

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

function DashboardContent() {
  const { logout } = useAuth();
  const router = useRouter();

  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [dash, orderList] = await Promise.all([
          api.get<DashboardResponse>("/merchant/dashboard"),
          api.get<RecentOrder[]>("/merchant/orders"),
        ]);
        setDashboard(dash);
        setOrders(orderList.slice(0, 5));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load dashboard.";
        // If no restaurant yet, redirect to settings to create one
        if (msg.toLowerCase().includes("restaurant not found")) {
          router.replace("/merchant/settings");
          return;
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MerchantHeader />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MerchantHeader />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm">
            {error}
          </div>
        </main>
      </div>
    );
  }

  const stats = dashboard!.stats;
  const restaurant = dashboard!.restaurant;

  return (
    <div className="min-h-screen bg-gray-50">
      <MerchantHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Store header */}
        <div className="flex items-start justify-between flex-wrap gap-3 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{restaurant.address}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {restaurant.cuisineTags.map((tag) => (
                <Badge key={tag} color="gray" size="sm">{tag}</Badge>
              ))}
              <Badge color={restaurant.isOpen ? "green" : "red"} size="sm">
                {restaurant.isOpen ? "Open" : "Closed"}
              </Badge>
            </div>
          </div>
          <Link href="/merchant/settings">
            <Button variant="secondary" className="text-sm px-4 py-2">Store settings</Button>
          </Link>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            emoji="🍽️"
            label="Active menu items"
            value={stats.activeItems.toString()}
          />
          <StatCard
            emoji="📋"
            label="Orders today"
            value={stats.todayOrderCount.toString()}
          />
          <StatCard
            emoji="💰"
            label="Revenue today"
            value={`₹${stats.todayRevenue.toFixed(0)}`}
            valueColor="text-green-700"
          />
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Link href="/merchant/items/new">
            <Button className="text-sm">+ Add menu item</Button>
          </Link>
          <Link href="/merchant/items">
            <Button variant="secondary" className="text-sm">Manage items</Button>
          </Link>
          <Link href="/merchant/orders">
            <Button variant="secondary" className="text-sm">View all orders</Button>
          </Link>
        </div>

        {/* Recent orders */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Recent orders</h2>
            <Link href="/merchant/orders" className="text-sm text-green-600 hover:underline font-medium">
              View all
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm font-medium">No orders yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50" aria-label="Recent orders">
              {orders.map((order) => {
                const summary = order.items
                  .slice(0, 2)
                  .map((i) => `${i.menuItem.name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`)
                  .join(", ");
                const extra = order.items.length > 2 ? ` +${order.items.length - 2} more` : "";
                return (
                  <li key={order.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{order.customer.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{summary}{extra}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge color={STATUS_COLOR[order.status] ?? "gray"} size="sm">
                        {STATUS_LABELS[order.status] ?? order.status}
                      </Badge>
                      <span className="text-xs font-semibold text-gray-700">₹{order.totalPrice.toFixed(0)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </main>
    </div>
  );
}

function StatCard({
  emoji,
  label,
  value,
  valueColor = "text-gray-900",
}: {
  emoji: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <Card className="p-5">
      <p className="text-2xl mb-2">{emoji}</p>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-extrabold mt-1 ${valueColor}`}>{value}</p>
    </Card>
  );
}

export function MerchantHeader() {
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        <Link href="/merchant/dashboard" className="text-xl font-bold text-green-600">
          NutriEats <span className="text-xs font-normal text-gray-400 ml-1">Merchant</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-4 text-sm font-medium text-gray-600">
          <Link href="/merchant/dashboard" className="hover:text-green-600 transition-colors">Dashboard</Link>
          <Link href="/merchant/items" className="hover:text-green-600 transition-colors">Items</Link>
          <Link href="/merchant/orders" className="hover:text-green-600 transition-colors">Orders</Link>
          <Link href="/merchant/settings" className="hover:text-green-600 transition-colors">Settings</Link>
        </nav>
        <Button
          variant="secondary"
          onClick={() => { logout(); router.push("/merchant/login"); }}
          className="text-sm px-4 py-2"
        >
          Log out
        </Button>
      </div>
    </header>
  );
}

export default function MerchantDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["MERCHANT"]}>
      <DashboardContent />
    </ProtectedRoute>
  );
}
