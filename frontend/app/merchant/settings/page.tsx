"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { MerchantHeader } from "@/app/merchant/dashboard/page";
import { api } from "@/lib/api";

interface Restaurant {
  id: string;
  name: string;
  address: string;
  cuisineTags: string[];
  healthScore: number;
  isOpen: boolean;
}

interface RestaurantWithItems extends Restaurant {
  menuItems: unknown[];
}

const CUISINE_SUGGESTIONS = [
  "Indian",
  "Chinese",
  "Italian",
  "Mexican",
  "Japanese",
  "Thai",
  "Mediterranean",
  "American",
  "Healthy",
  "Fast Food",
  "Vegan",
  "Bakery",
];

function SettingsContent() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [cuisineTags, setCuisineTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");

  const [errors, setErrors] = useState<{ name?: string; address?: string }>({});
  const [apiError, setApiError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Try to load existing restaurant data
  useEffect(() => {
    api
      .get<RestaurantWithItems>("/merchant/restaurant")
      .then((r) => {
        setName(r.name);
        setAddress(r.address);
        setCuisineTags(r.cuisineTags);
      })
      .catch(() => {
        // No restaurant yet — form stays empty (create mode)
      })
      .finally(() => setFetching(false));
  }, []);

  function toggleTag(tag: string) {
    if (cuisineTags.includes(tag)) {
      setCuisineTags(cuisineTags.filter((t) => t !== tag));
    } else {
      setCuisineTags([...cuisineTags, tag]);
    }
  }

  function addCustomTag() {
    const trimmed = customTag.trim();
    if (!trimmed || cuisineTags.includes(trimmed)) return;
    setCuisineTags([...cuisineTags, trimmed]);
    setCustomTag("");
  }

  function validate(): boolean {
    const next: { name?: string; address?: string } = {};
    if (!name.trim()) next.name = "Store name is required.";
    if (!address.trim()) next.address = "Address is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApiError("");
    setSuccessMsg("");
    if (!validate()) return;

    setLoading(true);
    try {
      await api.put<Restaurant>("/merchant/restaurant", {
        name: name.trim(),
        address: address.trim(),
        cuisineTags,
      });
      setSuccessMsg("Store settings saved successfully.");
      // If this was a first-time setup, go to dashboard
      setTimeout(() => router.push("/merchant/dashboard"), 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save settings.";
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MerchantHeader />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MerchantHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Store settings</h1>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Store info */}
          <Card className="p-6">
            <h2 className="text-base font-bold text-gray-900 mb-5">Store information</h2>

            <div className="space-y-5">
              <div>
                <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-1">
                  Store name <span className="text-red-500">*</span>
                </label>
                <input
                  id="storeName"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                    errors.name ? "border-red-400" : "border-gray-300"
                  }`}
                  disabled={loading}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p role="alert" className="mt-1 text-xs text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="address"
                  rows={2}
                  value={address}
                  onChange={(e) => { setAddress(e.target.value); setErrors((p) => ({ ...p, address: undefined })); }}
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors resize-none ${
                    errors.address ? "border-red-400" : "border-gray-300"
                  }`}
                  disabled={loading}
                  aria-invalid={!!errors.address}
                />
                {errors.address && (
                  <p role="alert" className="mt-1 text-xs text-red-600">{errors.address}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Cuisine tags */}
          <Card className="p-6">
            <h2 className="text-base font-bold text-gray-900 mb-2">Cuisine tags</h2>
            <p className="text-sm text-gray-500 mb-4">
              Tags help customers find your restaurant when browsing.
            </p>

            {/* Selected tags */}
            {cuisineTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {cuisineTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="flex items-center gap-1"
                    aria-label={`Remove ${tag}`}
                  >
                    <Badge color="green" size="sm">{tag} ×</Badge>
                  </button>
                ))}
              </div>
            )}

            {/* Suggestions */}
            <div className="flex flex-wrap gap-2 mb-4">
              {CUISINE_SUGGESTIONS.filter((t) => !cuisineTags.includes(t)).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>

            {/* Custom tag input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTag(); } }}
                placeholder="Add custom tag…"
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                disabled={loading}
                aria-label="Custom cuisine tag"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={addCustomTag}
                disabled={loading || !customTag.trim()}
                className="text-sm px-4 py-2"
              >
                Add
              </Button>
            </div>
          </Card>

          {/* Feedback */}
          {apiError && (
            <p role="alert" className="text-sm text-red-600 text-center">{apiError}</p>
          )}
          {successMsg && (
            <p role="status" className="text-sm text-green-600 text-center font-medium">{successMsg}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving…" : "Save settings"}
          </Button>
        </form>
      </main>
    </div>
  );
}

export default function MerchantSettingsPage() {
  return (
    <ProtectedRoute allowedRoles={["MERCHANT"]}>
      <SettingsContent />
    </ProtectedRoute>
  );
}
