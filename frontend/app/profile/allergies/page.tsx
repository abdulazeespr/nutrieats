"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { api } from "@/lib/api";

const COMMON_ALLERGENS = [
  "Gluten",
  "Dairy",
  "Eggs",
  "Nuts",
  "Peanuts",
  "Shellfish",
  "Fish",
  "Soy",
  "Sesame",
  "Sulphites",
];

interface ProfileResponse {
  allergies: { allergenName: string }[];
}

function AllergiesManager() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [custom, setCustom] = useState("");
  const [customList, setCustomList] = useState<string[]>([]);

  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [saved, setSaved] = useState(false);

  // Load existing allergies
  useEffect(() => {
    api
      .get<ProfileResponse>("/users/profile")
      .then(({ allergies }) => {
        const common = new Set<string>();
        const customs: string[] = [];

        allergies.forEach(({ allergenName }) => {
          if (COMMON_ALLERGENS.includes(allergenName)) {
            common.add(allergenName);
          } else {
            customs.push(allergenName);
          }
        });

        setSelected(common);
        setCustomList(customs);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  function toggle(allergen: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(allergen)) next.delete(allergen);
      else next.add(allergen);
      return next;
    });
    setSaved(false);
  }

  function addCustom() {
    const trimmed = custom.trim();
    if (!trimmed) return;
    const normalised = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    if (!customList.includes(normalised) && !COMMON_ALLERGENS.includes(normalised)) {
      setCustomList((prev) => [...prev, normalised]);
    }
    setCustom("");
    setSaved(false);
  }

  function removeCustom(name: string) {
    setCustomList((prev) => prev.filter((a) => a !== name));
    setSaved(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApiError("");
    setSaved(false);
    setLoading(true);

    const allergens = [...selected, ...customList];

    try {
      await api.put("/users/allergies", { allergens });
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
            <h1 className="text-2xl font-bold text-gray-900">Allergen Manager</h1>
            <p className="text-sm text-gray-500">Menu items that contain these will show a hazard warning</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="p-6 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
              Common Allergens
            </h2>
            <div className="grid grid-cols-2 gap-3" role="group" aria-label="Common allergens">
              {COMMON_ALLERGENS.map((allergen) => {
                const checked = selected.has(allergen);
                return (
                  <label
                    key={allergen}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors ${
                      checked
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(allergen)}
                      className="accent-red-500"
                      disabled={loading}
                      aria-label={allergen}
                    />
                    <span className="text-sm text-gray-700">{allergen}</span>
                  </label>
                );
              })}
            </div>
          </Card>

          <Card className="p-6 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
              Custom Allergens
            </h2>

            {customList.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4" role="list" aria-label="Custom allergens">
                {customList.map((name) => (
                  <div key={name} role="listitem" className="flex items-center gap-1">
                    <Badge color="red">{name}</Badge>
                    <button
                      type="button"
                      onClick={() => removeCustom(name)}
                      disabled={loading}
                      className="text-gray-400 hover:text-red-500 text-xs ml-1 focus:outline-none"
                      aria-label={`Remove ${name}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
                placeholder="e.g. Mustard"
                disabled={loading}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                aria-label="Add custom allergen"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={addCustom}
                disabled={loading || !custom.trim()}
              >
                Add
              </Button>
            </div>
          </Card>

          {/* Summary */}
          {(selected.size > 0 || customList.length > 0) && (
            <div className="mb-4 px-1">
              <p className="text-sm text-gray-500">
                <span className="font-medium text-gray-700">{selected.size + customList.length}</span>{" "}
                allergen{selected.size + customList.length === 1 ? "" : "s"} selected
              </p>
            </div>
          )}

          {apiError && (
            <p role="alert" className="mb-4 text-sm text-red-600 text-center">{apiError}</p>
          )}
          {saved && (
            <p role="status" className="mb-4 text-sm text-green-600 text-center font-medium">
              Allergens saved. Hazard badges will update on menu pages.
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving…" : "Save Allergens"}
          </Button>
        </form>
      </div>
    </main>
  );
}

export default function AllergiesPage() {
  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <AllergiesManager />
    </ProtectedRoute>
  );
}
