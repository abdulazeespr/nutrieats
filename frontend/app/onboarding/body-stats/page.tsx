"use client";

import { useState, useMemo, FormEvent } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import {
  calculateBMR,
  calculateTDEE,
  calculateRDA,
  ACTIVITY_LABELS,
  ActivityLevel,
} from "@/lib/bmr";
import { api } from "@/lib/api";

type Gender = "MALE" | "FEMALE" | "OTHER";

const ACTIVITY_LEVELS: ActivityLevel[] = [
  "SEDENTARY",
  "LIGHTLY_ACTIVE",
  "MODERATELY_ACTIVE",
  "VERY_ACTIVE",
];

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

function BodyStatsForm() {
  const router = useRouter();

  const [age, setAge] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | "">("");

  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  // Live BMR/RDA preview — only when all fields are valid
  const preview = useMemo(() => {
    const ageNum = Number(age);
    const weightNum = Number(weightKg);
    const heightNum = Number(heightCm);

    if (
      !gender ||
      !activityLevel ||
      !age || !weightKg || !heightCm ||
      ageNum < 10 || ageNum > 120 ||
      weightNum < 20 || weightNum > 300 ||
      heightNum < 50 || heightNum > 250
    ) {
      return null;
    }

    const bmr = calculateBMR(weightNum, heightNum, ageNum, gender);
    const tdee = calculateTDEE(bmr, activityLevel);
    const rda = calculateRDA(weightNum, tdee);
    return rda;
  }, [age, weightKg, heightCm, gender, activityLevel]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setApiError("");

    if (!gender || !activityLevel) {
      setApiError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      await api.put("/users/body-stats", {
        age: Number(age),
        weightKg: Number(weightKg),
        heightCm: Number(heightCm),
        gender,
        activityLevel,
      });
      router.push("/onboarding/allergies");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save. Please try again.";
      setApiError(message);
    } finally {
      setLoading(false);
    }
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
          Step 1 of 3
        </p>
        {/* Progress track */}
        <div
          className="w-full bg-gray-200 rounded-full h-2 mb-8"
          role="progressbar"
          aria-valuenow={1}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-label="Onboarding progress: step 1 of 3"
        >
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: "33%" }}
          />
        </div>

        <Card className="p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Tell us about yourself
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            We&apos;ll use this to personalise your daily nutrition targets.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* Age */}
            <div className="mb-5">
              <label
                htmlFor="age"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Age
              </label>
              <input
                id="age"
                type="number"
                min={10}
                max={120}
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 28"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* Weight */}
            <div className="mb-5">
              <label
                htmlFor="weightKg"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Weight (kg)
              </label>
              <input
                id="weightKg"
                type="number"
                min={20}
                max={300}
                step={0.1}
                required
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="e.g. 70.5"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* Height */}
            <div className="mb-5">
              <label
                htmlFor="heightCm"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Height (cm)
              </label>
              <input
                id="heightCm"
                type="number"
                min={50}
                max={250}
                required
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="e.g. 175"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* Gender */}
            <fieldset className="mb-5">
              <legend className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </legend>
              <div className="flex gap-4">
                {GENDER_OPTIONS.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 cursor-pointer text-sm text-gray-700"
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={value}
                      checked={gender === value}
                      onChange={() => setGender(value)}
                      className="accent-green-600"
                      disabled={loading}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Activity Level */}
            <fieldset className="mb-6">
              <legend className="block text-sm font-medium text-gray-700 mb-2">
                Activity Level
              </legend>
              <div className="grid gap-3">
                {ACTIVITY_LEVELS.map((level) => {
                  const selected = activityLevel === level;
                  return (
                    <Card
                      key={level}
                      onClick={() => !loading && setActivityLevel(level)}
                      className={`px-4 py-3 border-2 transition-colors ${
                        selected
                          ? "border-green-500 bg-green-50"
                          : "border-transparent hover:border-green-200"
                      }`}
                    >
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="activityLevel"
                          value={level}
                          checked={selected}
                          onChange={() => setActivityLevel(level)}
                          className="mt-0.5 accent-green-600 shrink-0"
                          disabled={loading}
                        />
                        <span className="text-sm text-gray-700 leading-snug">
                          {ACTIVITY_LABELS[level]}
                        </span>
                      </label>
                    </Card>
                  );
                })}
              </div>
            </fieldset>

            {/* Live BMR / RDA preview */}
            {preview && (
              <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-5">
                <h3 className="text-sm font-semibold text-green-800 mb-3">
                  Your Daily Targets
                </h3>
                <ul className="space-y-1.5 text-sm text-gray-700">
                  <li className="flex justify-between">
                    <span>Estimated daily calories</span>
                    <span className="font-semibold text-green-700">
                      {preview.rdaCalories} kcal
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Protein target</span>
                    <span className="font-semibold">{preview.rdaProtein} g</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Carbs target</span>
                    <span className="font-semibold">{preview.rdaCarbs} g</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Fat target</span>
                    <span className="font-semibold">{preview.rdaFat} g</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Fiber target</span>
                    <span className="font-semibold">{preview.rdaFiber} g</span>
                  </li>
                </ul>
              </div>
            )}

            {/* API error */}
            {apiError && (
              <p role="alert" className="mb-4 text-sm text-red-600 text-center">
                {apiError}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving…" : "Continue"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}

export default function BodyStatsPage() {
  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <BodyStatsForm />
    </ProtectedRoute>
  );
}
