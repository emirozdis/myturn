export function StreaksSkeleton() {
  return (
    <div className="flex-1 flex flex-col gap-3 px-4 pt-6 animate-pulse">
      <div className="h-8 w-32 rounded-xl bg-white/[0.05]" />
      <div className="h-[120px] rounded-[24px] bg-white/[0.04]" />
      <div className="h-[80px] rounded-[24px] bg-white/[0.03]" />
      <div className="flex-1 rounded-[24px] bg-white/[0.03]" />
    </div>
  );
}
