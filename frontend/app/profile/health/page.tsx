"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import Badge from "@/components/ui/Badge";
import { api } from "@/lib/api";

interface DailyLogResponse {
  consumed: {
    caloriesConsumed: number;
    proteinConsumed: number;
    carbsConsumed: number;
    fatConsumed: number;
    fiberConsumed: number;
  };
  rda: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  lowAlerts: string[];
}

interface RdaResponse {
  bmr: number;
  rdaCalories: number;
  rdaProtein: number;
  rdaCarbs: number;
  rdaFat: number;
  rdaFiber: number;
}

const SUGGESTIONS: Record<string, string> = {
  calories: "Try adding a wholesome meal — your energy intake is running low today.",
  protein: "Consider a protein-rich item like grilled chicken, eggs, or legumes.",
  carbs: "Your carb intake is low — a whole-grain wrap or rice bowl would help.",
  fat: "Add some healthy fats — avocado, nuts, or olive oil work well.",
  fiber: "Boost your fiber with a salad, fruit, or a whole-grain option.",
};

const NUTRIENT_LABELS: Record<string, string> = {
  calories: "Calories",
  protein: "Protein",
  carbs: "Carbs",
  fat: "Fat",
  fiber: "Fiber",
};

function pct(consumed: number, rda: number) {
  return rda > 0 ? Math.round((consumed / rda) * 100) : 0;
}

function statusBadge(p: number) {
  if (p >= 70) return { label: "On Track", color: "green" as const };
  if (p >= 40) return { label: "Low", color: "orange" as const };
  return { label: "Critical", color: "red" as const };
}

function HealthDashboard() {
  const [log, setLog] = useState<DailyLogResponse | null>(null);
  const [rda, setRda] = useState<RdaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<DailyLogResponse>("/users/daily-log"),
      api.get<RdaResponse>("/users/rda"),
    ])
      .then(([logData, rdaData]) => {
        setLog(logData);
        setRda(rdaData);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load data");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm animate-pulse">Loading your nutrition data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="p-6 max-w-sm w-full text-center">
          <p className="text-red-600 text-sm mb-4">{error}</p>
          {error.includes("Body stats") && (
            <Link
              href="/onboarding/body-stats"
              className="text-green-600 text-sm font-medium underline"
            >
              Set up your body stats
            </Link>
          )}
        </Card>
      </div>
    );
  }

  if (!log || !rda) return null;

  const { consumed } = log;
  const nutrients = [
    { key: "calories", consumed: consumed.caloriesConsumed, rda: log.rda.calories, unit: "kcal" },
    { key: "protein", consumed: consumed.proteinConsumed, rda: log.rda.protein, unit: "g" },
    { key: "carbs", consumed: consumed.carbsConsumed, rda: log.rda.carbs, unit: "g" },
    { key: "fat", consumed: consumed.fatConsumed, rda: log.rda.fat, unit: "g" },
    { key: "fiber", consumed: consumed.fiberConsumed, rda: log.rda.fiber, unit: "g" },
  ];

  const hasAlerts = log.lowAlerts.length > 0;

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nutrient Status</h1>
            <p className="text-sm text-gray-500 mt-0.5">Today&apos;s intake vs your daily targets</p>
          </div>
          <Link href="/profile/settings" className="text-sm text-green-600 font-medium hover:underline">
            Edit stats
          </Link>
        </div>

        {/* BMR Summary Card */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Your Baseline
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Basal Metabolic Rate</p>
              <p className="text-xl font-bold text-gray-900">{Math.round(rda.bmr)} <span className="text-sm font-normal text-gray-500">kcal/day</span></p>
              <p className="text-xs text-gray-400 mt-0.5">Energy your body burns at rest</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Daily Calorie Target</p>
              <p className="text-xl font-bold text-green-600">{rda.rdaCalories} <span className="text-sm font-normal text-gray-500">kcal/day</span></p>
              <p className="text-xs text-gray-400 mt-0.5">Adjusted for your activity level</p>
            </div>
          </div>
        </Card>

        {/* Low Alerts */}
        {hasAlerts && (
          <Card className="p-5 border border-orange-200 bg-orange-50">
            <h2 className="text-sm font-semibold text-orange-800 mb-3">⚠ Nutrients Running Low</h2>
            <ul className="space-y-2">
              {log.lowAlerts.map((key) => (
                <li key={key} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-orange-500 font-bold shrink-0">•</span>
                  <span>
                    <span className="font-medium">{NUTRIENT_LABELS[key] ?? key}:</span>{" "}
                    {SUGGESTIONS[key] ?? "Consider adding more of this nutrient today."}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-400 mt-3">
              Adjust alert thresholds in{" "}
              <Link href="/profile/notifications" className="text-green-600 underline">
                notification settings
              </Link>
              .
            </p>
          </Card>
        )}

        {/* Nutrient Progress */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Today&apos;s Breakdown
            </h2>
            <Link href="/profile/rda" className="text-xs text-green-600 font-medium hover:underline">
              Customise targets
            </Link>
          </div>
          <div className="space-y-5">
            {nutrients.map(({ key, consumed: c, rda: target, unit }) => {
              const p = pct(c, target);
              const { label, color } = statusBadge(p);
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{NUTRIENT_LABELS[key]}</span>
                    <Badge color={color} size="sm">{label}</Badge>
                  </div>
                  <ProgressBar value={c} max={target} label={NUTRIENT_LABELS[key]} unit={unit} />
                  <p className="text-xs text-gray-400 mt-1">{p}% of daily target</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Quick Links */}
        <nav aria-label="Health settings">
          <ul className="grid grid-cols-2 gap-3">
            {[
              { href: "/profile/settings", label: "Body Stats", desc: "Update weight, age & activity" },
              { href: "/profile/rda", label: "Custom Targets", desc: "Override daily nutrient goals" },
              { href: "/profile/allergies", label: "Allergen Manager", desc: "Manage your allergy alerts" },
              { href: "/profile/notifications", label: "Notifications", desc: "Choose which alerts you see" },
            ].map(({ href, label, desc }) => (
              <li key={href}>
                <Link href={href}>
                  <Card className="p-4 hover:border-green-300 transition-colors cursor-pointer h-full">
                    <p className="text-sm font-semibold text-gray-800">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  );
}

export default function HealthPage() {
  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <HealthDashboard />
    </ProtectedRoute>
  );
}
