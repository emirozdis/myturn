"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Pencil, MapPin, Calendar, Clapperboard, Users,
  LogOut, ChevronRight, UserCircle, IdCard, Lock, Bell, Palette,
  Moon, Check, ChevronLeft, Star, Bookmark, Play, Crown, Loader2
} from "lucide-react";
import { ACCENT } from "@/lib/theme";
import { glassStyle } from "@/components/shared/glass-style";
import { getProfileData, updateProfile } from "@/actions/profile";
import { signOut } from "next-auth/react";

type ActivityTab = "vlogs" | "rank" | "groups" | "saved";
type Panel = "editProfile" | "accountDetails" | "privacy" | "notifications" | "theme" | "logoutConfirm" | null;

const s = {
  row: {
    display: "flex" as const, alignItems: "center" as const, gap: 14,
    padding: "14px 16px", background: "none", border: "none",
    cursor: "pointer", textAlign: "left" as const, width: "100%",
  },
  iconCircle: (accent = false) => ({
    width: 36, height: 36, borderRadius: "50%",
    background: accent ? `${ACCENT}22` : "rgba(255,255,255,0.07)",
    border: `1px solid ${accent ? ACCENT + "44" : "rgba(255,255,255,0.10)"}`,
    display: "flex", alignItems: "center" as const, justifyContent: "center" as const, flexShrink: 0,
  }),
  label: { color: "#fff", fontWeight: 600, fontSize: 14, margin: 0 },
  sub:   { color: "rgba(255,255,255,0.40)", fontSize: 11, margin: "1px 0 0" },
  card:  { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, overflow: "hidden" as const },
  input: {
    width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12, color: "#fff", fontSize: 14, padding: "11px 14px", outline: "none",
    boxSizing: "border-box" as const,
  },
  section: { padding: "0 16px", marginBottom: 16 },
};

function StatPill({ icon: Icon, value, label }: { icon: React.ElementType; value: number | string; label: string }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 6, padding: "14px 6px" }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", border: `1.5px solid ${ACCENT}44`, background: `${ACCENT}18`, display: "flex", alignItems: "center" as const, justifyContent: "center" as const }}>
        <Icon size={18} color={ACCENT} />
      </div>
      <span style={{ color: "#fff", fontWeight: 700, fontSize: 20, lineHeight: 1 }}>{value}</span>
      <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 500 }}>{label}</span>
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
        display: "flex", flexDirection: "column" as const, overflowY: "auto" as const,
        scrollbarWidth: "none",
      }}
    >
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

function EditProfilePanel({ user, onBack, onSaveSuccess }: { user: any; onBack: () => void; onSaveSuccess: () => void }) {
  const [name, setName] = useState(user.name || "");
  const [handle, setHandle] = useState(user.handle || "");
  const [bio, setBio] = useState(user.bio || "");
  const [loc, setLoc] = useState(user.location || "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setError("");
    const res = await updateProfile({ name, handle, bio, location: loc });
    if (res.error) {
      setError(res.error);
    } else {
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onSaveSuccess();
        onBack();
      }, 900);
    }
  }

  return (
    <SlidePanel title="Edit Profile" onBack={onBack}>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 24 }}>
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 4 }}>
          <div style={{ position: "relative", margin: "0 auto" }}>
            <div style={{ width: 90, height: 90, borderRadius: "50%", overflow: "hidden", border: "2.5px solid rgba(255,255,255,0.18)" }}>
              <img src={user.image || "/profile.jpg"} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ position: "absolute", bottom: 2, right: 2, width: 26, height: 26, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center" as const, justifyContent: "center" as const, border: "2px solid #111", cursor: "pointer" }}>
              <Camera size={12} color="#000" />
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-4 text-red-500 text-sm font-semibold text-center bg-red-500/10 py-2.5 px-4 rounded-xl border border-red-500/20">
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column" as const, gap: 12, padding: "0 16px" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>Display Name</p>
            <input value={name} onChange={e => setName(e.target.value)} style={s.input as any} placeholder="Your name" />
          </div>
          <div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>Username</p>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.40)", fontSize: 14 }}>@</span>
              <input value={handle} onChange={e => setHandle(e.target.value)} style={{ ...s.input, paddingLeft: 28 } as any} placeholder="handle" />
            </div>
          </div>
          <div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>Bio</p>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
              style={{ ...s.input, resize: "none", lineHeight: 1.5 } as any} placeholder="Tell your story…" />
          </div>
          <div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>Location</p>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><MapPin size={14} color="rgba(255,255,255,0.40)" /></span>
              <input value={loc} onChange={e => setLoc(e.target.value)} style={{ ...s.input, paddingLeft: 34 } as any} placeholder="City, Country" />
            </div>
          </div>
        </div>

        <div style={{ padding: "0 16px" }}>
          <button type="button" onClick={save} style={{ width: "100%", background: saved ? "#22c55e" : ACCENT, border: "none", borderRadius: 14, color: "#000", fontWeight: 700, fontSize: 15, padding: "13px 0", cursor: "pointer", display: "flex", alignItems: "center" as const, justifyContent: "center" as const, gap: 8, transition: "background 0.2s" }}>
            {saved ? <><Check size={16} /> Saved!</> : "Save Changes"}
          </button>
        </div>
      </div>
    </SlidePanel>
  );
}

function VlogsGrid({ clips }: { clips: any[] }) {
  if (clips.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
        No personal vlogs posted yet.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
      {clips.map(v => (
        <div key={v.id} style={{ position: "relative", borderRadius: 12, overflow: "hidden", aspectRatio: "4/3", background: "#222", cursor: "pointer" }}>
          <img src={v.thumbnailUrl || "/image1.jpg"} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.78) 40%, transparent 100%)" }} />
          <div style={{ position: "absolute", top: 7, left: 7, background: "rgba(0,0,0,0.55)", borderRadius: 6, padding: "2px 7px", display: "flex", alignItems: "center", gap: 4 }}>
            <Play size={9} color="#fff" fill="#fff" />
            <span style={{ color: "#fff", fontSize: 10, fontWeight: 600 }}>0:12</span>
          </div>
          <div style={{ position: "absolute", bottom: 8, left: 8, right: 8 }}>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 12, margin: 0, lineHeight: 1.2 }}>Daily Update</p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, margin: "2px 0 0" }}>{new Date(v.recordedAt).toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function RankContent({ vlogsCount, calendarDays }: { vlogsCount: number; calendarDays: any[] }) {
  const nextRankGoal = 50;
  const progressPercent = (vlogsCount / nextRankGoal) * 100;

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
      <div style={{ ...glassStyle(0.04, 20, 0.08), borderRadius: 18, padding: "16px", display: "flex", flexDirection: "column" as const, gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: "linear-gradient(135deg, rgba(224,124,48,0.2) 0%, rgba(224,124,48,0.05) 100%)", border: "1px solid rgba(224,124,48,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Crown size={22} color={ACCENT} />
            </div>
            <div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px" }}>Current Level</p>
              <p style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: 0, lineHeight: 1 }}>Epic</p>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px" }}>Total Vlogs</p>
            <p style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: 0, lineHeight: 1 }}>{vlogsCount}</p>
          </div>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600 }}>Progress to Legendary</span>
            <span style={{ color: ACCENT, fontSize: 11, fontWeight: 700 }}>{vlogsCount} / {nextRankGoal}</span>
          </div>
          <div style={{ height: 8, background: "rgba(0,0,0,0.3)", borderRadius: 4, overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{ height: "100%", background: "linear-gradient(90deg, #ff9a44, #e07c30)", borderRadius: 4 }}
            />
          </div>
        </div>
      </div>

      <div style={{ ...glassStyle(0.04, 20, 0.08), borderRadius: 18, padding: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Vlogging History</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px 4px", textAlign: "center" as const }}>
          {["M","T","W","T","F","S","S"].map((d, i) => (
            <span key={i} style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", marginBottom: 4 }}>{d}</span>
          ))}
          {calendarDays.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "center", position: "relative" }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center" as const, justifyContent: "center" as const,
                fontSize: 11, fontWeight: 700,
                background: item.type === "vlogged" ? ACCENT : "transparent",
                border: item.type === "missed" ? "1px solid rgba(255,255,255,0.12)" : "none",
                color: item.type === "vlogged" ? "#000" : "rgba(255,255,255,0.60)",
              }}>
                {item.d}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [activityTab, setActivityTab] = useState<ActivityTab>("vlogs");
  const [panel, setPanel] = useState<Panel>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    setLoading(true);
    const res = await getProfileData();
    if (res.success) {
      setProfile(res);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const activityTabs = [
    { key: "vlogs" as const, label: "Vlogs" },
    { key: "rank" as const, label: "Rank" },
  ];

  const settingsRows = [
    { icon: UserCircle, label: "Edit Profile",    sub: "Update your information",      panel: "editProfile" as const },
    { icon: IdCard,     label: "Account Details", sub: "Email, phone, password",       panel: "accountDetails" as const },
  ];

  if (loading || !profile) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center text-white/50">
        <Loader2 size={32} className="animate-spin text-[#e07c30] mb-2" />
        <span className="text-[12px] font-medium tracking-wide">Retrieving profile...</span>
      </div>
    );
  }

  const { user, totalVlogs, groupsCount, friendsCount, clips, calendarDays } = profile;

  return (
    <motion.div
      key="profile-tab"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      style={{
        flex: 1, display: "flex", flexDirection: "column" as const, minHeight: 0,
        position: "relative", overflow: "hidden", margin: "-16px"
      }}
    >
      <div
        style={{
          flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" as const,
          scrollbarWidth: "none", msOverflowStyle: "none"
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: `::-webkit-scrollbar { display: none; }` }} />

        <div style={{ marginTop: "12px", padding: "16px 16px 0", display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 100, height: 100, borderRadius: "50%", overflow: "hidden", border: "2.5px solid rgba(255,255,255,0.18)" }}>
              <img src={user.image || "/profile.jpg"} alt={user.name || "User"} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
            <button type="button" onClick={() => setPanel("editProfile")} style={{ position: "absolute", bottom: 2, right: 2, width: 28, height: 28, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center" as const, justifyContent: "center" as const, border: "2px solid #111", cursor: "pointer" }}>
              <Camera size={13} color="#000" />
            </button>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1 }}>{user.name || "User"}</span>
              <div style={{ background: "linear-gradient(90deg, #ff9a44 0%, #e07c30 100%)", padding: "3px 8px", borderRadius: 8, display: "flex", alignItems: "center", gap: 4, boxShadow: "0 2px 8px rgba(224,124,48,0.3)" }}>
                <Crown size={12} color="#000" fill="#000" />
                <span style={{ color: "#000", fontSize: 10, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase" }}>Epic</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: 500 }}>@{user.handle || "handle"}</span>
              <button type="button" onClick={() => setPanel("editProfile")} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 20, padding: "3px 10px", color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <Pencil size={11} /> Edit
              </button>
            </div>
            <p style={{ color: "rgba(255,255,255,0.70)", fontSize: 13, margin: "0 0 8px", lineHeight: 1.4 }}>{user.bio}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.45)", fontSize: 11 }}>
                <MapPin size={12} color="rgba(255,255,255,0.45)" /> {user.location}
              </span>
              <span style={{ color: "rgba(255,255,255,0.20)", fontSize: 11 }}>•</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.45)", fontSize: 11 }}>
                <Calendar size={12} color="rgba(255,255,255,0.45)" /> Joined 2026
              </span>
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ ...glassStyle(0.04, 20, 0.08), borderRadius: 18, display: "flex", alignItems: "stretch" }}>
            {[
              { icon: Clapperboard, value: totalVlogs, label: "Total Vlogs" },
              { icon: Users,        value: friendsCount, label: "Friends"     },
              { icon: Users,        value: groupsCount,  label: "Groups"      },
            ].map((stat, i, arr) => (
              <div key={stat.label} style={{ flex: 1, display: "flex", flexDirection: "row" as const, alignItems: "stretch" }}>
                <StatPill icon={stat.icon} value={stat.value} label={stat.label} />
                {i < arr.length - 1 && <div style={{ width: 1, background: "rgba(255,255,255,0.07)", margin: "14px 0" }} />}
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ ...glassStyle(0.04, 20, 0.08), borderRadius: 18, overflow: "hidden" }}>
            {settingsRows.map((row, i) => {
              const Icon = row.icon;
              return (
                <button key={row.label} type="button" onClick={() => setPanel(row.panel)}
                  style={{ ...s.row, borderBottom: i < settingsRows.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" } as any}>
                  <div style={s.iconCircle() as any}>
                    <Icon size={16} color="rgba(255,255,255,0.70)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={s.label as any}>{row.label}</p>
                    <p style={s.sub as any}>{row.sub}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <ChevronRight size={15} color="rgba(255,255,255,0.30)" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>My Activity</span>
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
              {activityTab === "vlogs"  && <VlogsGrid clips={clips} />}
              {activityTab === "rank"   && <RankContent vlogsCount={totalVlogs} calendarDays={calendarDays} />}
            </motion.div>
          </AnimatePresence>
        </div>

        <div style={{ padding: "16px 16px 16px" }}>
          <button type="button" onClick={() => setPanel("logoutConfirm")}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", ...glassStyle(0.04, 20, 0.08), borderRadius: 16, cursor: "pointer", textAlign: "left" as const } as any}>
            <LogOut size={18} color={ACCENT} />
            <div style={{ flex: 1 }}>
              <p style={{ color: ACCENT, fontWeight: 700, fontSize: 14, margin: 0 }}>Log Out</p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: "1px 0 0" }}>See you again!</p>
            </div>
            <ChevronRight size={15} color="rgba(255,255,255,0.25)" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {panel === "editProfile" && (
          <EditProfilePanel
            key="ep"
            user={user}
            onBack={() => setPanel(null)}
            onSaveSuccess={fetchProfile}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {panel === "logoutConfirm" && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPanel(null)}
              className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm cursor-pointer"
            />

            {/* Sliding Card */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 inset-x-0 z-50 rounded-t-[32px] p-6 flex flex-col bg-neutral-950/95 border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
            >
              {/* Apple Handle bar indicator */}
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-5 flex-shrink-0" />

              <div className="flex flex-col items-center text-center gap-4">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center border border-[#e07c30]/20 shadow-sm"
                  style={{ background: `${ACCENT}15` }}
                >
                  <LogOut size={24} className="text-[#e07c30]" />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-white text-lg font-bold">Log out?</h3>
                  <p className="text-white/50 text-xs leading-relaxed max-w-[280px]">
                    You'll need to sign in again to access your account.
                  </p>
                </div>

                <div className="w-full flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setPanel(null)}
                    className="flex-1 py-3.5 rounded-xl text-white font-bold text-sm bg-white/5 border border-white/10 hover:bg-white/10 active:scale-[0.98] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex-1 py-3.5 rounded-xl text-black font-bold text-sm active:scale-[0.98] transition-all"
                    style={{ background: ACCENT }}
                  >
                    Log Out
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}