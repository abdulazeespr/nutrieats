"use client";

import { useState, useMemo, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { calculateHealthScore, isHealthy } from "@/lib/healthScore";
import { api } from "@/lib/api";

export interface Ingredient {
  name: string;
  tag: "beneficial" | "neutral" | "watch-out";
}

export interface ItemFormValues {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  cookingMethod: string;
  ingredients: Ingredient[];
  allergens: string[];
  discount: string;
}

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

const INGREDIENT_TAGS: Ingredient["tag"][] = ["beneficial", "neutral", "watch-out"];

const TAG_COLOR: Record<Ingredient["tag"], "green" | "gray" | "orange"> = {
  beneficial: "green",
  neutral: "gray",
  "watch-out": "orange",
};

const EMPTY_FORM: ItemFormValues = {
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  fiber: "",
  cookingMethod: "",
  ingredients: [],
  allergens: [],
  discount: "0",
};

interface ItemFormProps {
  mode: "create" | "edit";
  itemId?: string;
  initialValues?: Partial<ItemFormValues>;
}

export default function ItemForm({ mode, itemId, initialValues }: ItemFormProps) {
  const router = useRouter();

  const [form, setForm] = useState<ItemFormValues>({ ...EMPTY_FORM, ...initialValues });
  const [newIngName, setNewIngName] = useState("");
  const [newIngTag, setNewIngTag] = useState<Ingredient["tag"]>("neutral");
  const [errors, setErrors] = useState<Partial<Record<keyof ItemFormValues, string>>>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  function set<K extends keyof ItemFormValues>(key: K, value: ItemFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  // Live health score preview
  const preview = useMemo(() => {
    const cals = parseFloat(form.calories);
    const fat = parseFloat(form.fat);
    const fiber = parseFloat(form.fiber);
    const protein = parseFloat(form.protein);
    if (isNaN(cals) || isNaN(fat) || isNaN(fiber) || isNaN(protein)) return null;
    const score = calculateHealthScore({
      calories: cals,
      fat,
      fiber,
      protein,
      cookingMethod: form.cookingMethod,
    });
    return { score, healthy: isHealthy(score) };
  }, [form.calories, form.fat, form.fiber, form.protein, form.cookingMethod]);

  function validate(): boolean {
    const next: Partial<Record<keyof ItemFormValues, string>> = {};
    if (!form.name.trim()) next.name = "Name is required.";
    if (!form.price || isNaN(parseFloat(form.price)) || parseFloat(form.price) <= 0)
      next.price = "Price must be a positive number.";
    if (!form.calories || isNaN(parseFloat(form.calories)) || parseFloat(form.calories) < 0)
      next.calories = "Calories must be 0 or more.";
    if (!form.protein || isNaN(parseFloat(form.protein)) || parseFloat(form.protein) < 0)
      next.protein = "Protein must be 0 or more.";
    if (!form.carbs || isNaN(parseFloat(form.carbs)) || parseFloat(form.carbs) < 0)
      next.carbs = "Carbs must be 0 or more.";
    if (!form.fat || isNaN(parseFloat(form.fat)) || parseFloat(form.fat) < 0)
      next.fat = "Fat must be 0 or more.";
    if (!form.fiber || isNaN(parseFloat(form.fiber)) || parseFloat(form.fiber) < 0)
      next.fiber = "Fiber must be 0 or more.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function addIngredient() {
    if (!newIngName.trim()) return;
    set("ingredients", [
      ...form.ingredients,
      { name: newIngName.trim(), tag: newIngTag },
    ]);
    setNewIngName("");
    setNewIngTag("neutral");
  }

  function removeIngredient(index: number) {
    set("ingredients", form.ingredients.filter((_, i) => i !== index));
  }

  function toggleAllergen(allergen: string) {
    if (form.allergens.includes(allergen)) {
      set("allergens", form.allergens.filter((a) => a !== allergen));
    } else {
      set("allergens", [...form.allergens, allergen]);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApiError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        imageUrl: form.imageUrl.trim(),
        calories: parseFloat(form.calories),
        protein: parseFloat(form.protein),
        carbs: parseFloat(form.carbs),
        fat: parseFloat(form.fat),
        fiber: parseFloat(form.fiber),
        cookingMethod: form.cookingMethod.trim(),
        ingredients: form.ingredients,
        allergens: form.allergens,
        discount: parseFloat(form.discount) || 0,
      };

      if (mode === "create") {
        await api.post("/merchant/items", payload);
      } else {
        await api.put(`/merchant/items/${itemId}`, payload);
      }

      router.push("/merchant/items");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save item.";
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Basic info */}
      <Card className="p-6">
        <h2 className="text-base font-bold text-gray-900 mb-5">Basic information</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Item name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                errors.name ? "border-red-400" : "border-gray-300"
              }`}
              disabled={loading}
              aria-invalid={!!errors.name}
            />
            {errors.name && <p role="alert" className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors resize-none"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                errors.price ? "border-red-400" : "border-gray-300"
              }`}
              disabled={loading}
              aria-invalid={!!errors.price}
            />
            {errors.price && <p role="alert" className="mt-1 text-xs text-red-600">{errors.price}</p>}
          </div>

          <div>
            <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-1">
              Discount (%)
            </label>
            <input
              id="discount"
              type="number"
              min="0"
              max="100"
              step="1"
              value={form.discount}
              onChange={(e) => set("discount", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              disabled={loading}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Image URL
            </label>
            <input
              id="imageUrl"
              type="url"
              value={form.imageUrl}
              onChange={(e) => set("imageUrl", e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              disabled={loading}
            />
          </div>
        </div>
      </Card>

      {/* Nutritional info */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">Nutritional information</h2>
          {preview && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Health score:</span>
              <Badge color={preview.healthy ? "green" : "orange"} size="md">
                {preview.score.toFixed(1)} — {preview.healthy ? "Healthy" : "Indulgent"}
              </Badge>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          {(
            [
              { key: "calories", label: "Calories", unit: "kcal" },
              { key: "protein", label: "Protein", unit: "g" },
              { key: "carbs", label: "Carbs", unit: "g" },
              { key: "fat", label: "Fat", unit: "g" },
              { key: "fiber", label: "Fiber", unit: "g" },
            ] as { key: keyof ItemFormValues; label: string; unit: string }[]
          ).map(({ key, label, unit }) => (
            <div key={key}>
              <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1">
                {label} ({unit}) <span className="text-red-500">*</span>
              </label>
              <input
                id={key}
                type="number"
                min="0"
                step="0.1"
                value={form[key] as string}
                onChange={(e) => set(key, e.target.value)}
                className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                  errors[key] ? "border-red-400" : "border-gray-300"
                }`}
                disabled={loading}
                aria-invalid={!!errors[key]}
              />
              {errors[key] && (
                <p role="alert" className="mt-1 text-xs text-red-600">{errors[key]}</p>
              )}
            </div>
          ))}
        </div>

        {/* Health score breakdown */}
        {preview && (
          <div className="mt-5 rounded-xl bg-gray-50 border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-600 mb-2">Score breakdown</p>
            <ul className="space-y-1 text-xs text-gray-500">
              <li>Base score: 10</li>
              {parseFloat(form.calories) > 600 && <li className="text-orange-600">−2 calories &gt; 600 kcal</li>}
              {parseFloat(form.fat) > 20 && <li className="text-orange-600">−2 fat &gt; 20g</li>}
              {/deep.?fri/i.test(form.cookingMethod) && <li className="text-orange-600">−2 deep fried</li>}
              {parseFloat(form.fiber) > 5 && <li className="text-green-600">+1 fiber &gt; 5g</li>}
              {parseFloat(form.protein) > 20 && <li className="text-green-600">+1 protein &gt; 20g</li>}
              <li className="font-semibold text-gray-700 pt-1 border-t border-gray-200 mt-1">
                Final: {preview.score.toFixed(1)} / 10
              </li>
            </ul>
          </div>
        )}
      </Card>

      {/* Cooking method */}
      <Card className="p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">How it&apos;s made</h2>
        <label htmlFor="cookingMethod" className="block text-sm font-medium text-gray-700 mb-1">
          Cooking method
        </label>
        <input
          id="cookingMethod"
          type="text"
          value={form.cookingMethod}
          onChange={(e) => set("cookingMethod", e.target.value)}
          placeholder='e.g. "Steamed, no added oil" or "Deep fried in refined oil"'
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
          disabled={loading}
        />
        <p className="mt-1.5 text-xs text-gray-400">
          Tip: mentioning &quot;deep fried&quot; applies a −2 penalty to the health score.
        </p>
      </Card>

      {/* Ingredients */}
      <Card className="p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">Ingredients</h2>

        {/* Add ingredient row */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newIngName}
            onChange={(e) => setNewIngName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addIngredient(); } }}
            placeholder="Ingredient name"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
            disabled={loading}
            aria-label="New ingredient name"
          />
          <select
            value={newIngTag}
            onChange={(e) => setNewIngTag(e.target.value as Ingredient["tag"])}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 bg-white"
            disabled={loading}
            aria-label="Ingredient health tag"
          >
            {INGREDIENT_TAGS.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="secondary"
            onClick={addIngredient}
            disabled={loading || !newIngName.trim()}
            className="text-sm px-4 py-2"
          >
            Add
          </Button>
        </div>

        {form.ingredients.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No ingredients added yet.</p>
        ) : (
          <ul className="space-y-2" aria-label="Ingredients list">
            {form.ingredients.map((ing, i) => (
              <li key={i} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge color={TAG_COLOR[ing.tag]} size="sm">{ing.tag}</Badge>
                  <span className="text-sm text-gray-800 truncate">{ing.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeIngredient(i)}
                  disabled={loading}
                  aria-label={`Remove ${ing.name}`}
                  className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none shrink-0"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Allergens */}
      <Card className="p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">Allergens</h2>
        <fieldset>
          <legend className="text-sm text-gray-500 mb-3">
            Check all allergens present in this item.
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {COMMON_ALLERGENS.map((allergen) => {
              const checked = form.allergens.includes(allergen);
              return (
                <label
                  key={allergen}
                  className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 cursor-pointer transition-colors text-sm ${
                    checked
                      ? "border-red-400 bg-red-50 text-red-700"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAllergen(allergen)}
                    disabled={loading}
                    className="accent-red-500 shrink-0"
                    aria-label={allergen}
                  />
                  {allergen}
                </label>
              );
            })}
          </div>
        </fieldset>
      </Card>

      {/* Submit */}
      {apiError && (
        <p role="alert" className="text-sm text-red-600 text-center">
          {apiError}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading
            ? mode === "create" ? "Creating…" : "Saving…"
            : mode === "create" ? "Create item" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/merchant/items")}
          disabled={loading}
          className="px-6"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
