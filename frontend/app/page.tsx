"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import HazardBox from "@/components/home/HazardBox";
import DealCard from "@/components/home/DealCard";
import FlashOfferStrip from "@/components/home/FlashOfferStrip";

interface DealItem {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  discount: number;
  calories: number;
  healthScore: number;
  isHealthy: boolean;
  restaurant: {
    id: string;
    name: string;
    address: string;
  };
}

interface FlashOfferItem {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  discount: number;
  flashDealUntil: string;
  restaurant: {
    id: string;
    name: string;
  };
}

interface DailyLog {
  lowAlerts: string[];
}

type CategoryFilter = "all" | "healthy" | "indulgent";

export default function HomePage() {
  const { user, logout } = useAuth();
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [flashOffers, setFlashOffers] = useState<FlashOfferItem[]>([]);
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CategoryFilter>("all");

  useEffect(() => {
    async function fetchData() {
      try {
        const [dealsData, flashData] = await Promise.all([
          api.get<DealItem[]>("/deals"),
          api.get<FlashOfferItem[]>("/offers/flash").catch(() => []),
        ]);

        setDeals(dealsData);
        setFlashOffers(flashData);

        // Only fetch daily log if user is logged in
        if (user) {
          const log = await api.get<DailyLog>("/users/daily-log").catch(() => null);
          setDailyLog(log);
        }
      } catch (error) {
        console.error("Failed to fetch home data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  const filteredDeals = deals.filter((deal) => {
    if (filter === "healthy") return deal.isHealthy;
    if (filter === "indulgent") return !deal.isHealthy;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold text-green-600 cursor-pointer">
              NutriEats
            </h1>
          </Link>

          <nav className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/restaurants">
                  <Button variant="secondary">Browse</Button>
                </Link>
                <Link href="/profile/health">
                  <Button variant="secondary">Profile</Button>
                </Link>
                <Link href="/orders">
                  <Button variant="secondary">Orders</Button>
                </Link>
                <Button variant="secondary" onClick={logout}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="secondary">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button>Sign up</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* RDA Hazard Box (20%) — only shown if logged in and has alerts */}
        {user && dailyLog && dailyLog.lowAlerts.length > 0 && (
          <section>
            <HazardBox lowAlerts={dailyLog.lowAlerts} />
          </section>
        )}

        {/* Flash Offers Strip (10%) */}
        {flashOffers.length > 0 && (
          <section>
            <FlashOfferStrip offers={flashOffers} />
          </section>
        )}

        {/* Best Deals Section (70%) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">🔥 Best Deals</h2>

            {/* Category Quick Filters */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  filter === "all"
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-green-600"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("healthy")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  filter === "healthy"
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-green-600"
                }`}
              >
                Healthy
              </button>
              <button
                onClick={() => setFilter("indulgent")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  filter === "indulgent"
                    ? "bg-orange-600 text-white"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-orange-600"
                }`}
              >
                Indulgent
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading deals...</div>
          ) : filteredDeals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No deals available right now.</p>
              <Link href="/restaurants">
                <Button>Browse Restaurants</Button>
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDeals.map((deal) => (
                <DealCard key={deal.id} {...deal} />
              ))}
            </div>
          )}
        </section>

        {/* If not logged in, show marketing section */}
        {!user && (
          <section className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-8 text-center space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">
              Track Your Health, Order What You Love
            </h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Sign up to set your personal RDA targets, track nutrients in real time,
              and get smart alerts when you're low on essential nutrients.
            </p>
            <Link href="/register">
              <Button className="text-lg px-8 py-4">Get Started Free</Button>
            </Link>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-center text-gray-500 text-sm">
          <p>
            &copy; {new Date().getFullYear()} NutriEats. Built with Next.js,
            Express, Prisma, and PostgreSQL.
          </p>
          <p className="mt-2">
            <Link
              href="/merchant/login"
              className="text-green-600 hover:underline"
            >
              Merchant Login
            </Link>
            {" • "}
            <Link href="/rider/login" className="text-green-600 hover:underline">
              Rider Login
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
