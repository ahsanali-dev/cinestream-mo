"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    openAuthModal,
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
  const [isGooglePromptOpen, setIsGooglePromptOpen] = useState(false);
  const [googlePromptEmail, setGooglePromptEmail] = useState("");
  const [googlePromptName, setGooglePromptName] = useState("");
  const googleBtnRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMode(authModalMode);
    setError(null);
  }, [authModalMode, isAuthModalOpen]);

  // Initialize Google Identity Services (GSI)
  useEffect(() => {
    if (!isAuthModalOpen) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const initGsi = () => {
      if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
        try {
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

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = "";
            (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
              theme: "filled_black",
              size: "large",
              shape: "rectangular",
              width: 360,
              text: "continue_with",
              logo_alignment: "left",
            });
          }
        } catch (err) {
          console.warn("Google GSI init err:", err);
        }
      }
    };

    initGsi();
    const interval = setInterval(() => {
      if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
        initGsi();
        clearInterval(interval);
      }
    }, 400);

    return () => clearInterval(interval);
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

  const handleGoogleClick = async () => {
    setError(null);

    // Check if Google Client ID is configured in environment
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (googleClientId && typeof window !== "undefined" && (window as any).google?.accounts?.id) {
      setGoogleLoading(true);
      try {
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setIsGooglePromptOpen(true);
            setGoogleLoading(false);
          }
        });
      } catch {
        setIsGooglePromptOpen(true);
        setGoogleLoading(false);
      }
      return;
    }

    // Direct Google Sign-In prompt modal
    setIsGooglePromptOpen(true);
  };

  const handleCustomGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googlePromptEmail.trim()) {
      setError("Please enter your Google account email");
      return;
    }

    setGoogleLoading(true);
    setError(null);

    try {
      const cleanEmail = googlePromptEmail.toLowerCase().trim();
      const displayName = googlePromptName.trim() || cleanEmail.split("@")[0];
      const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(displayName)}`;

      const res = await loginWithGoogle({
        email: cleanEmail,
        name: displayName,
        avatar,
        googleId: `google_${Date.now()}`,
      });

      if (!res.success) {
        setError(res.error || "Google authentication failed");
      } else {
        setIsGooglePromptOpen(false);
      }
    } catch (err: any) {
      setError(err?.message || "Google authentication failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-xl animate-fade-in">
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

        {/* Google Quick Sign-In Prompt View */}
        {isGooglePromptOpen ? (
          <div className="animate-fade-in">
            <div className="p-4 rounded-2xl border border-white/10 bg-white/5 mb-5 text-center">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-md">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
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
              </div>
              <h3 className="text-sm font-bold text-white">Sign In with Google</h3>
              <p className="text-[11px] text-white/50 mt-1">
                Enter your Google account to connect instantly
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleCustomGoogleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-white/60 uppercase tracking-wider mb-1.5">
                  Google Account Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Hunter"
                  value={googlePromptName}
                  onChange={(e) => setGooglePromptName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 focus:border-accent outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-white/60 uppercase tracking-wider mb-1.5">
                  Google Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={googlePromptEmail}
                  onChange={(e) => setGooglePromptEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 focus:border-accent outline-none transition-colors"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGooglePromptOpen(false)}
                  className="flex-1 h-11 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white/70 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={googleLoading}
                  className="flex-1 h-11 rounded-xl bg-accent hover:bg-[#ff7b1a] text-white text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,106,0,0.3)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {googleLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    "Authorize"
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
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

            {/* Native Google Identity Services Button Container */}
            <div ref={googleBtnRef} className="w-full flex justify-center mb-2.5 overflow-hidden rounded-full"></div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 h-12 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all text-xs font-bold text-white cursor-pointer group shadow-sm mb-4"
            >
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
            </button>

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
          </>
        )}
      </div>
    </div>
  );
}
