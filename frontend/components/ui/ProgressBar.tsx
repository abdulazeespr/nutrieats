interface ProgressBarProps {
  value: number;    // current
  max: number;      // target (RDA)
  label: string;
  unit?: string;
}

export default function ProgressBar({ value, max, label, unit = "g" }: ProgressBarProps) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  const color = pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-orange-400" : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="text-gray-500">
          {Math.round(value)}{unit} / {Math.round(max)}{unit}
        </span>
      </div>
      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label}
        />
      </div>
    </div>
  );
}
