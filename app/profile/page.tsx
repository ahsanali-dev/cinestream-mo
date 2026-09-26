"use client";
import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user, openAuthModal, logout } = useAuth();

  return (
    <div className="min-h-screen px-4 sm:px-8 md:px-16 py-8 max-w-5xl mx-auto animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            <i className="ph-fill ph-user-circle text-accent"></i>
            User Profile & Account
          </h1>
          <p className="text-xs sm:text-sm text-white/50 mt-1">
            Manage your MoviesZone membership, devices, and preferences
          </p>
        </div>

        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <i className="ph-bold ph-arrow-left"></i>
          Back Home
        </Link>
      </div>

      {user ? (
        /* Logged In View */
        <div className="space-y-6">
          {/* Main User Card */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#121622] to-[#0a0d14] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="relative">
                <img
                  src={
                    user.avatar ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`
                  }
                  alt={user.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-2 border-accent/40 shadow-xl bg-black/40"
                />
                <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-accent text-[9px] font-black uppercase tracking-wider text-white shadow-md">
                  VIP
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    {user.name}
                  </h2>
                  <span className="inline-flex self-center sm:self-auto items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-accent/20 border border-accent/40 text-accent">
                    <i className="ph-fill ph-crown-simple text-xs"></i>
                    VIP Active
                  </span>
                </div>

                <p className="text-sm text-white/60 mt-1 font-mono">{user.email}</p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4 text-xs font-semibold text-white/50">
                  <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-xl border border-white/5">
                    <i className="ph-bold ph-shield-check text-green-400"></i>
                    <span>
                      {user.authProvider === "google" ? "Google Account" : "Password Protected"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-xl border border-white/5">
                    <i className="ph-bold ph-broadcast text-accent"></i>
                    <span>Unlimited 4K HDR Streaming</span>
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="self-center sm:self-start flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                <i className="ph-bold ph-sign-out text-base"></i>
                Sign Out
              </button>
            </div>
          </div>

          {/* Account Details & Cloud Sync Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cloud Sync Status */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
                <i className="ph-bold ph-cloud-arrow-up text-accent"></i>
                Cloud Synchronization
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Your account is active. Your watchlist, watch progress, and custom preferences
                automatically sync across web browsers and the MoviesZone Android APK.
              </p>
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-white/40 font-bold uppercase tracking-wider text-[10px]">
                  Status
                </span>
                <span className="flex items-center gap-1.5 text-green-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
                  Active & Synced
                </span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
                <i className="ph-bold ph-squares-four text-accent"></i>
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Link
                  href="/watchlist"
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-xs font-bold text-white group"
                >
                  <span className="flex items-center gap-2">
                    <i className="ph-fill ph-heart text-accent"></i>
                    View My Watchlist
                  </span>
                  <i className="ph-bold ph-arrow-right text-white/40 group-hover:translate-x-1 transition-transform"></i>
                </Link>
                <Link
                  href="/explore"
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-xs font-bold text-white group"
                >
                  <span className="flex items-center gap-2">
                    <i className="ph-bold ph-compass text-accent"></i>
                    Explore Trending Cinema
                  </span>
                  <i className="ph-bold ph-arrow-right text-white/40 group-hover:translate-x-1 transition-transform"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Guest Mode View */
        <div className="space-y-6">
          {/* Guest Card */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#121622] to-[#0a0d14] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row items-center gap-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 text-4xl shrink-0">
                <i className="ph-bold ph-user"></i>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Guest Explorer
                  </h2>
                  <span className="inline-flex self-center sm:self-auto items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 border border-white/15 text-white/70">
                    Free Guest Mode
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-white/60 mt-1 max-w-xl">
                  You are browsing in Guest Mode. All movies, series, search, and video streams
                  work freely without any login required!
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-5">
                  <button
                    onClick={() => openAuthModal("login")}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-accent hover:bg-[#ff7b1a] text-white text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,106,0,0.3)] active:scale-95 cursor-pointer"
                  >
                    <i className="ph-bold ph-sign-in text-sm"></i>
                    Sign In to Account
                  </button>
                  <button
                    onClick={() => openAuthModal("signup")}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits of signing in */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
              <i className="ph-fill ph-cloud-check text-2xl text-accent mb-2 block"></i>
              <h4 className="text-sm font-bold text-white mb-1">Cross-Device Sync</h4>
              <p className="text-xs text-white/50 leading-relaxed">
                Sync your saved watchlist and watch progress between the web browser and Android app.
              </p>
            </div>
            <div className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
              <i className="ph-fill ph-google-logo text-2xl text-accent mb-2 block"></i>
              <h4 className="text-sm font-bold text-white mb-1">One-Click Google Login</h4>
              <p className="text-xs text-white/50 leading-relaxed">
                Connect seamlessly with your Google credentials or standard email and password.
              </p>
            </div>
            <div className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
              <i className="ph-fill ph-sparkle text-2xl text-accent mb-2 block"></i>
              <h4 className="text-sm font-bold text-white mb-1">100% Free Forever</h4>
              <p className="text-xs text-white/50 leading-relaxed">
                No credit card, no subscription fees. Enjoy pure high-definition streaming.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
