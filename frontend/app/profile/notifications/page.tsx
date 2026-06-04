"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";

interface NotifPrefs {
  lowCaloriesAlert: boolean;
  lowProteinAlert: boolean;
  lowCarbsAlert: boolean;
  lowFatAlert: boolean;
  lowFiberAlert: boolean;
}

interface ProfileResponse {
  notifPrefs: NotifPrefs | null;
}

const TOGGLES: { key: keyof NotifPrefs; label: string; description: string }[] = [
  { key: "lowCaloriesAlert", label: "Low Calories", description: "Alert when daily calorie intake is below 40% of target" },
  { key: "lowProteinAlert", label: "Low Protein", description: "Alert when protein is low — common for recovery and satiety" },
  { key: "lowCarbsAlert", label: "Low Carbs", description: "Alert when carbohydrate intake is running low" },
  { key: "lowFatAlert", label: "Low Fat", description: "Alert for low fat intake (off by default)" },
  { key: "lowFiberAlert", label: "Low Fiber", description: "Alert when fiber intake is below target — key for gut health" },
];

function Toggle({
  checked,
  onChange,
  disabled,
  id,
}: {
  checked: boolean;
  onChange: () => void;
  disabled: boolean;
  id: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 ${
        checked ? "bg-green-500" : "bg-gray-300"
      } disabled:opacity-50`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function NotificationsForm() {
  const [prefs, setPrefs] = useState<NotifPrefs>({
    lowCaloriesAlert: true,
    lowProteinAlert: true,
    lowCarbsAlert: true,
    lowFatAlert: false,
    lowFiberAlert: true,
  });

  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .get<ProfileResponse>("/users/profile")
      .then(({ notifPrefs }) => {
        if (notifPrefs) setPrefs(notifPrefs);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  function toggle(key: keyof NotifPrefs) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  }

  async function handleSave() {
    setApiError("");
    setSaved(false);
    setLoading(true);

    try {
      await api.put("/users/notifications", prefs);
      setSaved(true);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm animate-pulse">Loading…</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/profile/health" className="text-gray-400 hover:text-gray-600 text-sm">
            ← Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500">Choose which low-nutrient alerts you receive</p>
          </div>
        </div>

        <Card className="p-6">
          <ul className="divide-y divide-gray-100" role="list">
            {TOGGLES.map(({ key, label, description }) => (
              <li key={key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div className="pr-4">
                  <label
                    htmlFor={`toggle-${key}`}
                    className="text-sm font-medium text-gray-800 cursor-pointer"
                  >
                    {label}
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                </div>
                <Toggle
                  id={`toggle-${key}`}
                  checked={prefs[key]}
                  onChange={() => toggle(key)}
                  disabled={loading}
                />
              </li>
            ))}
          </ul>

          {apiError && (
            <p role="alert" className="mt-5 text-sm text-red-600 text-center">{apiError}</p>
          )}
          {saved && (
            <p role="status" className="mt-5 text-sm text-green-600 text-center font-medium">
              Preferences saved.
            </p>
          )}

          <Button className="w-full mt-6" onClick={handleSave} disabled={loading}>
            {loading ? "Saving…" : "Save Preferences"}
          </Button>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-4">
          Alerts appear in the{" "}
          <Link href="/profile/health" className="text-green-600 underline">
            Nutrient Status
          </Link>{" "}
          dashboard when you&apos;re below 40% of your daily target.
        </p>
      </div>
    </main>
  );
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <NotificationsForm />
    </ProtectedRoute>
  );
}
