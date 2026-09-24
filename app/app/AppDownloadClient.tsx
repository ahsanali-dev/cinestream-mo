"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useInstallModal } from "@/context/InstallModalContext";
import { ANDROID_APK_DOWNLOAD_URL } from "@/components/DownloadAppModal";

export default function AppDownloadClient() {
  const [platform, setPlatform] = useState<"android" | "ios" | "desktop">("android");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { deferredPrompt, promptPWAInstall } = useInstallModal();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userAgent = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(userAgent)) {
        setPlatform("ios");
      } else if (/android/.test(userAgent)) {
        setPlatform("android");
      } else {
        setPlatform("android");
      }
    }
  }, []);

  const handleDownloadApk = () => {
    const link = document.createElement("a");
    link.href = ANDROID_APK_DOWNLOAD_URL;
    link.setAttribute("download", "MoviesZone.apk");
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "Why is MoviesZone App better than other free streaming options?",
      a: "Most third-party streaming apps and websites are cluttered with intrusive popup ads and slow server buffering. MoviesZone's Android App provides 100% ad-free cinema playback, high-speed CDN servers, Hindi Dubbed multi-audio support, and regular updates.",
    },
    {
      q: "How do I install the MoviesZone APK on Android?",
      a: "1) Tap 'Download Android App (.APK)'. 2) When prompted, enable 'Install from Unknown Sources' in your browser/device settings. 3) Open the downloaded APK file and tap 'Install' to start watching immediately.",
    },
    {
      q: "How to install MoviesZone on iPhone (iOS) and iPad?",
      a: "Open MoviesZone in Safari on your iPhone or iPad, tap the Share icon at the bottom bar, select 'Add to Home Screen', and tap 'Add'. It installs as a full-screen, standalone app on your home screen.",
    },
    {
      q: "Is MoviesZone APK safe and free from virus/malware?",
      a: "Yes, 100%. MoviesZone APK is compiled from clean open source tooling and hosted securely on GitHub CDN releases without any adware or malicious permissions.",
    },
    {
      q: "Does MoviesZone support Hindi Dubbed Bollywood and South Indian movies?",
      a: "Yes! MoviesZone specializes in Hindi Dubbed audio tracks for Hollywood blockbusters, Bollywood hits, Punjabi cinema, and South Indian (Tamil & Telugu) movies.",
    },
  ];

  return (
    <div className="px-4 sm:px-8 md:px-16 pt-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="relative rounded-3xl md:rounded-[40px] border border-white/10 bg-gradient-to-b from-white/[0.07] via-white/[0.02] to-transparent p-6 sm:p-12 md:p-16 overflow-hidden shadow-2xl backdrop-blur-2xl">
        {/* Glow Spheres */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl pointer-events-none -mr-28 -mt-28" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FFAA00]/15 rounded-full blur-3xl pointer-events-none -ml-28 -mb-28" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left: Pitch & Buttons */}
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 border border-accent/40 text-accent text-xs font-black uppercase tracking-wider shadow-sm">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse"></span>
              Official Android Release
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter italic text-white leading-tight">
              MoviesZone <span className="text-accent">App</span>
            </h1>

            <p className="text-base sm:text-lg text-white/80 max-w-xl font-medium leading-relaxed">
              Experience <strong className="text-white">100% Ad-Free</strong> cinema streaming in 1080p Full HD.
              Watch unlimited Bollywood, Hollywood, Hindi Dubbed hits, and Netflix/Prime shows with zero interruptions.
            </p>

            {/* Badges / Rating row */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-bold text-white/70">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                <i className="ph-fill ph-star text-yellow-400 text-sm"></i>
                <span className="text-white font-black">4.9 / 5.0</span>
                <span className="text-white/40">(48K+ Reviews)</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                <i className="ph-fill ph-download-simple text-accent text-sm"></i>
                <span className="text-white font-black">50,000+</span> Downloads
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                <i className="ph-fill ph-shield-check text-emerald-400 text-sm"></i>
                Safe &amp; Verified
              </div>
            </div>

            {/* Platform Selection Tabs */}
            <div className="pt-2">
              <div className="inline-grid grid-cols-3 gap-1.5 p-1.5 bg-black/60 rounded-2xl border border-white/10 max-w-md w-full">
                <button
                  type="button"
                  onClick={() => setPlatform("android")}
                  className={`py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    platform === "android"
                      ? "bg-accent text-white shadow-lg shadow-accent/40 scale-[1.02]"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <i className="ph-bold ph-android-logo text-base"></i>
                  <span>Android</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform("ios")}
                  className={`py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    platform === "ios"
                      ? "bg-accent text-white shadow-lg shadow-accent/40 scale-[1.02]"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <i className="ph-bold ph-apple-logo text-base"></i>
                  <span>iPhone / iPad</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform("desktop")}
                  className={`py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    platform === "desktop"
                      ? "bg-accent text-white shadow-lg shadow-accent/40 scale-[1.02]"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <i className="ph-bold ph-laptop text-base"></i>
                  <span>Desktop PC</span>
                </button>
              </div>
            </div>

            {/* CTA Buttons based on Platform */}
            <div className="pt-2">
              {platform === "android" && (
                <div className="space-y-3 animate-fade-in max-w-md mx-auto lg:mx-0">
                  <button
                    type="button"
                    onClick={handleDownloadApk}
                    className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-accent to-[#ff8c00] hover:from-[#ff8c00] hover:to-accent text-white font-black italic uppercase text-sm sm:text-base tracking-wider flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,106,0,0.6)] hover:shadow-[0_0_45px_rgba(255,106,0,0.85)] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20"
                  >
                    <i className="ph-bold ph-download-simple text-xl"></i>
                    <span>Download Android App (.APK)</span>
                  </button>
                  <div className="flex items-center justify-between text-[11px] text-white/50 px-2 font-medium">
                    <span>Direct GitHub Release</span>
                    <span>•</span>
                    <span className="text-white/70 font-bold">Size: 80.6 MB</span>
                    <span>•</span>
                    <span>Android 7.0+</span>
                  </div>
                </div>
              )}

              {platform === "ios" && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left space-y-3 max-w-md mx-auto lg:mx-0 animate-fade-in">
                  <p className="text-xs font-black uppercase tracking-wider text-accent flex items-center gap-2">
                    <i className="ph-fill ph-apple-logo text-base"></i> Safari PWA Installation (iOS)
                  </p>
                  <ol className="text-xs text-white/80 space-y-2 list-decimal list-inside font-medium leading-relaxed">
                    <li>Open this website in <strong>Safari</strong> on your iPhone or iPad.</li>
                    <li>Tap the <strong>Share button</strong> at the bottom of the screen.</li>
                    <li>Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>.</li>
                    <li>Tap <strong>&quot;Add&quot;</strong> to launch the full-screen cinema app.</li>
                  </ol>
                </div>
              )}

              {platform === "desktop" && (
                <div className="space-y-3 animate-fade-in max-w-md mx-auto lg:mx-0">
                  {deferredPrompt ? (
                    <button
                      type="button"
                      onClick={promptPWAInstall}
                      className="w-full py-4 px-8 rounded-2xl bg-accent hover:bg-[#ff7b1a] text-white font-black italic uppercase text-sm tracking-wider flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,106,0,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <i className="ph-bold ph-laptop text-xl"></i>
                      <span>Install MoviesZone on PC / Mac</span>
                    </button>
                  ) : (
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2 text-xs text-white/80">
                      <p className="font-black uppercase text-accent">Desktop Browser Install</p>
                      <p>In Chrome, Edge, or Brave, click the <strong>Install icon</strong> in the right corner of your address bar to install MoviesZone as a desktop app.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Premium App Card Showcase */}
          <div className="w-full lg:w-96 flex flex-col items-center">
            <div className="relative group p-8 rounded-[36px] bg-gradient-to-b from-[#181a24] to-[#0d0e15] border border-white/15 shadow-[0_0_50px_rgba(255,106,0,0.2)] text-center space-y-6 w-full max-w-sm">
              <div className="relative mx-auto h-28 w-28 rounded-3xl bg-gradient-to-br from-accent to-[#ff8c00] flex items-center justify-center shadow-2xl shadow-accent/40 border border-white/30 group-hover:scale-105 transition-transform duration-300">
                <img
                  src="/logo.png"
                  alt="MoviesZone App Logo"
                  className="w-20 h-20 object-contain drop-shadow-xl"
                />
              </div>

              <div>
                <h3 className="text-2xl font-black italic uppercase tracking-tight text-white">
                  MoviesZone <span className="text-accent">APK</span>
                </h3>
                <p className="text-xs font-bold text-accent uppercase tracking-wider mt-1">
                  100% Ad-Free • Hindi Dubbed • 1080p
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-left">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest block font-bold">Size</span>
                  <span className="text-xs font-black text-white">80.6 MB</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest block font-bold">Requirement</span>
                  <span className="text-xs font-black text-white">Android 7.0+</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest block font-bold">License</span>
                  <span className="text-xs font-black text-emerald-400">100% Free</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest block font-bold">Package</span>
                  <span className="text-xs font-black text-white">Direct APK</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="mt-20 space-y-12">
        <div className="text-center space-y-3">
          <span className="px-3 py-1 rounded-full bg-accent/20 border border-accent/40 text-accent text-xs font-black uppercase tracking-wider">
            Key Highlights
          </span>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white">
            Why Download MoviesZone App?
          </h2>
          <p className="text-sm md:text-base text-white/60 max-w-2xl mx-auto font-medium">
            Designed for movie lovers who want cinema-grade streaming without annoying ads or buffer delays.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-accent/40 transition-all hover:scale-[1.02] space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-accent/20 text-accent flex items-center justify-center text-3xl font-bold shadow-lg shadow-accent/20">
              <i className="ph-fill ph-shield-check"></i>
            </div>
            <h3 className="text-xl font-black uppercase text-white tracking-wide">
              100% Zero Ads
            </h3>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              No popups, no redirects, no video pre-roll commercials. Hit play and start watching instantly.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-accent/40 transition-all hover:scale-[1.02] space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-[#FFAA00]/20 text-[#FFAA00] flex items-center justify-center text-3xl font-bold shadow-lg shadow-[#FFAA00]/20">
              <i className="ph-fill ph-translate"></i>
            </div>
            <h3 className="text-xl font-black uppercase text-white tracking-wide">
              Guaranteed Hindi Dubbed
            </h3>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              Bollywood hits, Punjabi cinema, and South Indian (Tamil &amp; Telugu) blockbusters in crystal-clear Hindi audio.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-accent/40 transition-all hover:scale-[1.02] space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-3xl font-bold shadow-lg shadow-blue-500/20">
              <i className="ph-fill ph-lightning"></i>
            </div>
            <h3 className="text-xl font-black uppercase text-white tracking-wide">
              Ultra-Fast 1080p CDN
            </h3>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              Optimized low-latency streaming infrastructure ensures smooth buffer-free playback even on slower connections.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-accent/40 transition-all hover:scale-[1.02] space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-3xl font-bold shadow-lg shadow-purple-500/20">
              <i className="ph-fill ph-television"></i>
            </div>
            <h3 className="text-xl font-black uppercase text-white tracking-wide">
              Netflix &amp; OTT Series
            </h3>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              Stream the complete catalogue of Netflix, Prime Video, Disney+, and HBO Max original series with all seasons.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-accent/40 transition-all hover:scale-[1.02] space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl font-bold shadow-lg shadow-emerald-500/20">
              <i className="ph-fill ph-closed-captioning"></i>
            </div>
            <h3 className="text-xl font-black uppercase text-white tracking-wide">
              Subtitles &amp; Multi-Audio
            </h3>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              Switch between original audio, Hindi dubbed tracks, and synchronized English/multilingual subtitle tracks anytime.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-accent/40 transition-all hover:scale-[1.02] space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-3xl font-bold shadow-lg shadow-rose-500/20">
              <i className="ph-fill ph-screencast"></i>
            </div>
            <h3 className="text-xl font-black uppercase text-white tracking-wide">
              Android TV &amp; Cast Ready
            </h3>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              Compatible with Android TV boxes, smart TVs, and screen mirroring for the ultimate big-screen living room setup.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Comparison Matrix */}
      <section className="mt-24 space-y-8">
        <div className="text-center space-y-2">
          <span className="px-3 py-1 rounded-full bg-accent/20 border border-accent/40 text-accent text-xs font-black uppercase tracking-wider">
            Comparison Matrix
          </span>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white">
            How MoviesZone Stands Out
          </h2>
          <p className="text-xs md:text-sm text-white/60">
            See why MoviesZone App delivers the premier cinema streaming experience.
          </p>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-black/40 text-white/70 font-black uppercase tracking-wider">
                <th className="p-4 sm:p-6">Feature</th>
                <th className="p-4 sm:p-6 text-accent font-black">MoviesZone App</th>
                <th className="p-4 sm:p-6">Other Movie Apps</th>
                <th className="p-4 sm:p-6">Standard Web Sites</th>
                <th className="p-4 sm:p-6">Paid OTT Platforms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/80">
              <tr>
                <td className="p-4 sm:p-6 font-bold text-white">100% Ad-Free Experience</td>
                <td className="p-4 sm:p-6 text-emerald-400 font-black"><i className="ph-fill ph-check-circle text-base align-middle mr-1"></i> Yes (100% Zero Ads)</td>
                <td className="p-4 sm:p-6 text-rose-400"><i className="ph-fill ph-x-circle text-base align-middle mr-1"></i> Popups / Ads</td>
                <td className="p-4 sm:p-6 text-rose-400"><i className="ph-fill ph-x-circle text-base align-middle mr-1"></i> Heavy Banners</td>
                <td className="p-4 sm:p-6 text-emerald-400"><i className="ph-fill ph-check-circle text-base align-middle mr-1"></i> Yes ($15+/mo)</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-6 font-bold text-white">Hindi Dubbed &amp; Multi-Audio</td>
                <td className="p-4 sm:p-6 text-emerald-400 font-black"><i className="ph-fill ph-check-circle text-base align-middle mr-1"></i> Dedicated Audio</td>
                <td className="p-4 sm:p-6 text-yellow-400"><i className="ph-fill ph-minus-circle text-base align-middle mr-1"></i> Limited</td>
                <td className="p-4 sm:p-6 text-yellow-400"><i className="ph-fill ph-minus-circle text-base align-middle mr-1"></i> English Only</td>
                <td className="p-4 sm:p-6 text-yellow-400"><i className="ph-fill ph-minus-circle text-base align-middle mr-1"></i> Selected Only</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-6 font-bold text-white">Trending TV &amp; Web Series</td>
                <td className="p-4 sm:p-6 text-emerald-400 font-black"><i className="ph-fill ph-check-circle text-base align-middle mr-1"></i> All Seasons Free</td>
                <td className="p-4 sm:p-6 text-yellow-400"><i className="ph-fill ph-minus-circle text-base align-middle mr-1"></i> Paid VIP Paywall</td>
                <td className="p-4 sm:p-6 text-yellow-400"><i className="ph-fill ph-minus-circle text-base align-middle mr-1"></i> Broken Links</td>
                <td className="p-4 sm:p-6 text-emerald-400"><i className="ph-fill ph-check-circle text-base align-middle mr-1"></i> Single Platform Only</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-6 font-bold text-white">Buffer-Free Fast CDN</td>
                <td className="p-4 sm:p-6 text-emerald-400 font-black"><i className="ph-fill ph-check-circle text-base align-middle mr-1"></i> High Speed (1080p)</td>
                <td className="p-4 sm:p-6 text-rose-400"><i className="ph-fill ph-x-circle text-base align-middle mr-1"></i> Constant Buffering</td>
                <td className="p-4 sm:p-6 text-yellow-400"><i className="ph-fill ph-minus-circle text-base align-middle mr-1"></i> Medium Speed</td>
                <td className="p-4 sm:p-6 text-emerald-400"><i className="ph-fill ph-check-circle text-base align-middle mr-1"></i> High Speed</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-6 font-bold text-white">Subscription / Paywall</td>
                <td className="p-4 sm:p-6 text-emerald-400 font-black"><i className="ph-fill ph-check-circle text-base align-middle mr-1"></i> 100% Free Forever</td>
                <td className="p-4 sm:p-6 text-rose-400"><i className="ph-fill ph-x-circle text-base align-middle mr-1"></i> Monthly VIP Sub</td>
                <td className="p-4 sm:p-6 text-emerald-400"><i className="ph-fill ph-check-circle text-base align-middle mr-1"></i> Free</td>
                <td className="p-4 sm:p-6 text-rose-400"><i className="ph-fill ph-x-circle text-base align-middle mr-1"></i> $10 – $25 / Month</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Step by Step Install Guide */}
      <section className="mt-24 space-y-12">
        <div className="text-center space-y-2">
          <span className="px-3 py-1 rounded-full bg-accent/20 border border-accent/40 text-accent text-xs font-black uppercase tracking-wider">
            Quick Tutorial
          </span>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white">
            How to Install MoviesZone APK on Android
          </h2>
          <p className="text-xs md:text-sm text-white/60">
            Follow these 3 simple steps to start streaming in minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4">
            <span className="h-10 w-10 rounded-xl bg-accent text-white font-black text-base flex items-center justify-center shadow-lg shadow-accent/30">1</span>
            <h3 className="text-lg font-black uppercase text-white">Download APK</h3>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              Tap the <strong>Download Android App (.APK)</strong> button on this page to fetch the latest installation package.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4">
            <span className="h-10 w-10 rounded-xl bg-accent text-white font-black text-base flex items-center justify-center shadow-lg shadow-accent/30">2</span>
            <h3 className="text-lg font-black uppercase text-white">Allow Unknown Sources</h3>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              If prompted by Android, go to Settings and enable <strong>&quot;Allow from this source&quot;</strong> to permit the installation.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4">
            <span className="h-10 w-10 rounded-xl bg-accent text-white font-black text-base flex items-center justify-center shadow-lg shadow-accent/30">3</span>
            <h3 className="text-lg font-black uppercase text-white">Open &amp; Enjoy Ad-Free</h3>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              Open MoviesZone and enjoy instant access to thousands of HD movies and series with zero commercials.
            </p>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="mt-24 space-y-8">
        <div className="text-center space-y-2">
          <span className="px-3 py-1 rounded-full bg-accent/20 border border-accent/40 text-accent text-xs font-black uppercase tracking-wider">
            Questions &amp; Answers
          </span>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4 max-w-3xl mx-auto">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <span className="font-bold text-sm sm:text-base text-white">{faq.q}</span>
                  <i
                    className={`ph-bold ph-caret-down text-accent text-lg transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  ></i>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-white/70 leading-relaxed animate-fade-in border-t border-white/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom Download CTA Bar */}
      <section className="mt-20 p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-accent/20 via-accent/10 to-[#FFAA00]/20 border border-accent/30 text-center space-y-6 shadow-2xl">
        <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white italic">
          Ready for 100% Ad-Free Cinema?
        </h2>
        <p className="text-xs sm:text-sm text-white/70 max-w-lg mx-auto">
          Download the latest MoviesZone APK now and upgrade your streaming experience today.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={handleDownloadApk}
            className="px-8 py-3.5 rounded-2xl bg-accent hover:bg-[#ff7b1a] text-white font-black uppercase text-xs sm:text-sm tracking-wider flex items-center gap-2.5 shadow-xl shadow-accent/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <i className="ph-bold ph-download-simple text-lg"></i>
            <span>Download APK Now</span>
          </button>
          <Link
            href="/"
            className="px-8 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-black uppercase text-xs sm:text-sm tracking-wider hover:scale-105 active:scale-95 transition-all"
          >
            Stream Online
          </Link>
        </div>
      </section>
    </div>
  );
}
