"use client";

import { useState } from "react";
import { Archive, Home, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppIcon } from "@/components/ui/icon";
import { appTheme as t } from "./theme";
import type { MainTab } from "./navigation";

const tabs: { id: MainTab; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "Today", icon: Home },
  { id: "record", label: "Record", icon: Video },
  { id: "archive", label: "Archive", icon: Archive },
];

export function TabBar({ active, onChange }: { active: MainTab; onChange: (tab: MainTab) => void }) {
  return (
    <nav
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-around",
        paddingTop: 8,
        paddingLeft: 12,
        paddingRight: 12,
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(8,8,8,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        marginBottom: 0,
        position: "relative",
        zIndex: 10,
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        const isRecord = tab.id === "record";
        return (
          <TabItem
            key={tab.id}
            label={tab.label}
            icon={tab.icon}
            isActive={isActive}
            isRecord={isRecord}
            onClick={() => onChange(tab.id)}
          />
        );
      })}
    </nav>
  );
}

function TabItem({
  label,
  icon,
  isActive,
  isRecord,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  isRecord: boolean;
  onClick: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const iconColor = isActive ? (isRecord ? "#000" : "#fff") : "rgba(255,255,255,0.4)";

  if (isRecord) {
    return (
      <button
        type="button"
        onClick={onClick}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          padding: "0 8px 4px",
          transform: pressed ? "scale(0.94)" : "scale(1)",
          transition: `transform 0.15s ${t.ease.spring}`,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            background: isActive ? "#fff" : "rgba(255,255,255,0.12)",
            border: isActive ? "none" : "1px solid rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 2,
            boxShadow: isActive ? "0 8px 24px rgba(255,255,255,0.15)" : "none",
          }}
        >
          <AppIcon icon={icon} size={26} color={iconColor} />
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: isActive ? "#fff" : t.textDim,
            letterSpacing: "0.2px",
          }}
        >
          {label}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "none",
        background: "transparent",
        cursor: "pointer",
        padding: "6px 16px 4px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        minWidth: 64,
      }}
    >
      <AppIcon icon={icon} size={22} color={iconColor} />
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: isActive ? "#fff" : t.textDim,
        }}
      >
        {label}
      </span>
    </button>
  );
}
