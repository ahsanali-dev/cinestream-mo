"use client";

import React, { useState, useRef, useEffect } from "react";

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  poster?: string;
}

export default function ShareButton({ title, text, url, poster }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getShareUrl = () => {
    if (typeof window !== "undefined") {
      return url || window.location.href;
    }
    return url || "https://movieszonestream.vercel.app";
  };

  const handleShare = async () => {
    const shareUrl = getShareUrl();
    const shareData = {
      title: `${title} | MoviesZone`,
      text: text || `Watch ${title} in High Definition on MoviesZone!`,
      url: shareUrl,
    };

    // Use native Web Share API on mobile (WhatsApp, Twitter, Messages, etc.)
    if (typeof navigator !== "undefined" && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        // User cancelled or share failed, fallback to dropdown/copy
        if (err.name !== "AbortError") {
          setIsMenuOpen(true);
        }
      }
    } else {
      // Desktop: toggle social share menu & copy link
      setIsMenuOpen(!isMenuOpen);
    }
  };

  const copyToClipboard = async () => {
    const shareUrl = getShareUrl();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error("Clipboard copy failed:", e);
    }
  };

  const shareUrl = getShareUrl();
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(text || `Watch ${title} in HD on MoviesZone! 🍿🎬`);

  return (
    <div ref={menuRef} className="relative inline-block">
      <button
        onClick={handleShare}
        className="flex items-center gap-2.5 px-4 py-2.5 sm:px-6 sm:py-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-accent/40 hover:bg-white/10 text-white transition-all duration-300 cursor-pointer shadow-lg active:scale-95 group font-black italic uppercase tracking-wider text-xs md:text-sm"
        aria-label="Share movie link"
      >
        <div className="h-7 w-7 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
          <i className="ph-bold ph-share-network text-base"></i>
        </div>
        <span>Share</span>
      </button>

      {/* Social Share Menu (For Desktop & Fallback) */}
      {isMenuOpen && (
        <div className="absolute left-0 top-full mt-3 z-50 w-72 rounded-3xl bg-[#0f0f12]/98 backdrop-blur-2xl border border-white/15 p-4 shadow-2xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-[11px] font-black italic uppercase tracking-wider text-white/80">
              Share Movie
            </span>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="text-white/40 hover:text-white text-sm"
            >
              <i className="ph-bold ph-x"></i>
            </button>
          </div>

          {/* Social Link Preview Card */}
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10">
            {poster ? (
              <img
                src={poster}
                alt={title}
                className="w-12 h-16 object-cover rounded-xl shadow-md shrink-0"
              />
            ) : (
              <div className="w-12 h-16 rounded-xl bg-accent/20 flex items-center justify-center text-accent shrink-0">
                <i className="ph-fill ph-film-strip text-2xl"></i>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-black text-accent tracking-wider uppercase block">
                MoviesZone Preview
              </span>
              <h4 className="text-xs font-bold text-white truncate">{title}</h4>
              <p className="text-[10px] text-white/50 truncate">Watch Free in HD on MoviesZone</p>
            </div>
          </div>

          {/* Social Icons Grid */}
          <div className="grid grid-cols-4 gap-2">
            {/* WhatsApp */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all text-emerald-400 group"
            >
              <i className="ph-fill ph-whatsapp-logo text-2xl group-hover:scale-110 transition-transform"></i>
              <span className="text-[9px] font-bold text-white/80">WhatsApp</span>
            </a>

            {/* Twitter / X */}
            <a
              href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 transition-all text-sky-400 group"
            >
              <i className="ph-bold ph-x-logo text-2xl group-hover:scale-110 transition-transform"></i>
              <span className="text-[9px] font-bold text-white/80">X / Twitter</span>
            </a>

            {/* Telegram */}
            <a
              href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-all text-blue-400 group"
            >
              <i className="ph-fill ph-telegram-logo text-2xl group-hover:scale-110 transition-transform"></i>
              <span className="text-[9px] font-bold text-white/80">Telegram</span>
            </a>

            {/* Facebook */}
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all text-indigo-400 group"
            >
              <i className="ph-fill ph-facebook-logo text-2xl group-hover:scale-110 transition-transform"></i>
              <span className="text-[9px] font-bold text-white/80">Facebook</span>
            </a>
          </div>

          {/* Direct Copy Button */}
          <button
            onClick={copyToClipboard}
            className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border ${
              copied
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-lg"
                : "bg-accent hover:bg-accent/90 text-white border-accent shadow-lg shadow-accent/25 active:scale-98"
            }`}
          >
            <i className={`ph-bold ${copied ? "ph-check" : "ph-copy"} text-base`}></i>
            <span>{copied ? "Link Copied!" : "Copy Page Link"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
