"use client";

import { useState, useRef } from "react";
import { Bell, BellOff, ChevronRight, Users, Flame } from "lucide-react";
import type { MockAppState } from "@/lib/mock-app-data";
import { AppIcon } from "@/components/ui/icon";
import { appTheme as t } from "../theme";
import {
  Avatar,
  AppBtn,
  Card,
  SectionLabel,
  Badge,
  GroupedSection,
  ListRow,
} from "../ui";
import { useAppNav } from "../navigation";

export function HomePage({ data }: { data: MockAppState }) {
  const { openOverlay, setTab } = useAppNav();
  const [prevExpanded, setPrevExpanded] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  // ── Empty state ───────────────────────────────────────────────────────────
  if (data.groupEmpty) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "0 24px",
          gap: 0,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 22,
            background: t.bg2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <AppIcon icon={Users} size={36} color={t.textSecondary} strokeWidth={1.5} />
        </div>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: t.text,
            fontFamily: t.fontDisplay,
            letterSpacing: "-0.7px",
            marginBottom: 10,
            lineHeight: 1.1,
          }}
        >
          Start your circle
        </h2>
        <p
          style={{
            fontSize: 15,
            color: t.textSecondary,
            lineHeight: 1.5,
            marginBottom: 32,
            maxWidth: 280,
          }}
        >
          Invite friends to your group before the daily rotation begins.
        </p>
        <AppBtn onClick={() => openOverlay("group")} style={{ maxWidth: 280 }}>
          Invite to group
        </AppBtn>
      </div>
    );
  }

  const v = data.todayVlogger;
  const waiting = !data.hasStartedToday;

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 16, marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16 }}>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 20,
          paddingTop: 4,
          minHeight: 44,
        }}
      >
        <button
          type="button"
          onClick={() => openOverlay("group")}
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: "pointer",
            textAlign: "left",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: t.textTertiary,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              lineHeight: 1,
              marginBottom: 3,
            }}
          >
            Group
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              fontSize: 22,
              fontWeight: 700,
              color: t.text,
              fontFamily: t.fontDisplay,
              letterSpacing: "-0.5px",
              lineHeight: 1,
            }}
          >
            {data.groupName}
            <ChevronRight size={16} color={t.textTertiary} />
          </div>
        </button>

        <button
          type="button"
          title={data.notifications.pushEnabled ? "Notifications on" : "Notifications off"}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: 6,
            opacity: data.notifications.pushEnabled ? 1 : 0.35,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <AppIcon
            icon={data.notifications.pushEnabled ? Bell : BellOff}
            size={22}
            color={t.text}
            strokeWidth={1.7}
          />
        </button>

        <button
          type="button"
          onClick={() => openOverlay("settings")}
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <Avatar initials={data.currentUser.initials} size={36} ring />
        </button>
      </header>

      {/* ── Today hero card ──────────────────────────────────────────────── */}
      <div
        style={{
          borderRadius: 20,
          background:
            "linear-gradient(160deg, rgba(40,40,50,0.9) 0%, rgba(20,20,28,1) 100%)",
          border: "0.5px solid rgba(255,255,255,0.1)",
          padding: "20px 20px 18px",
          marginBottom: 28,
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: t.textTertiary,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          Today&apos;s Story
        </div>

        <div
          style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}
        >
          <Avatar initials={v.initials} size={54} ring />
          <div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: t.text,
                fontFamily: t.fontDisplay,
                letterSpacing: "-0.5px",
                lineHeight: 1.2,
                marginBottom: 4,
              }}
            >
              {data.isCurrentUserVlogger ? "Your day 🎥" : `${v.name} is vlogging`}
            </div>
            <div style={{ fontSize: 14, color: t.textSecondary }}>
              {v.hoursRemaining}h remaining
            </div>
          </div>
        </div>

        {waiting && (
          <p
            style={{
              fontSize: 14,
              color: t.textSecondary,
              marginBottom: 14,
              fontStyle: "italic",
            }}
          >
            {data.isCurrentUserVlogger
              ? "Be the first moment today…"
              : "Waiting for first moment…"}
          </p>
        )}

        {data.isCurrentUserVlogger ? (
          <AppBtn onClick={() => setTab("record")}>Start Recording</AppBtn>
        ) : (
          <AppBtn
            variant="tinted"
            onClick={() =>
              timelineRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
            disabled={waiting && data.todayClips.length === 0}
          >
            Watch Day
          </AppBtn>
        )}
      </div>

      {/* ── Live timeline ────────────────────────────────────────────────── */}
      <SectionLabel style={{ marginBottom: 10 }}>Live timeline</SectionLabel>
      <div
        ref={timelineRef}
        style={{ marginBottom: 28 }}
      >
        {data.todayClips.length === 0 ? (
          <div
            style={{
              padding: "24px 16px",
              textAlign: "center",
              color: t.textTertiary,
              fontSize: 15,
              background: t.card,
              borderRadius: t.radius.lg,
            }}
          >
            No moments yet today
          </div>
        ) : (
          <Card>
            {data.todayClips.map((clip, idx) => (
              <button
                key={clip.id}
                type="button"
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "12px 16px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                  position: "relative",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 66,
                    borderRadius: 10,
                    background: `url(${clip.thumbnailUrl || "https://picsum.photos/seed/fb/200/300"}) center/cover no-repeat`,
                    backgroundColor: t.bg3,
                    flexShrink: 0,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      bottom: 4,
                      right: 4,
                      fontSize: 9,
                      fontWeight: 600,
                      color: "#fff",
                      background: "rgba(0,0,0,0.55)",
                      padding: "2px 5px",
                      borderRadius: 5,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {clip.duration}
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                  <div
                    style={{ fontSize: 12, color: t.textSecondary, marginBottom: 3 }}
                  >
                    {clip.timestamp}
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 500,
                      color: t.text,
                      letterSpacing: "-0.2px",
                      lineHeight: 1.35,
                    }}
                  >
                    {clip.caption ?? "Moment"}
                  </div>
                  <div style={{ fontSize: 12, color: t.textTertiary, marginTop: 3 }}>
                    {v.name}
                  </div>
                </div>

                <ChevronRightIcon />

                {/* row separator */}
                {idx < data.todayClips.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 80,
                      right: 0,
                      height: 0.5,
                      background: t.separator,
                    }}
                  />
                )}
              </button>
            ))}
          </Card>
        )}
      </div>

      {/* ── Group activity ───────────────────────────────────────────────── */}
      {(data.watchers.length > 0 || data.reactors.length > 0) && (
        <div style={{ marginBottom: 28 }}>
          <SectionLabel style={{ marginBottom: 10 }}>Group activity</SectionLabel>
          <Card style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", gap: 28, overflowX: "auto" }}>
              {data.watchers.length > 0 && (
                <ActivityCluster label="Watched" users={data.watchers} />
              )}
              {data.reactors.length > 0 && (
                <ActivityCluster label="Reacted" users={data.reactors} />
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ── Previous days ────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setPrevExpanded(!prevExpanded)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          border: "none",
          background: "transparent",
          padding: "4px 2px",
          cursor: "pointer",
          marginBottom: 10,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <SectionLabel style={{ margin: 0 }}>Previous days</SectionLabel>
        <span
          style={{
            fontSize: 13,
            color: t.blue,
            fontFamily: t.fontText,
          }}
        >
          {prevExpanded ? "Show less" : "Show all"}
        </span>
      </button>

      {prevExpanded && (
        <Card style={{ marginBottom: 16 }}>
          {data.previousDays.map((day, idx) => (
            <button
              key={day.id}
              type="button"
              onClick={() => setTab("archive")}
              style={{
                display: "flex",
                gap: 12,
                padding: "12px 16px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                position: "relative",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <CollageThumb urls={day.collageUrls} />
              <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: t.text,
                    letterSpacing: "-0.2px",
                  }}
                >
                  {day.vloggerName}&apos;s Day
                </div>
                <div style={{ fontSize: 13, color: t.textSecondary, marginTop: 2 }}>
                  {day.label} · {day.clipCount} moments
                </div>
              </div>
              <ChevronRightIcon />
              {idx < data.previousDays.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 60,
                    right: 0,
                    height: 0.5,
                    background: t.separator,
                  }}
                />
              )}
            </button>
          ))}
        </Card>
      )}
    </div>
  );
}

// ── Helper components ──────────────────────────────────────────────────────

function ChevronRightIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(235,235,245,0.3)"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, alignSelf: "center" }}
      aria-hidden
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function CollageThumb({ urls }: { urls: string[] }) {
  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 11,
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        flexShrink: 0,
        backgroundColor: t.bg3,
      }}
    >
      {urls.slice(0, 4).map((url, i) => (
        <div key={i} style={{ background: `url(${url}) center/cover no-repeat` }} />
      ))}
    </div>
  );
}

function ActivityCluster({
  label,
  users,
}: {
  label: string;
  users: { initials: string; name: string }[];
}) {
  return (
    <div style={{ flexShrink: 0 }}>
      <div
        style={{
          fontSize: 11,
          color: t.textTertiary,
          marginBottom: 8,
          fontWeight: 600,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex" }}>
        {users.map((u, i) => (
          <div key={i} style={{ marginLeft: i === 0 ? 0 : -8 }}>
            <Avatar initials={u.initials} size={30} ring />
          </div>
        ))}
      </div>
    </div>
  );
}