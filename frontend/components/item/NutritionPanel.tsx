import ProgressBar from "@/components/ui/ProgressBar";

interface NutritionPanelProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  /** RDA targets — if provided, renders progress bars showing "% of daily target" */
  rda?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

interface NutrientDef {
  label: string;
  value: number;
  unit: string;
  rdaKey: keyof NonNullable<NutritionPanelProps["rda"]>;
}

export default function NutritionPanel({
  calories,
  protein,
  carbs,
  fat,
  fiber,
  rda,
}: NutritionPanelProps) {
  const rows: NutrientDef[] = [
    { label: "Calories", value: calories, unit: "kcal", rdaKey: "calories" },
    { label: "Protein", value: protein, unit: "g", rdaKey: "protein" },
    { label: "Carbs", value: carbs, unit: "g", rdaKey: "carbs" },
    { label: "Fat", value: fat, unit: "g", rdaKey: "fat" },
    { label: "Fiber", value: fiber, unit: "g", rdaKey: "fiber" },
  ];

  if (rda) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-gray-500">
          Shows how this item moves your daily targets.
        </p>
        {rows.map((row) => {
          const target = rda[row.rdaKey];
          const pct = target > 0 ? (row.value / target) * 100 : 0;
          return (
            <div key={row.label}>
              <ProgressBar
                label={row.label}
                value={pct}
                max={100}
                unit="%"
              />
              <p className="text-xs text-gray-400 mt-0.5">
                {Math.round(row.value)}{row.unit} of {Math.round(target)}{row.unit} daily target
              </p>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {rows.map((row) => (
        <div
          key={row.label}
          className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center"
        >
          <p className="text-xs text-gray-500">{row.label}</p>
          <p className="text-base font-bold text-gray-900 mt-0.5">
            {Math.round(row.value)}
            <span className="text-xs font-normal text-gray-500 ml-0.5">{row.unit}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
