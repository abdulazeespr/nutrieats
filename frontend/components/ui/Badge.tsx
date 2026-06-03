import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  color?: "green" | "orange" | "red" | "gray" | "blue";
  size?: "sm" | "md";
}

const colorMap = {
  green: "bg-green-100 text-green-800",
  orange: "bg-orange-100 text-orange-800",
  red: "bg-red-100 text-red-800",
  gray: "bg-gray-100 text-gray-700",
  blue: "bg-blue-100 text-blue-800",
};

export default function Badge({ children, color = "gray", size = "sm" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full
        ${size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"}
        ${colorMap[color]}`}
    >
      {children}
    </span>
  );
}
