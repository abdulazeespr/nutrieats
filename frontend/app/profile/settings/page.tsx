"use client";

import { useEffect, useState, useMemo, FormEvent } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import {
  calculateBMR,
  calculateTDEE,
  calculateRDA,
  ACTIVITY_LABELS,
  ActivityLevel,
} from "@/lib/bmr";

type Gender = "MALE" | "FEMALE" | "OTHER";

interface ProfileResponse {
  bodyStats: {
    age: number;
    weightKg: number;
    heightCm: number;
    gender: Gender;
    activityLevel: ActivityLevel;
    bmr: number;
    rdaCalories: number;
  } | null;
}

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

function SettingsForm() {
  const [age, setAge] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | "">("");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [apiError, setApiError] = useState("");
  const [saved, setSaved] = useState(false);

  // Load existing body stats
  useEffect(() => {
    api
      .get<ProfileResponse>("/users/profile")
      .then(({ bodyStats }) => {
        if (bodyStats) {
          setAge(String(bodyStats.age));
          setWeightKg(String(bodyStats.weightKg));
          setHeightCm(String(bodyStats.heightCm));
          setGender(bodyStats.gender);
          setActivityLevel(bodyStats.activityLevel);
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  // Live BMR/RDA preview
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
    ) return null;

    const bmr = calculateBMR(weightNum, heightNum, ageNum, gender);
    const tdee = calculateTDEE(bmr, activityLevel);
    return { bmr: Math.round(bmr), ...calculateRDA(weightNum, tdee) };
  }, [age, weightKg, heightCm, gender, activityLevel]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!gender || !activityLevel) {
      setApiError("Please fill in all fields.");
      return;
    }
    setApiError("");
    setSaved(false);
    setLoading(true);

    try {
      await api.put("/users/body-stats", {
        age: Number(age),
        weightKg: Number(weightKg),
        heightCm: Number(heightCm),
        gender,
        activityLevel,
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
          <h1 className="text-2xl font-bold text-gray-900">Body Stats</h1>
        </div>

        <Card className="p-8">
          <p className="text-sm text-gray-500 mb-6">
            Update your stats to keep your BMR and daily targets accurate.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* Age */}
            <div className="mb-5">
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                id="age" type="number" min={10} max={120} required
                value={age} onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 28" disabled={loading}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Weight */}
            <div className="mb-5">
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input
                id="weight" type="number" min={20} max={300} step={0.1} required
                value={weightKg} onChange={(e) => setWeightKg(e.target.value)}
                placeholder="e.g. 70.5" disabled={loading}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Height */}
            <div className="mb-5">
              <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
              <input
                id="height" type="number" min={50} max={250} required
                value={heightCm} onChange={(e) => setHeightCm(e.target.value)}
                placeholder="e.g. 175" disabled={loading}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Gender */}
            <fieldset className="mb-5">
              <legend className="block text-sm font-medium text-gray-700 mb-2">Gender</legend>
              <div className="flex gap-4">
                {GENDER_OPTIONS.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input
                      type="radio" name="gender" value={value}
                      checked={gender === value} onChange={() => setGender(value)}
                      className="accent-green-600" disabled={loading}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Activity Level */}
            <fieldset className="mb-6">
              <legend className="block text-sm font-medium text-gray-700 mb-2">Activity Level</legend>
              <div className="grid gap-3">
                {ACTIVITY_LEVELS.map((level) => {
                  const selected = activityLevel === level;
                  return (
                    <Card
                      key={level}
                      onClick={() => !loading && setActivityLevel(level)}
                      className={`px-4 py-3 border-2 transition-colors cursor-pointer ${
                        selected ? "border-green-500 bg-green-50" : "border-transparent hover:border-green-200"
                      }`}
                    >
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="radio" name="activityLevel" value={level}
                          checked={selected} onChange={() => setActivityLevel(level)}
                          className="mt-0.5 accent-green-600 shrink-0" disabled={loading}
                        />
                        <span className="text-sm text-gray-700 leading-snug">{ACTIVITY_LABELS[level]}</span>
                      </label>
                    </Card>
                  );
                })}
              </div>
            </fieldset>

            {/* Live preview */}
            {preview && (
              <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-5">
                <h3 className="text-sm font-semibold text-green-800 mb-3">Recalculated Targets</h3>
                <ul className="space-y-1.5 text-sm text-gray-700">
                  <li className="flex justify-between">
                    <span>BMR</span>
                    <span className="font-semibold text-green-700">{preview.bmr} kcal</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Daily calories</span>
                    <span className="font-semibold">{preview.rdaCalories} kcal</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Protein</span>
                    <span className="font-semibold">{preview.rdaProtein} g</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Carbs</span>
                    <span className="font-semibold">{preview.rdaCarbs} g</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Fat</span>
                    <span className="font-semibold">{preview.rdaFat} g</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Fiber</span>
                    <span className="font-semibold">{preview.rdaFiber} g</span>
                  </li>
                </ul>
              </div>
            )}

            {apiError && (
              <p role="alert" className="mb-4 text-sm text-red-600 text-center">{apiError}</p>
            )}
            {saved && (
              <p role="status" className="mb-4 text-sm text-green-600 text-center font-medium">
                Stats saved — your targets have been updated.
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving…" : "Save Changes"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}

export default function ProfileSettingsPage() {
  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <SettingsForm />
    </ProtectedRoute>
  );
}
