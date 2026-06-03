"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  saveToken,
  getToken,
  removeToken,
  decodeToken,
} from "@/lib/auth";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "MERCHANT" | "RIDER";
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  // On mount, restore session from localStorage
  useEffect(() => {
    const stored = getToken();
    if (!stored) return;

    const decoded = decodeToken(stored);
    if (!decoded) {
      // Token is malformed — clear it
      removeToken();
      return;
    }

    // Check expiry
    if (decoded.exp * 1000 < Date.now()) {
      removeToken();
      return;
    }

    // We can restore the token from storage. The full user object (name/email)
    // is not encoded in the JWT, so we restore only what the token provides.
    // Pages that need the full profile should fetch it from the API.
    setToken(stored);
    setUser({
      id: decoded.userId,
      name: "",
      email: "",
      role: decoded.role as AuthUser["role"],
    });
  }, []);

  function login(newToken: string, newUser: AuthUser) {
    saveToken(newToken);
    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    removeToken();
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
