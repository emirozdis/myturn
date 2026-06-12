import { Avatar } from "@/components/shared/avatar";
import { getVibeBadgeStyle } from "@/lib/vibe";

type LeaderboardCarouselProps = {
  friendsStreaks: any[];
};

export function LeaderboardCarousel({ friendsStreaks }: LeaderboardCarouselProps) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-white/60 text-[11px] font-bold uppercase tracking-widest pl-1">Leaderboard</span>
      <div className="flex items-start gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2">
        {friendsStreaks.map((friend: any) => (
          <div key={friend.name} className="flex flex-col items-center gap-2 relative flex-shrink-0 w-[64px] mt-2">
            <div
              className="absolute -top-1.5 -left-1.5 w-[18px] h-[18px] rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-[9px] font-bold text-white z-10 shadow-lg"
              style={
                friend.isMe ? { background: "#e07c30", borderColor: "#ffb880", color: "#000" } : {}
              }
            >
              {friend.rank}
            </div>

            <div
              className={`p-[2.5px] rounded-full ${friend.isMe ? "bg-gradient-to-br from-[#ff9a44] to-[#e07c30]" : "bg-white/10"}`}
            >
              <Avatar src={friend.img} size={46} />
            </div>

            <div className="flex flex-col items-center text-center gap-0.5 w-full">
              <span className="text-white text-[11px] font-bold tracking-tight truncate w-full">{friend.name}</span>

              <span
                style={{
                  ...getVibeBadgeStyle(friend.archetype),
                  fontSize: "8px",
                  fontWeight: 800,
                  padding: "1.5px 6px",
                  borderRadius: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginTop: "2.5px",
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "100%",
                }}
              >
                {friend.archetype}
              </span>

              <span
                className={`text-[10px] font-bold mt-1 ${friend.isMe ? "text-[#e07c30]" : "text-white/60"}`}
              >
                {friend.streak} days
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
