import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type UserRole = "customer" | "store_owner" | "admin";

export interface AuthUser {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  role: UserRole;
  address?: string | null;
  storeId?: number | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<AuthUser>;
  signup: (data: SignupData) => Promise<{ user: AuthUser; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  showAuthModal: boolean;
  openAuthModal: (mode?: "login" | "signup") => void;
  closeAuthModal: () => void;
  authMode: "login" | "signup";
  setAuthMode: (mode: "login" | "signup") => void;
}

export interface SignupData {
  role: "customer" | "store_owner";
  name: string;
  phone: string;
  email?: string;
  password: string;
  address?: string;
  storeName?: string;
  storeAddress?: string;
  storeCategory?: string;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const apiUrl = (path: string) => `${BASE}/api${path}`;

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/auth/me"), { credentials: "include" });
      if (res.ok) {
        const data = await res.json() as { user: AuthUser };
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (phone: string, password: string): Promise<AuthUser> => {
    const res = await fetch(apiUrl("/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ phone, password }),
    });
    if (!res.ok) {
      const err = await res.json() as { error: string };
      throw new Error(err.error ?? "Login failed");
    }
    const data = await res.json() as { user: AuthUser };
    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(async (data: SignupData): Promise<{ user: AuthUser; message?: string }> => {
    const res = await fetch(apiUrl("/auth/signup"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json() as { error: string };
      throw new Error(err.error ?? "Signup failed");
    }
    const result = await res.json() as { user: AuthUser; message?: string };
    setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(async () => {
    await fetch(apiUrl("/auth/logout"), { method: "POST", credentials: "include" });
    setUser(null);
    localStorage.removeItem("bb_owner_phone");
    localStorage.removeItem("bb_admin_auth");
  }, []);

  const openAuthModal = useCallback((mode: "login" | "signup" = "login") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        refreshUser,
        showAuthModal,
        openAuthModal,
        closeAuthModal,
        authMode,
        setAuthMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
