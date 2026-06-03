import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
}

export default function Button({ children, variant = "primary", className = "", ...props }: ButtonProps) {
  const baseClass = "px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-green-600 hover:bg-green-700 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-900",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  };

  return (
    <button className={`${baseClass} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
