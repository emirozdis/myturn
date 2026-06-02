"use client";

import { useState } from "react";
import { Check, Flame } from "lucide-react";
import type { MockAppState } from "@/lib/mock-app-data";
import { AppIcon } from "@/components/ui/icon";
import { appTheme as t } from "../theme";
import { Avatar, AppBtn, Card, ScreenHeader, SectionLabel } from "../ui";

export function GroupPage({ data, onBack }: { data: MockAppState; onBack: () => void }) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    void navigator.clipboard?.writeText(data.inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <ScreenHeader title={data.groupName} onBack={onBack} />

      <AppBtn onClick={copyLink} style={{ marginBottom: 24 }}>
        {copied ? (
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            Link copied
            <Check size={18} strokeWidth={2.5} />
          </span>
        ) : (
          "Copy invite link"
        )}
      </AppBtn>

      <Card style={{ marginBottom: 24, textAlign: "center", padding: 24 }}>
        <div
          style={{
            width: 120,
            height: 120,
            margin: "0 auto 12px",
            borderRadius: 16,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            color: "#000",
            fontWeight: 600,
          }}
        >
          QR CODE
        </div>
        <p style={{ fontSize: 13, color: t.textMuted, margin: 0 }}>Scan to join the group</p>
      </Card>

      <SectionLabel>Members · {data.members.length}</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
        {data.members.map((m) => (
          <Card key={m.id} style={{ padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Avatar initials={m.initials} size={44} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>{m.name}</div>
                <div style={{ fontSize: 13, color: t.textMuted }}>Last vlogged {m.lastVlogged}</div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: t.accent,
                  background: t.accentMuted,
                  padding: "6px 10px",
                  borderRadius: 10,
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <AppIcon icon={Flame} size={14} color={t.accent} />
                  {m.streak}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
