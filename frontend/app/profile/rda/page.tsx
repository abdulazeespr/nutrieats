"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";

interface RdaValues {
  bmr: number;
  rdaCalories: number;
  rdaProtein: number;
  rdaCarbs: number;
  rdaFat: number;
  rdaFiber: number;
}

interface NutrientField {
  key: keyof Omit<RdaValues, "bmr">;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}

const FIELDS: NutrientField[] = [
  { key: "rdaCalories", label: "Daily Calories", unit: "kcal", min: 800, max: 5000, step: 50 },
  { key: "rdaProtein", label: "Protein", unit: "g", min: 10, max: 300, step: 1 },
  { key: "rdaCarbs", label: "Carbohydrates", unit: "g", min: 20, max: 600, step: 5 },
  { key: "rdaFat", label: "Fat", unit: "g", min: 10, max: 200, step: 1 },
  { key: "rdaFiber", label: "Fiber", unit: "g", min: 5, max: 80, step: 1 },
];

function RdaForm() {
  const [values, setValues] = useState<Omit<RdaValues, "bmr">>({
    rdaCalories: 2000,
    rdaProtein: 50,
    rdaCarbs: 250,
    rdaFat: 65,
    rdaFiber: 25,
  });
  const [bmr, setBmr] = useState<number | null>(null);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .get<RdaValues>("/users/rda")
      .then((data) => {
        setBmr(data.bmr);
        setValues({
          rdaCalories: data.rdaCalories,
          rdaProtein: data.rdaProtein,
          rdaCarbs: data.rdaCarbs,
          rdaFat: data.rdaFat,
          rdaFiber: data.rdaFiber,
        });
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  function handleChange(key: keyof Omit<RdaValues, "bmr">, val: string) {
    setValues((prev) => ({ ...prev, [key]: Number(val) }));
    setSaved(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApiError("");
    setSaved(false);
    setLoading(true);

    try {
      const updated = await api.put<RdaValues>("/users/rda", values);
      setValues({
        rdaCalories: updated.rdaCalories,
        rdaProtein: updated.rdaProtein,
        rdaCarbs: updated.rdaCarbs,
        rdaFat: updated.rdaFat,
        rdaFiber: updated.rdaFiber,
      });
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
            <h1 className="text-2xl font-bold text-gray-900">Custom Targets</h1>
            <p className="text-sm text-gray-500">Override your auto-calculated daily goals</p>
          </div>
        </div>

        {bmr !== null && (
          <Card className="p-4 mb-4 bg-green-50 border border-green-200">
            <p className="text-sm text-gray-700">
              Your <span className="font-semibold text-green-700">BMR is {Math.round(bmr)} kcal/day</span>.
              The values below can be customised. Reset by updating your body stats.
            </p>
          </Card>
        )}

        <Card className="p-6">
          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-6">
              {FIELDS.map(({ key, label, unit, min, max, step }) => (
                <div key={key}>
                  <div className="flex justify-between mb-2">
                    <label htmlFor={key} className="text-sm font-medium text-gray-700">
                      {label}
                    </label>
                    <span className="text-sm font-semibold text-green-700">
                      {values[key]} {unit}
                    </span>
                  </div>
                  <input
                    id={key}
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={values[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    disabled={loading}
                    className="w-full accent-green-500"
                    aria-label={`${label} target: ${values[key]} ${unit}`}
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                    <span>{min} {unit}</span>
                    <span>{max} {unit}</span>
                  </div>
                  {/* Also allow direct number input */}
                  <input
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    value={values[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    disabled={loading}
                    aria-label={`${label} exact value`}
                    className="mt-2 w-28 rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              ))}
            </div>

            {apiError && (
              <p role="alert" className="mt-5 text-sm text-red-600 text-center">{apiError}</p>
            )}
            {saved && (
              <p role="status" className="mt-5 text-sm text-green-600 text-center font-medium">
                Targets saved successfully.
              </p>
            )}

            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? "Saving…" : "Save Targets"}
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-4">
          To reset to auto-calculated values,{" "}
          <Link href="/profile/settings" className="text-green-600 underline">
            re-save your body stats
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

export default function RdaPage() {
  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <RdaForm />
    </ProtectedRoute>
  );
}
