"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type MainTab = "home" | "record" | "archive";

export type OverlayScreen = "group" | "settings" | "notifications" | null;

type AppNavContextValue = {
  tab: MainTab;
  overlay: OverlayScreen;
  setTab: (tab: MainTab) => void;
  openOverlay: (screen: NonNullable<OverlayScreen>) => void;
  closeOverlay: () => void;
};

const AppNavContext = createContext<AppNavContextValue | null>(null);

export function AppNavProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<MainTab>("home");
  const [overlay, setOverlay] = useState<OverlayScreen>(null);

  const openOverlay = useCallback((screen: NonNullable<OverlayScreen>) => setOverlay(screen), []);
  const closeOverlay = useCallback(() => setOverlay(null), []);

  return (
    <AppNavContext.Provider value={{ tab, overlay, setTab, openOverlay, closeOverlay }}>
      {children}
    </AppNavContext.Provider>
  );
}

export function useAppNav() {
  const ctx = useContext(AppNavContext);
  if (!ctx) throw new Error("useAppNav must be used within AppNavProvider");
  return ctx;
}
