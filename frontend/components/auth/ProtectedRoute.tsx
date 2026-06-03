"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace("/");
    }
  }, [mounted, user, allowedRoles, router]);

  // Avoid flash while auth state is being restored on initial mount
  if (!mounted) return null;

  // Still waiting to determine if user is authenticated
  if (!user) return null;

  // User is authenticated but role check failed
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}
