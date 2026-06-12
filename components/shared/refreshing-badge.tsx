export function RefreshingBadge({ className = "absolute top-0 right-0 z-20" }: { className?: string }) {
  return (
    <div className={`${className} flex items-center gap-1 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full shadow-lg pointer-events-none`}>
      <span className="w-1.5 h-1.5 rounded-full bg-[#e07c30] animate-pulse" />
      <span className="text-white/50 text-[9px] font-semibold tracking-wide">updating</span>
    </div>
  );
}
