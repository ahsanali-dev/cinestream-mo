"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserSession } from "@/lib/auth";

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: "login" | "signup";
  openAuthModal: (mode?: "login" | "signup") => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (payload: { credential?: string; email?: string; name?: string; avatar?: string; googleId?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("login");

  // Restore session from localStorage on initial load
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("cinestream_auth_token");
      const storedUser = localStorage.getItem("cinestream_auth_user");

      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {}
        }

        // Validate token with server asynchronously in background
        fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${storedToken}` },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data?.user) {
              setUser(data.user);
              localStorage.setItem("cinestream_auth_user", JSON.stringify(data.user));
            } else {
              // Token expired or invalid: reset to guest
              setUser(null);
              setToken(null);
              localStorage.removeItem("cinestream_auth_token");
              localStorage.removeItem("cinestream_auth_user");
            }
          })
          .catch(() => {
            // Keep stored user if offline
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    } catch {
      setIsLoading(false);
    }
  }, []);

  const openAuthModal = useCallback((mode: "login" | "signup" = "login") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Failed to log in" };
      }

      setUser(data.user);
      setToken(data.user.token || null);
      if (data.user.token) {
        localStorage.setItem("cinestream_auth_token", data.user.token);
      }
      localStorage.setItem("cinestream_auth_user", JSON.stringify(data.user));
      closeAuthModal();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Network error. Please try again." };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Failed to create account" };
      }

      setUser(data.user);
      setToken(data.user.token || null);
      if (data.user.token) {
        localStorage.setItem("cinestream_auth_token", data.user.token);
      }
      localStorage.setItem("cinestream_auth_user", JSON.stringify(data.user));
      closeAuthModal();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Network error. Please try again." };
    }
  };

  const loginWithGoogle = async (payload: { credential?: string; email?: string; name?: string; avatar?: string; googleId?: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Google authentication failed" };
      }

      setUser(data.user);
      setToken(data.user.token || null);
      if (data.user.token) {
        localStorage.setItem("cinestream_auth_token", data.user.token);
      }
      localStorage.setItem("cinestream_auth_user", JSON.stringify(data.user));
      closeAuthModal();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Network error connecting to Google" };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem("cinestream_auth_token");
      localStorage.removeItem("cinestream_auth_user");
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
