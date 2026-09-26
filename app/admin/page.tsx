"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Smartphone,
  Users,
  Server,
  Radio,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Save,
  Layers,
  Shield,
  Film,
  Zap,
  Globe,
  Database,
  ArrowUpRight,
  Monitor,
  Flame,
  Lock,
  Unlock,
  LogOut,
  KeyRound,
  Eye,
  EyeOff,
  Wrench,
  Clock,
  Timer,
} from "lucide-react";

interface AppConfig {
  source_mode: "moviebox" | "netmirror" | "both";
  default_source: "moviebox" | "netmirror";
  auto_fallback_enabled: boolean;
  shorts_enabled: boolean;
  family_filter_enabled: boolean;
  maintenance?: {
    enabled: boolean;
    title?: string;
    message?: string;
    back_online_time?: string;
  };
  netmirror: {
    enabled: boolean;
    active_domain: string;
    auth_token: string;
    proxy_enabled: boolean;
    proxy_url: string;
  };
  moviebox: {
    enabled: boolean;
    api_base: string;
    fallback_api: string;
    web_base?: string;
    auth_tokens?: string[];
  };
  updated_at?: string;
}

interface StatsData {
  totalInstalls: number;
  liveUsers: number;
  todayActive: number;
  weeklyActive: number;
  activityTimeline: Array<{ time: string; active: number }>;
  installTrend: Array<{ date: string; installs: number }>;
  deviceBrands: Array<{ name: string; count: number }>;
  osCounts: Record<string, number>;
  recentDevices: Array<{
    deviceId: string;
    deviceModel: string;
    os: string;
    appVersion: string;
    currentScreen: string;
    lastActiveAt: string;
    status: "online" | "offline";
    pingCount: number;
  }>;
  isMongoConnected: boolean;
  isMongoConfigured: boolean;
}

export default function AdminDashboard() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null);
  const [adminToken, setAdminToken] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [stats, setStats] = useState<StatsData | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");
  const [isMintingToken, setIsMintingToken] = useState(false);
  const [isTestingTokens, setIsTestingTokens] = useState(false);
  const [tokenNotice, setTokenNotice] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Check admin session on initial mount
  useEffect(() => {
    const token = sessionStorage.getItem("cinestream_admin_token");
    if (token) {
      setAdminToken(token);
      // Validate token with server
      fetch("/api/admin/auth", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) {
            setIsAdminAuthenticated(true);
          } else {
            sessionStorage.removeItem("cinestream_admin_token");
            setIsAdminAuthenticated(false);
          }
        })
        .catch(() => {
          setIsAdminAuthenticated(false);
        });
    } else {
      setIsAdminAuthenticated(false);
    }
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoginError(data.error || "Invalid Admin Key. Access Denied.");
        setLoginLoading(false);
        return;
      }

      setAdminToken(data.token);
      sessionStorage.setItem("cinestream_admin_token", data.token);
      setIsAdminAuthenticated(true);
      setPasswordInput("");
    } catch (err: any) {
      setLoginError(err?.message || "Failed to authenticate with server.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
    } catch {}
    sessionStorage.removeItem("cinestream_admin_token");
    setAdminToken("");
    setIsAdminAuthenticated(false);
    setStats(null);
    setConfig(null);
  };

  const fetchData = useCallback(async () => {
    if (!adminToken) return;
    try {
      const [statsRes, configRes] = await Promise.all([
        fetch("/api/admin/stats", {
          cache: "no-store",
          headers: { Authorization: `Bearer ${adminToken}` },
        }),
        fetch("/api/app/config", {
          cache: "no-store",
          headers: { Authorization: `Bearer ${adminToken}` },
        }),
      ]);

      if (statsRes.status === 401) {
        setIsAdminAuthenticated(false);
        sessionStorage.removeItem("cinestream_admin_token");
        return;
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.stats);
        }
      }

      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData.success) {
          setConfig(configData.config);
        }
      }
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchData();
    }
  }, [isAdminAuthenticated, fetchData]);

  // Periodic Auto-Refresh
  useEffect(() => {
    if (!isAdminAuthenticated || !autoRefresh) return;
    const interval = setInterval(() => {
      fetchData();
    }, 10000);
    return () => clearInterval(interval);
  }, [isAdminAuthenticated, autoRefresh, fetchData]);

  const handleSaveConfig = async () => {
    if (!config || !adminToken) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/app/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(config),
      });

      if (res.status === 401) {
        setIsAdminAuthenticated(false);
        return;
      }

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 5000);
      }
    } catch (err) {
      console.error("Failed to save config:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleMintToken = async () => {
    if (!adminToken) return;
    setIsMintingToken(true);
    setTokenNotice(null);
    try {
      const res = await fetch("/api/admin/refresh-tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ action: "mint" }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        setTokenNotice({
          text: `✅ Fresh live token minted & tested! Streams: ${data.testResult?.streamsCount || 3}. Saved to database & synced to apps!`,
          type: "success",
        });
        if (config) {
          const current = config.moviebox?.auth_tokens || [];
          const updated = [data.token, ...current.filter((t: string) => t !== data.token)].slice(0, 6);
          setConfig({
            ...config,
            moviebox: {
              ...config.moviebox,
              auth_tokens: updated,
            },
          });
        }
      } else {
        setTokenNotice({
          text: `❌ ${data.error || "Failed to mint token"}`,
          type: "error",
        });
      }
    } catch (e: any) {
      setTokenNotice({ text: `❌ ${e.message}`, type: "error" });
    } finally {
      setIsMintingToken(false);
    }
  };

  const handleTestTokens = async () => {
    if (!adminToken) return;
    setIsTestingTokens(true);
    setTokenNotice(null);
    try {
      const res = await fetch("/api/admin/refresh-tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ action: "test_all" }),
      });
      const data = await res.json();
      if (data.success) {
        setTokenNotice({
          text: `📊 Token Health: ${data.healthyTokens}/${data.totalTokens} active tokens delivering streams!`,
          type: data.healthyTokens > 0 ? "success" : "error",
        });
      } else {
        setTokenNotice({ text: `❌ ${data.error}`, type: "error" });
      }
    } catch (e: any) {
      setTokenNotice({ text: `❌ ${e.message}`, type: "error" });
    } finally {
      setIsTestingTokens(false);
    }
  };

  // Helper for max value in activity timeline
  const maxActivity = stats?.activityTimeline
    ? Math.max(...stats.activityTimeline.map((item) => item.active), 5)
    : 10;

  const maxInstalls = stats?.installTrend
    ? Math.max(...stats.installTrend.map((item) => item.installs), 5)
    : 10;

  // 1. Initial Loading Screen
  if (isAdminAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#080A0F] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF6A00] border-t-transparent" />
      </div>
    );
  }

  // 2. Admin Login Security Gate (Restricted Access)
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-[#080A0F] text-[#F3F4F6] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FF6A00]/20 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0e1118]/95 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF6A00] to-[#FFAA00] flex items-center justify-center shadow-lg shadow-[#FF6A00]/30 mb-4">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              MoviesZone <span className="text-[#FF6A00] font-light">Admin Gate</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1.5 max-w-[280px]">
              Restricted Area. Authorized master key required to view real fleet telemetry and API switchboard.
            </p>
          </div>

          {loginError && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Admin Master Password / Access Key
              </label>
              <div className="relative flex items-center">
                <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter admin password..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full h-12 pl-10 pr-10 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-zinc-600 focus:border-[#FF6A00] outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#FF6A00] to-amber-500 hover:from-[#ff771a] hover:to-amber-400 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-[#FF6A00]/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loginLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Unlock Command Dashboard</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <a href="/" className="text-xs text-zinc-500 hover:text-white transition-colors">
              ← Return to MoviesZone Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated Admin Dashboard
  return (
    <div className="min-h-screen bg-[#080A0F] text-[#F3F4F6] p-4 sm:p-6 md:p-8 font-sans selection:bg-[#FF6A00] selection:text-white">
      {/* Background glowing ambient effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-[#FF6A00]/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[160px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF6A00] to-[#FFAA00] flex items-center justify-center shadow-lg shadow-[#FF6A00]/25">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                MoviesZone <span className="text-[#FF6A00] font-light">Command Fleet</span>
              </h1>
            </div>
            <p className="text-sm text-zinc-400">
              Live Real-Time Fleet Monitor & Multi-Source Dynamic API Switchboard
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* MongoDB status badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                stats?.isMongoConnected
                  ? "bg-emerald-950/60 border-emerald-500/30 text-emerald-400"
                  : stats?.isMongoConfigured
                  ? "bg-amber-950/60 border-amber-500/30 text-amber-400"
                  : "bg-blue-950/60 border-blue-500/30 text-blue-400"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>
                {stats?.isMongoConnected
                  ? "MongoDB Atlas: Connected (100% Real DB)"
                  : stats?.isMongoConfigured
                  ? "MongoDB: Connecting..."
                  : "Memory Store (Ready for Atlas URI)"}
              </span>
            </div>

            {/* Live Refresh Button */}
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#FF6A00]" : ""}`} />
              <span>{lastRefreshed ? `Refreshed ${lastRefreshed}` : "Refresh"}</span>
            </button>

            {/* Admin Logout Button */}
            <button
              onClick={handleAdminLogout}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-bold text-red-400 transition-all active:scale-95 cursor-pointer"
              title="Lock Admin Dashboard"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock / Sign Out</span>
            </button>
          </div>
        </header>

        {/* Global Key Fleet Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Real Installs */}
          <div className="relative overflow-hidden rounded-2xl bg-[#121622]/80 border border-white/10 p-5 shadow-xl hover:border-white/20 transition-all">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-bold uppercase tracking-wider">
              <span>Total Real Devices</span>
              <Smartphone className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{stats?.totalInstalls ?? 0}</span>
              <span className="text-xs font-bold text-emerald-400">Real Devices in DB</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">Live hardware profiles tracked via MongoDB</p>
          </div>

          {/* Card 2: Live Online Right Now */}
          <div className="relative overflow-hidden rounded-2xl bg-[#121622]/80 border border-white/10 p-5 shadow-xl hover:border-white/20 transition-all">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-bold uppercase tracking-wider">
              <span className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live Online Now
              </span>
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-400">{stats?.liveUsers ?? 0}</span>
              <span className="text-xs font-semibold text-zinc-400">active right now</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">Pinging in the last 5 minutes</p>
          </div>

          {/* Card 3: Active Today (DAU) */}
          <div className="relative overflow-hidden rounded-2xl bg-[#121622]/80 border border-white/10 p-5 shadow-xl hover:border-white/20 transition-all">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-bold uppercase tracking-wider">
              <span>Active Today (DAU)</span>
              <Users className="w-4 h-4 text-[#FF6A00]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{stats?.todayActive ?? 0}</span>
              <span className="text-xs text-zinc-400">/ {stats?.weeklyActive ?? 0} weekly</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">Daily unique users browsing & watching</p>
          </div>

          {/* Card 4: Active Streaming Mode */}
          <div className="relative overflow-hidden rounded-2xl bg-[#121622]/80 border border-white/10 p-5 shadow-xl hover:border-white/20 transition-all">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-bold uppercase tracking-wider">
              <span>Active Streaming Mode</span>
              <Zap className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-3">
              <span className="text-xl font-black uppercase text-[#FF6A00]">
                {config?.source_mode === "both"
                  ? "Dual (MovieBox + NetMirror)"
                  : config?.source_mode === "netmirror"
                  ? "NetMirror Direct"
                  : "MovieBox API"}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              {config?.auto_fallback_enabled ? "✓ Auto-Failover Active" : "Direct Mode"}
            </p>
          </div>
        </section>

        {/* Charts Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 24-Hour Timeline */}
          <div className="lg:col-span-2 rounded-2xl bg-[#121622]/80 border border-white/10 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#FF6A00]" />
                  24-Hour Real-Time Activity Pulse
                </h2>
                <p className="text-xs text-zinc-400">Real device sessions recorded in database</p>
              </div>
              <div className="text-[11px] font-mono text-zinc-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                Peak: {maxActivity} active/hr
              </div>
            </div>

            <div className="h-44 flex items-end gap-1.5 pt-6 pb-2 px-2 border-b border-white/5">
              {stats?.activityTimeline && stats.activityTimeline.length > 0 ? (
                stats.activityTimeline.map((item, idx) => {
                  const heightPercent = maxActivity > 0 ? Math.round((item.active / maxActivity) * 100) : 0;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div
                        style={{ height: `${Math.max(heightPercent, 4)}%` }}
                        className={`w-full rounded-t transition-all ${
                          item.active > 0
                            ? "bg-gradient-to-t from-[#FF6A00] to-amber-400 group-hover:brightness-125"
                            : "bg-white/5 group-hover:bg-white/10"
                        }`}
                      />
                      <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-[10px] text-zinc-200 px-1.5 py-0.5 rounded border border-white/20 whitespace-nowrap pointer-events-none z-10 font-mono">
                        {item.time}: {item.active} users
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">
                  Real traffic will chart here automatically as users stream.
                </div>
              )}
            </div>

            <div className="flex justify-between text-[10px] font-mono text-zinc-500 px-1">
              <span>24h ago</span>
              <span>18h ago</span>
              <span>12h ago</span>
              <span>6h ago</span>
              <span>Now</span>
            </div>
          </div>

          {/* 7-Day Trend */}
          <div className="rounded-2xl bg-[#121622]/80 border border-white/10 p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              7-Day Device Onboarding
            </h2>
            <p className="text-xs text-zinc-400">Daily unique installations registered in DB</p>

            <div className="space-y-3 pt-2">
              {stats?.installTrend && stats.installTrend.length > 0 ? (
                stats.installTrend.map((item, idx) => {
                  const widthPercent = maxInstalls > 0 ? Math.round((item.installs / maxInstalls) * 100) : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-zinc-400">{item.date}</span>
                        <span className="font-bold text-white">{item.installs}</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.max(widthPercent, item.installs > 0 ? 8 : 0)}%` }}
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all"
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-zinc-500">
                  No devices recorded in the last 7 days yet.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Remote Engine & API Switchboard (DYNAMIC APIS & SUBMIT BUTTON) */}
        <section className="rounded-2xl bg-[#121622]/80 border border-white/10 p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#FF6A00]" />
                Remote Engine & API Switchboard
              </h2>
              <p className="text-xs text-zinc-400">
                Edit stream providers and API endpoints dynamically. Stored directly in MongoDB Atlas.
              </p>
            </div>

            {/* Top Save Button */}
            <div className="flex items-center gap-3">
              {saveSuccess && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4" />
                  Saved to MongoDB Atlas!
                </div>
              )}
              <button
                onClick={handleSaveConfig}
                disabled={saving || !config}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6A00] to-amber-500 hover:from-[#ff771a] hover:to-amber-400 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-[#FF6A00]/25 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Save className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
                <span>{saving ? "Deploying..." : "Save Configuration"}</span>
              </button>
            </div>
          </div>

          {config && (
            <div className="space-y-6">
              {/* Provider Mode Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Select Active Streaming Provider Mode
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Mode 1: MovieBox Only */}
                  <div
                    onClick={() => setConfig({ ...config, source_mode: "moviebox" })}
                    className={`cursor-pointer rounded-xl p-4 border transition-all ${
                      config.source_mode === "moviebox"
                        ? "bg-[#FF6A00]/15 border-[#FF6A00] shadow-lg shadow-[#FF6A00]/20"
                        : "bg-white/5 border-white/10 hover:border-white/20 opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Film className="w-5 h-5 text-[#FF6A00]" />
                        <span className="font-bold text-white text-sm">MovieBox Only</span>
                      </div>
                      <input
                        type="radio"
                        checked={config.source_mode === "moviebox"}
                        onChange={() => {}}
                        className="accent-[#FF6A00]"
                      />
                    </div>
                    <p className="text-xs text-zinc-400 mt-2">
                      Direct MP4 progressive videos (1080p, 720p, 480p). Universal global catalog.
                    </p>
                  </div>

                  {/* Mode 2: NetMirror Only */}
                  <div
                    onClick={() => setConfig({ ...config, source_mode: "netmirror" })}
                    className={`cursor-pointer rounded-xl p-4 border transition-all ${
                      config.source_mode === "netmirror"
                        ? "bg-[#FF6A00]/15 border-[#FF6A00] shadow-lg shadow-[#FF6A00]/20"
                        : "bg-white/5 border-white/10 hover:border-white/20 opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-400" />
                        <span className="font-bold text-white text-sm">NetMirror Only</span>
                      </div>
                      <input
                        type="radio"
                        checked={config.source_mode === "netmirror"}
                        onChange={() => {}}
                        className="accent-[#FF6A00]"
                      />
                    </div>
                    <p className="text-xs text-zinc-400 mt-2">
                      Direct HLS (.m3u8) streams with multi-language audio (Hindi, English).
                    </p>
                  </div>

                  {/* Mode 3: Both (Dual Hybrid Engine) */}
                  <div
                    onClick={() => setConfig({ ...config, source_mode: "both" })}
                    className={`cursor-pointer rounded-xl p-4 border transition-all ${
                      config.source_mode === "both"
                        ? "bg-gradient-to-br from-[#FF6A00]/20 to-purple-600/20 border-emerald-500 shadow-lg shadow-emerald-500/20"
                        : "bg-white/5 border-white/10 hover:border-white/20 opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-emerald-400" />
                        <span className="font-bold text-white text-sm">
                          Both (Dual Hybrid Engine)
                        </span>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-500 text-black px-1.5 py-0.5 rounded">
                        RECOMMENDED
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 mt-2">
                      Server switcher in player. If MovieBox fails, app auto-plays NetMirror!
                    </p>
                  </div>
                </div>
              </div>

              {/* Dynamic Feature Controls */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/30 to-blue-950/30 border border-purple-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    Fleet Dynamic Feature Flags & Safety Controls
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">Applies to Mobile Apps Instantly</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Toggle 1: Shorts */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    config.source_mode === "netmirror"
                      ? "bg-zinc-900/60 border-zinc-800 opacity-60"
                      : config.shorts_enabled !== false
                      ? "bg-purple-900/20 border-purple-500/40"
                      : "bg-black/30 border-white/5"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Flame className={`w-5 h-5 ${config.shorts_enabled !== false && config.source_mode !== "netmirror" ? "text-[#FF6A00]" : "text-zinc-500"}`} />
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            Shorts & Snips Tab
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            {config.source_mode === "netmirror"
                              ? "NetMirror has no shorts API. Tab automatically hidden."
                              : config.shorts_enabled !== false
                              ? "Shorts tab is visible in bottom navigation."
                              : "Shorts tab is hidden remotely from app."}
                          </div>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer ml-3">
                        <input
                          type="checkbox"
                          disabled={config.source_mode === "netmirror"}
                          checked={config.shorts_enabled !== false && config.source_mode !== "netmirror"}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              shorts_enabled: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF6A00]" />
                      </label>
                    </div>
                  </div>

                  {/* Toggle 2: Family Safety */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    config.family_filter_enabled !== false
                      ? "bg-emerald-950/20 border-emerald-500/40"
                      : "bg-amber-950/20 border-amber-500/30"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Shield className={`w-5 h-5 ${config.family_filter_enabled !== false ? "text-emerald-400" : "text-amber-400"}`} />
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            Family Safe Search & 18+ Filter
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            {config.family_filter_enabled !== false
                              ? "LOCKED / ENFORCED: Mobile users CANNOT disable 18+ filter in app settings."
                              : "USER OVERRIDE ALLOWED: Mobile users can freely toggle filter ON/OFF."}
                          </div>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer ml-3">
                        <input
                          type="checkbox"
                          checked={config.family_filter_enabled !== false}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              family_filter_enabled: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* App Under Maintenance Mode Card */}
              <div className={`p-5 rounded-2xl border transition-all ${
                config.maintenance?.enabled
                  ? "bg-rose-950/30 border-rose-500/50 shadow-lg shadow-rose-950/40"
                  : "bg-black/40 border-white/10"
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${
                      config.maintenance?.enabled
                        ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                        : "bg-zinc-800/60 border-zinc-700/50 text-zinc-400"
                    }`}>
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        Mobile App Under Maintenance Mode
                        {config.maintenance?.enabled && (
                          <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-rose-500 text-white animate-pulse">
                            Active Lockdown
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        Locks all user apps with a full-screen maintenance overlay and live countdown timer.
                      </div>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer ml-3">
                    <input
                      type="checkbox"
                      checked={Boolean(config.maintenance?.enabled)}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          maintenance: {
                            ...(config.maintenance || {
                              title: "Site & App Under Maintenance",
                              message: "Our servers are currently undergoing scheduled maintenance and upgrades. MoviesZone will be back online shortly!",
                              back_online_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                            }),
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500" />
                  </label>
                </div>

                {config.maintenance?.enabled && (
                  <div className="mt-4 pt-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Maintenance Title */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                          Overlay Heading
                        </label>
                        <input
                          type="text"
                          value={config.maintenance?.title || ""}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              maintenance: {
                                ...(config.maintenance as any),
                                title: e.target.value,
                              },
                            })
                          }
                          placeholder="e.g. Site & App Under Maintenance"
                          className="w-full px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      {/* Expected Back Online Time */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-rose-400" />
                            Expected Back Online (Countdown Target)
                          </label>
                          <span className="text-[10px] text-zinc-500">
                            {config.maintenance?.back_online_time ? new Date(config.maintenance.back_online_time).toLocaleString() : ""}
                          </span>
                        </div>
                        <input
                          type="datetime-local"
                          value={
                            config.maintenance?.back_online_time
                              ? new Date(config.maintenance.back_online_time).toISOString().slice(0, 16)
                              : ""
                          }
                          onChange={(e) => {
                            if (e.target.value) {
                              setConfig({
                                ...config,
                                maintenance: {
                                  ...(config.maintenance as any),
                                  back_online_time: new Date(e.target.value).toISOString(),
                                },
                              });
                            }
                          }}
                          className="w-full px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] text-zinc-400 font-medium">Quick Presets:</span>
                      {[
                        { label: "+6 Hours", hours: 6 },
                        { label: "+12 Hours", hours: 12 },
                        { label: "+1 Day", hours: 24 },
                        { label: "+2 Days", hours: 48 },
                        { label: "+3 Days", hours: 72 },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            const newDate = new Date(Date.now() + preset.hours * 60 * 60 * 1000).toISOString();
                            setConfig({
                              ...config,
                              maintenance: {
                                ...(config.maintenance as any),
                                back_online_time: newDate,
                              },
                            });
                          }}
                          className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/5 transition"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {/* Notice Message */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                        Notice / Explanation Message
                      </label>
                      <textarea
                        rows={2}
                        value={config.maintenance?.message || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            maintenance: {
                              ...(config.maintenance as any),
                              message: e.target.value,
                            },
                          })
                        }
                        placeholder="Explain why servers are undergoing maintenance..."
                        className="w-full px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced Parameters Configuration Inputs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                {/* NetMirror Parameters */}
                <div className="space-y-4 p-5 rounded-2xl bg-black/40 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      NetMirror Edge & Domain Settings
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-[11px] text-zinc-400">Proxy via CF Worker</span>
                      <input
                        type="checkbox"
                        checked={config.netmirror?.proxy_enabled ?? true}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            netmirror: {
                              ...config.netmirror,
                              proxy_enabled: e.target.checked,
                            },
                          })
                        }
                        className="accent-[#FF6A00]"
                      />
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400">
                      Active NetMirror Domain (Changes dynamically)
                    </label>
                    <input
                      type="text"
                      value={config.netmirror?.active_domain || ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          netmirror: {
                            ...config.netmirror,
                            active_domain: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-[#080A0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF6A00]"
                      placeholder="https://net77.cc"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400">
                      NetMirror Session Auth Token (Optional Cookie)
                    </label>
                    <input
                      type="text"
                      value={config.netmirror?.auth_token || ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          netmirror: {
                            ...config.netmirror,
                            auth_token: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-[#080A0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#FF6A00]"
                      placeholder="session cookie..."
                    />
                  </div>
                </div>

                {/* MovieBox Parameters */}
                <div className="space-y-4 p-5 rounded-2xl bg-black/40 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400 flex items-center gap-2">
                      <Server className="w-4 h-4" />
                      MovieBox API Infrastructure
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-[11px] text-zinc-400">Auto-Fallback on Error</span>
                      <input
                        type="checkbox"
                        checked={config.auto_fallback_enabled ?? true}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            auto_fallback_enabled: e.target.checked,
                          })
                        }
                        className="accent-emerald-500"
                      />
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400">
                      Primary MovieBox API Endpoint
                    </label>
                    <input
                      type="text"
                      value={config.moviebox?.api_base || ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          moviebox: {
                            ...config.moviebox,
                            api_base: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-[#080A0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF6A00]"
                      placeholder="https://h5-api.aoneroom.com"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400">
                      Fallback Mirror API Endpoint
                    </label>
                    <input
                      type="text"
                      value={config.moviebox?.fallback_api || ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          moviebox: {
                            ...config.moviebox,
                            fallback_api: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-[#080A0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF6A00]"
                      placeholder="https://filmboom.top"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400">
                      MovieBox Web & Referer Domain (Slug Gateway)
                    </label>
                    <input
                      type="text"
                      value={config.moviebox?.web_base || ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          moviebox: {
                            ...config.moviebox,
                            web_base: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-[#080A0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF6A00]"
                      placeholder="https://moviebox.ac"
                    />
                  </div>

                  {/* Dynamic MovieBox Token Pool with Live Auto-Mint */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        Live Auth Tokens Pool ({(config.moviebox?.auth_tokens || []).length} active)
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleTestTokens}
                          disabled={isTestingTokens || !config}
                          className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${isTestingTokens ? "animate-spin" : ""}`} />
                          Verify All
                        </button>
                        <button
                          type="button"
                          onClick={handleMintToken}
                          disabled={isMintingToken || !config}
                          className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                        >
                          <Zap className={`w-3 h-3 ${isMintingToken ? "animate-bounce" : ""}`} />
                          Auto-Mint Fresh Token
                        </button>
                      </div>
                    </div>

                    {tokenNotice && (
                      <div
                        className={`text-xs px-3.5 py-2.5 rounded-xl border flex items-center gap-2 ${
                          tokenNotice.type === "success"
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            : "bg-red-500/10 border-red-500/30 text-red-300"
                        }`}
                      >
                        <span className="text-sm">{tokenNotice.type === "success" ? "⚡" : "⚠️"}</span>
                        <span>{tokenNotice.text}</span>
                      </div>
                    )}

                    <textarea
                      rows={3}
                      value={(config.moviebox?.auth_tokens || []).join("\n")}
                      onChange={(e) => {
                        const lines = e.target.value
                          .split("\n")
                          .map((l) => l.trim())
                          .filter((l) => l.length > 20);
                        setConfig({
                          ...config,
                          moviebox: {
                            ...config.moviebox,
                            auth_tokens: lines,
                          },
                        });
                      }}
                      className="w-full bg-[#080A0F] border border-white/10 rounded-xl px-4 py-2.5 text-[11px] text-zinc-300 font-mono focus:outline-none focus:border-[#FF6A00]"
                      placeholder="One JWT token per line (or click Auto-Mint Fresh Token above)..."
                    />
                    <p className="text-[10px] text-zinc-500">
                      Devices automatically rotate through this verified token pool. If any token expires, devices seamlessly failover without app updates or user interruption.
                    </p>
                  </div>
                </div>
              </div>

              {/* Dedicated Big Submit / Save Button directly beneath the inputs! */}
              <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-[#FF6A00]/10 via-amber-500/5 to-transparent p-5 rounded-2xl border border-[#FF6A00]/30 shadow-lg">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#FF6A00]/20 border border-[#FF6A00]/30 flex items-center justify-center text-[#FF6A00] shrink-0 shadow-md">
                    <Save className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Save Changes to MongoDB Atlas</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Submitting updates your remote database immediately. All active mobile apps will consume these endpoints.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {saveSuccess && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-2.5 rounded-xl border border-emerald-500/30">
                      <CheckCircle2 className="w-4 h-4" />
                      Saved & Broadcasted!
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    disabled={saving || !config}
                    className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#FF6A00] to-amber-500 hover:from-[#ff771a] hover:to-amber-400 active:scale-95 text-white text-xs font-black uppercase tracking-wider shadow-xl shadow-[#FF6A00]/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
                    <span>{saving ? "Saving to Database..." : "SUBMIT / APPLY CONFIGURATION"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Live Device Fleet Table (100% REAL DATA FROM MONGODB) */}
        <section className="rounded-2xl bg-[#121622]/80 border border-white/10 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Monitor className="w-5 h-5 text-blue-400" />
                Live Active Connected Devices
              </h2>
              <p className="text-xs text-zinc-400">
                100% Real devices communicating with MoviesZone backend services (from MongoDB Atlas)
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              Total Real Devices: {stats?.recentDevices?.length || 0}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 text-zinc-400 uppercase font-mono tracking-wider">
                <tr>
                  <th className="pb-3 pl-2">Status</th>
                  <th className="pb-3">Device Model</th>
                  <th className="pb-3">OS</th>
                  <th className="pb-3">App Version</th>
                  <th className="pb-3">Current Screen</th>
                  <th className="pb-3">Total Pings</th>
                  <th className="pb-3 pr-2">Last Seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {stats?.recentDevices && stats.recentDevices.length > 0 ? (
                  stats.recentDevices.map((device, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 pl-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            device.status === "online"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              device.status === "online" ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
                            }`}
                          />
                          {device.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-white">{device.deviceModel}</td>
                      <td className="py-3 text-zinc-400">{device.os}</td>
                      <td className="py-3 text-zinc-400">{device.appVersion}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded bg-white/5 text-zinc-300 text-[11px]">
                          {device.currentScreen}
                        </span>
                      </td>
                      <td className="py-3 text-zinc-400">{device.pingCount}</td>
                      <td className="py-3 pr-2 text-zinc-400">
                        {new Date(device.lastActiveAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500 text-xs font-sans">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Smartphone className="w-8 h-8 text-zinc-600 mb-1" />
                        <p className="font-bold text-zinc-400">No Real Devices Connected Yet</p>
                        <p className="text-[11px] text-zinc-500 max-w-sm">
                          All mock data has been purged. Real mobile devices and user pings will be recorded in MongoDB Atlas and displayed here automatically.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
