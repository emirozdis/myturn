"use client";

type VideoStoryIndicatorsProps = {
  clips: any[];
  currentClipSubIndex: number;
  videoProgress: number;
  gesture: "none" | "paused" | "rewind" | "fastforward";
};

export function VideoStoryIndicators({
  clips,
  currentClipSubIndex,
  videoProgress,
  gesture,
}: VideoStoryIndicatorsProps) {
  if (clips.length <= 1) return null;

  return (
    <div className="absolute top-2.5 left-6 right-6 flex gap-2 z-40 pointer-events-none">
      {clips.map((c, idx) => {
        const isActive = idx === currentClipSubIndex;
        const isDone = idx < currentClipSubIndex;
        return (
          <div key={c.id || idx} className="h-[3px] flex-1 rounded-full overflow-hidden bg-white/20 shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            {isActive ? (
              <div
                className="h-full bg-white rounded-full"
                style={{
                  width: `${videoProgress}%`,
                  transition: gesture !== "none" ? "none" : "width 0.1s linear"
                }}
              />
            ) : isDone ? (
              <div className="h-full bg-white rounded-full" style={{ width: "100%" }} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
