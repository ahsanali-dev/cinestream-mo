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
  setSessionUser: (user: UserSession) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (payload: {
    credential?: string;
    access_token?: string;
    code?: string;
    email?: string;
    name?: string;
    avatar?: string;
    googleId?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("login");

  const openAuthModal = useCallback((mode: "login" | "signup" = "login") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const setSessionUser = useCallback(
    (userData: UserSession) => {
      setUser(userData);
      setToken(userData.token || null);
      if (userData.token) {
        try {
          localStorage.setItem("cinestream_auth_token", userData.token);
        } catch {}
      }
      try {
        localStorage.setItem("cinestream_auth_user", JSON.stringify(userData));
      } catch {}
      closeAuthModal();
    },
    [closeAuthModal]
  );

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

  // Listen for OAuth message events from popup window (e.g. Google OAuth redirect callback)
  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      if (typeof window !== "undefined" && event.origin !== window.location.origin) {
        return;
      }
      if (event.data?.type === "GOOGLE_AUTH_SUCCESS" && event.data?.user) {
        setSessionUser(event.data.user);
      }
    };

    window.addEventListener("message", handleAuthMessage);
    return () => window.removeEventListener("message", handleAuthMessage);
  }, [setSessionUser]);

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

      setSessionUser(data.user);
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

      setSessionUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Network error. Please try again." };
    }
  };

  const loginWithGoogle = async (payload: {
    credential?: string;
    access_token?: string;
    code?: string;
    email?: string;
    name?: string;
    avatar?: string;
    googleId?: string;
  }): Promise<{ success: boolean; error?: string }> => {
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

      setSessionUser(data.user);
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
        setSessionUser,
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
