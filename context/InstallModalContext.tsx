"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

type Platform = "android" | "ios" | "desktop";

interface InstallModalContextType {
  isOpen: boolean;
  activePlatform: Platform;
  setActivePlatform: (platform: Platform) => void;
  openInstallModal: (platform?: Platform) => void;
  closeInstallModal: () => void;
  isInstalled: boolean;
  deferredPrompt: any;
  promptPWAInstall: () => Promise<void>;
}

const InstallModalContext = createContext<InstallModalContextType | undefined>(undefined);

export const InstallModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activePlatform, setActivePlatform] = useState<Platform>("android");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userAgent = navigator.userAgent.toLowerCase();
      let defaultOS: Platform = "android";

      if (/iphone|ipad|ipod/.test(userAgent)) {
        defaultOS = "ios";
      } else if (/android/.test(userAgent)) {
        defaultOS = "android";
      } else {
        defaultOS = "android"; // Promote Android as top choice
      }
      setActivePlatform(defaultOS);

      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isIOSStandalone);

      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      const handleAppInstalled = () => {
        setIsInstalled(true);
        setIsOpen(false);
        setDeferredPrompt(null);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.addEventListener("appinstalled", handleAppInstalled);

      // Auto-popup modal on first visit in the session
      const hasShownThisSession = sessionStorage.getItem("mz_app_modal_shown");
      if (!hasShownThisSession && !isStandalone && !isIOSStandalone) {
        const timer = setTimeout(() => {
          setIsOpen(true);
          sessionStorage.setItem("mz_app_modal_shown", "true");
        }, 1500);

        return () => {
          clearTimeout(timer);
          window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
          window.removeEventListener("appinstalled", handleAppInstalled);
        };
      }

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    }
  }, []);

  const openInstallModal = (platform?: Platform) => {
    if (platform) {
      setActivePlatform(platform);
    }
    setIsOpen(true);
  };

  const closeInstallModal = () => {
    setIsOpen(false);
  };

  const promptPWAInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA Prompt Outcome: ${outcome}`);
      setDeferredPrompt(null);
    }
  };

  return (
    <InstallModalContext.Provider
      value={{
        isOpen,
        activePlatform,
        setActivePlatform,
        openInstallModal,
        closeInstallModal,
        isInstalled,
        deferredPrompt,
        promptPWAInstall,
      }}
    >
      {children}
    </InstallModalContext.Provider>
  );
};

export const useInstallModal = () => {
  const context = useContext(InstallModalContext);
  if (!context) {
    throw new Error("useInstallModal must be used within an InstallModalProvider");
  }
  return context;
};
