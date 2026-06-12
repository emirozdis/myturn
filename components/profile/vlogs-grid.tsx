import { Play } from "lucide-react";

export function VlogsGrid({ clips, onPlayClip }: { clips: any[]; onPlayClip: (clip: any) => void }) {
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
        <div
          key={v.id}
          onClick={() => onPlayClip(v)}
          className="group relative rounded-xl overflow-hidden aspect-[4/3] bg-[#222] cursor-pointer"
        >
          <img src={v.thumbnailUrl || "/image1.jpg"} alt="" className="w-full h-full object-cover block group-hover:scale-105 transition-transform duration-500" />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.78) 10%, transparent 100%)" }} />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur border border-white/20 flex items-center justify-center">
              <Play size={16} className="text-white ml-1" />
            </div>
          </div>
          <div style={{ position: "absolute", top: 7, left: 7, background: "rgba(0,0,0,0.55)", borderRadius: 6, padding: "3px 7px", display: "flex", alignItems: "center", gap: 4 }}>
            <Play size={9} color="#fff" fill="#fff" />
            <span style={{ color: "#fff", fontSize: 10, fontWeight: 600 }}>Play</span>
          </div>
          <div style={{ position: "absolute", bottom: 8, left: 8, right: 8 }}>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 12, margin: 0, lineHeight: 1.2 }}>
              {new Date(v.recordedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, margin: "2px 0 0" }}>{v.location || "Earth"}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
