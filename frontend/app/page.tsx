"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Button from "@/components/ui/Button";
import HazardBox from "@/components/home/HazardBox";
import DealCard from "@/components/home/DealCard";
import FlashOfferStrip from "@/components/home/FlashOfferStrip";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonDealCard } from "@/components/ui/Skeleton";

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dealsData, flashData] = await Promise.all([
          api.get<DealItem[]>("/deals"),
          api.get<FlashOfferItem[]>("/offers/flash").catch(() => []),
        ]);

        setDeals(dealsData);
        setFlashOffers(flashData);

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
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-green-600 shrink-0">
            NutriEats
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-3" aria-label="Main navigation">
            {user ? (
              <>
                <Link href="/restaurants">
                  <Button variant="secondary" className="text-sm px-4 py-2">Browse</Button>
                </Link>
                <Link href="/profile/health">
                  <Button variant="secondary" className="text-sm px-4 py-2">Profile</Button>
                </Link>
                <Link href="/orders">
                  <Button variant="secondary" className="text-sm px-4 py-2">Orders</Button>
                </Link>
                <Button variant="secondary" onClick={logout} className="text-sm px-4 py-2">
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="secondary" className="text-sm px-4 py-2">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button className="text-sm px-4 py-2">Sign up</Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            aria-label="Open menu"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            {mobileNavOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>

        {/* Mobile nav drawer */}
        {mobileNavOpen && (
          <nav
            className="sm:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-3"
            aria-label="Mobile navigation"
          >
            {user ? (
              <>
                <Link href="/restaurants" onClick={() => setMobileNavOpen(false)}>
                  <Button variant="secondary" className="w-full text-sm">Browse restaurants</Button>
                </Link>
                <Link href="/profile/health" onClick={() => setMobileNavOpen(false)}>
                  <Button variant="secondary" className="w-full text-sm">My Profile</Button>
                </Link>
                <Link href="/orders" onClick={() => setMobileNavOpen(false)}>
                  <Button variant="secondary" className="w-full text-sm">My Orders</Button>
                </Link>
                <Button
                  variant="secondary"
                  className="w-full text-sm"
                  onClick={() => { logout(); setMobileNavOpen(false); }}
                >
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileNavOpen(false)}>
                  <Button variant="secondary" className="w-full text-sm">Log in</Button>
                </Link>
                <Link href="/register" onClick={() => setMobileNavOpen(false)}>
                  <Button className="w-full text-sm">Sign up</Button>
                </Link>
              </>
            )}
          </nav>
        )}
      </header>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">

        {/* RDA Hazard Box — only when logged in and there are alerts */}
        {user && dailyLog && dailyLog.lowAlerts.length > 0 && (
          <section aria-label="Nutritional alerts">
            <HazardBox lowAlerts={dailyLog.lowAlerts} />
          </section>
        )}

        {/* Flash Offers Strip */}
        {!loading && flashOffers.length > 0 && (
          <section aria-label="Flash offers">
            <FlashOfferStrip offers={flashOffers} />
          </section>
        )}

        {/* Best Deals Section */}
        <section className="space-y-4" aria-label="Best deals">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-2xl font-bold text-gray-900">🔥 Best Deals</h2>

            {/* Category Quick Filters */}
            <div
              role="group"
              aria-label="Filter deals"
              className="flex gap-2 overflow-x-auto pb-1"
            >
              {(["all", "healthy", "indulgent"] as CategoryFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  aria-pressed={filter === f}
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500
                    ${filter === f
                      ? f === "indulgent"
                        ? "bg-orange-500 text-white"
                        : "bg-green-600 text-white"
                      : f === "indulgent"
                        ? "bg-white text-gray-700 border border-gray-200 hover:border-orange-400"
                        : "bg-white text-gray-700 border border-gray-200 hover:border-green-500"
                    }`}
                >
                  {f === "all" ? "All" : f === "healthy" ? "🥗 Healthy" : "🍔 Indulgent"}
                </button>
              ))}
            </div>
          </div>

          {/* Loading skeletons */}
          {loading && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonDealCard key={i} />
              ))}
            </div>
          )}

          {/* No deals */}
          {!loading && filteredDeals.length === 0 && (
            <EmptyState
              emoji="🏷️"
              heading="No deals right now"
              subtext={
                filter !== "all"
                  ? `No ${filter} deals available. Try a different filter.`
                  : "Check back soon — new deals drop daily!"
              }
              action={
                <Link
                  href="/restaurants"
                  className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                >
                  Browse all restaurants
                </Link>
              }
            />
          )}

          {/* Deal cards grid */}
          {!loading && filteredDeals.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDeals.map((deal) => (
                <DealCard key={deal.id} {...deal} />
              ))}
            </div>
          )}
        </section>

        {/* Marketing section for guests */}
        {!user && (
          <section className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-6 sm:p-8 text-center space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Track Your Health, Order What You Love
            </h2>
            <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto">
              Sign up to set personal RDA targets, track nutrients in real time,
              and get smart alerts when you&apos;re low on essential nutrients.
            </p>
            <Link href="/register">
              <Button className="text-base sm:text-lg px-8 py-3 sm:py-4">Get Started Free</Button>
            </Link>
          </section>
        )}
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-center text-gray-500 text-sm">
          <p>
            &copy; {new Date().getFullYear()} NutriEats. Built with Next.js,
            Express, Prisma, and PostgreSQL.
          </p>
          <p className="mt-2">
            <Link href="/merchant/login" className="text-green-600 hover:underline">
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
