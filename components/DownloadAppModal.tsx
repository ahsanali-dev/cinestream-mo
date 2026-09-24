"use client";
import React from "react";
import { useInstallModal } from "@/context/InstallModalContext";

export const ANDROID_APK_DOWNLOAD_URL =
  "https://github.com/ahsanali-dev/movies-zone-releases/releases/latest/download/movieszone.apk";

export default function DownloadAppModal() {
  const {
    isOpen,
    activePlatform,
    setActivePlatform,
    closeInstallModal,
    deferredPrompt,
    promptPWAInstall,
  } = useInstallModal();

  if (!isOpen) return null;

  return (
    <div
      onClick={closeInstallModal}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#080A0F]/95 p-6 sm:p-8 shadow-[0_0_50px_rgba(255,106,0,0.15)] animate-scale-in text-left overflow-hidden"
      >
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-accent/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#FFAA00]/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        {/* Close Button */}
        <button
          type="button"
          onClick={closeInstallModal}
          className="absolute top-4 right-4 h-9 w-9 flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer z-10"
          aria-label="Close dialog"
        >
          <i className="ph-bold ph-x text-base"></i>
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse"></span>
            Official Android App
          </span>
          <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
            80.6 MB
          </span>
        </div>

        {/* App Title & Brand Info */}
        <div className="flex items-center gap-4 mb-4">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-accent to-[#ff8c00] flex items-center justify-center shadow-xl shadow-accent/25 border border-white/20 shrink-0">
            <img
              src="/logo.png"
              alt="MoviesZone Logo"
              className="w-10 h-10 object-contain drop-shadow-md"
            />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight text-white">
              MoviesZone <span className="text-accent">App</span>
            </h3>
            <p className="text-xs font-bold text-accent uppercase tracking-wider">
              100% Ad-Free • Hindi Dubbed • Full HD
            </p>
          </div>
        </div>

        {/* Main Value Proposition Pitch (in Clear English) */}
        <p className="text-xs sm:text-sm text-white/75 leading-relaxed mb-5">
          Web streaming may experience occasional video ads or limited Hindi audio.
          Download the official <strong className="text-white font-bold">MoviesZone Android App</strong> for
          seamless <span className="text-accent font-bold">100% ad-free cinema</span>, guaranteed
          Hindi Dubbed titles, and ultra-fast buffer-free streaming.
        </p>

        {/* 3 Key Feature Pills */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center text-center gap-1">
            <i className="ph-fill ph-translate text-accent text-lg"></i>
            <span className="text-[10px] font-black uppercase text-white tracking-wide">Hindi Dubbed</span>
            <span className="text-[9px] text-white/50">Multi-Audio Included</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center text-center gap-1">
            <i className="ph-fill ph-shield-check text-accent text-lg"></i>
            <span className="text-[10px] font-black uppercase text-white tracking-wide">100% Ad-Free</span>
            <span className="text-[9px] text-white/50">Zero Popups / Interruption</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center text-center gap-1">
            <i className="ph-fill ph-lightning text-accent text-lg"></i>
            <span className="text-[10px] font-black uppercase text-white tracking-wide">Smooth 1080p</span>
            <span className="text-[9px] text-white/50">Ultra-Fast Playback</span>
          </div>
        </div>

        {/* Platform Selection Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/50 rounded-2xl border border-white/10 mb-5">
          <button
            type="button"
            onClick={() => setActivePlatform("android")}
            className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activePlatform === "android"
                ? "bg-accent text-white shadow-lg shadow-accent/30 font-black"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            <i className="ph-bold ph-android-logo text-sm"></i>
            <span>Android (APK)</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePlatform("ios")}
            className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activePlatform === "ios"
                ? "bg-accent text-white shadow-lg shadow-accent/30 font-black"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            <i className="ph-bold ph-apple-logo text-sm"></i>
            <span>Apple (iOS)</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePlatform("desktop")}
            className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activePlatform === "desktop"
                ? "bg-accent text-white shadow-lg shadow-accent/30 font-black"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            <i className="ph-bold ph-laptop text-sm"></i>
            <span>Desktop</span>
          </button>
        </div>

        {/* Platform Specific Action Content */}
        <div className="space-y-4 min-h-[140px] flex flex-col justify-center">
          {/* TAB 1: ANDROID NATIVE APK DOWNLOAD */}
          {activePlatform === "android" && (
            <div className="space-y-3 animate-fade-in">
              <button
                type="button"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = ANDROID_APK_DOWNLOAD_URL;
                  link.setAttribute("download", "MoviesZone.apk");
                  link.setAttribute("target", "_blank");
                  link.setAttribute("rel", "noopener noreferrer");
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-accent to-[#ff7b1a] hover:from-[#ff7b1a] hover:to-accent text-white font-black italic uppercase text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(255,106,0,0.6)] hover:shadow-[0_0_35px_rgba(255,106,0,0.8)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border border-accent/40 text-center"
              >
                <i className="ph-bold ph-download-simple text-lg"></i>
                <span>Download Android App (.APK)</span>
              </button>

              <div className="flex items-center justify-between text-[10px] text-white/50 px-1">
                <span className="flex items-center gap-1">
                  <i className="ph-bold ph-shield-check text-emerald-400"></i>
                  Safe &amp; Virus-Free
                </span>
                <span>Direct GitHub CDN Release</span>
                <span>Requires Android 7.0+</span>
              </div>
            </div>
          )}

          {/* TAB 2: APPLE IOS (PWA / ADD TO HOME SCREEN) */}
          {activePlatform === "ios" && (
            <div className="space-y-3 text-xs text-white/80 animate-fade-in bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-1">
                <span className="text-[11px] font-black uppercase text-accent tracking-wider flex items-center gap-1.5">
                  <i className="ph-fill ph-apple-logo text-sm"></i>
                  Install on iPhone &amp; iPad
                </span>
                <span className="text-[9px] bg-white/10 text-white/70 px-2 py-0.5 rounded-full font-bold uppercase">
                  PWA Web App
                </span>
              </div>

              <div className="space-y-2.5 pt-1">
                <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
                  <span className="h-6 w-6 rounded-lg bg-accent text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md">1</span>
                  <p className="leading-snug text-xs text-white/90">
                    Open in <strong className="text-white">Safari</strong> and tap the <strong className="text-accent">Share</strong> icon <i className="ph-bold ph-export text-accent text-sm align-middle inline-block mx-0.5"></i> at the bottom.
                  </p>
                </div>

                <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
                  <span className="h-6 w-6 rounded-lg bg-accent text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md">2</span>
                  <p className="leading-snug text-xs text-white/90">
                    Scroll down and tap <strong className="text-accent">"Add to Home Screen"</strong> <i className="ph-bold ph-plus-square text-accent text-sm align-middle inline-block mx-0.5"></i>.
                  </p>
                </div>

                <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
                  <span className="h-6 w-6 rounded-lg bg-accent text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md">3</span>
                  <p className="leading-snug text-xs text-white/90">
                    Tap <strong className="text-accent">"Add"</strong> in the top-right corner to launch full-screen cinema app.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DESKTOP PWA INSTALL */}
          {activePlatform === "desktop" && (
            <div className="space-y-3 animate-fade-in">
              {deferredPrompt ? (
                <button
                  type="button"
                  onClick={promptPWAInstall}
                  className="w-full py-3.5 px-6 rounded-2xl bg-accent hover:bg-[#ff7b1a] text-white font-black italic uppercase text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2.5 shadow-[0_0_20px_rgba(255,106,0,0.5)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                >
                  <i className="ph-bold ph-laptop text-lg"></i>
                  <span>Install MoviesZone Desktop App</span>
                </button>
              ) : (
                <div className="space-y-2 text-xs text-white/80 bg-white/5 p-3.5 rounded-2xl border border-white/10">
                  <div className="flex items-start gap-2.5">
                    <span className="h-5 w-5 rounded-md bg-accent/20 text-accent font-black text-[10px] flex items-center justify-center shrink-0">1</span>
                    <p className="leading-snug">Look at your browser's address bar (Chrome, Edge, or Brave).</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="h-5 w-5 rounded-md bg-accent/20 text-accent font-black text-[10px] flex items-center justify-center shrink-0">2</span>
                    <p className="leading-snug">Click the <strong>Install</strong> icon <i className="ph-bold ph-download-simple text-accent align-middle"></i> next to the URL.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="h-5 w-5 rounded-md bg-accent/20 text-accent font-black text-[10px] flex items-center justify-center shrink-0">3</span>
                    <p className="leading-snug">Enjoy instant desktop shortcut and full-screen cinema playback.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={closeInstallModal}
            className="text-white/50 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
          >
            Continue in Browser
          </button>
          <a
            href="/app"
            onClick={closeInstallModal}
            className="text-[11px] font-bold text-accent hover:underline uppercase tracking-wider flex items-center gap-1"
          >
            <span>App Page &amp; Guide</span>
            <i className="ph-bold ph-arrow-right text-xs"></i>
          </a>
        </div>
      </div>
    </div>
  );
}
