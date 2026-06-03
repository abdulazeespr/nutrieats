"use client";

import { useState, useRef, KeyboardEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { api } from "@/lib/api";

const COMMON_ALLERGENS = [
  "Gluten",
  "Dairy",
  "Eggs",
  "Nuts",
  "Peanuts",
  "Soy",
  "Shellfish",
  "Fish",
  "Sesame",
  "Mustard",
];

function AllergiesForm() {
  const router = useRouter();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customInput, setCustomInput] = useState("");
  const [customAllergens, setCustomAllergens] = useState<string[]>([]);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  function toggleAllergen(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  function addCustomAllergen() {
    const trimmed = customInput.trim();
    if (!trimmed) return;

    const alreadyCommon = COMMON_ALLERGENS.some(
      (a) => a.toLowerCase() === trimmed.toLowerCase()
    );
    const alreadyCustom = customAllergens.some(
      (a) => a.toLowerCase() === trimmed.toLowerCase()
    );

    if (!alreadyCommon && !alreadyCustom) {
      setCustomAllergens((prev) => [...prev, trimmed]);
    }

    setCustomInput("");
    inputRef.current?.focus();
  }

  function removeCustomAllergen(name: string) {
    setCustomAllergens((prev) => prev.filter((a) => a !== name));
  }

  function handleInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomAllergen();
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setApiError("");
    setLoading(true);

    const allergens = [...selected, ...customAllergens];

    try {
      await api.put("/users/allergies", { allergens });
      router.push("/onboarding/notifications");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save. Please try again.";
      setApiError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    router.push("/onboarding/notifications");
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="w-full max-w-2xl mx-auto">
        {/* Brand */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-green-600">NutriEats</h1>
        </div>

        {/* Step indicator */}
        <p className="text-center text-sm text-gray-500 mb-2 font-medium">
          Step 2 of 3
        </p>
        {/* Progress track */}
        <div
          className="w-full bg-gray-200 rounded-full h-2 mb-8"
          role="progressbar"
          aria-valuenow={2}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-label="Onboarding progress: step 2 of 3"
        >
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: "66%" }}
          />
        </div>

        <Card className="p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Any food allergies?
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            We&apos;ll highlight menu items that contain allergens you&apos;ve flagged. You
            can update these later in your profile.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* Common allergen grid */}
            <fieldset className="mb-6">
              <legend className="block text-sm font-medium text-gray-700 mb-3">
                Common allergens
              </legend>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {COMMON_ALLERGENS.map((allergen) => {
                  const isSelected = selected.has(allergen);
                  return (
                    <Card
                      key={allergen}
                      onClick={() => !loading && toggleAllergen(allergen)}
                      className={`p-3 border-2 transition-colors ${
                        isSelected
                          ? "border-green-500 bg-green-50"
                          : "border-transparent hover:border-green-200"
                      }`}
                    >
                      <label className="flex flex-col items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          name="allergens"
                          value={allergen}
                          checked={isSelected}
                          onChange={() => toggleAllergen(allergen)}
                          className="accent-green-600"
                          disabled={loading}
                          aria-label={allergen}
                          // prevent double-toggle from label click propagation
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                          {allergen}
                        </span>
                      </label>
                    </Card>
                  );
                })}
              </div>
            </fieldset>

            {/* Custom allergen section */}
            <div className="mb-6">
              <label
                htmlFor="customAllergen"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Add a custom allergen
              </label>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  id="customAllergen"
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="e.g. Lupin, Celery…"
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={loading}
                  aria-label="Custom allergen input"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addCustomAllergen}
                  disabled={loading || !customInput.trim()}
                  className="px-4 py-2.5 text-sm"
                >
                  Add
                </Button>
              </div>

              {/* Custom allergen tags */}
              {customAllergens.length > 0 && (
                <div
                  className="mt-3 flex flex-wrap gap-2"
                  aria-label="Added custom allergens"
                >
                  {customAllergens.map((allergen) => (
                    <Badge key={allergen} color="green" size="md">
                      {allergen}
                      <button
                        type="button"
                        onClick={() => removeCustomAllergen(allergen)}
                        disabled={loading}
                        className="ml-1 rounded-full hover:bg-green-200 focus:outline-none focus:ring-1 focus:ring-green-600 p-0.5"
                        aria-label={`Remove ${allergen}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-3 h-3"
                          aria-hidden="true"
                        >
                          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                        </svg>
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
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
                {loading ? "Saving…" : "Save & Continue"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}

export default function AllergiesPage() {
  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <AllergiesForm />
    </ProtectedRoute>
  );
}
