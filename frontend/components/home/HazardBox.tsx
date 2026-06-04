"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface HazardBoxProps {
  lowAlerts: string[];
}

export default function HazardBox({ lowAlerts }: HazardBoxProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (lowAlerts.length === 0) return null;

  const visibleAlerts = lowAlerts.filter((alert) => !dismissed.has(alert));
  if (visibleAlerts.length === 0) return null;

  const dismiss = (alert: string) => {
    setDismissed((prev) => new Set(prev).add(alert));
  };

  const alertLabels: Record<string, string> = {
    calories: "Calories",
    protein: "Protein",
    carbs: "Carbs",
    fat: "Fat",
    fiber: "Fiber",
  };

  return (
    <Card className="p-4 bg-orange-50 border-orange-200">
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">
          ⚠️
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-orange-900 mb-2">
            RDA Alerts — Low Intake Today
          </h3>
          <div className="flex flex-wrap gap-2">
            {visibleAlerts.map((alert) => (
              <div key={alert} className="flex items-center gap-1">
                <Badge color="orange" size="sm">
                  Low {alertLabels[alert] || alert}
                </Badge>
                <button
                  type="button"
                  onClick={() => dismiss(alert)}
                  className="text-orange-600 hover:text-orange-800 text-xs font-bold px-1"
                  aria-label={`Dismiss ${alert} alert`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
