export interface Ingredient {
  name: string;
  tag?: "beneficial" | "neutral" | "watch-out";
}

interface IngredientsListProps {
  ingredients: Ingredient[] | string[];
}

const TAG_STYLE = {
  beneficial: "border-green-200 bg-green-50 text-green-800",
  neutral: "border-gray-200 bg-gray-50 text-gray-700",
  "watch-out": "border-orange-200 bg-orange-50 text-orange-800",
};

const TAG_LABEL = {
  beneficial: "Beneficial",
  neutral: "Neutral",
  "watch-out": "Watch out",
};

function normalise(raw: Ingredient | string): Ingredient {
  if (typeof raw === "string") return { name: raw, tag: "neutral" };
  return { name: raw.name, tag: raw.tag ?? "neutral" };
}

export default function IngredientsList({ ingredients }: IngredientsListProps) {
  if (!ingredients || ingredients.length === 0) {
    return <p className="text-sm text-gray-400 italic">No ingredients listed.</p>;
  }

  const items = (ingredients as (Ingredient | string)[]).map(normalise);

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Ingredients list">
      {items.map((item, i) => {
        const tag = item.tag ?? "neutral";
        return (
          <li key={i}>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${TAG_STYLE[tag]}`}
              title={TAG_LABEL[tag]}
            >
              {item.name}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
