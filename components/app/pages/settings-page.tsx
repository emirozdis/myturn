"use client";

import { useState } from "react";
import { Bell, ChevronRight, LogOut, Trash2, User } from "lucide-react";
import type { MockAppState } from "@/lib/mock-app-data";
import { AppIcon } from "@/components/ui/icon";
import { appTheme as t } from "../theme";
import {
  Avatar,
  AppBtn,
  Card,
  ScreenHeader,
  GroupedSection,
  ListRow,
} from "../ui";

export function SettingsPage({
  data,
  onBack,
  onOpenNotifications,
}: {
  data: MockAppState;
  onBack: () => void;
  onOpenNotifications: () => void;
}) {
  const [profileName, setProfileName] = useState(data.currentUser.name);
  const [timezone, setTimezone] = useState(data.timezone);
  const [nameEditing, setNameEditing] = useState(false);

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
      <ScreenHeader title="Settings" onBack={onBack} />

      {/* ── Profile section ─────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: 28,
          gap: 10,
        }}
      >
        <div style={{ position: "relative" }}>
          <Avatar initials={data.currentUser.initials} size={80} ring />
          <button
            type="button"
            style={{
              position: "absolute",
              bottom: -2,
              right: -2,
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: t.blue,
              border: `3px solid ${t.bg}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
        </div>
        <div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: t.text,
              textAlign: "center",
              fontFamily: t.fontDisplay,
              letterSpacing: "-0.3px",
            }}
          >
            {profileName}
          </div>
          <div
            style={{
              fontSize: 13,
              color: t.blue,
              textAlign: "center",
              marginTop: 2,
              cursor: "pointer",
            }}
            onClick={() => setNameEditing(true)}
          >
            Edit profile
          </div>
        </div>
      </div>

      {/* ── Profile name ────────────────────────────────────────────────── */}
      <GroupedSection header="PROFILE" footer="This is how you appear to your group members.">
        <div style={{ padding: "0px 16px" }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: t.textSecondary,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              paddingTop: 10,
              paddingBottom: 4,
            }}
          >
            Display name
          </label>
          <input
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            onFocus={() => setNameEditing(true)}
            onBlur={() => setNameEditing(false)}
            style={{
              width: "100%",
              padding: "8px 0 12px",
              border: "none",
              borderTop: `0.5px solid ${t.separator}`,
              background: "transparent",
              color: t.text,
              fontSize: 17,
              outline: "none",
              fontFamily: t.fontText,
              boxSizing: "border-box",
              letterSpacing: "-0.2px",
            }}
          />
        </div>
      </GroupedSection>

      {/* ── Timezone ────────────────────────────────────────────────────── */}
      <GroupedSection
        header="TIME"
        footer="Used for daily rotation and your turn timing."
      >
        <div style={{ padding: "4px 16px 4px" }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: t.textSecondary,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              paddingTop: 8,
              paddingBottom: 4,
            }}
          >
            Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 0 12px",
              borderTop: `0.5px solid ${t.separator}`,
              border: "none",
              background: "transparent",
              color: t.text,
              fontSize: 17,
              outline: "none",
              fontFamily: t.fontText,
            }}
          >
            <option value="America/New_York">America / New York</option>
            <option value="America/Los_Angeles">America / Los Angeles</option>
            <option value="Europe/London">Europe / London</option>
            <option value="Europe/Istanbul">Europe / Istanbul</option>
          </select>
        </div>
      </GroupedSection>

      {/* ── Notifications ────────────────────────────────────────────────── */}
      <GroupedSection header="ALERTS">
        <button
          type="button"
          onClick={onOpenNotifications}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            width: "100%",
            textAlign: "left",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: "rgba(255,69,58,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppIcon icon={Bell} size={16} color={t.red} strokeWidth={2} />
          </div>
          <span
            style={{
              flex: 1,
              fontSize: 17,
              color: t.text,
              fontFamily: t.fontText,
              letterSpacing: "-0.2px",
            }}
          >
            Notifications
          </span>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(235,235,245,0.3)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </GroupedSection>

      {/* ── Account actions ──────────────────────────────────────────────── */}
      <GroupedSection style={{ marginTop: 8 }}>
        <button
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            width: "100%",
            textAlign: "left",
            position: "relative",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <AppIcon icon={LogOut} size={18} color={t.blue} strokeWidth={2} />
          <span style={{ fontSize: 17, color: t.blue, fontFamily: t.fontText }}>
            Sign out
          </span>
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 46,
              right: 0,
              height: 0.5,
              background: t.separator,
            }}
          />
        </button>

        <button
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            width: "100%",
            textAlign: "left",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <AppIcon icon={Trash2} size={18} color={t.red} strokeWidth={2} />
          <span style={{ fontSize: 17, color: t.red, fontFamily: t.fontText }}>
            Delete account
          </span>
        </button>
      </GroupedSection>

      <div style={{ height: 40 }} />
    </div>
  );
}