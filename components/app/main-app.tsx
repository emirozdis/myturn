"use client";

import { useState, useCallback } from "react";
import { Noise } from "@/components/onboarding/ui";
import { MOCK_APP, type Clip, type MockAppState } from "@/lib/mock-app-data";
import { AppNavProvider, useAppNav } from "./navigation";
import { TabBar } from "./tab-bar";
import { appTheme as t } from "./theme";
import { HomePage } from "./pages/home-page";
import { RecordPage } from "./pages/record-page";
import { ArchivePage } from "./pages/archive-page";
import { GroupPage } from "./pages/group-page";
import { SettingsPage } from "./pages/settings-page";
import { NotificationsSettingsPage } from "./pages/notifications-settings-page";

function MainAppInner({ userName }: { userName: string }) {
  const { tab, overlay, setTab, openOverlay, closeOverlay } = useAppNav();
  const [appData, setAppData] = useState<MockAppState>(() => ({
    ...MOCK_APP,
    currentUser: { ...MOCK_APP.currentUser, name: userName || MOCK_APP.currentUser.name },
  }));

  const onClipAdded = useCallback((clip: Clip) => {
    setAppData((d) => ({
      ...d,
      hasStartedToday: true,
      todayClips: [clip, ...d.todayClips],
    }));
  }, []);

  const showTabContent = !overlay;

  return (
    <div
      style={{
        height: "100dvh",
        width: "100%",
        background: t.bg,
        display: "flex",
        flexDirection: "column",
        fontFamily: t.fontText,
        position: "relative",
        overflow: "hidden",
        overscrollBehavior: "none",
      }}
    >
      <Noise />
      <div
        style={{
          position: "fixed",
          top: -120,
          left: "50%",
          transform: "translateX(-50%)",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          maxWidth: 480,
          width: "100%",
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
          minHeight: 0,
        }}
      >
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "max(12px, env(safe-area-inset-top)) 20px 0",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {showTabContent && (
            <>
              {tab === "home" && <HomePage data={appData} />}
              {tab === "record" && <RecordPage data={appData} onClipAdded={onClipAdded} />}
              {tab === "archive" && <ArchivePage data={appData} />}
            </>
          )}

          {overlay && (
            <OverlayPanel>
              {overlay === "group" && <GroupPage data={appData} onBack={closeOverlay} />}
              {overlay === "settings" && (
                <SettingsPage
                  data={appData}
                  onBack={closeOverlay}
                  onOpenNotifications={() => openOverlay("notifications")}
                />
              )}
              {overlay === "notifications" && (
                <NotificationsSettingsPage data={appData} onBack={() => openOverlay("settings")} />
              )}
            </OverlayPanel>
          )}
        </main>

        {showTabContent && <TabBar active={tab} onChange={setTab} />}
      </div>
    </div>
  );
}

function OverlayPanel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: t.bg,
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        animation: "slideIn 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        padding: "max(8px, env(safe-area-inset-top)) 20px max(24px, env(safe-area-inset-bottom))",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0.6; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      {children}
    </div>
  );
}

export function MainApp({ userName }: { userName: string }) {
  return (
    <AppNavProvider>
      <MainAppInner userName={userName} />
    </AppNavProvider>
  );
}
