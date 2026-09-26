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
} from "lucide-react";

interface AppConfig {
  source_mode: "moviebox" | "netmirror" | "both";
  default_source: "moviebox" | "netmirror";
  auto_fallback_enabled: boolean;
  shorts_enabled: boolean;
  family_filter_enabled: boolean;
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
  const [stats, setStats] = useState<StatsData | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, configRes] = await Promise.all([
        fetch("/api/admin/stats", { cache: "no-store" }),
        fetch("/api/app/config", { cache: "no-store" }),
      ]);

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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Periodic Auto-Refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData();
    }, 10000); // 10s auto-refresh for live user accuracy
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const handleSaveConfig = async () => {
    if (!config) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/app/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      }
    } catch (err) {
      console.error("Failed to save config:", err);
    } finally {
      setSaving(false);
    }
  };

  // Helper for max value in activity timeline
  const maxActivity = stats?.activityTimeline
    ? Math.max(...stats.activityTimeline.map((item) => item.active), 5)
    : 10;

  const maxInstalls = stats?.installTrend
    ? Math.max(...stats.installTrend.map((item) => item.installs), 5)
    : 10;

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
              Real-time Mobile App Fleet Monitor & Multi-Source Dynamic API Controller
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
                  ? "MongoDB Atlas: Connected"
                  : stats?.isMongoConfigured
                  ? "MongoDB: Connecting..."
                  : "Memory Store (Ready for Atlas URI)"}
              </span>
            </div>

            {/* Live Refresh Button */}
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#FF6A00]" : ""}`} />
              <span>{lastRefreshed ? `Refreshed ${lastRefreshed}` : "Refresh"}</span>
            </button>
          </div>
        </header>

        {/* 4 Main KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Installs */}
          <div className="relative overflow-hidden rounded-2xl bg-[#121622]/80 border border-white/10 p-5 shadow-xl hover:border-white/20 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">
                Total Installs
              </span>
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Smartphone className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white">
                {stats?.totalInstalls.toLocaleString() ?? "..."}
              </span>
              <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                Devices Installed
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">Unique mobile apps installed across all phones</p>
          </div>

          {/* Card 2: Live Online Users (Glowing green pulse) */}
          <div className="relative overflow-hidden rounded-2xl bg-[#121622]/80 border border-emerald-500/20 p-5 shadow-xl hover:border-emerald-500/40 transition-all group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 tracking-wider uppercase flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                Live Online Now
              </span>
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Radio className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white">
                {stats?.liveUsers.toLocaleString() ?? "..."}
              </span>
              <span className="text-xs font-medium text-emerald-400">active right now</span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">Pinging in the last 5 minutes</p>
          </div>

          {/* Card 3: Today Active (DAU) */}
          <div className="relative overflow-hidden rounded-2xl bg-[#121622]/80 border border-white/10 p-5 shadow-xl hover:border-white/20 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">
                Active Today (DAU)
              </span>
              <div className="w-9 h-9 rounded-lg bg-[#FF6A00]/10 flex items-center justify-center text-[#FF6A00]">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white">
                {stats?.todayActive.toLocaleString() ?? "..."}
              </span>
              <span className="text-xs font-medium text-zinc-400">
                / {stats?.weeklyActive.toLocaleString() ?? "0"} weekly
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">Daily unique users browsing & watching</p>
          </div>

          {/* Card 4: Active Engine Status */}
          <div className="relative overflow-hidden rounded-2xl bg-[#121622]/80 border border-white/10 p-5 shadow-xl hover:border-white/20 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">
                Active Streaming Mode
              </span>
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Zap className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-xl sm:text-2xl font-black uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#FF6A00] to-amber-400">
                {config?.source_mode === "both"
                  ? "DUAL (MovieBox + NetMirror)"
                  : config?.source_mode === "netmirror"
                  ? "NETMIRROR ONLY"
                  : "MOVIEBOX ONLY"}
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              {config?.auto_fallback_enabled ? "✓ Auto-Failover Active" : "Manual Mode"}
            </p>
          </div>
        </section>

        {/* Dynamic Analytics Visual Graphs Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart: 24h Activity Timeline */}
          <div className="lg:col-span-2 rounded-2xl bg-[#121622]/80 border border-white/10 p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#FF6A00]" />
                  24-Hour Fleet Activity Pulse
                </h2>
                <p className="text-xs text-zinc-400">
                  Real-time device usage and active sessions over the past 24 hours
                </p>
              </div>
              <span className="text-xs font-medium text-zinc-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                Peak: {maxActivity} active/hr
              </span>
            </div>

            {/* SVG Interactive Area & Bar Chart */}
            <div className="h-56 w-full pt-4 relative flex items-end gap-1.5 sm:gap-2">
              {stats?.activityTimeline.map((item, idx) => {
                const heightPercent = maxActivity > 0 ? (item.active / maxActivity) * 100 : 0;
                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 border border-white/10 text-white text-[10px] py-1 px-2 rounded-md pointer-events-none whitespace-nowrap shadow-xl z-20">
                      {item.time}: <span className="font-bold text-[#FF6A00]">{item.active} users</span>
                    </div>

                    {/* Bar */}
                    <div
                      style={{ height: `${Math.max(heightPercent, 6)}%` }}
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        item.active > 0
                          ? "bg-gradient-to-t from-[#FF6A00]/40 to-[#FF6A00] group-hover:from-[#FF6A00]/60 group-hover:to-amber-400"
                          : "bg-white/5"
                      }`}
                    />
                    {/* Hour label on every 4th bar */}
                    {idx % 4 === 0 && (
                      <span className="text-[9px] text-zinc-500 mt-2 truncate w-full text-center">
                        {item.time}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Secondary Chart: 7-Day Installs Trend */}
          <div className="rounded-2xl bg-[#121622]/80 border border-white/10 p-6 shadow-xl space-y-4 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                7-Day New Installs
              </h2>
              <p className="text-xs text-zinc-400">Daily new app downloads & first-time setups</p>
            </div>

            <div className="space-y-3 my-auto pt-2">
              {stats?.installTrend.map((item, idx) => {
                const percent = maxInstalls > 0 ? (item.installs / maxInstalls) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-zinc-400">{item.date}</span>
                      <span className="text-white font-bold">{item.installs}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        style={{ width: `${Math.max(percent, 8)}%` }}
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-white/5 flex justify-between text-xs text-zinc-400">
              <span>Weekly Total</span>
              <span className="text-white font-bold">
                {stats?.installTrend.reduce((acc, curr) => acc + curr.installs, 0)} Installs
              </span>
            </div>
          </div>
        </section>

        {/* API & Remote Switchboard Control Center */}
        <section className="rounded-2xl bg-[#121622]/80 border border-white/10 p-6 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Shield className="w-6 h-6 text-[#FF6A00]" />
                Remote Engine & API Switchboard
              </h2>
              <p className="text-xs text-zinc-400">
                Change streaming providers and endpoints remotely without uploading a new APK build
              </p>
            </div>

            <div className="flex items-center gap-3">
              {saveSuccess && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4" />
                  Deployed to All Apps!
                </div>
              )}
              <button
                onClick={handleSaveConfig}
                disabled={saving || !config}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6A00] to-amber-500 hover:from-[#ff771a] hover:to-amber-400 text-white text-xs font-bold shadow-lg shadow-[#FF6A00]/25 transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
                <span>{saving ? "Deploying..." : "Save & Broadcast to Apps"}</span>
              </button>
            </div>
          </div>

          {config && (
            <div className="space-y-6">
              {/* Provider Mode Selector (3 Big Cards) */}
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
                      Direct HLS (.m3u8) streams with authentic multi-language audio (Hindi, English).
                    </p>
                  </div>

                  {/* Mode 3: Both (Dual with Auto-Failover) */}
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
                      User gets server switcher in player. If MovieBox fails, app auto-plays NetMirror
                      instantly!
                    </p>
                  </div>
                </div>
              </div>

              {/* Dynamic Feature Controls (Shorts & Family Safety) */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/30 to-blue-950/30 border border-purple-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    Fleet Dynamic Feature Flags & Safety Controls
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">Applies to Mobile Apps Instantly</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Toggle 1: Shorts Screen Dynamic Control */}
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
                            {config.source_mode === "netmirror" && (
                              <span className="text-[9px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                                Auto-Hidden in NetMirror Mode
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            {config.source_mode === "netmirror"
                              ? "NetMirror has no shorts API. Tab automatically vanishes from user app."
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

                  {/* Toggle 2: Family Safety / Adult Keyword Filter */}
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
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              config.family_filter_enabled !== false
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-amber-500/20 text-amber-400"
                            }`}>
                              {config.family_filter_enabled !== false ? "ACTIVE (PROTECTED)" : "DISABLED (ALL PASS)"}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            {config.family_filter_enabled !== false
                              ? "Blocks explicit keywords, adult queries & adult catalogs across search and feed."
                              : "Filters bypassed: All search queries and results allowed without restrictions."}
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

              {/* Advanced Parameters Configuration */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                {/* NetMirror Parameters */}
                <div className="space-y-4 p-4 rounded-xl bg-black/40 border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      NetMirror Edge & Domain Settings
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-[11px] text-zinc-400">Proxy via CF Worker</span>
                      <input
                        type="checkbox"
                        checked={config.netmirror.proxy_enabled}
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

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-400">
                      Active NetMirror Domain (Changes dynamically)
                    </label>
                    <input
                      type="text"
                      value={config.netmirror.active_domain}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          netmirror: {
                            ...config.netmirror,
                            active_domain: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-[#080A0F] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6A00]"
                      placeholder="https://net77.cc"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-400">
                      NetMirror Session Auth Token (Optional Cookie)
                    </label>
                    <input
                      type="text"
                      value={config.netmirror.auth_token}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          netmirror: {
                            ...config.netmirror,
                            auth_token: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-[#080A0F] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#FF6A00]"
                    />
                  </div>
                </div>

                {/* MovieBox Parameters */}
                <div className="space-y-4 p-4 rounded-xl bg-black/40 border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400 flex items-center gap-2">
                      <Server className="w-4 h-4" />
                      MovieBox API Infrastructure
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-[11px] text-zinc-400">Auto-Fallback on Error</span>
                      <input
                        type="checkbox"
                        checked={config.auto_fallback_enabled}
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

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-400">
                      Primary MovieBox API Endpoint
                    </label>
                    <input
                      type="text"
                      value={config.moviebox.api_base}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          moviebox: {
                            ...config.moviebox,
                            api_base: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-[#080A0F] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6A00]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-400">
                      Fallback Mirror API Endpoint
                    </label>
                    <input
                      type="text"
                      value={config.moviebox.fallback_api}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          moviebox: {
                            ...config.moviebox,
                            fallback_api: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-[#080A0F] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6A00]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Live Device Fleet Table */}
        <section className="rounded-2xl bg-[#121622]/80 border border-white/10 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Monitor className="w-5 h-5 text-blue-400" />
                Live Active Connected Devices
              </h2>
              <p className="text-xs text-zinc-400">
                Devices currently communicating with MoviesZone backend services
              </p>
            </div>
            <span className="text-xs text-zinc-400">
              Showing last {stats?.recentDevices.length ?? 0} active devices
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-white/5 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3 rounded-l-lg">Status</th>
                  <th className="p-3">Device Model</th>
                  <th className="p-3">OS</th>
                  <th className="p-3">App Version</th>
                  <th className="p-3">Current Screen</th>
                  <th className="p-3">Total Pings</th>
                  <th className="p-3 rounded-r-lg">Last Seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats?.recentDevices.map((dev, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3">
                      {dev.status === "online" ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          ONLINE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-400">
                          IDLE
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-white">{dev.deviceModel}</td>
                    <td className="p-3 text-zinc-400">{dev.os}</td>
                    <td className="p-3 font-mono text-[11px] text-zinc-400">v{dev.appVersion}</td>
                    <td className="p-3">
                      <span className="bg-white/5 px-2 py-0.5 rounded text-[11px] text-zinc-300">
                        {dev.currentScreen}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-zinc-400">{dev.pingCount}</td>
                    <td className="p-3 text-zinc-400">
                      {new Date(dev.lastActiveAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
