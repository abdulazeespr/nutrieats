"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth, AuthUser } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

type Role = "CUSTOMER" | "MERCHANT" | "RIDER";

interface RegisterResponse {
  user: AuthUser;
  token: string;
}

interface RoleOption {
  value: Role;
  label: string;
  description: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: "CUSTOMER",
    label: "Customer",
    description: "Order healthy meals delivered to you",
  },
  {
    value: "MERCHANT",
    label: "Restaurant Owner",
    description: "List your restaurant and manage orders",
  },
  {
    value: "RIDER",
    label: "Delivery Partner",
    description: "Earn by delivering orders in your area",
  },
];

const REDIRECT_MAP: Record<Role, string> = {
  CUSTOMER: "/onboarding/body-stats",
  MERCHANT: "/merchant/dashboard",
  RIDER: "/rider/dashboard",
};

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("CUSTOMER");
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const next: FormErrors = {};

    if (!name.trim()) {
      next.name = "Name is required.";
    }

    if (!email.trim()) {
      next.email = "Email is required.";
    } else if (!validateEmail(email)) {
      next.email = "Please enter a valid email address.";
    }

    if (!password) {
      next.password = "Password is required.";
    } else if (password.length < 6) {
      next.password = "Password must be at least 6 characters.";
    }

    if (!confirmPassword) {
      next.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      next.confirmPassword = "Passwords do not match.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setApiError("");

    if (!validate()) return;

    setLoading(true);
    try {
      const payload: {
        name: string;
        email: string;
        password: string;
        role: Role;
        phone?: string;
      } = { name: name.trim(), email, password, role };

      if (phone.trim()) {
        payload.phone = phone.trim();
      }

      const data = await api.post<RegisterResponse>("/auth/register", payload);
      login(data.token, data.user);
      router.push(REDIRECT_MAP[data.user.role]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Registration failed. Please try again.";
      setApiError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Brand header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-600">NutriEats</h1>
          <p className="text-gray-500 mt-1">Create your account</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} noValidate>
            {/* Name */}
            <div className="mb-5">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.name ? "border-red-400" : "border-gray-300"
                }`}
                aria-describedby={errors.name ? "name-error" : undefined}
                aria-invalid={!!errors.name}
                aria-required="true"
                disabled={loading}
              />
              {errors.name && (
                <p id="name-error" role="alert" className="mt-1 text-xs text-red-600">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="mb-5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.email ? "border-red-400" : "border-gray-300"
                }`}
                aria-describedby={errors.email ? "email-error" : undefined}
                aria-invalid={!!errors.email}
                aria-required="true"
                disabled={loading}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="mt-1 text-xs text-red-600">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone (optional) */}
            <div className="mb-5">
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone number{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="mb-5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.password ? "border-red-400" : "border-gray-300"
                }`}
                aria-describedby={errors.password ? "password-error" : undefined}
                aria-invalid={!!errors.password}
                aria-required="true"
                disabled={loading}
              />
              {errors.password && (
                <p id="password-error" role="alert" className="mt-1 text-xs text-red-600">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm password <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.confirmPassword ? "border-red-400" : "border-gray-300"
                }`}
                aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                aria-invalid={!!errors.confirmPassword}
                aria-required="true"
                disabled={loading}
              />
              {errors.confirmPassword && (
                <p
                  id="confirm-password-error"
                  role="alert"
                  className="mt-1 text-xs text-red-600"
                >
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Role selector */}
            <fieldset className="mb-6">
              <legend className="block text-sm font-medium text-gray-700 mb-3">
                I am a… <span className="text-red-500">*</span>
              </legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {ROLE_OPTIONS.map(({ value, label, description }) => {
                  const selected = role === value;
                  return (
                    <label
                      key={value}
                      className={`relative flex flex-col gap-1 rounded-xl border-2 px-4 py-3 cursor-pointer transition-colors ${
                        selected
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={value}
                        checked={selected}
                        onChange={() => setRole(value)}
                        disabled={loading}
                        className="sr-only"
                      />
                      <span
                        className={`text-sm font-semibold ${
                          selected ? "text-green-700" : "text-gray-800"
                        }`}
                      >
                        {label}
                      </span>
                      <span
                        className={`text-xs leading-snug ${
                          selected ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        {description}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* API error */}
            {apiError && (
              <p role="alert" className="mb-4 text-sm text-red-600 text-center">
                {apiError}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-green-600 font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
