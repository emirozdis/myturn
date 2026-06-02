"use client";

import { useState } from "react";
import type { MockAppState } from "@/lib/mock-app-data";
import { appTheme as t } from "../theme";
import { Card, SectionLabel, InlineHeader } from "../ui";

export function ArchivePage({ data }: { data: MockAppState }) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const allDays = [
    {
      id: "today",
      label: "Today",
      vloggerName: data.todayVlogger.name,
      clipCount: data.todayClips.length,
      collageUrls: [
        ...data.todayClips.map((c) => c.thumbnailUrl || ""),
        "https://picsum.photos/seed/t1/200/200",
        "https://picsum.photos/seed/t2/200/200",
        "https://picsum.photos/seed/t3/200/200",
        "https://picsum.photos/seed/t4/200/200",
      ],
    },
    ...data.previousDays,
  ];

  const today = new Date();
  const monthName = today.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        paddingBottom: 16,
        marginLeft: -16,
        marginRight: -16,
        paddingLeft: 16,
        paddingRight: 16,
      }}
    >
      <InlineHeader eyebrow="Memory" title="Archive" />

      <p
        style={{
          fontSize: 15,
          color: t.textSecondary,
          marginTop: -12,
          marginBottom: 24,
          lineHeight: 1.5,
        }}
      >
        Every day belongs to one person.
      </p>

      {/* ── Calendar ────────────────────────────────────────────────────── */}
      <SectionLabel style={{ marginBottom: 10 }}>
        {monthName}
      </SectionLabel>

      <div
        style={{
          borderRadius: t.radius.lg,
          background: t.card,
          padding: "14px 12px",
          marginBottom: 28,
        }}
      >
        {/* Day labels */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 4,
            marginBottom: 8,
          }}
        >
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div
              key={i}
              style={{
                textAlign: "center",
                fontSize: 12,
                color: t.textTertiary,
                fontWeight: 500,
                fontFamily: t.fontText,
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 4,
          }}
        >
          {Array.from({ length: 28 }).map((_, i) => {
            const day = i + 1;
            const hasStory = day % 3 !== 0;
            const isToday = day === 28;
            const isSelected = selectedDay === day;
            return (
              <button
                key={i}
                type="button"
                onClick={() => hasStory && setSelectedDay(isSelected ? null : day)}
                style={{
                  aspectRatio: "1",
                  borderRadius: 8,
                  border: "none",
                  background: isToday
                    ? t.blue
                    : isSelected
                      ? "rgba(10,132,255,0.25)"
                      : hasStory
                        ? "rgba(255,255,255,0.08)"
                        : "transparent",
                  color: isToday
                    ? "#fff"
                    : hasStory
                      ? t.text
                      : t.textTertiary,
                  fontSize: 14,
                  fontWeight: isToday ? 700 : 400,
                  cursor: hasStory ? "pointer" : "default",
                  fontFamily: t.fontText,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {day}
                {hasStory && !isToday && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: 2,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: t.accent,
                      opacity: 0.7,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── All days list ───────────────────────────────────────────────── */}
      <SectionLabel style={{ marginBottom: 10 }}>All days</SectionLabel>
      <Card>
        {allDays.map((day, idx) => (
          <button
            key={day.id}
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
            {/* Collage thumb */}
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 11,
                overflow: "hidden",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gridTemplateRows: "1fr 1fr",
                flexShrink: 0,
                backgroundColor: t.bg3,
              }}
            >
              {day.collageUrls.slice(0, 4).map((url, i) => (
                <div key={i} style={{ background: `url(${url}) center/cover no-repeat` }} />
              ))}
            </div>

            <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  color: t.text,
                  letterSpacing: "-0.2px",
                }}
              >
                {day.vloggerName}&apos;s Day
              </div>
              <div
                style={{ fontSize: 13, color: t.textSecondary, marginTop: 2 }}
              >
                {day.label} · {day.clipCount} moments
              </div>
            </div>

            {/* Disclosure chevron */}
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

            {idx < allDays.length - 1 && (
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
    </div>
  );
}