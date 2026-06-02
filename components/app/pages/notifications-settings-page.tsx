"use client";

import { useState } from "react";
import { Bell, BellOff, Clock, Upload, BarChart2 } from "lucide-react";
import type { MockAppState } from "@/lib/mock-app-data";
import { AppIcon } from "@/components/ui/icon";
import { appTheme as t } from "../theme";
import {
  AppBtn,
  ScreenHeader,
  GroupedSection,
  ToggleRow,
} from "../ui";

export function NotificationsSettingsPage({
  data,
  onBack,
}: {
  data: MockAppState;
  onBack: () => void;
}) {
  const [prefs, setPrefs] = useState(data.notifications);

  const requestPush = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      await Notification.requestPermission();
    }
  };

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        marginLeft: -16,
        marginRight: -16,
        paddingLeft: 16,
        paddingRight: 16,
      }}
    >
      <ScreenHeader title="Notifications" onBack={onBack} />

      {/* ── Push status banner ──────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 16px",
          borderRadius: t.radius.lg,
          background: prefs.pushEnabled
            ? "rgba(48,209,88,0.1)"
            : "rgba(255,159,10,0.1)",
          border: `0.5px solid ${prefs.pushEnabled ? "rgba(48,209,88,0.25)" : "rgba(255,159,10,0.25)"}`,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: prefs.pushEnabled
              ? "rgba(48,209,88,0.18)"
              : "rgba(255,159,10,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <AppIcon
            icon={prefs.pushEnabled ? Bell : BellOff}
            size={20}
            color={prefs.pushEnabled ? t.accent : t.orange}
            strokeWidth={1.8}
          />
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: t.text,
              letterSpacing: "-0.2px",
              marginBottom: 2,
            }}
          >
            Push notifications
          </div>
          <div style={{ fontSize: 13, color: t.textSecondary }}>
            {prefs.pushEnabled
              ? "Enabled on this device"
              : "Disabled — tap to enable"}
          </div>
        </div>

        {!prefs.pushEnabled && (
          <button
            type="button"
            onClick={requestPush}
            style={{
              border: "none",
              background: t.orange,
              color: "#000",
              fontSize: 13,
              fontWeight: 600,
              padding: "7px 14px",
              borderRadius: 980,
              cursor: "pointer",
              fontFamily: t.fontText,
              flexShrink: 0,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            Enable
          </button>
        )}
      </div>

      {/* ── Alert types ────────────────────────────────────────────────── */}
      <GroupedSection
        header="ALERTS"
        footer="Notifications are delivered immediately and won't wake your device during Do Not Disturb."
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "2px 16px 0px" }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: "rgba(255,69,58,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AppIcon icon={Clock} size={16} color={t.red} strokeWidth={2} />
          </div>
          <div style={{ flex: 1 }}>
            <ToggleRow
              title="Today's turn"
              desc="When it's your day to vlog"
              on={prefs.todaysTurn}
              onChange={(v) => setPrefs((p) => ({ ...p, todaysTurn: v }))}
              noBorder
            />
          </div>
        </div>

        <div style={{ height: 0.5, background: t.separator, margin: "0 16px" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "2px 16px 0px" }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: t.blueMuted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AppIcon icon={Upload} size={16} color={t.blue} strokeWidth={2} />
          </div>
          <div style={{ flex: 1 }}>
            <ToggleRow
              title="New moment uploaded"
              desc="When your group posts a clip"
              on={prefs.someoneUploads}
              onChange={(v) => setPrefs((p) => ({ ...p, someoneUploads: v }))}
              noBorder
            />
          </div>
        </div>

        <div style={{ height: 0.5, background: t.separator, margin: "0 16px" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "2px 16px 0px" }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: "rgba(88,86,214,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AppIcon icon={BarChart2} size={16} color="#5856D6" strokeWidth={2} />
          </div>
          <div style={{ flex: 1 }}>
            <ToggleRow
              title="Daily recap"
              desc="End-of-day summary of your group"
              on={prefs.dailyRecap}
              onChange={(v) => setPrefs((p) => ({ ...p, dailyRecap: v }))}
              noBorder
            />
          </div>
        </div>
      </GroupedSection>
    </div>
  );
}