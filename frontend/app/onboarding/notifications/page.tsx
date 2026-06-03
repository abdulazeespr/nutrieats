"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { api } from "@/lib/api";

interface NotifPrefs {
  lowCaloriesAlert: boolean;
  lowProteinAlert: boolean;
  lowCarbsAlert: boolean;
  lowFatAlert: boolean;
  lowFiberAlert: boolean;
}

interface NutrientToggleRow {
  key: keyof NotifPrefs;
  label: string;
  description: string;
}

const NUTRIENT_ROWS: NutrientToggleRow[] = [
  {
    key: "lowCaloriesAlert",
    label: "Calories",
    description: "Alert when daily calories are low",
  },
  {
    key: "lowProteinAlert",
    label: "Protein",
    description: "Alert when daily protein is low",
  },
  {
    key: "lowCarbsAlert",
    label: "Carbs",
    description: "Alert when daily carbs are low",
  },
  {
    key: "lowFatAlert",
    label: "Fat",
    description: "Alert when daily fat is low",
  },
  {
    key: "lowFiberAlert",
    label: "Fiber",
    description: "Alert when daily fiber is low",
  },
];

const DEFAULT_PREFS: NotifPrefs = {
  lowCaloriesAlert: true,
  lowProteinAlert: true,
  lowCarbsAlert: true,
  lowFatAlert: false,
  lowFiberAlert: true,
};

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
  nutrient: string;
}

function ToggleSwitch({ checked, onChange, disabled, label, nutrient }: ToggleSwitchProps) {
  function handleClick() {
    if (!disabled) onChange(!checked);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!disabled) onChange(!checked);
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`${label} — ${nutrient}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-green-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function NotificationsForm() {
  const router = useRouter();

  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleToggle(key: keyof NotifPrefs, value: boolean) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setApiError("");
    setLoading(true);

    try {
      await api.put("/users/notifications", prefs);
      router.push("/restaurants");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save. Please try again.";
      setApiError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    router.push("/restaurants");
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="w-full max-w-xl mx-auto">
        {/* Brand */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-green-600">NutriEats</h1>
        </div>

        {/* Step indicator */}
        <p className="text-center text-sm text-gray-500 mb-2 font-medium">
          Step 3 of 3
        </p>
        {/* Progress track */}
        <div
          className="w-full bg-gray-200 rounded-full h-2 mb-8"
          role="progressbar"
          aria-valuenow={3}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-label="Onboarding progress: step 3 of 3"
        >
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: "100%" }}
          />
        </div>

        <Card className="p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Nutrition alerts
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            We&apos;ll notify you when your daily intake for these nutrients is
            running low. You can change these anytime in your profile.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* Toggle list */}
            <div className="divide-y divide-gray-100 mb-6">
              {NUTRIENT_ROWS.map(({ key, label, description }) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 mr-4">
                    <p className="text-sm font-medium text-gray-900">
                      {label}
                    </p>
                    <p className="text-sm text-gray-500">
                      {label} &mdash; {description}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={prefs[key]}
                    onChange={(value) => handleToggle(key, value)}
                    disabled={loading}
                    label={label}
                    nutrient={description}
                  />
                </div>
              ))}
            </div>

            {/* API error */}
            {apiError && (
              <p role="alert" className="mb-4 text-sm text-red-600 text-center">
                {apiError}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleSkip}
                disabled={loading}
                className="flex-1"
              >
                Skip
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Saving…" : "Save & Finish"}
              </Button>
            </div>
          </form>
        </Card>
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
