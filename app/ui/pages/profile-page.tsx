"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Pencil, MapPin, Calendar, Clapperboard, Flame, Users,
  LogOut, ChevronRight, UserCircle, IdCard, Lock, Bell, Palette,
  Moon, Sun, Check, Eye, EyeOff, ChevronLeft, Star, Bookmark, Play,
  Shield, Smartphone, Mail, Phone, Globe, AtSign, AlertTriangle,
  BellRing, Volume2
} from "lucide-react";
import { ACCENT } from "../theme";
import { glassStyle } from "../shared/glass-style";

/* ═══════════════════════════ TYPES ═══════════════════════════ */

type ActivityTab = "vlogs" | "streaks" | "groups" | "saved";
type Panel = "editProfile" | "accountDetails" | "privacy" | "notifications" | "theme" | "logoutConfirm" | null;

/* ═══════════════════════════ MOCK DATA ═══════════════════════════ */

const VLOGS = [
  { id: "v1", title: "Beach day",      date: "Apr 14, 2025", duration: "2:45", thumb: "/image1.jpg" },
  { id: "v2", title: "Food trip!",     date: "Apr 11, 2025", duration: "3:12", thumb: "/image1.jpg" },
  { id: "v3", title: "Island hopping", date: "Apr 7, 2025",  duration: "4:01", thumb: "/image1.jpg" },
  { id: "v4", title: "Chill Friday",   date: "Apr 5, 2025",  duration: "1:58", thumb: "/image1.jpg" },
];

const SAVED_VLOGS = [
  { id: "s1", title: "Sunset drive",   date: "Apr 12, 2025", duration: "3:20", thumb: "/image1.jpg" },
  { id: "s2", title: "Morning run",    date: "Apr 9, 2025",  duration: "1:45", thumb: "/image1.jpg" },
];

const CALENDAR_DAYS: { d: number | null; type: "vlogged" | "missed" | "partial" | "future" | "empty"; best?: boolean }[] = [
  { d: null, type: "empty" }, { d: null, type: "empty" }, { d: 1, type: "vlogged" }, { d: 2, type: "vlogged" },
  { d: 3, type: "vlogged" }, { d: 4, type: "missed" }, { d: 5, type: "vlogged" },
  { d: 6, type: "vlogged" }, { d: 7, type: "vlogged", best: true }, { d: 8, type: "vlogged" }, { d: 9, type: "missed" },
  { d: 10, type: "vlogged" }, { d: 11, type: "vlogged" }, { d: 12, type: "vlogged" },
  { d: 13, type: "missed" }, { d: 14, type: "vlogged" }, { d: 15, type: "vlogged" }, { d: 16, type: "future" },
  { d: 17, type: "future" }, { d: 18, type: "future" }, { d: 19, type: "future" }, { d: 20, type: "future" },
  { d: 21, type: "future" }, { d: 22, type: "future" }, { d: 23, type: "future" }, { d: 24, type: "future" },
  { d: 25, type: "future" }, { d: 26, type: "future" }, { d: 27, type: "future" }, { d: 28, type: "future" },
  { d: 29, type: "future" }, { d: 30, type: "future" },
];

const USER_GROUPS = [
  { id: "g1", emoji: "🏠", name: "The Apartment",    members: 8,  lastVlog: "2 days ago",  role: "Admin"  },
  { id: "g2", emoji: "🏔️", name: "Weekend Warriors",  members: 5,  lastVlog: "1 week ago",  role: "Member" },
  { id: "g3", emoji: "🍔", name: "Foodies Club",     members: 6,  lastVlog: "3 days ago",  role: "Member" },
  { id: "g4", emoji: "🎬", name: "Daily Vloggers",   members: 14, lastVlog: "Yesterday",   role: "Member" },
];

/* ═══════════════════════════ SHARED ATOMS ═══════════════════════════ */

const s = {
  row: {
    display: "flex", alignItems: "center", gap: 14,
    padding: "14px 16px", background: "none", border: "none",
    cursor: "pointer", textAlign: "left" as const, width: "100%",
  },
  iconCircle: (accent = false) => ({
    width: 36, height: 36, borderRadius: "50%",
    background: accent ? `${ACCENT}22` : "rgba(255,255,255,0.07)",
    border: `1px solid ${accent ? ACCENT + "44" : "rgba(255,255,255,0.10)"}`,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  }),
  label: { color: "#fff", fontWeight: 600, fontSize: 14, margin: 0 },
  sub:   { color: "rgba(255,255,255,0.40)", fontSize: 11, margin: "1px 0 0" },
  card:  { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, overflow: "hidden" },
  input: {
    width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12, color: "#fff", fontSize: 14, padding: "11px 14px", outline: "none",
    boxSizing: "border-box" as const,
  },
  section: { padding: "0 16px", marginBottom: 16 },
};

/* ═══════════════════════════ STAT PILL ═══════════════════════════ */

function StatPill({ icon: Icon, value, label }: { icon: React.ElementType; value: number | string; label: string }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "14px 6px" }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", border: `1.5px solid ${ACCENT}44`, background: `${ACCENT}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={18} color={ACCENT} />
      </div>
      <span style={{ color: "#fff", fontWeight: 700, fontSize: 20, lineHeight: 1 }}>{value}</span>
      <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 500 }}>{label}</span>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        width: 44, height: 26, borderRadius: 13, cursor: "pointer", flexShrink: 0,
        background: on ? ACCENT : "rgba(255,255,255,0.15)",
        position: "relative", transition: "background 0.2s",
      }}
    >
      <div style={{
        position: "absolute", top: 3, left: on ? 21 : 3,
        width: 20, height: 20, borderRadius: "50%", background: "#fff",
        transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      }} />
    </div>
  );
}

function SlidePanel({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      style={{
        position: "absolute", inset: 0, background: "#111", zIndex: 10,
        display: "flex", flexDirection: "column", overflowY: "auto",
        scrollbarWidth: "none",
      }}
    >
      {/* panel header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 16px 0", flexShrink: 0 }}>
        <button
          type="button"
          onClick={onBack}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(255,255,255,0.7)", display: "flex" }}
        >
          <ChevronLeft size={22} />
        </button>
        <span style={{ color: "#fff", fontSize: 17, fontWeight: 700 }}>{title}</span>
      </div>
      <div style={{ flex: 1, padding: "20px 0 32px" }}>
        {children}
      </div>
    </motion.div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ color: "rgba(255,255,255,0.40)", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 8px", padding: "0 16px" }}>
      {children}
    </p>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: 0 }} />;
}

/* ═══════════════════════════ PANELS ═══════════════════════════ */

function EditProfilePanel({ onBack }: { onBack: () => void }) {
  const [name,    setName]    = useState("Emir");
  const [handle,  setHandle]  = useState("emirozdis");
  const [bio,     setBio]     = useState("Vlogging our days, making our memories ✨");
  const [loc,     setLoc]     = useState("Phuket, Thailand");
  const [saved,   setSaved]   = useState(false);

  function save() { setSaved(true); setTimeout(() => { setSaved(false); onBack(); }, 900); }

  return (
    <SlidePanel title="Edit Profile" onBack={onBack}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* avatar */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 4 }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: 90, height: 90, borderRadius: "50%", overflow: "hidden", border: "2.5px solid rgba(255,255,255,0.18)" }}>
              <img src="/profile.jpg" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ position: "absolute", bottom: 2, right: 2, width: 26, height: 26, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #111", cursor: "pointer" }}>
              <Camera size={12} color="#000" />
            </div>
          </div>
        </div>

        {/* fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 16px" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>Display Name</p>
            <input value={name} onChange={e => setName(e.target.value)} style={s.input} placeholder="Your name" />
          </div>
          <div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>Username</p>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.40)", fontSize: 14 }}>@</span>
              <input value={handle} onChange={e => setHandle(e.target.value)} style={{ ...s.input, paddingLeft: 28 }} placeholder="handle" />
            </div>
          </div>
          <div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>Bio</p>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
              style={{ ...s.input, resize: "none", lineHeight: 1.5 }} placeholder="Tell your story…" />
          </div>
          <div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>Location</p>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><MapPin size={14} color="rgba(255,255,255,0.40)" /></span>
              <input value={loc} onChange={e => setLoc(e.target.value)} style={{ ...s.input, paddingLeft: 34 }} placeholder="City, Country" />
            </div>
          </div>
        </div>

        <div style={{ padding: "0 16px" }}>
          <button type="button" onClick={save} style={{ width: "100%", background: saved ? "#22c55e" : ACCENT, border: "none", borderRadius: 14, color: "#000", fontWeight: 700, fontSize: 15, padding: "13px 0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.2s" }}>
            {saved ? <><Check size={16} /> Saved!</> : "Save Changes"}
          </button>
        </div>
      </div>
    </SlidePanel>
  );
}

function AccountDetailsPanel({ onBack }: { onBack: () => void }) {
  const [email,   setEmail]   = useState("emir.ozdis@example.com");
  const [phone,   setPhone]   = useState("+90 555 123 45 67");
  const [showPw,  setShowPw]  = useState(false);
  const [pw,      setPw]      = useState("••••••••");
  const [saved,   setSaved]   = useState(false);

  function save() { setSaved(true); setTimeout(() => setSaved(false), 1400); }

  return (
    <SlidePanel title="Account Details" onBack={onBack}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 16px" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>Email</p>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><Mail size={14} color="rgba(255,255,255,0.40)" /></span>
              <input value={email} onChange={e => setEmail(e.target.value)} style={{ ...s.input, paddingLeft: 34 }} type="email" />
            </div>
          </div>
          <div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>Phone</p>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><Phone size={14} color="rgba(255,255,255,0.40)" /></span>
              <input value={phone} onChange={e => setPhone(e.target.value)} style={{ ...s.input, paddingLeft: 34 }} type="tel" />
            </div>
          </div>
          <div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>Password</p>
            <div style={{ position: "relative" }}>
              <input value={pw} onChange={e => setPw(e.target.value)} type={showPw ? "text" : "password"} style={{ ...s.input, paddingRight: 42 }} />
              <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.45)", display: "flex" }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* linked accounts */}
        <div>
          <SectionTitle>Linked Accounts</SectionTitle>
          <div style={{ ...glassStyle(0.04, 20, 0.08), borderRadius: 18, overflow: "hidden", margin: "0 16px" }}>
            {[
              { icon: Globe,       label: "Google",   linked: true  },
              { icon: Smartphone,  label: "Apple ID", linked: false },
            ].map((item, i, arr) => {
              const Icon = item.icon;
              return (
                <div key={item.label}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px" }}>
                    <div style={s.iconCircle()}>
                      <Icon size={15} color="rgba(255,255,255,0.65)" />
                    </div>
                    <span style={{ flex: 1, color: "#fff", fontWeight: 600, fontSize: 14 }}>{item.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: item.linked ? "#4ade80" : "rgba(255,255,255,0.35)" }}>
                      {item.linked ? "Connected" : "Connect"}
                    </span>
                  </div>
                  {i < arr.length - 1 && <Divider />}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "0 16px" }}>
          <button type="button" onClick={save} style={{ width: "100%", background: saved ? "#22c55e" : ACCENT, border: "none", borderRadius: 14, color: "#000", fontWeight: 700, fontSize: 15, padding: "13px 0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.2s" }}>
            {saved ? <><Check size={16} /> Saved!</> : "Save Changes"}
          </button>
        </div>
      </div>
    </SlidePanel>
  );
}

function PrivacyPanel({ onBack }: { onBack: () => void }) {
  const [priv, setPriv] = useState({ publicProfile: true, showLocation: false, showStreak: true, allowTagging: true, dataCollection: false });
  const toggle = (k: keyof typeof priv) => setPriv(v => ({ ...v, [k]: !v[k] }));

  const rows = [
    { key: "publicProfile" as const, icon: Globe,   label: "Public Profile",    sub: "Anyone can view your profile" },
    { key: "showLocation"  as const, icon: MapPin,   label: "Show Location",     sub: "Display your location on profile" },
    { key: "showStreak"    as const, icon: Flame,    label: "Show Streak",       sub: "Show your streak to friends" },
    { key: "allowTagging"  as const, icon: AtSign,   label: "Allow Tagging",     sub: "Friends can tag you in vlogs" },
    { key: "dataCollection"as const, icon: Shield,   label: "Analytics",         sub: "Help improve the app with data" },
  ];

  return (
    <SlidePanel title="Privacy" onBack={onBack}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <SectionTitle>Visibility</SectionTitle>
          <div style={{ ...glassStyle(0.04, 20, 0.08), borderRadius: 18, overflow: "hidden", margin: "0 16px" }}>
            {rows.map((r, i) => {
              const Icon = r.icon;
              return (
                <div key={r.key}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px" }}>
                    <div style={s.iconCircle()}>
                      <Icon size={15} color="rgba(255,255,255,0.65)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={s.label}>{r.label}</p>
                      <p style={s.sub}>{r.sub}</p>
                    </div>
                    <Toggle on={priv[r.key]} onChange={() => toggle(r.key)} />
                  </div>
                  {i < rows.length - 1 && <Divider />}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "0 16px" }}>
          <div style={{ background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.18)", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
            <AlertTriangle size={16} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ color: "#f87171", fontWeight: 600, fontSize: 13, margin: 0 }}>Danger Zone</p>
              <p style={{ color: "rgba(255,255,255,0.40)", fontSize: 11, margin: "4px 0 10px" }}>Permanently delete your account and all data.</p>
              <button type="button" style={{ background: "rgba(255,100,100,0.15)", border: "1px solid rgba(255,100,100,0.30)", borderRadius: 10, color: "#f87171", fontSize: 12, fontWeight: 700, padding: "7px 14px", cursor: "pointer" }}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </SlidePanel>
  );
}

function NotificationsPanel({ onBack }: { onBack: () => void }) {
  const [notifs, setNotifs] = useState({
    pushEnabled: true, friendVlogs: true, streakReminder: true,
    groupActivity: false, mentions: true, newFollower: false,
    weeklyDigest: true, sound: true,
  });
  const toggle = (k: keyof typeof notifs) => setNotifs(v => ({ ...v, [k]: !v[k] }));

  const groups = [
    {
      title: "Push Notifications",
      rows: [
        { key: "pushEnabled"    as const, icon: BellRing, label: "Enable Push",        sub: "Master toggle for all push alerts" },
        { key: "sound"          as const, icon: Volume2,  label: "Notification Sound",  sub: "Play sound with push alerts" },
      ],
    },
    {
      title: "Activity",
      rows: [
        { key: "friendVlogs"    as const, icon: Clapperboard, label: "Friend Vlogs",    sub: "When friends post a new vlog" },
        { key: "groupActivity"  as const, icon: Users,         label: "Group Activity",  sub: "Updates from your groups" },
        { key: "mentions"       as const, icon: AtSign,        label: "Mentions",        sub: "When someone tags you" },
        { key: "newFollower"    as const, icon: UserCircle,    label: "New Friends",     sub: "When someone adds you" },
      ],
    },
    {
      title: "Reminders",
      rows: [
        { key: "streakReminder" as const, icon: Flame,     label: "Streak Reminder",   sub: "Daily reminder to keep your streak" },
        { key: "weeklyDigest"   as const, icon: Calendar,  label: "Weekly Digest",     sub: "Your weekly activity summary" },
      ],
    },
  ];

  return (
    <SlidePanel title="Notifications" onBack={onBack}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {groups.map(group => (
          <div key={group.title}>
            <SectionTitle>{group.title}</SectionTitle>
            <div style={{ ...glassStyle(0.04, 20, 0.08), borderRadius: 18, overflow: "hidden", margin: "0 16px" }}>
              {group.rows.map((r, i) => {
                const Icon = r.icon;
                const disabled = !notifs.pushEnabled && r.key !== "pushEnabled";
                return (
                  <div key={r.key}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", opacity: disabled ? 0.4 : 1, transition: "opacity 0.2s" }}>
                      <div style={s.iconCircle()}>
                        <Icon size={15} color="rgba(255,255,255,0.65)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={s.label}>{r.label}</p>
                        <p style={s.sub}>{r.sub}</p>
                      </div>
                      <Toggle on={notifs[r.key]} onChange={() => !disabled && toggle(r.key)} />
                    </div>
                    {i < group.rows.length - 1 && <Divider />}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </SlidePanel>
  );
}

function ThemePanel({ onBack }: { onBack: () => void }) {
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");
  const [accent, setAccent] = useState("#e07c30");

  const themes: { key: typeof theme extends infer T ? T : never; label: string; icon: React.ElementType; preview: string }[] = [
    { key: "dark",   label: "Dark",   icon: Moon,        preview: "#111" },
    { key: "light",  label: "Light",  icon: Sun,         preview: "#f5f5f5" },
    { key: "system", label: "System", icon: Smartphone,  preview: "linear-gradient(135deg,#111 50%,#f5f5f5 50%)" },
  ];

  const accents = ["#e07c30", "#3b82f6", "#22c55e", "#a855f7", "#ec4899", "#ef4444"];

  return (
    <SlidePanel title="Theme" onBack={onBack}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <SectionTitle>Appearance</SectionTitle>
          <div style={{ display: "flex", gap: 10, padding: "0 16px" }}>
            {themes.map(t => {
              const Icon = t.icon;
              const active = theme === t.key;
              return (
                <button key={t.key} type="button" onClick={() => setTheme(t.key as any)}
                  style={{ flex: 1, border: `2px solid ${active ? ACCENT : "rgba(255,255,255,0.10)"}`, borderRadius: 14, padding: "14px 8px", cursor: "pointer", background: "rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, transition: "border-color 0.2s" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: t.preview, border: "1px solid rgba(255,255,255,0.12)" }} />
                  <Icon size={14} color={active ? ACCENT : "rgba(255,255,255,0.55)"} />
                  <span style={{ color: active ? "#fff" : "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600 }}>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <SectionTitle>Accent Color</SectionTitle>
          <div style={{ display: "flex", gap: 12, padding: "0 16px", flexWrap: "wrap" }}>
            {accents.map(c => (
              <button key={c} type="button" onClick={() => setAccent(c)}
                style={{ width: 38, height: 38, borderRadius: "50%", background: c, border: `3px solid ${accent === c ? "#fff" : "transparent"}`, cursor: "pointer", transition: "border-color 0.15s" }} />
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>Display</SectionTitle>
          <div style={{ ...glassStyle(0.04, 20, 0.08), borderRadius: 18, overflow: "hidden", margin: "0 16px" }}>
            {[
              { label: "Reduce Motion",    sub: "Minimize animations across the app" },
              { label: "High Contrast",    sub: "Increase contrast for readability" },
            ].map((r, i, arr) => {
              const [on, setOn] = useState(false);
              return (
                <div key={r.label}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px" }}>
                    <div style={{ flex: 1 }}>
                      <p style={s.label}>{r.label}</p>
                      <p style={s.sub}>{r.sub}</p>
                    </div>
                    <Toggle on={on} onChange={setOn} />
                  </div>
                  {i < arr.length - 1 && <Divider />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SlidePanel>
  );
}

/* ═══════════════════════════ ACTIVITY CONTENT ═══════════════════════════ */

function VlogsGrid() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
      {VLOGS.map(v => (
        <div key={v.id} style={{ position: "relative", borderRadius: 12, overflow: "hidden", aspectRatio: "4/3", background: "#222", cursor: "pointer" }}>
          <img src={v.thumb} alt={v.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.78) 40%, transparent 100%)" }} />
          <div style={{ position: "absolute", top: 7, left: 7, background: "rgba(0,0,0,0.55)", borderRadius: 6, padding: "2px 7px", display: "flex", alignItems: "center", gap: 4 }}>
            <Play size={9} color="#fff" fill="#fff" />
            <span style={{ color: "#fff", fontSize: 10, fontWeight: 600 }}>{v.duration}</span>
          </div>
          <div style={{ position: "absolute", bottom: 8, left: 8, right: 8 }}>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 12, margin: 0, lineHeight: 1.2 }}>{v.title}</p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, margin: "2px 0 0" }}>{v.date}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function StreaksContent() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* stats */}
      <div style={{ ...glassStyle(0.04, 20, 0.08), borderRadius: 18, display: "flex", alignItems: "center" }}>
        {[
          { label: "Current", value: "3", unit: "days", color: ACCENT },
          { label: "Best",    value: "12", unit: "days", color: "#fff" },
          { label: "Total",   value: "36", unit: "vlogs", color: "#fff" },
        ].map((item, i, arr) => (
          <div key={item.label} style={{ flex: 1, display: "flex", flexDirection: "row" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "16px 8px" }}>
              <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.label}</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                <span style={{ color: item.color, fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{item.value}</span>
                <span style={{ color: "rgba(255,255,255,0.40)", fontSize: 10 }}>{item.unit}</span>
              </div>
              {item.label === "Current" && <Flame size={14} color={ACCENT} fill={ACCENT} />}
            </div>
            {i < arr.length - 1 && <div style={{ width: 1, background: "rgba(255,255,255,0.07)", margin: "12px 0" }} />}
          </div>
        ))}
      </div>

      {/* calendar */}
      <div style={{ ...glassStyle(0.04, 20, 0.08), borderRadius: 18, padding: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>April 2025</span>
          <div style={{ display: "flex", gap: 6 }}>
            {["‹", "›"].map(ch => (
              <button key={ch} type="button" style={{ width: 26, height: 26, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.55)", fontSize: 14, cursor: "pointer" }}>{ch}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px 4px", textAlign: "center" }}>
          {["M","T","W","T","F","S","S"].map((d, i) => (
            <span key={i} style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", marginBottom: 4 }}>{d}</span>
          ))}
          {CALENDAR_DAYS.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "center", position: "relative" }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700,
                background: item.type === "vlogged" ? ACCENT : item.type === "partial" ? `${ACCENT}44` : "transparent",
                border: item.type === "missed" ? "1px solid rgba(255,255,255,0.12)" : "none",
                color: item.type === "vlogged" ? "#000" : item.type === "future" || item.type === "empty" ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.60)",
              }}>
                {item.d}
              </div>
              {item.best && (
                <div style={{ position: "absolute", bottom: -2, right: -2, width: 13, height: 13, background: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid #111` }}>
                  <Star size={6} color={ACCENT} fill={ACCENT} />
                </div>
              )}
            </div>
          ))}
        </div>
        {/* legend */}
        <div style={{ display: "flex", gap: 12, marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap" }}>
          {[
            { color: ACCENT,                          label: "Vlogged"  },
            { color: "transparent", border: ACCENT,   label: "Partial"  },
            { color: "transparent", border: "rgba(255,255,255,0.25)", label: "Missed" },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.color, border: `1.5px solid ${l.border || l.color}` }} />
              <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: 500 }}>{l.label}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Star size={10} color={ACCENT} fill={ACCENT} />
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: 500 }}>Best day</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function GroupsContent() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {USER_GROUPS.map(g => (
        <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 12, ...glassStyle(0.04, 20, 0.08), borderRadius: 14, padding: "12px 14px" }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
            {g.emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 13, margin: 0 }}>{g.name}</p>
              {g.role === "Admin" && (
                <span style={{ background: `${ACCENT}22`, border: `1px solid ${ACCENT}44`, borderRadius: 6, color: ACCENT, fontSize: 9, fontWeight: 700, padding: "1px 6px" }}>Admin</span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
              <span style={{ color: "rgba(255,255,255,0.40)", fontSize: 11 }}>{g.members} members</span>
              <span style={{ color: "rgba(255,255,255,0.20)", fontSize: 10 }}>·</span>
              <span style={{ color: "rgba(255,255,255,0.30)", fontSize: 11 }}>Last vlog {g.lastVlog}</span>
            </div>
          </div>
          <ChevronRight size={15} color="rgba(255,255,255,0.25)" />
        </div>
      ))}
    </div>
  );
}

function SavedContent() {
  return SAVED_VLOGS.length > 0 ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {SAVED_VLOGS.map(v => (
        <div key={v.id} style={{ display: "flex", gap: 12, ...glassStyle(0.04, 20, 0.08), borderRadius: 14, overflow: "hidden", cursor: "pointer" }}>
          <div style={{ position: "relative", width: 90, flexShrink: 0 }}>
            <img src={v.thumb} alt={v.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Play size={12} color="#fff" fill="#fff" />
              </div>
            </div>
            <div style={{ position: "absolute", bottom: 5, left: 5, background: "rgba(0,0,0,0.6)", borderRadius: 4, padding: "1px 5px" }}>
              <span style={{ color: "#fff", fontSize: 9, fontWeight: 600 }}>{v.duration}</span>
            </div>
          </div>
          <div style={{ flex: 1, padding: "12px 12px 12px 0", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 13, margin: 0 }}>{v.title}</p>
              <p style={{ color: "rgba(255,255,255,0.40)", fontSize: 11, margin: "4px 0 0" }}>{v.date}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Bookmark size={12} color={ACCENT} fill={ACCENT} />
              <span style={{ color: ACCENT, fontSize: 11, fontWeight: 600 }}>Saved</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div style={{ textAlign: "center", padding: "32px 0", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
      No saved vlogs yet
    </div>
  );
}

/* ═══════════════════════════ MAIN COMPONENT ═══════════════════════════ */

export function ProfilePage() {
  const [activityTab, setActivityTab] = useState<ActivityTab>("vlogs");
  const [panel, setPanel] = useState<Panel>(null);

  const activityTabs: { key: ActivityTab; label: string }[] = [
    { key: "vlogs",   label: "Vlogs"   },
    { key: "streaks", label: "Streaks" },
    { key: "groups",  label: "Groups"  },
    { key: "saved",   label: "Saved"   },
  ];

  const settingsRows: { icon: React.ElementType; label: string; sub: string; panel: Panel; right?: "moon" }[] = [
    { icon: UserCircle, label: "Edit Profile",    sub: "Update your information",      panel: "editProfile"    },
    { icon: IdCard,     label: "Account Details", sub: "Email, phone, password",       panel: "accountDetails" },
    { icon: Lock,       label: "Privacy",         sub: "Manage your privacy settings", panel: "privacy"        },
    { icon: Bell,       label: "Notifications",   sub: "Manage your notifications",    panel: "notifications"  },
    { icon: Palette,    label: "Theme",           sub: "Dark Mode",                    panel: "theme", right: "moon" },
  ];

  return (
    <motion.div
      key="profile-tab"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      style={{
        flex: 1, display: "flex", flexDirection: "column", minHeight: 0,
        position: "relative", overflow: "hidden", margin: "-16px"
      }}
    >
      {/* ──────── MAIN SCROLL CONTENT ──────── */}
      <div
        style={{
          flex: 1, overflowY: "auto", display: "flex", flexDirection: "column",
          scrollbarWidth: "none", msOverflowStyle: "none"
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: `::-webkit-scrollbar { display: none; }` }} />

        {/* profile header */}
        <div style={{ padding: "16px 16px 0", display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 100, height: 100, borderRadius: "50%", overflow: "hidden", border: "2.5px solid rgba(255,255,255,0.18)" }}>
              <img src="/profile.jpg" alt="Emir" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
            <button type="button" onClick={() => setPanel("editProfile")} style={{ position: "absolute", bottom: 2, right: 2, width: 28, height: 28, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #111", cursor: "pointer" }}>
              <Camera size={13} color="#000" />
            </button>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1 }}>Emir</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: 500 }}>@emirozdis</span>
              <button type="button" onClick={() => setPanel("editProfile")} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 20, padding: "3px 10px", color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <Pencil size={11} /> Edit
              </button>
            </div>
            <p style={{ color: "rgba(255,255,255,0.70)", fontSize: 13, margin: "0 0 8px", lineHeight: 1.4 }}>Vlogging our days, making our memories ✨</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.45)", fontSize: 11 }}>
                <MapPin size={12} color="rgba(255,255,255,0.45)" /> Phuket, Thailand
              </span>
              <span style={{ color: "rgba(255,255,255,0.20)", fontSize: 11 }}>•</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.45)", fontSize: 11 }}>
                <Calendar size={12} color="rgba(255,255,255,0.45)" /> Joined Mar 2025
              </span>
            </div>
          </div>
        </div>

        {/* stats */}
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ ...glassStyle(0.04, 20, 0.08), borderRadius: 18, display: "flex", alignItems: "stretch" }}>
            {[
              { icon: Clapperboard, value: 36, label: "Total Vlogs" },
              { icon: Flame,        value: 3,  label: "Day Streak"  },
              { icon: Users,        value: 12, label: "Friends"     },
              { icon: Users,        value: 4,  label: "Groups"      },
            ].map((stat, i, arr) => (
              <div key={stat.label} style={{ flex: 1, display: "flex", flexDirection: "row", alignItems: "stretch" }}>
                <StatPill icon={stat.icon} value={stat.value} label={stat.label} />
                {i < arr.length - 1 && <div style={{ width: 1, background: "rgba(255,255,255,0.07)", margin: "14px 0" }} />}
              </div>
            ))}
          </div>
        </div>

        {/* settings rows */}
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ ...glassStyle(0.04, 20, 0.08), borderRadius: 18, overflow: "hidden" }}>
            {settingsRows.map((row, i) => {
              const Icon = row.icon;
              return (
                <button key={row.label} type="button" onClick={() => setPanel(row.panel)}
                  style={{ ...s.row, borderBottom: i < settingsRows.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                  <div style={s.iconCircle()}>
                    <Icon size={16} color="rgba(255,255,255,0.70)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={s.label}>{row.label}</p>
                    <p style={s.sub}>{row.sub}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    {row.right === "moon" && <Moon size={16} color={ACCENT} fill={ACCENT} />}
                    <ChevronRight size={15} color="rgba(255,255,255,0.30)" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* activity */}
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>My Activity</span>
            <button type="button" style={{ background: "none", border: "none", color: ACCENT, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}>See all</button>
          </div>
          <div style={{ display: "flex", ...glassStyle(0.04, 20, 0.08), borderRadius: 12, padding: 3, gap: 2, marginBottom: 14 }}>
            {activityTabs.map(t => (
              <button key={t.key} type="button" onClick={() => setActivityTab(t.key)}
                style={{ flex: 1, padding: "7px 0", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.18s", background: activityTab === t.key ? ACCENT : "transparent", color: activityTab === t.key ? "#000" : "rgba(255,255,255,0.55)" }}>
                {t.label}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={activityTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
              {activityTab === "vlogs"   && <VlogsGrid />}
              {activityTab === "streaks" && <StreaksContent />}
              {activityTab === "groups"  && <GroupsContent />}
              {activityTab === "saved"   && <SavedContent />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* log out */}
        <div style={{ padding: "16px 16px 16px" }}>
          <button type="button" onClick={() => setPanel("logoutConfirm")}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", ...glassStyle(0.04, 20, 0.08), borderRadius: 16, cursor: "pointer", textAlign: "left" }}>
            <LogOut size={18} color={ACCENT} />
            <div style={{ flex: 1 }}>
              <p style={{ color: ACCENT, fontWeight: 700, fontSize: 14, margin: 0 }}>Log Out</p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: "1px 0 0" }}>See you again!</p>
            </div>
            <ChevronRight size={15} color="rgba(255,255,255,0.25)" />
          </button>
        </div>
      </div>

      {/* ──────── SLIDE PANELS ──────── */}
      <AnimatePresence>
        {panel === "editProfile"    && <EditProfilePanel    key="ep"  onBack={() => setPanel(null)} />}
        {panel === "accountDetails" && <AccountDetailsPanel key="ad"  onBack={() => setPanel(null)} />}
        {panel === "privacy"        && <PrivacyPanel        key="pv"  onBack={() => setPanel(null)} />}
        {panel === "notifications"  && <NotificationsPanel  key="nf"  onBack={() => setPanel(null)} />}
        {panel === "theme"          && <ThemePanel          key="th"  onBack={() => setPanel(null)} />}
      </AnimatePresence>

      {/* ──────── LOG OUT CONFIRMATION ──────── */}
      <AnimatePresence>
        {panel === "logoutConfirm" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 20, display: "flex", alignItems: "flex-end", paddingBottom: 32 }}
            onClick={() => setPanel(null)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              onClick={e => e.stopPropagation()}
              style={{ width: "100%", background: "#1a1a1a", borderTop: "1px solid rgba(255,255,255,0.10)", borderRadius: "24px 24px 0 0", padding: "24px 20px 12px" }}
            >
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${ACCENT}22`, border: `1.5px solid ${ACCENT}44`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <LogOut size={22} color={ACCENT} />
                </div>
              </div>
              <p style={{ color: "#fff", fontWeight: 800, fontSize: 18, textAlign: "center", margin: "0 0 6px" }}>Log out?</p>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, textAlign: "center", margin: "0 0 24px" }}>You'll need to sign in again to access your account.</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setPanel(null)}
                  style={{ flex: 1, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, color: "#fff", fontWeight: 700, fontSize: 15, padding: "13px 0", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="button"
                  style={{ flex: 1, background: ACCENT, border: "none", borderRadius: 14, color: "#000", fontWeight: 700, fontSize: 15, padding: "13px 0", cursor: "pointer" }}>
                  Log Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}