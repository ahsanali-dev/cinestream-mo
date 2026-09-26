"use client";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

function loadGoogleGsiScript(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve();
    if ((window as any).google?.accounts) return resolve();
    const existing = document.getElementById("google-gsi-client");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.id = "google-gsi-client";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    login,
    register,
    loginWithGoogle,
  } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMode(authModalMode);
    setError(null);
  }, [authModalMode, isAuthModalOpen]);

  // Initialize Google Identity Services (GSI)
  useEffect(() => {
    if (!isAuthModalOpen) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    let isMounted = true;

    let isGsiInitialized = false;

    const initGsi = () => {
      if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
        try {
          if (!isGsiInitialized) {
            (window as any).google.accounts.id.initialize({
              client_id: clientId,
              callback: async (response: any) => {
                if (response?.credential) {
                  setGoogleLoading(true);
                  setError(null);
                  const res = await loginWithGoogle({ credential: response.credential });
                  setGoogleLoading(false);
                  if (!res.success) {
                    setError(res.error || "Google sign-in failed.");
                  }
                }
              },
            });
            isGsiInitialized = true;
          }

          if (googleBtnRef.current && isMounted) {
            googleBtnRef.current.innerHTML = "";
            (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
              theme: "filled_black",
              size: "large",
              shape: "rectangular",
              width: 380,
              text: "continue_with",
              logo_alignment: "left",
            });
          }
        } catch (err) {
          console.warn("Google GSI init err:", err);
        }
      }
    };

    loadGoogleGsiScript().then(() => {
      if (isMounted) initGsi();
    });

    const interval = setInterval(() => {
      if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
        initGsi();
        clearInterval(interval);
      }
    }, 400);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthModalOpen, loginWithGoogle]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        if (!email.trim() || !password) {
          setError("Please fill in both email and password.");
          setLoading(false);
          return;
        }
        const res = await login(email.trim(), password);
        if (!res.success) {
          setError(res.error || "Login failed. Check your credentials.");
        }
      } else {
        if (!name.trim()) {
          setError("Please enter your full name.");
          setLoading(false);
          return;
        }
        if (!email.trim() || !password) {
          setError("Please provide a valid email and password.");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          setLoading(false);
          return;
        }
        const res = await register(name.trim(), email.trim(), password);
        if (!res.success) {
          setError(res.error || "Sign up failed. Please try again.");
        }
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Synchronous Direct OAuth popup trigger (Never blocked by browsers)
   */
  const handleDirectOAuthClick = () => {
    setError(null);

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("Google OAuth Client ID is not configured.");
      return;
    }

    try {
      const width = 500;
      const height = 620;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const redirectUri = `${window.location.origin}/api/auth/google/callback`;

      const authUrl =
        "https://accounts.google.com/o/oauth2/v2/auth?" +
        new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: "code",
          scope: "openid email profile",
          prompt: "select_account",
          access_type: "offline",
        }).toString();

      // Synchronous window.open in user click gesture - never blocked!
      const popup = window.open(
        authUrl,
        "google_oauth_popup",
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
      );

      if (!popup) {
        setError("Popup was blocked by your browser. Please allow popups for MoviesZone.");
        return;
      }

      setGoogleLoading(true);
      const checkTimer = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkTimer);
          setGoogleLoading(false);
        }
      }, 500);
    } catch (err: any) {
      setError(err?.message || "Failed to launch Google authorization window.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-xl animate-fade-in">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Modal Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0e1118]/95 p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl transition-all">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#a0a0a0] hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          aria-label="Close modal"
        >
          <i className="ph-bold ph-x text-base"></i>
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex items-center gap-2 mb-2">
            <img
              src="/logo.png"
              alt="MoviesZone"
              className="w-9 h-9 object-contain drop-shadow-[0_0_12px_rgba(255,106,0,0.5)]"
            />
            <span className="text-2xl font-black italic tracking-tighter text-accent">
              MoviesZone
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-xs text-white/50 mt-1 max-w-[280px]">
            {mode === "login"
              ? "Sign in to sync your watchlist and playback across devices"
              : "Join MoviesZone for personalized recommendations & cloud sync"}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex rounded-2xl border border-white/10 bg-white/5 p-1 mb-5">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              mode === "login"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-white/50 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              mode === "signup"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-white/50 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Single Unified Google OAuth Button */}
        <div className="relative w-full h-12 mb-4 rounded-2xl overflow-hidden group">
          {/* Custom Styled Visual Presentation */}
          <button
            type="button"
            onClick={handleDirectOAuthClick}
            disabled={googleLoading}
            className="w-full h-full flex items-center justify-center gap-3 border border-white/15 bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all text-xs font-bold text-white cursor-pointer group shadow-sm disabled:opacity-60"
          >
            {googleLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                <span className="text-white/80">Connecting to Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12c0 2.03.45 3.84 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Invisible Google Identity Services Button Overlay (Receives direct trusted user clicks) */}
          <div
            ref={googleBtnRef}
            className="absolute inset-0 z-10 opacity-0 overflow-hidden cursor-pointer flex items-center justify-center pointer-events-auto"
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
            or with email
          </span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
            <i className="ph-bold ph-warning-circle text-base shrink-0"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Email / Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "signup" && (
            <div>
              <label className="block text-[11px] font-bold text-white/60 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative flex items-center">
                <i className="ph-bold ph-user absolute left-3.5 text-white/40 text-sm"></i>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 focus:border-accent outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-white/60 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative flex items-center">
              <i className="ph-bold ph-envelope absolute left-3.5 text-white/40 text-sm"></i>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 focus:border-accent outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-white/60 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative flex items-center">
              <i className="ph-bold ph-lock-key absolute left-3.5 text-white/40 text-sm"></i>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-10 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 focus:border-accent outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                <i className={`ph-bold ${showPassword ? "ph-eye-slash" : "ph-eye"} text-base`}></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-accent hover:bg-[#ff7b1a] text-white text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,106,0,0.3)] hover:shadow-[0_0_25px_rgba(255,106,0,0.5)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <span>{mode === "login" ? "Sign In to Account" : "Create My Account"}</span>
            )}
          </button>
        </form>

        {/* Guest Friendly Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <p className="text-[11px] text-white/40">
            Don't want to sign in right now?
          </p>
          <button
            type="button"
            onClick={closeAuthModal}
            className="mt-1 text-xs font-bold text-accent hover:underline cursor-pointer"
          >
            Continue Watching as Guest →
          </button>
        </div>
      </div>
    </div>
  );
}
